"use client";

import React, { useMemo } from 'react';
import { BookOpen, Users, CheckCircle, TrendingUp } from 'lucide-react';

interface CourseDetailCardProps {
  curso: any;
  reportData: any[];
}

export function CourseDetailCard({ curso, reportData }: CourseDetailCardProps) {
  // Processar dados do curso
  const processedData = useMemo(() => {
    if (!reportData.length) {
      return {
        concluintes: { total: 0, primeirog: 0, segundog: 0, ni: 0 },
        resumo: { totalInscricoes: 0, totalConcluidos: 0, taxaConclusao: 0 }
      };
    }

    // Função para determinar o grau
    const getGrau = (row: any): '1º Grau' | '2º Grau' | 'N/I' => {
      const explicitNum = Number(row?.grau ?? row?.grau_nivel ?? row?.nivel ?? row?.grade ?? NaN);
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
      return 'N/I';
    };

    // Contar apenas concluintes por grau
    const concluintes = { total: 0, primeirog: 0, segundog: 0, ni: 0 };
    
    reportData.forEach((row: any) => {
      const concluido = row.student_status === 'CONCLUÍDO' || row.student_status === 'CONCLUIU';
      if (concluido) {
        concluintes.total++;
        const grau = getGrau(row);
        if (grau === '1º Grau') concluintes.primeirog++;
        else if (grau === '2º Grau') concluintes.segundog++;
        else concluintes.ni++;
      }
    });

    // Calcular resumo
    const totalInscricoes = reportData.length;
    const totalConcluidos = concluintes.total;
    const taxaConclusao = totalInscricoes > 0 ? (totalConcluidos / totalInscricoes * 100) : 0;

    return {
      concluintes,
      resumo: { totalInscricoes, totalConcluidos, taxaConclusao }
    };
  }, [reportData]);

  const courseName = curso.nome || `Curso ${curso.courseid}`;

  return (
    <div className="modern-card overflow-hidden">
      {/* Header do Curso - Estilo igual aos cards existentes */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4">
        <div className="flex items-center gap-3">
          <BookOpen className="h-6 w-6" />
          <div>
            <h3 
              className="font-bold text-lg cursor-help"
              title={courseName}
            >
              {courseName}
            </h3>
            <p className="text-blue-100 text-sm">ID: {curso.courseid}</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Grid de Métricas Principais - Estilo ModernCourseCard */}
        <div className="grid grid-cols-2 gap-4">
          <div className="modern-card bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
            <div className="p-4 text-center">
              <Users className="h-8 w-8 mx-auto mb-2 text-blue-600 dark:text-blue-400" />
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300 mb-1">
                {processedData.resumo.totalInscricoes}
              </div>
              <div className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                Inscritos
              </div>
            </div>
          </div>

          <div className="modern-card bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
            <div className="p-4 text-center">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600 dark:text-green-400" />
              <div className="text-2xl font-bold text-green-700 dark:text-green-300 mb-1">
                {processedData.resumo.totalConcluidos}
              </div>
              <div className="text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wide">
                Concluíram
              </div>
            </div>
          </div>
        </div>

        {/* Taxa de Conclusão Destacada */}
        <div className="modern-card bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-800">
          <div className="p-6 text-center">
            <TrendingUp className="h-10 w-10 mx-auto mb-3 text-orange-600 dark:text-orange-400" />
            <div className="text-4xl font-bold text-orange-700 dark:text-orange-300 mb-2">
              {processedData.resumo.taxaConclusao.toFixed(1)}%
            </div>
            <div className="text-sm font-medium text-orange-600 dark:text-orange-400 uppercase tracking-wide">
              Taxa de Conclusão
            </div>
          </div>
        </div>

        {/* Concluintes por Grau - Pills estilo ModernCourseCard */}
        {reportData.length > 0 && (
          <div className="modern-card bg-gray-50 dark:bg-gray-900/20">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                Concluintes por Grau
              </h4>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 rounded-md px-3 py-3 text-center">
                  <div className="text-xs font-semibold uppercase tracking-wide opacity-75 mb-1">Total</div>
                  <div className="text-lg font-bold">{processedData.concluintes.total}</div>
                </div>
                <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-700 rounded-md px-3 py-3 text-center">
                  <div className="text-xs font-semibold uppercase tracking-wide opacity-75 mb-1">1º Grau</div>
                  <div className="text-lg font-bold">{processedData.concluintes.primeirog}</div>
                </div>
                <div className="bg-violet-100 dark:bg-violet-900/30 text-violet-800 dark:text-violet-300 border border-violet-300 dark:border-violet-700 rounded-md px-3 py-3 text-center">
                  <div className="text-xs font-semibold uppercase tracking-wide opacity-75 mb-1">2º Grau</div>
                  <div className="text-lg font-bold">{processedData.concluintes.segundog}</div>
                </div>
                <div className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-600 rounded-md px-3 py-3 text-center">
                  <div className="text-xs font-semibold uppercase tracking-wide opacity-75 mb-1">N/I</div>
                  <div className="text-lg font-bold">{processedData.concluintes.ni}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Indicador se não há dados */}
        {reportData.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum dado encontrado para este curso</p>
          </div>
        )}
      </div>
    </div>
  );
}
