"use client";

import React, { useMemo, useState } from 'react';
import { Settings } from 'lucide-react';

interface CourseCardProps {
  course: { id: number; name: string; rows: any[] };
}

export function ModernCourseCard({ course }: CourseCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [opts, setOpts] = useState({ cursando: false, reprovadosEvadidos: false, mediaProgresso: false, quizzes: false });

  const total = course.rows.length;
  const concluidos = course.rows.filter((r: any) => r.student_status === 'CONCLUÍDO').length;
  const cursando = course.rows.filter((r: any) => r.student_status === 'CURSANDO').length;
  const reprovadosEvadidos = course.rows.filter((r: any) => 
    r.student_status === 'REPROVADO_EVADIDO' || 
    r.student_status === 'NUNCA_ACESSOU'
  ).length;
  const mediaProgresso = Math.round((course.rows.reduce((s: number, r: any) => s + (Number(r.progress_percentage) || 0), 0) / Math.max(1, total)) * 10) / 10;
  const totalQuizzes = course.rows.reduce((s: number, r: any) => s + (Number(r.total_quizzes) || 0), 0);
  const taxa = total ? Math.round((concluidos / total) * 1000) / 10 : 0;

  function getGrau(row: any): '1º Grau' | '2º Grau' | 'N/I' {
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
    if (src.includes('2')) return '2º Grau';
    if (src.includes('1')) return '1º Grau';
    return 'N/I'; // Agrupa Não Informados e vazios
  }

  const concluintesPorGrau = useMemo(() => {
    const acc: Record<'1º Grau' | '2º Grau' | 'N/I', number> = {
      '1º Grau': 0,
      '2º Grau': 0,
      'N/I': 0,
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
    <div className="modern-card group">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
              {course.name}
            </h4>
            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
              <span className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
                ID {course.id}
              </span>
            </div>
          </div>
          <div className="relative ml-4">
            <button 
              onClick={() => setMenuOpen(v => !v)} 
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all opacity-0 group-hover:opacity-100" 
              title="Opções do card"
            >
              <Settings className="h-5 w-5" />
            </button>
            
            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 z-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 w-52">
                <div className="space-y-2">
                  {[
                    { key: 'cursando', label: 'Mostrar Cursando' },
                    { key: 'reprovadosEvadidos', label: 'Mostrar Reprov./Evadidos' },
                    { key: 'mediaProgresso', label: 'Média de Progresso' },
                    { key: 'quizzes', label: 'Total de Quizzes' }
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-3 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 rounded px-2">
                      <input 
                        type="checkbox" 
                        checked={opts[key as keyof typeof opts]} 
                        onChange={e => setOpts(o => ({ ...o, [key]: e.target.checked }))}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats principais */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <StatCard label="Inscritos" value={total} color="blue" />
          <StatCard label="Cursando" value={cursando} color="orange" />
          <StatCard label="Concluintes" value={concluidos} color="green" />
          <StatCard label="Taxa" value={`${taxa}%`} color="purple" />
          
          {/* Stats opcionais */}
          {opts.cursando && <StatCard label="Cursando" value={cursando} color="blue" />}
          {opts.reprovadosEvadidos && <StatCard label="Reprov./Evadidos" value={reprovadosEvadidos} color="gray" />}
          {opts.mediaProgresso && <StatCard label="Média Progresso" value={`${mediaProgresso}%`} color="indigo" />}
          {opts.quizzes && <StatCard label="Quizzes" value={totalQuizzes} color="pink" />}
        </div>

        {/* Concluintes por grau */}
        <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Concluintes por Grau</h5>
          <div className="grid grid-cols-4 gap-2">
            <GradePill label="Total" value={concluidos} color="emerald" />
            <GradePill label="1º Grau" value={concluintesPorGrau['1º Grau']} color="blue" />
            <GradePill label="2º Grau" value={concluintesPorGrau['2º Grau']} color="violet" />
            <GradePill label="N/I" value={concluintesPorGrau['N/I']} color="slate" />
          </div>
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
