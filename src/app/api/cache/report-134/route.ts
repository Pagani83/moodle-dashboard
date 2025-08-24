import { NextRequest, NextResponse } from 'next/server';
import path from 'node:path';
import fs from 'node:fs/promises';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const STORAGE_DIR = path.join(process.cwd(), 'storage', 'report134');

async function ensureDir() {
  await fs.mkdir(STORAGE_DIR, { recursive: true });
}

function getTimestamp() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

async function listFiles() {
  await ensureDir();
  const entries = await fs.readdir(STORAGE_DIR, { withFileTypes: true });
  const files = await Promise.all(entries
    .filter(e => e.isFile() && e.name.endsWith('.xlsx'))
    .map(async e => {
      const full = path.join(STORAGE_DIR, e.name);
      const stat = await fs.stat(full);
      return { name: e.name, path: full, mtimeMs: stat.mtimeMs, size: stat.size };
    }));
  files.sort((a, b) => b.mtimeMs - a.mtimeMs);
  return files;
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const latest = url.searchParams.get('latest');
    const files = await listFiles();
    if (latest) {
      if (!files.length) return NextResponse.json({ ok: true, hasFile: false, reason: 'no_files' }, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache', 
          'Expires': '0'
        }
      });

      const latestFile = files[0];
      // Ler XLSX e retornar JSON
      const ExcelJS = (await import('exceljs')).default;
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.readFile(latestFile.path);
      const metaSheet = wb.getWorksheet('meta');
      const dataSheet = wb.getWorksheet('data');
      const meta: Record<string, any> = {};
      if (metaSheet) {
        metaSheet.eachRow((row: any) => {
          const [k, v] = row.values.slice(1); // values[0] is empty per exceljs
          if (k) meta[k] = v;
        });
      }
      
      // Adicionar informações universais sobre o arquivo (timestamp do sistema de arquivos)
      const fileStats = await fs.stat(latestFile.path);
      const universalLastUpdate = new Date(fileStats.mtime).toISOString();
      
      let data: any[] = [];
      if (dataSheet) {
        const headers: string[] = [];
        dataSheet.getRow(1).eachCell((cell: any) => headers.push(String(cell.value ?? '')));
        for (let r = 2; r <= dataSheet.rowCount; r++) {
          const rowObj: any = {};
          const row = dataSheet.getRow(r);
          headers.forEach((h, idx) => {
            rowObj[h] = row.getCell(idx + 1).value ?? null;
          });
          data.push(rowObj);
        }
      }
      
      // Retornar com timestamp universal
      return NextResponse.json({ 
        ok: true, 
        hasFile: true, 
        file: { 
          name: latestFile.name, 
          size: latestFile.size,
          universalLastUpdate, // Timestamp baseado no sistema de arquivos (universal)
          cacheBuster: Date.now() // Para garantir que não há cache no lado cliente
        }, 
        meta, 
        data 
      }, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
    }
    // Listagem simples
    return NextResponse.json({ ok: true, files: files.map(f => ({ name: f.name, mtimeMs: f.mtimeMs, size: f.size })) });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureDir();
    const url = new URL(req.url);
    const forceRefresh = url.searchParams.get('force_refresh') === 'true';
    
    let data, lastFetch, fetchDuration, totalRows;
    
    if (forceRefresh) {
      // Force refresh - buscar dados frescos do Moodle
      console.log('🔄 Force refresh requested - fetching fresh data from Moodle...');
      
      try {
        // Aqui você faria a chamada para o Moodle para buscar dados frescos
        // Por exemplo, usando o MoodleClient diretamente ou chamando outro endpoint
        const startTime = Date.now();
        
        // Buscar dados frescos do Moodle via API
        console.log('📡 Fetching fresh data from Moodle...');
        const moodleResponse = await fetch('/api/moodle/report-134', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          }
        });
        
        if (!moodleResponse.ok) {
          throw new Error(`Moodle API failed: ${moodleResponse.status} ${moodleResponse.statusText}`);
        }
        
        const freshData = await moodleResponse.json();
        console.log(`✅ Fresh data fetched: ${freshData.length} records`);
        
        // Criar arquivo Excel com dados frescos
        if (Array.isArray(freshData) && freshData.length > 0) {
          const ExcelJS = (await import('exceljs')).default;
          const wb = new ExcelJS.Workbook();
          const metaSheet = wb.addWorksheet('meta');
          
          fetchDuration = Date.now() - startTime;
          lastFetch = new Date().toISOString();
          
          metaSheet.addRow(['lastFetch', lastFetch]);
          metaSheet.addRow(['fetchDuration', fetchDuration]);
          metaSheet.addRow(['totalRows', freshData.length]);

          const dataSheet = wb.addWorksheet('data');
          const headers = Object.keys(freshData[0]);
          dataSheet.addRow(headers);
          for (const row of freshData) {
            dataSheet.addRow(headers.map((h) => row[h] ?? null));
          }

          const filename = `report134_${getTimestamp()}.xlsx`;
          const fullPath = path.join(STORAGE_DIR, filename);
          await wb.xlsx.writeFile(fullPath);

          // Manter apenas os últimos 7 arquivos
          const files = await listFiles();
          const excess = files.slice(7);
          await Promise.all(excess.map(f => fs.unlink(path.join(STORAGE_DIR, f.name)).catch(() => {})));
          
          console.log(`💾 Fresh data saved to: ${filename}`);
        } else {
          fetchDuration = Date.now() - startTime;
          lastFetch = new Date().toISOString();
          console.log('⚠️ No fresh data received from Moodle');
        }
        
        // Criar um arquivo temporário com timestamp universal para indicar atualização
        const tempTimestamp = getTimestamp();
        const tempFile = path.join(STORAGE_DIR, `temp_refresh_${tempTimestamp}.txt`);
        await fs.writeFile(tempFile, JSON.stringify({
          refreshedAt: lastFetch,
          fetchDuration,
          isForceRefresh: true
        }));
        
        return NextResponse.json({ 
          ok: true, 
          refreshTriggered: true, 
          message: 'Force refresh completed - fresh data will be available on next request',
          timestamp: lastFetch,
          universalTimestamp: lastFetch, // Timestamp universal para todos os usuários
          fetchDuration,
          cacheBuster: Date.now() // Para invalidar qualquer cache local
        }, {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        
      } catch (error) {
        console.error('❌ Force refresh failed:', error);
        return NextResponse.json({ 
          ok: false, 
          error: 'Force refresh failed', 
          details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
      }
    } else {
      // Comportamento normal - salvar dados fornecidos
      const body = await req.json();
      ({ data, lastFetch, fetchDuration, totalRows } = body || {});
      if (!Array.isArray(data) || data.length === 0) {
        return NextResponse.json({ ok: false, error: 'Dados vazios' }, { status: 400 });
      }
    }

    if (data) {
      const ExcelJS = (await import('exceljs')).default;
      const wb = new ExcelJS.Workbook();
      const metaSheet = wb.addWorksheet('meta');
      metaSheet.addRow(['lastFetch', lastFetch || new Date().toISOString()]);
      metaSheet.addRow(['fetchDuration', fetchDuration ?? 0]);
      metaSheet.addRow(['totalRows', totalRows ?? data.length]);

      const dataSheet = wb.addWorksheet('data');
      const headers = Object.keys(data[0]);
      dataSheet.addRow(headers);
      for (const row of data) {
        dataSheet.addRow(headers.map((h) => row[h] ?? null));
      }

      const filename = `report134_${getTimestamp()}.xlsx`;
      const fullPath = path.join(STORAGE_DIR, filename);
      await wb.xlsx.writeFile(fullPath);

      // Manter apenas os últimos 7 arquivos
      const files = await listFiles();
      const excess = files.slice(7);
      await Promise.all(excess.map(f => fs.unlink(path.join(STORAGE_DIR, f.name)).catch(() => {})));

      return NextResponse.json({ ok: true, file: { name: filename } });
    }

    return NextResponse.json({ ok: true, message: 'Operation completed' });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
