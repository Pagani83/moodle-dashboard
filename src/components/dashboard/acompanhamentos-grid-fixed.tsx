"use client";

import React, { useState, useMemo } from 'react';
import { BookOpen, Eye, Edit, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { useMoodleStore } from '@/store/moodle-store';
import type { Acompanhamento } from '@/types/moodle';

interface AcompanhamentosGridProps {
  onOpenDetailModal: (acompanhamento: Acompanhamento) => void;
  onCreateNew: () => void;
  onEdit: (acompanhamento: Acompanhamento) => void;
  onDelete: (acompanhamento: Acompanhamento) => void;
  reportData?: any[]; // Dados do Report 134 em cache
}

export function AcompanhamentosGrid({ onOpenDetailModal, onCreateNew, onEdit, onDelete, reportData = [] }: AcompanhamentosGridProps) {
  const { acompanhamentos } = useMoodleStore();
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const handleDelete = (acompanhamento: Acompanhamento) => {
    const confirmation = window.confirm(`Tem certeza que deseja excluir o acompanhamento "${acompanhamento.nome}"?`);
    if (confirmation) {
      const secondConfirmation = window.confirm(
        "Esta ação é irreversível! Os dados do acompanhamento serão perdidos permanentemente. Confirma a exclusão?"
      );
      
      if (secondConfirmation) {
        onDelete(acompanhamento);
      }
    }
  };

  // Função para calcular estatísticas de um acompanhamento
  const calculateAcompanhamentoStats = useMemo(() => {
    return (acompanhamento: Acompanhamento) => {
      if (!reportData || reportData.length === 0) {
        return { totalInscricoes: 0, totalConclusoes: 0 };
      }

      const courseIds = new Set(acompanhamento.cursos?.map(c => Number(c.courseid)) || []);
      const filteredData = reportData.filter((row: any) => 
        courseIds.has(Number(row.course_id))
      );

      const totalInscricoes = filteredData.length;
      const totalConclusoes = filteredData.filter((row: any) => 
        row.student_status === 'CONCLUÍDO' || row.student_status === 'CONCLUIU'
      ).length;

      return { totalInscricoes, totalConclusoes };
    };
  }, [reportData]);

  const toggleCardExpansion = (id: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedCards(newExpanded);
  };

  if (!acompanhamentos || acompanhamentos.length === 0) {
    return (
      <div className="text-center py-16 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-800 dark:to-slate-700 rounded-2xl border-2 border-dashed border-blue-300 dark:border-slate-600">
        <div className="max-w-md mx-auto">
          <div className="w-20 h-20 mx-auto mb-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
            <BookOpen className="h-10 w-10 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">
            Nenhum acompanhamento encontrado
          </h3>
          <p className="text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
            Comece criando seu primeiro acompanhamento para organizar e monitorar o progresso dos cursos.
          </p>
        </div>
        <button
          onClick={onCreateNew}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-0.5"
        >
          <BookOpen className="h-4 w-4" />
          Criar Primeiro Acompanhamento
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {acompanhamentos.map((acompanhamento) => {
        const isExpanded = expandedCards.has(acompanhamento.id);
        const courseCount = acompanhamento.cursos?.length || 0;
        const maxCoursesToShow = 3;
        const hasMoreCourses = courseCount > maxCoursesToShow;
        const coursesToShow = isExpanded 
          ? acompanhamento.cursos 
          : acompanhamento.cursos?.slice(0, maxCoursesToShow);
        
        // Calcular estatísticas
        const stats = calculateAcompanhamentoStats(acompanhamento);

        return (
          <div key={acompanhamento.id} className="group">
            {/* MODO CLARO: Design limpo com cores suaves */}
            {/* MODO ESCURO: Design mais contrastante com bordas luminosas */}
            <div className="
              bg-white dark:bg-slate-800 
              border-2 border-slate-200 dark:border-slate-600
              rounded-2xl 
              shadow-sm hover:shadow-lg dark:shadow-slate-900/30 
              hover:-translate-y-1 
              transition-all duration-300 
              overflow-hidden
              hover:border-blue-300 dark:hover:border-blue-500
            ">
              {/* Header com Design Completamente Diferente para Cada Modo */}
              <div className="
                p-6 pb-4 
                bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-700 dark:via-slate-700 dark:to-slate-600
                border-b-2 border-blue-100 dark:border-slate-500
              ">
                {/* Título Principal */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 
                      className="text-2xl font-bold text-slate-800 dark:text-white mb-2 leading-tight cursor-help tracking-tight"
                      title={acompanhamento.nome}
                    >
                      {acompanhamento.nome}
                    </h3>
                    <div className="flex items-center gap-2">
                      <div className="inline-flex items-center px-4 py-2 bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-semibold border-2 border-blue-200 dark:border-blue-600 shadow-sm">
                        <BookOpen className="h-4 w-4 mr-2" />
                        {courseCount} curso{courseCount !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                  
                  {/* Botões de Ação */}
                  <div className="flex items-center gap-1 ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={() => onOpenDetailModal(acompanhamento)}
                      className="p-2.5 text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 rounded-xl hover:bg-white dark:hover:bg-slate-700 transition-all duration-200 border border-transparent hover:border-blue-200 dark:hover:border-blue-600"
                      title="Ver detalhes"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onEdit(acompanhamento)}
                      className="p-2.5 text-slate-600 hover:text-emerald-600 dark:text-slate-300 dark:hover:text-emerald-400 rounded-xl hover:bg-white dark:hover:bg-slate-700 transition-all duration-200 border border-transparent hover:border-emerald-200 dark:hover:border-emerald-600"
                      title="Editar acompanhamento"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(acompanhamento)}
                      className="p-2.5 text-slate-600 hover:text-red-600 dark:text-slate-300 dark:hover:text-red-400 rounded-xl hover:bg-white dark:hover:bg-slate-700 transition-all duration-200 border border-transparent hover:border-red-200 dark:hover:border-red-600"
                      title="Excluir acompanhamento"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Conteúdo Principal do Card */}
              <div className="p-6 bg-slate-50/30 dark:bg-slate-800">
                {/* Lista de Cursos com Design Distinto */}
                {courseCount > 0 && (
                  <div className="space-y-4 mb-6">
                    <div className="space-y-3">
                      {coursesToShow?.map((curso: any) => (
                        <div
                          key={curso.courseid}
                          className="flex items-center justify-between p-4 bg-white dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 hover:shadow-sm dark:hover:border-slate-500 transition-all duration-200"
                        >
                          <div className="flex-1 min-w-0">
                            <div 
                              className="text-sm font-semibold text-slate-800 dark:text-white line-clamp-1 cursor-help mb-1"
                              title={curso.nome || `Curso ${curso.courseid}`}
                            >
                              {curso.nome || `Curso ${curso.courseid}`}
                            </div>
                            <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                              ID: {curso.courseid}
                            </div>
                          </div>
                          <div className="ml-3 flex-shrink-0">
                            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700">
                              ✓ Ativo
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Botão para expandir/recolher */}
                    {hasMoreCourses && (
                      <button
                        onClick={() => toggleCardExpansion(acompanhamento.id)}
                        className="w-full mt-3 p-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800 transition-colors duration-200 flex items-center justify-center gap-2"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="h-4 w-4" />
                            Mostrar menos cursos
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4" />
                            Ver mais {courseCount - maxCoursesToShow} cursos
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}

                {/* Estatísticas com Cards Individuais */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 flex flex-col items-center justify-center min-h-[80px]">
                    <div className="text-lg font-bold text-blue-700 dark:text-blue-300 mb-1">
                      {stats.totalInscricoes}
                    </div>
                    <div className="text-[10px] font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide text-center leading-tight">
                      ALUNOS
                    </div>
                  </div>
                  <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800 flex flex-col items-center justify-center min-h-[80px]">
                    <div className="text-lg font-bold text-emerald-700 dark:text-emerald-300 mb-1">
                      {stats.totalConclusoes}
                    </div>
                    <div className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wide text-center leading-tight">
                      CONCLUÍDOS
                    </div>
                  </div>
                  <div className="text-center p-3 bg-violet-50 dark:bg-violet-900/20 rounded-xl border border-violet-200 dark:border-violet-800 flex flex-col items-center justify-center min-h-[80px]">
                    <div className="text-lg font-bold text-violet-700 dark:text-violet-300 mb-1">
                      {stats.totalInscricoes > 0 ? Math.round((stats.totalConclusoes / stats.totalInscricoes) * 100) : 0}%
                    </div>
                    <div className="text-[10px] font-medium text-violet-600 dark:text-violet-400 uppercase tracking-wide text-center leading-tight">
                      CONCLUSÕES
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
