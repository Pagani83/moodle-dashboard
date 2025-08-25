import { NextRequest, NextResponse } from 'next/server';
import path from 'node:path';
import fs from 'node:fs/promises';
import { createMoodleClient } from '@/lib/moodle-client';

const STORAGE_DIR = path.join(process.cwd(), 'storage', 'combined-report');

async function ensureDir() {
  await fs.mkdir(STORAGE_DIR, { recursive: true });
}

function getTimestamp() {
  const now = new Date();
  // Avoid using a regex with square brackets which some scanners (Tailwind/Turbopack)
  // may misinterpret and emit as CSS selectors. Use safe chained replacements.
  return now
    .toISOString()
    .replaceAll('-', '')
    .replaceAll(':', '')
    .replaceAll('T', '')
    .replaceAll('.', '')
    .slice(0, 15);
}

async function listFiles() {
  const files = await fs.readdir(STORAGE_DIR);
  const stats = await Promise.all(
    files.map(async (name) => {
      const filePath = path.join(STORAGE_DIR, name);
      const stat = await fs.stat(filePath);
      return { name, path: filePath, mtimeMs: stat.mtimeMs, size: stat.size };
    })
  );
  return stats.sort((a, b) => b.mtimeMs - a.mtimeMs);
}

export async function POST(req: NextRequest) {
  try {
    await ensureDir();
    let body: any = null;
    let data134, data151, lastFetch, fetchDuration;
    try {
      body = await req.json();
    } catch (e) {
      body = null;
    }

    if (!body) {
      const configPath = path.join(process.cwd(), 'backup', 'config.json');
      let moodleConfigRaw;
      try {
        moodleConfigRaw = await fs.readFile(configPath, 'utf-8');
      } catch (e) {
        return NextResponse.json({ ok: false, error: 'Configuração do Moodle não encontrada.' }, { status: 500 });
      }
      let moodleConfig;
      try {
        moodleConfig = JSON.parse(moodleConfigRaw);
      } catch (e) {
        return NextResponse.json({ ok: false, error: 'Configuração do Moodle inválida.' }, { status: 500 });
      }
      const config = {
        baseUrl: moodleConfig.base_url,
        token: moodleConfig.token,
        timeout: 300000,
        defaultCategory: 22,
      };
      const client = createMoodleClient(config);
      let t0 = Date.now();
      try {
        data134 = await client.getReport134();
        data151 = await client.getReport151();
        fetchDuration = Date.now() - t0;
      } catch (e: any) {
        return NextResponse.json({ ok: false, error: 'Erro ao buscar dados do Moodle: ' + (e?.message || e) }, { status: 500 });
      }
      const report134Array = Array.isArray(data134) ? data134 : [];
      const report151Array = Array.isArray(data151) ? data151 : [];
      if (report134Array.length === 0 && report151Array.length === 0) {
        return NextResponse.json({ ok: false, error: 'Dados vazios para ambos os relatórios' }, { status: 400 });
      }
      const combinedData = [...report134Array, ...report151Array];
      const totalRecords = combinedData.length;
      // Generate Excel workbook and write to storage with robust error handling
      let filename = `combined_report_${getTimestamp()}.xlsx`;
      const fullPath = path.join(STORAGE_DIR, filename);
      try {
        const ExcelJS = (await import('exceljs')).default;
        const wb = new ExcelJS.Workbook();
        const metaSheet = wb.addWorksheet('meta');
        lastFetch = new Date().toISOString();
        metaSheet.addRow(['lastFetch', lastFetch]);
        metaSheet.addRow(['fetchDuration', fetchDuration]);
        metaSheet.addRow(['totalRows', totalRecords]);
        metaSheet.addRow(['report134Count', report134Array.length]);
        metaSheet.addRow(['report151Count', report151Array.length]);
        metaSheet.addRow(['combinedAt', new Date().toISOString()]);
        const dataSheet = wb.addWorksheet('data');
        if (combinedData.length > 0) {
          const headers = Object.keys(combinedData[0]);
          dataSheet.addRow(headers);
          for (const row of combinedData) {
            dataSheet.addRow(headers.map((h) => row[h] ?? null));
          }
        }

        // Write to a temp file first, then rename — this gives safer behavior and
        // better diagnostics if writing fails (permissions, disk full, etc).
        const tempPath = fullPath + '.tmp';
        try {
          await wb.xlsx.writeFile(tempPath);
          // ensure temp file exists and has content
          const stat = await fs.stat(tempPath);
          console.log('ℹ️ Temp file written:', tempPath, 'size=', stat.size);
          await fs.rename(tempPath, fullPath);
          console.log('✅ Combined file moved to:', fullPath);
        } catch (writeErr: any) {
          console.error('❌ Falha ao gravar o arquivo temporário:', writeErr);
          // attempt to cleanup temp file
          try {
            await fs.unlink(tempPath).catch(() => {});
          } catch {}
          throw writeErr;
        }
      } catch (e: any) {
        console.error('❌ Erro ao gerar/gravar arquivo combinado:', e);
        return NextResponse.json({ ok: false, error: 'Erro ao salvar arquivo combinado: ' + (e?.message || e) }, { status: 500 });
      }
      const files = await listFiles();
      const excess = files.slice(7);
      await Promise.all(excess.map(f => fs.unlink(f.path).catch(() => {})));
      return NextResponse.json({
        ok: true,
        file: { name: filename },
        totalRecords,
        sources: {
          report134Count: report134Array.length,
          report151Count: report151Array.length
        }
      });
    }
    // Se houver body, não faz nada (padrão antigo)
    return NextResponse.json({ ok: false, error: 'Body não suportado.' }, { status: 400 });
  } catch (e: any) {
    console.error('❌ Erro ao ler cache combinado:', e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    await ensureDir();
    const params = req.nextUrl?.searchParams;
    const latest = params?.get('latest');
  const readOnly = params?.get('read_only');

    const files = await listFiles();
    if (!files || files.length === 0) {
      return NextResponse.json({ ok: true, files: [], latest: null });
    }

    if (latest && (latest === '1' || latest.toLowerCase() === 'true')) {
      const f = files[0];
      // If read_only requested, parse the xlsx and return data + meta
      if (readOnly && (readOnly === '1' || readOnly.toLowerCase() === 'true')) {
        try {
          const ExcelJS = (await import('exceljs')).default;
          const wb = new ExcelJS.Workbook();
          const fullPath = f.path;
          await wb.xlsx.readFile(fullPath);

          const metaSheet = wb.getWorksheet('meta');
          const dataSheet = wb.getWorksheet('data');

          const meta: Record<string, any> = {};
          if (metaSheet) {
            metaSheet.eachRow((row) => {
              const vals = Array.isArray(row.values) ? row.values.slice(1) : [];
              const k = vals[0];
              const v = vals[1];
              if (typeof k !== 'undefined') meta[String(k)] = v;
            });
          }

          const data: any[] = [];
          if (dataSheet) {
            const headerRow = dataSheet.getRow(1);
            const headers = Array.isArray(headerRow.values) ? headerRow.values.slice(1).map((h: any) => String(h)) : [];
            dataSheet.eachRow((row, rowNumber) => {
              if (rowNumber === 1) return; // skip headers
              const values = Array.isArray(row.values) ? row.values.slice(1) : [];
              const obj: Record<string, any> = {};
              for (let i = 0; i < headers.length; i++) {
                obj[headers[i]] = values[i] ?? null;
              }
              data.push(obj);
            });
          }

          const totalRecords = data.length;
          const sources = {
            report134Count: Number(meta.report134Count) || 0,
            report151Count: Number(meta.report151Count) || 0,
          };

          return NextResponse.json({ ok: true, hasFile: true, file: { name: f.name, size: f.size, universalLastUpdate: meta.combinedAt || meta.lastFetch }, meta, data, totalRecords, sources });
        } catch (e: any) {
          console.error('❌ Erro ao ler arquivo combinado:', e);
          return NextResponse.json({ ok: false, error: 'Erro ao ler arquivo combinado: ' + (e?.message || e) }, { status: 500 });
        }
      }

      return NextResponse.json({ ok: true, file: { name: f.name, mtimeMs: f.mtimeMs, size: f.size } });
    }

    // Otherwise return list
    return NextResponse.json({ ok: true, files: files.map(f => ({ name: f.name, mtimeMs: f.mtimeMs, size: f.size })) });
  } catch (e: any) {
    console.error('❌ Erro no GET /api/cache/combined-report:', e);
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}
