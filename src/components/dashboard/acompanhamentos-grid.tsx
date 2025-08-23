"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { BookOpen, Eye, Edit, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { useMoodleStore } from '@/store/moodle-store';
import { useAcompanhamentosSync } from '@/hooks/use-acompanhamentos';
import type { Acompanhamento } from '@/types/moodle';

interface AcompanhamentosGridProps {
  onOpenDetailModal: (acompanhamento: Acompanhamento) => void;
  onCreateNew: () => void;
  onEdit: (acompanhamento: Acompanhamento) => void;
  onDelete: (acompanhamento: Acompanhamento) => void;
  reportData?: any[]; // Dados do Report 134 em cache
}

export function AcompanhamentosGrid({ onOpenDetailModal, onCreateNew, onEdit, onDelete, reportData = [] }: AcompanhamentosGridProps) {
  const { theme } = useMoodleStore();
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  // Hook para sincronizar com API
  const {
    acompanhamentos: persistentAcompanhamentos,
    isLoading: isLoadingPersistent,
    createAcompanhamento,
    updateAcompanhamento,
    deleteAcompanhamento,
  } = useAcompanhamentosSync();

  console.log('AcompanhamentosGrid - persistentAcompanhamentos:', persistentAcompanhamentos);
  console.log('AcompanhamentosGrid - isLoading:', isLoadingPersistent);

  // Usar apenas dados persistentes da API
  const acompanhamentos = persistentAcompanhamentos;

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

  if (isLoadingPersistent) {
    return (
      <div className="text-center py-16 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-800 dark:to-slate-700 rounded-2xl">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-lg font-medium text-slate-700 dark:text-slate-300">
              Carregando acompanhamentos...
            </span>
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            Sincronizando dados com o servidor
          </p>
        </div>
      </div>
    );
  }

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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 px-4">
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
            {/* Designs completamente distintos por modo */}
            <div className={`
              rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden
              ${theme === 'dark' 
                ? 'bg-slate-800 border-2 border-slate-600 shadow-slate-900/30 hover:border-blue-500'
                : 'bg-white border-2 border-slate-200 shadow-blue-100/20 hover:border-blue-300'
              }
            `}>
              {/* Header com designs únicos */}
              <div className={`
                p-4 pb-3 border-b-2
                ${theme === 'dark'
                  ? 'bg-gradient-to-br from-slate-700 via-slate-700 to-slate-600 border-slate-500'
                  : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-blue-100'
                }
              `}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 
                      className={`text-lg font-bold mb-2 leading-tight cursor-help tracking-tight ${
                        theme === 'dark' ? 'text-white' : 'text-slate-800'
                      }`}
                      title={acompanhamento.nome}
                    >
                      {acompanhamento.nome}
                    </h3>
                    <div className="flex items-center gap-2">
                      <div className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold border-2 shadow-sm ${
                        theme === 'dark'
                          ? 'bg-slate-800 text-blue-300 border-blue-600'
                          : 'bg-white text-blue-700 border-blue-200'
                      }`}>
                        <BookOpen className="h-4 w-4 mr-2" />
                        {courseCount} curso{courseCount !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                  
                  {/* Botões de Ação */}
                  <div className="flex items-center gap-1 ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={() => onOpenDetailModal(acompanhamento)}
                      className={`p-2.5 rounded-xl transition-all duration-200 border border-transparent ${
                        theme === 'dark'
                          ? 'text-slate-300 hover:text-blue-400 hover:bg-slate-700 hover:border-blue-600'
                          : 'text-slate-600 hover:text-blue-600 hover:bg-white hover:border-blue-200'
                      }`}
                      title="Ver detalhes"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onEdit(acompanhamento)}
                      className={`p-2.5 rounded-xl transition-all duration-200 border border-transparent ${
                        theme === 'dark'
                          ? 'text-slate-300 hover:text-emerald-400 hover:bg-slate-700 hover:border-emerald-600'
                          : 'text-slate-600 hover:text-emerald-600 hover:bg-white hover:border-emerald-200'
                      }`}
                      title="Editar acompanhamento"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(acompanhamento)}
                      className={`p-2.5 rounded-xl transition-all duration-200 border border-transparent ${
                        theme === 'dark'
                          ? 'text-slate-300 hover:text-red-400 hover:bg-slate-700 hover:border-red-600'
                          : 'text-slate-600 hover:text-red-600 hover:bg-white hover:border-red-200'
                      }`}
                      title="Excluir acompanhamento"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Conteúdo Principal do Card */}
              <div className={`p-4 ${
                theme === 'dark' ? 'bg-slate-800' : 'bg-slate-50/30'
              }`}>
                {/* Lista de Cursos com Design Distinto */}
                {courseCount > 0 && (
                  <div className="space-y-2 mb-4">
                    <div className="space-y-2">
                      {coursesToShow?.map((curso: any) => (
                        <div
                          key={curso.courseid}
                          className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 ${
                            theme === 'dark'
                              ? 'bg-slate-700 border-slate-600 hover:border-slate-500'
                              : 'bg-white border-slate-200 hover:shadow-sm'
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <div 
                              className={`text-sm font-semibold line-clamp-1 cursor-help mb-1 ${
                                theme === 'dark' ? 'text-white' : 'text-slate-800'
                              }`}
                              title={curso.nome || `Curso ${curso.courseid}`}
                            >
                              {curso.nome || `Curso ${curso.courseid}`}
                            </div>
                            <div className={`text-xs font-medium ${
                              theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                            }`}>
                              ID: {curso.courseid}
                            </div>
                          </div>
                          <div className="ml-3 flex-shrink-0">
                            <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border ${
                              theme === 'dark'
                                ? 'bg-emerald-900/30 text-emerald-300 border-emerald-700'
                                : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            }`}>
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
                        className={`w-full mt-3 p-2 text-sm font-medium rounded-lg border transition-colors duration-200 flex items-center justify-center gap-2 ${
                          theme === 'dark'
                            ? 'text-blue-400 hover:text-blue-300 bg-blue-900/20 hover:bg-blue-900/30 border-blue-800'
                            : 'text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border-blue-200'
                        }`}
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
                <div className="grid grid-cols-3 gap-3 mt-6">
                  <div className={`text-center p-3 rounded-xl border-2 shadow-sm flex flex-col items-center justify-center min-h-[80px] ${
                    theme === 'dark'
                      ? 'bg-blue-900/30 border-blue-700'
                      : 'bg-blue-50 border-blue-200'
                  }`}>
                    <div className={`text-lg font-bold mb-1 ${
                      theme === 'dark' ? 'text-blue-300' : 'text-blue-700'
                    }`}>
                      {stats.totalInscricoes}
                    </div>
                    <div className={`text-[10px] font-medium uppercase tracking-wide text-center leading-tight ${
                      theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                    }`}>
                      ALUNOS
                    </div>
                  </div>
                  <div className={`text-center p-3 rounded-xl border-2 shadow-sm flex flex-col items-center justify-center min-h-[80px] ${
                    theme === 'dark'
                      ? 'bg-emerald-900/30 border-emerald-700'
                      : 'bg-emerald-50 border-emerald-200'
                  }`}>
                    <div className={`text-lg font-bold mb-1 ${
                      theme === 'dark' ? 'text-emerald-300' : 'text-emerald-700'
                    }`}>
                      {stats.totalConclusoes}
                    </div>
                    <div className={`text-[10px] font-medium uppercase tracking-wide text-center leading-tight ${
                      theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'
                    }`}>
                      CONCLUÍDOS
                    </div>
                  </div>
                  <div className={`text-center p-3 rounded-xl border-2 shadow-sm flex flex-col items-center justify-center min-h-[80px] ${
                    theme === 'dark'
                      ? 'bg-violet-900/30 border-violet-700'
                      : 'bg-violet-50 border-violet-200'
                  }`}>
                    <div className={`text-lg font-bold mb-1 ${
                      theme === 'dark' ? 'text-violet-300' : 'text-violet-700'
                    }`}>
                      {stats.totalInscricoes > 0 ? Math.round((stats.totalConclusoes / stats.totalInscricoes) * 100) : 0}%
                    </div>
                    <div className={`text-[10px] font-medium uppercase tracking-wide text-center leading-tight ${
                      theme === 'dark' ? 'text-violet-400' : 'text-violet-600'
                    }`}>
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
