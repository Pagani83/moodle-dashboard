"use client";

import React, { useMemo, useState } from 'react';
import { Plus, Filter, Trash2, Edit3, RefreshCw, Users, BookOpen, Eye } from 'lucide-react';
import { useMoodleStore } from '@/store/moodle-store';
import { useSafeMoodleClient } from '@/providers/moodle-provider';
import { useReport134Full } from '@/hooks/use-report-134';
import type { Acompanhamento, CursoAcompanhamento } from '@/types/moodle';

interface AcompanhamentosSidebarProps {
  onOpenDetailModal?: (acompanhamento: Acompanhamento) => void;
}

export default function AcompanhamentosSidebar({ onOpenDetailModal }: AcompanhamentosSidebarProps) {
  const { acompanhamentos, acompanhamentoAtivo, setAcompanhamentoAtivo, addAcompanhamento, removeAcompanhamento, updateAcompanhamento } = useMoodleStore();
  const client = useSafeMoodleClient();
  const report134 = useReport134Full(client!, false);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [periodoIni, setPeriodoIni] = useState('');
  const [periodoFim, setPeriodoFim] = useState('');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<number[]>([]);
  
  const allCourses = useMemo(() => {
    const data = (report134.data?.data as any[]) || [];
    const map = new Map<number, { id: number; name: string }>();
    for (const r of data) {
      const id = Number(r.course_id);
      if (!map.has(id)) map.set(id, { id, name: r.course_fullname || r.course_shortname || String(id) });
    }
    return Array.from(map.values());
  }, [report134.data]);

  const coursesFiltered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allCourses;
    return allCourses.filter(c => c.name.toLowerCase().includes(q));
  }, [allCourses, query]);

  function startEdit(acomp: Acompanhamento) {
    setEditingId(acomp.id);
    setNome(acomp.nome);
    setDescricao(acomp.descricao);
    setPeriodoIni('');
    setPeriodoFim('');
    setSelected(acomp.cursos.map(c => c.courseid));
    setShowForm(true);
  }

  function resetForm() {
    setEditingId(null);
    setShowForm(false);
    setNome(''); setDescricao(''); setPeriodoIni(''); setPeriodoFim(''); setSelected([]);
  }

  function openDetailModal(acompanhamento: Acompanhamento) {
    if (onOpenDetailModal) {
      onOpenDetailModal(acompanhamento);
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const cursos: CursoAcompanhamento[] = selected.map(id => {
      const c = allCourses.find(x => x.id === id);
      return { courseid: id, nome: c?.name || String(id), ativo: true, relatorios: [{ tipo: 'configurable_reports', ativo: true, params: { reportId: 134 } }] };
    });
    const payload = { nome, descricao, cursos, mostrar_card_resumo: true } as const;
    if (editingId) updateAcompanhamento(editingId, payload as any); else addAcompanhamento(payload as any);
    resetForm();
  }

  return (
    <aside className="modern-card h-fit">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Acompanhamentos</h3>
          <button 
            onClick={() => setShowForm(v => !v)} 
            className="modern-button flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span className="text-sm">{showForm ? 'Cancelar' : 'Novo'}</span>
          </button>
        </div>
      </div>      {showForm && (
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nome</label>
              <input 
                value={nome} 
                onChange={e => setNome(e.target.value)} 
                required 
                className="modern-input w-full" 
                placeholder="Nome do acompanhamento"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Descrição</label>
              <textarea 
                value={descricao} 
                onChange={e => setDescricao(e.target.value)} 
                rows={2} 
                className="modern-input w-full resize-none" 
                placeholder="Descrição opcional"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Início</label>
                <input 
                  type="date" 
                  value={periodoIni} 
                  onChange={e => setPeriodoIni(e.target.value)} 
                  className="modern-input w-full" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Fim</label>
                <input 
                  type="date" 
                  value={periodoFim} 
                  onChange={e => setPeriodoFim(e.target.value)} 
                  className="modern-input w-full" 
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Cursos</label>
              <div className="space-y-3">
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input 
                    value={query} 
                    onChange={e => setQuery(e.target.value)} 
                    placeholder="Buscar cursos..." 
                    className="modern-input w-full pl-10" 
                  />
                </div>
                <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900">
                  {!report134.data && (
                    <div className="p-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                      Carregue o cache do Relatório 134 em Configurações.
                    </div>
                  )}
                  {report134.data && coursesFiltered.map(c => (
                    <label key={c.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-800 last:border-b-0 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={selected.includes(c.id)} 
                        onChange={(e) => setSelected(prev => 
                          e.target.checked ? [...prev, c.id] : prev.filter(x => x !== c.id)
                        )}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      />
                      <span className="flex-1 text-sm text-gray-900 dark:text-white truncate">{c.name}</span>
                    </label>
                  ))}
                  {report134.data && coursesFiltered.length === 0 && (
                    <div className="p-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                      Nenhum curso encontrado
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-4">
              <button 
                type="button" 
                onClick={resetForm} 
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="modern-button"
              >
                {editingId ? 'Salvar' : 'Criar'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="flex-1 min-h-0">
        {acompanhamentos.length === 0 ? (
          <div className="p-6 text-center">
            <div className="text-gray-400 dark:text-gray-500 mb-3">
              <Users className="h-12 w-12 mx-auto" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Nenhum acompanhamento criado</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">Clique em "Novo" para começar</p>
          </div>
        ) : (
          <div className="p-2">
            {acompanhamentos.map(a => (
              <div 
                key={a.id} 
                className={`group rounded-lg p-4 mb-2 cursor-pointer transition-all ${
                  acompanhamentoAtivo === a.id 
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 border-2 border-transparent'
                }`}
              >
                <div className="flex items-start justify-between">
                  <button 
                    onClick={() => setAcompanhamentoAtivo(a.id)} 
                    className="text-left flex-1 min-w-0"
                  >
                    <div className="font-medium text-gray-900 dark:text-white truncate text-sm mb-1">
                      {a.nome}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                      <BookOpen className="h-3 w-3 mr-1" />
                      {a.cursos.length} curso{a.cursos.length !== 1 ? 's' : ''}
                    </div>
                  </button>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => openDetailModal(a)} 
                      className="p-1.5 text-gray-400 hover:text-green-500 dark:hover:text-green-400 transition-colors rounded" 
                      title="Ver Detalhes"
                    >
                      <Eye className="h-4 w-4"/>
                    </button>
                    <button 
                      onClick={() => startEdit(a)} 
                      className="p-1.5 text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors rounded" 
                      title="Editar"
                    >
                      <Edit3 className="h-4 w-4"/>
                    </button>
                    <button 
                      onClick={() => removeAcompanhamento(a.id)} 
                      className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors rounded" 
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4"/>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {!report134.data && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-amber-50 dark:bg-amber-900/10">
          <div className="flex items-center text-amber-600 dark:text-amber-400 text-xs">
            <RefreshCw className="h-4 w-4 mr-2"/>
            <span>Carregue o Relatório 134 para ver cursos disponíveis</span>
          </div>
        </div>
      )}
    </aside>
  );
}
