'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { AlertCircle, Trash2, Plus, Filter, Edit3 } from 'lucide-react';
import { useActiveAcompanhamentoId, useSetActiveAcompanhamentoId } from '@/hooks/use-active-acompanhamento';
import { useCombinedReport } from '@/hooks/useCombinedReport';
import { useSafeMoodleClient } from '@/providers/moodle-provider';
import { useAcompanhamentosSync } from '@/hooks/use-acompanhamentos';
import { useSession } from 'next-auth/react';
import type { Acompanhamento, CursoAcompanhamento } from '@/types/moodle';

export default function AcompanhamentosView() {
  const { data: session } = useSession();
  
  console.log('AcompanhamentosView - session:', session)
  
  // Usar o novo hook de sincronização
  const {
    acompanhamentos: persistentAcompanhamentos,
    isLoading: isLoadingPersistent,
    createAcompanhamento,
    updateAcompanhamento,
    deleteAcompanhamento,
    isCreating,
    isUpdating,
    isDeleting
  } = useAcompanhamentosSync();
  
  console.log('AcompanhamentosView - persistentAcompanhamentos:', persistentAcompanhamentos)
  console.log('AcompanhamentosView - isLoadingPersistent:', isLoadingPersistent)


  // Novo: acompanhamento ativo persistente
  const { data: acompanhamentoAtivo, isLoading: isLoadingAtivo } = useActiveAcompanhamentoId();
  const setAcompanhamentoAtivoMutation = useSetActiveAcompanhamentoId();
  
  const client = useSafeMoodleClient();
  const combinedReport = useCombinedReport();

  // Usar apenas dados persistentes da API
  const acompanhamentos = persistentAcompanhamentos;

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [periodoIni, setPeriodoIni] = useState<string>('');
  const [periodoFim, setPeriodoFim] = useState<string>('');
  const [courseSearch, setCourseSearch] = useState('');
  const [selectedCourseIds, setSelectedCourseIds] = useState<number[]>([]);

  // Derivar cursos a partir do cache do Relatório 134 (sem API)
  const allCourses = useMemo(() => {
    const data = (combinedReport.data?.data as any[]) || [];
    const map = new Map<number, { id: number; fullname: string; shortname?: string }>();
    for (const r of data) {
      const id = Number(r.course_id);
      if (!map.has(id)) {
        map.set(id, { id, fullname: r.course_fullname || String(id), shortname: r.course_shortname });
      }
    }
    return Array.from(map.values());
  }, [combinedReport.data]);

  const filteredCourses = useMemo(() => {
    const q = courseSearch.trim().toLowerCase();
    if (!q) return allCourses;
    return allCourses.filter((c: any) =>
      (c.fullname || c.shortname || '').toLowerCase().includes(q)
    );
  }, [allCourses, courseSearch]);

  const activeAcomp = useMemo(() => acompanhamentos.find(a => a.id === acompanhamentoAtivo) || null, [acompanhamentos, acompanhamentoAtivo]);

  function resetForm() {
    setEditingId(null);
    setNome('');
    setDescricao('');
    setPeriodoIni('');
    setPeriodoFim('');
    setSelectedCourseIds([]);
    setShowForm(false);
  }

  function startEdit(acomp: Acompanhamento) {
    setEditingId(acomp.id);
    setNome(acomp.nome);
    setDescricao(acomp.descricao);
    setPeriodoIni('');
    setPeriodoFim('');
    const ids = acomp.cursos.map(c => c.courseid);
    setSelectedCourseIds(ids);
    setShowForm(true);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const selected: CursoAcompanhamento[] = selectedCourseIds.map((id) => {
      const c = allCourses.find((x: any) => x.id === id);
      return {
        courseid: id,
        nome: c?.fullname || c?.shortname || String(id),
        ativo: true,
        relatorios: [],
      };
    });

    const base = {
      nome,
      descricao,
      cursos: selected,
      mostrar_card_resumo: true,
      criado_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString()
    };

    try {
      if (editingId) {
        await updateAcompanhamento({ id: editingId, ...base });
      } else {
        await createAcompanhamento(base);
      }
      resetForm();
    } catch (error) {
      console.error('Erro ao salvar acompanhamento:', error);
      alert('Erro ao salvar acompanhamento. Tente novamente.');
    }
  }

  // Função para remover acompanhamento
  const handleRemoveAcompanhamento = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este acompanhamento?')) return;
    
    try {
      await deleteAcompanhamento(id);
      // Se era o ativo, limpar seleção
      if (acompanhamentoAtivo === id) {
        await setAcompanhamentoAtivoMutation.mutateAsync(null);
      }
    } catch (error) {
      console.error('Erro ao excluir acompanhamento:', error);
      alert('Erro ao excluir acompanhamento. Tente novamente.');
    }
  }

  // Filtrar dados do 134 por acompanhamento
  const filtered134 = useMemo(() => {
    const src = (combinedReport.data?.data as any[]) || [];
    if (!activeAcomp || !src.length) return [] as any[];
    const ids = new Set(activeAcomp.cursos.map((c: any) => c.courseid));
    const start = periodoIni ? new Date(periodoIni) : null;
    const end = periodoFim ? new Date(periodoFim) : null;
    return src.filter((r: any) => {
      if (!ids.has(Number(r.course_id))) return false;
      // filtro por período usando completion_date quando disponível (dd-mm-yyyy)
      if (start || end) {
        const dateStr = r.completion_date && r.completion_date !== 'Não Concluído' ? r.completion_date : r.course_enddate;
        if (dateStr) {
          const dt = new Date(String(dateStr).split('-').reverse().join('-'));
          if (start && dt < start) return false;
          if (end && dt > end) return false;
        }
      }
      return true;
    });
  }, [combinedReport.data, activeAcomp, periodoIni, periodoFim]);

  const resumo = useMemo(() => {
    const data = filtered134;
    const total = data.length;
    const concluidos = data.filter((r: any) => r.student_status === 'CONCLUÍDO').length;
    const ativos = data.filter((r: any) => r.student_status === 'CURSANDO').length;
    const taxa = total ? Math.round((concluidos / total) * 1000) / 10 : 0;
    const cursosUnicos = new Set(data.map((r: any) => r.course_id)).size;
    return { total, concluidos, ativos, taxa, cursosUnicos };
  }, [filtered134]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Acompanhamentos</h3>
            <p className="text-sm text-gray-600">Crie acompanhamentos com cursos e período específicos</p>
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="inline-flex items-center px-3 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" /> {showForm ? 'Cancelar' : 'Novo Acompanhamento'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={onSubmit} className="space-y-4 border-t pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome</label>
                <input value={nome} onChange={(e) => setNome(e.target.value)} required className="mt-1 w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Período (início)</label>
                <input type="date" value={periodoIni} onChange={(e) => setPeriodoIni(e.target.value)} className="mt-1 w-full border rounded px-3 py-2" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Descrição</label>
                <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={2} className="mt-1 w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Período (fim)</label>
                <input type="date" value={periodoFim} onChange={(e) => setPeriodoFim(e.target.value)} className="mt-1 w-full border rounded px-3 py-2" />
              </div>
            </div>

            <div className="mt-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Cursos</label>
              <div className="flex items-center gap-2 mb-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <input
                  placeholder="Buscar curso..."
                  value={courseSearch}
                  onChange={(e) => setCourseSearch(e.target.value)}
                  className="flex-1 border rounded px-3 py-2"
                />
              </div>
              <div className="max-h-56 overflow-y-auto border rounded">
                {!combinedReport.data && (
                  <div className="p-3 text-sm text-gray-500">Para listar cursos, carregue o cache do Relatório 134 na aba correspondente.</div>
                )}
                {combinedReport.data && filteredCourses.map((c: any) => {
                  const checked = selectedCourseIds.includes(c.id);
                  return (
                    <label key={c.id} className="flex items-center gap-2 px-3 py-2 border-b hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          setSelectedCourseIds((prev) =>
                            e.target.checked ? [...prev, c.id] : prev.filter((x) => x !== c.id)
                          );
                        }}
                      />
                      <span className="text-sm text-gray-700 truncate">{c.fullname || c.shortname}</span>
                    </label>
                  );
                })}
                {combinedReport.data && filteredCourses.length === 0 && (
                  <div className="p-3 text-sm text-gray-500">Nenhum curso encontrado</div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button type="button" onClick={resetForm} className="px-3 py-2 text-sm rounded-md border">Cancelar</button>
              <button type="submit" className="px-3 py-2 text-sm rounded-md bg-green-600 text-white hover:bg-green-700">
                {editingId ? 'Salvar alterações' : 'Criar acompanhamento'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Lista de acompanhamentos */}
      <div className="bg-white rounded-lg shadow p-6">
        <h4 className="text-md font-medium text-gray-900 mb-4">Salvos</h4>
        {isLoadingPersistent ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2 text-gray-500">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span>Carregando acompanhamentos...</span>
            </div>
          </div>
        ) : acompanhamentos.length === 0 ? (
          <p className="text-gray-600 text-sm">Nenhum acompanhamento criado ainda.</p>
        ) : (
          <div className="space-y-3">
            {acompanhamentos.map((a) => (
              <div key={a.id} className={`p-3 rounded border flex items-center justify-between ${acompanhamentoAtivo === a.id ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                <div>
                  <p className="font-medium text-gray-900">{a.nome}</p>
                  <p className="text-xs text-gray-600">{a.cursos.length} cursos • atualizado {new Date(a.atualizado_em).toLocaleString('pt-BR')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => { setAcompanhamentoAtivoMutation.mutateAsync(a.id); }} className="px-2 py-1 text-xs rounded border bg-white">Ativar</button>
                  <button onClick={() => startEdit(a)} className="px-2 py-1 text-xs rounded border bg-white inline-flex items-center"><Edit3 className="h-3 w-3 mr-1"/>Editar</button>
                  <button onClick={() => handleRemoveAcompanhamento(a.id)} className="px-2 py-1 text-xs rounded border bg-white inline-flex items-center text-red-600"><Trash2 className="h-3 w-3 mr-1"/>Excluir</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Painel do acompanhamento ativo */}
  {activeAcomp && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-lg font-bold text-gray-900">{activeAcomp.nome}</h4>
              <p className="text-sm text-gray-600">{activeAcomp.cursos.length} cursos selecionados</p>
            </div>
    <div className="text-xs text-gray-500">Usando dados do cache combinado</div>
          </div>

          {!combinedReport.data && !combinedReport.isFetching && (
            <div className="p-4 rounded border border-yellow-200 bg-yellow-50 text-yellow-800 text-sm flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
      Nenhum cache combinado disponível. Acesse a aba "Fontes" para carregar/atualizar o cache.
            </div>
          )}

          {combinedReport.data && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <StatCard label="Registros" value={resumo.total} />
              <StatCard label="Cursos" value={resumo.cursosUnicos} />
              <StatCard label="Concluídos" value={resumo.concluidos} />
              <StatCard label="Taxa Conclusão" value={`${resumo.taxa}%`} />
            </div>
          )}

          {combinedReport.data && (
            <div className="overflow-x-auto border rounded">
              <table className="min-w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-2 text-left">Curso</th>
                    <th className="px-2 py-2 text-left">Usuário</th>
                    <th className="px-2 py-2 text-left">Status</th>
                    <th className="px-2 py-2 text-left">Conclusão</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered134.slice(0, 25).map((r: any, i: number) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-2 py-2 truncate max-w-64">{r.course_fullname}</td>
                      <td className="px-2 py-2 truncate max-w-64">{r.fullname}</td>
                      <td className="px-2 py-2">{r.student_status}</td>
                      <td className="px-2 py-2">{r.completion_date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered134.length > 25 && (
                <p className="text-center text-xs text-gray-500 py-2">Mostrando 25 de {filtered134.length} registros filtrados</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-gray-50 rounded p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-lg font-semibold text-gray-900">{value}</p>
    </div>
  );
}
