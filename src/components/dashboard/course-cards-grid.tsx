"use client";

import React, { useMemo, useState } from 'react';
import { Settings, BookOpen, Database } from 'lucide-react';
import { useAcompanhamentosSync } from '@/hooks/use-acompanhamentos';
import { useActiveAcompanhamentoId } from '@/hooks/use-active-acompanhamento';
import { useSafeMoodleClient } from '@/providers/moodle-provider';
import { useCombinedReport } from '@/hooks/useCombinedReport';
import { ModernCourseCard } from './modern-course-card';

export default function CourseCardsGrid() {
  // Buscar acompanhamentos persistentes e o ID ativo
  const { acompanhamentos } = useAcompanhamentosSync();
  const { data: activeAcompanhamentoId } = useActiveAcompanhamentoId();
  const active = useMemo(() => acompanhamentos.find(a => a.id === activeAcompanhamentoId) || null, [acompanhamentos, activeAcompanhamentoId]);
  const client = useSafeMoodleClient();
  const combinedReport = useCombinedReport();

  const filtered = useMemo(() => {
    if (!active) return [] as any[];
    const ids = new Set(active.cursos.map((c: any) => c.courseid));
    const data = (combinedReport.data?.data as any[]) || [];
    return data.filter((r: any) => ids.has(Number(r.course_id)));
  }, [active, combinedReport.data]);

  const byCourse = useMemo(() => {
    const map = new Map<number, { id: number; name: string; rows: any[] }>();
    for (const r of filtered) {
      const id = Number(r.course_id);
      if (!map.has(id)) map.set(id, { id, name: r.course_fullname || r.course_shortname || String(id), rows: [] });
      map.get(id)!.rows.push(r);
    }
    return Array.from(map.values());
  }, [filtered]);

  if (!active) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center py-12">
          <div className="text-gray-300 dark:text-gray-600 mb-4">
            <BookOpen className="h-16 w-16 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Selecione um acompanhamento</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Escolha um acompanhamento na lateral para visualizar os cursos</p>
        </div>
      </div>
    );
  }

  // Mostrar mensagem direcionando para o modal ao invés dos cards antigos
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center py-12 max-w-md">
        <div className="text-blue-400 dark:text-blue-500 mb-6">
          <Database className="h-20 w-20 mx-auto" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          {active?.nome || 'Acompanhamento Selecionado'}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Para ver os detalhes consolidados deste acompanhamento, clique no ícone <strong>👁️ "Ver Detalhes"</strong> na barra lateral.
        </p>
        <div className="modern-card p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <strong>{active?.cursos?.length || 0} curso(s)</strong> monitorado(s) neste acompanhamento
          </p>
        </div>
      </div>
    </div>
  );
}

function CourseCard({ course }: { course: { id: number; name: string; rows: any[] } }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [opts, setOpts] = useState({ cursando: false, reprovadosEvadidos: false, mediaProgresso: false, quizzes: false });

  const total = course.rows.length; // Inscritos totais
  const concluidos = course.rows.filter((r: any) => r.student_status === 'CONCLUÍDO').length; // Concluintes totais
  const cursando = course.rows.filter((r: any) => r.student_status === 'CURSANDO').length; // Cursando
  const reprovadosEvadidos = course.rows.filter((r: any) => 
    r.student_status === 'REPROVADO_EVADIDO' || 
    r.student_status === 'NUNCA_ACESSOU'
  ).length;
  const mediaProgresso = Math.round((course.rows.reduce((s: number, r: any) => s + (Number(r.progress_percentage) || 0), 0) / Math.max(1, total)) * 10) / 10;
  const totalQuizzes = course.rows.reduce((s: number, r: any) => s + (Number(r.total_quizzes) || 0), 0);
  const taxa = total ? Math.round((concluidos / total) * 1000) / 10 : 0;

  // Regra simplificada solicitada: se contiver 1 => 1º Grau; se contiver 2 => 2º Grau; senão Não Informado
  function getGrau(row: any): '1º Grau' | '2º Grau' | 'Não Informado' {
    const explicitNum = Number(
      row?.grau ?? row?.grau_nivel ?? row?.nivel ?? row?.grade ?? NaN
    );
    if (explicitNum === 1) return '1º Grau';
    if (explicitNum === 2) return '2º Grau';

    const src = (
      String(row.nomesetor_exerc ?? '') + ' ' +
      String(row.setor_exerc ?? '') + ' ' +
      String(row.category_name ?? '') + ' ' +
      String(row.grau ?? '')
    ).toLowerCase();
    // Prioriza 2 antes de 1 para casos como "2º grau"; regra pedida é direta por dígito
    if (src.includes('2')) return '2º Grau';
    if (src.includes('1')) return '1º Grau';
    return 'Não Informado';
  }

  const concluintesPorGrau = useMemo(() => {
    const acc: Record<'1º Grau' | '2º Grau' | 'Não Informado', number> = {
      '1º Grau': 0,
      '2º Grau': 0,
      'Não Informado': 0,
    };
    for (const r of course.rows) {
      if (r.student_status === 'CONCLUÍDO') {
        const g = getGrau(r);
        acc[g] += 1;
      }
    }
    return acc;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course.rows.length]);

  return (
    <div className="bg-white rounded-lg shadow p-4 relative">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="text-sm font-semibold text-gray-900">{course.name}</h4>
          <p className="text-xs text-gray-600">ID {course.id}</p>
        </div>
        <button onClick={() => setMenuOpen(v => !v)} className="p-1 text-gray-600 hover:text-gray-900" title="Opções do card">
          <Settings className="h-4 w-4" />
        </button>
      </div>

      {menuOpen && (
        <div className="absolute right-2 top-9 z-10 bg-white border rounded shadow p-2 text-xs w-44">
          <label className="flex items-center gap-2 py-1">
            <input type="checkbox" checked={opts.cursando} onChange={e => setOpts(o => ({ ...o, cursando: e.target.checked }))} />
            Mostrar Cursando
          </label>
          <label className="flex items-center gap-2 py-1">
            <input type="checkbox" checked={opts.reprovadosEvadidos} onChange={e => setOpts(o => ({ ...o, reprovadosEvadidos: e.target.checked }))} />
            Mostrar Reprovados/Evadidos
          </label>
          <label className="flex items-center gap-2 py-1">
            <input type="checkbox" checked={opts.mediaProgresso} onChange={e => setOpts(o => ({ ...o, mediaProgresso: e.target.checked }))} />
            Média de Progresso
          </label>
          <label className="flex items-center gap-2 py-1">
            <input type="checkbox" checked={opts.quizzes} onChange={e => setOpts(o => ({ ...o, quizzes: e.target.checked }))} />
            Total de Quizzes
          </label>
        </div>
      )}

      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <StatCard label="Inscritos" value={total} color="blue" />
        <StatCard label="Cursando" value={cursando} color="green" />
        <StatCard label="Concluintes" value={concluidos} color="purple" />
        <StatCard label="Taxa" value={`${taxa}%`} color="orange" />
        {opts.cursando && <StatCard label="Cursando" value={cursando} color="emerald" />}
        {opts.reprovadosEvadidos && <StatCard label="Reprov./Evadidos" value={reprovadosEvadidos} color="gray" />}
        {opts.mediaProgresso && <StatCard label="Média Progresso" value={`${mediaProgresso}%`} color="indigo" />}
        {opts.quizzes && <StatCard label="Quizzes" value={totalQuizzes} color="pink" />}
      </div>

      {/* Concluintes por grau */}
      <div className="mt-4">
  <div className="text-[11px] text-gray-700 font-semibold mb-2">Concluintes</div>
        <div className="grid grid-cols-4 gap-2 text-center">
          <GradePill label="Totais" value={concluidos} color="emerald" />
          <GradePill label="1º Grau" value={concluintesPorGrau['1º Grau']} color="blue" />
          <GradePill label="2º Grau" value={concluintesPorGrau['2º Grau']} color="violet" />
          <GradePill label="Não Informado" value={concluintesPorGrau['Não Informado']} color="slate" />
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number | string; color: string }) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    green: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    gray: 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700',
    indigo: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    pink: 'bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800',
  };

  return (
    <div className={`rounded-lg border p-3 ${colorClasses[color] || colorClasses.gray}`}>
      <div className="text-xs font-medium opacity-75 mb-1">{label}</div>
      <div className="text-lg font-bold">{value}</div>
    </div>
  );
}

function GradePill({ label, value, color }: { label: string; value: number | string; color: string }) {
  const colorClasses: Record<string, string> = {
    emerald: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700',
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700',
    violet: 'bg-violet-100 dark:bg-violet-900/30 text-violet-800 dark:text-violet-300 border-violet-300 dark:border-violet-700',
    slate: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-600',
  };

  return (
    <div className={`rounded-md border px-2 py-2 text-center ${colorClasses[color] || colorClasses.slate}`}>
      <div className="text-xs font-semibold uppercase tracking-wide opacity-75 mb-0.5">{label}</div>
      <div className="text-sm font-bold">{value}</div>
    </div>
  );
}
