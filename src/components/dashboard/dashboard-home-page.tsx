'use client';

import React, { useState } from 'react';
import { 
  useMoodleClient, 
  useMoodleStatus, 
  useSafeMoodleClient 
} from '@/providers/moodle-provider';
import { 
  useDashboardMasterCJUD,
  useCourseSummaries,
  useTestConnection,
  useCacheStats 
} from '@/hooks/use-moodle';
import {
  useReport134Sample,
  useReport134Full,
  useReport134Status,
  useForceReport134Update,
  useTestReport134Access,
  useTestReport134,
  useRunReport, // Importar o novo hook
  useRestoreReport134FromFile,
  REPORT_134_CONFIG
} from '@/hooks/use-report-134';
import { useMoodleStore } from '@/store/moodle-store';
import { useQuery } from '@tanstack/react-query';
import {
  Settings, 
  Database, 
  Activity, 
  Users, 
  BookOpen,
  TrendingUp,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  Eye,
  Download,
  Calendar,
  BarChart3
} from 'lucide-react';
import AcompanhamentosView from './acompanhamentos-view';
import { AcompanhamentosGrid } from './acompanhamentos-grid';
import { AcompanhamentoDetailModal } from './acompanhamento-detail-modal';
import { YouTubeWidget } from '../youtube/youtube-widget';
import type { Acompanhamento } from '@/types/moodle';

export function DashboardHomePage() {
  const { isConfigured, needsConfiguration } = useMoodleStatus();
  
  const { theme, setTheme, removeAcompanhamento, addAcompanhamento, updateAcompanhamento } = useMoodleStore();
  const client = useSafeMoodleClient();
  
  // Estado do modal de detalhamento
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAcompanhamento, setModalAcompanhamento] = useState<Acompanhamento | null>(null);
  const { config, filters } = useMoodleStore();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'acompanhamentos' | 'report134' | 'config'>('dashboard');

  // Hook para buscar dados do cache local com fallback para arquivos de storage
  const useCachedReport134 = () => {
    return useQuery({
      queryKey: ['report134-cache'],
      queryFn: async () => {
        try {
          console.log('📊 Buscando dados do cache/storage...');
          const response = await fetch('/api/cache/report-134?latest=1');
          
          if (response.ok) {
            const data = await response.json();
            
            // Verificar se tem dados válidos
            if (data.data && Array.isArray(data.data) && data.data.length > 0) {
              console.log('✅ Dados encontrados:', data.data.length, 'registros');
              // Adicionar informação sobre a fonte
              data.meta = { 
                ...data.meta, 
                source: 'cache',
                lastUpdate: data.meta?.lastFetch || new Date().toISOString()
              };
              return data;
            } else if (data.hasFile === false) {
              console.warn('📁 Nenhum arquivo encontrado no storage');
              return { 
                data: [], 
                meta: { 
                  source: 'empty', 
                  lastUpdate: null, 
                  reason: 'no_files' 
                } 
              };
            }
          }
          
          throw new Error(`Resposta da API inválida: ${response.status}`);
          
        } catch (error) {
          console.error('❌ Erro ao buscar dados:', error);
          // Retornar estrutura vazia em caso de erro
          return { 
            data: [], 
            meta: { 
              lastUpdate: null, 
              source: 'error', 
              error: error instanceof Error ? error.message : 'Erro desconhecido' 
            } 
          };
        }
      },
      staleTime: 5 * 60 * 1000, // 5 minutos
      gcTime: 30 * 60 * 1000, // 30 minutos (para manter fallback disponível)
      retry: (failureCount, error) => {
        // Tentar até 2 vezes em caso de erro de rede
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000), // Backoff exponencial mais rápido
    });
  };

  // Função para extrair lista única de cursos dos dados do Report 134
  const extractUniqueCoursesFromReport = (reportData: any[]): any[] => {
    if (!reportData || reportData.length === 0) return [];
    
    const coursesMap = new Map();
    
    reportData.forEach(record => {
      const courseId = record.course_id || record.courseid;
      if (courseId && !coursesMap.has(courseId)) {
        // Priorizar o nome do curso real ao invés de "Curso X"
        const realCourseName = record.course_name || 
                              record.course_fullname ||
                              record.fullname || 
                              record.nome ||
                              record.shortname ||
                              record.course_shortname;
        
        coursesMap.set(courseId, {
          courseid: courseId,
          nome: realCourseName || `Curso ${courseId}`, // Nome real do curso como principal
          shortname: record.course_shortname || record.shortname || `curso_${courseId}`,
          fullname: record.course_fullname || record.fullname || record.course_name || realCourseName
        });
      }
    });
    
    return Array.from(coursesMap.values()).sort((a, b) => 
      (a.nome || a.shortname).localeCompare(b.nome || b.shortname)
    );
  };

  const report134Cache = useCachedReport134();

  // Estado para modal de criação/edição
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingAcompanhamento, setEditingAcompanhamento] = useState<Acompanhamento | null>(null);

  // Funções para gerenciar acompanhamentos
  const handleCreateNew = () => {
    setEditingAcompanhamento(null); // Garantir que não está em modo de edição
    setCreateModalOpen(true);
  };

  const handleCreateAcompanhamento = (dados: { nome: string; descricao: string; cursos: any[] }) => {
    if (editingAcompanhamento) {
      // Editando acompanhamento existente
      updateAcompanhamento(editingAcompanhamento.id, {
        nome: dados.nome,
        descricao: dados.descricao,
        cursos: dados.cursos,
        mostrar_card_resumo: true,
      });
      setEditingAcompanhamento(null);
    } else {
      // Criando novo acompanhamento
      addAcompanhamento({
        nome: dados.nome,
        descricao: dados.descricao,
        cursos: dados.cursos,
        mostrar_card_resumo: true,
      });
    }
    setCreateModalOpen(false);
  };

  const handleEdit = (acompanhamento: Acompanhamento) => {
    setEditingAcompanhamento(acompanhamento);
    setCreateModalOpen(true);
  };

  const handleDelete = (acompanhamento: Acompanhamento) => {
    removeAcompanhamento(acompanhamento.id);
  };

  // Queries principais - DESATIVADAS temporariamente para focar no Relatório 134
  const masterDataQuery = useDashboardMasterCJUD(
    client!,
    filters.category || 22,
    filters.startDate,
    filters.endDate,
    false // DESATIVADO - focar apenas no Relatório 134
  );

  const summariesQuery = useCourseSummaries(
    client!,
    filters.category || 22,
    false // DESATIVADO - focar apenas no Relatório 134
  );

  const cacheStatsQuery = useCacheStats(client!, false); // DESATIVADO
  const testConnectionMutation = useTestConnection(client!);

  // Queries do Relatório 134
  // DESATIVADO para não rodar automaticamente
  const report134Access = useTestReport134Access(client!, false);
  const report134Full = useReport134Full(client!, false); // DESATIVADO - usar cache ao invés 
  const report134Status = useReport134Status(client!);
  const forceReport134Update = useForceReport134Update(client!);
  
  // Hook de mutação para rodar relatórios sob demanda
  const runReportMutation = useRunReport(client!);

  if (needsConfiguration || !isConfigured) {
    return <ConfigurationNeededView />;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      {/* Header moderno */}
      <header className="modern-header sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Dashboard Moodle CJUD
              </h1>
              <div className="flex items-center space-x-4 mt-1">
                <p className="text-sm text-slate-600 dark:text-gray-400">
                  Sistema de acompanhamento e relatórios
                </p>
                {/* Indicador da fonte de dados */}
                {report134Cache.data?.meta?.source && (
                  <div className="flex items-center space-x-2 text-xs">
                    <div className={`h-2 w-2 rounded-full ${
                      report134Cache.data.meta.source === 'cache' ? 'bg-green-500' : 
                      report134Cache.data.meta.source === 'empty' ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}></div>
                    <span className={`${
                      report134Cache.data.meta.source === 'cache' ? 'text-green-600 dark:text-green-400' : 
                      report134Cache.data.meta.source === 'empty' ? 'text-yellow-600 dark:text-yellow-400' :
                      'text-red-600 dark:text-red-400'
                    }`}>
                      {report134Cache.data.meta.source === 'cache' ? 
                        `Dados Atualizados (${report134Cache.data.data?.length || 0} registros)` : 
                       report134Cache.data.meta.source === 'empty' ? 'Aguardando Dados' :
                       'Erro nos Dados'}
                    </span>
                  </div>
                )}
                {report134Cache.isLoading && (
                  <div className="flex items-center space-x-2 text-xs text-blue-600 dark:text-blue-400">
                    <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
                    <span>Carregando...</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-6">
              {config && (
                <div className="hidden md:block text-sm text-slate-600 dark:text-gray-400">
                  <span className="font-medium">URL:</span> {config.baseUrl}
                </div>
              )}
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-slate-700 dark:text-gray-300">Conectado</span>
                </div>
                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="inline-flex items-center space-x-2 px-3 py-1.5 bg-gradient-to-r from-slate-100 to-slate-200 dark:from-gray-800 dark:to-gray-700 hover:from-slate-200 hover:to-slate-300 dark:hover:from-gray-700 dark:hover:to-gray-600 text-slate-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-all duration-200 border border-slate-300/50 dark:border-gray-600"
                  title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
                >
                  <span className="text-xs">{theme === 'dark' ? '☀️' : '🌙'}</span>
                  <span className="hidden sm:inline">{theme === 'dark' ? 'Claro' : 'Escuro'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation moderna */}
      <nav className="modern-nav sticky top-[100px] z-40">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex">
            {(['dashboard', 'acompanhamentos', 'report134', 'config'] as const).map((tab) => {
              const isActive = activeTab === tab;
              const labels = {
                dashboard: 'Dashboard',
                acompanhamentos: 'Acompanhamentos',
                report134: 'Relatório 134',
                config: 'Configurações'
              };
              
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`modern-tab ${isActive ? 'active' : ''}`}
                >
                  {labels[tab]}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {activeTab === 'report134' && (
          <div className="space-y-6">
            <Report134View 
              status={report134Status}
              forceUpdate={forceReport134Update}
            />
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Estatísticas Gerais do Sistema */}
            <div className={`p-6 rounded-2xl shadow-sm transition-all duration-300 ${
              theme === 'dark' 
                ? 'bg-gradient-to-r from-slate-800 to-slate-700 border-2 border-slate-600 shadow-slate-900/20'
                : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-blue-100/20'
            }`}>
              <div>
                <h2 className={`text-4xl font-black mb-2 tracking-tight ${
                  theme === 'dark' ? 'text-white' : 'text-slate-800'
                }`}>
                  Dashboard Geral
                </h2>
                <p className={`text-lg font-medium ${
                  theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                }`}>
                  Visão geral das estatísticas do sistema
                </p>
              </div>
            </div>

            {/* Dados do Moodle */}
            <DashboardContent 
              masterData={masterDataQuery}
              summaries={summariesQuery}
              cacheStats={cacheStatsQuery}
            />
          </div>
        )}

        {activeTab === 'acompanhamentos' && (
          <div className="space-y-8">
            {/* Header com botão de criar acompanhamento */}
            <div className={`flex items-center justify-between p-6 rounded-2xl shadow-sm transition-all duration-300 ${
              theme === 'dark' 
                ? 'bg-gradient-to-r from-slate-800 to-slate-700 border-2 border-slate-600 shadow-slate-900/20'
                : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-blue-100/20'
            }`}>
              <div>
                <h2 className={`text-4xl font-black mb-2 tracking-tight ${
                  theme === 'dark' ? 'text-white' : 'text-slate-800'
                }`}>
                  Acompanhamentos
                </h2>
                <p className={`text-lg font-medium ${
                  theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                }`}>
                  Gerencie e visualize seus acompanhamentos de cursos
                </p>
              </div>
              <button 
                onClick={handleCreateNew}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-lg shadow-sm hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5"
              >
                <BookOpen className="h-4 w-4" />
                Criar Acompanhamento
              </button>
            </div>
            
            {/* Grid de Cards de Acompanhamentos */}
            <AcompanhamentosGrid 
              onOpenDetailModal={(acompanhamento) => {
                setModalAcompanhamento(acompanhamento);
                setModalOpen(true);
              }}
              onCreateNew={handleCreateNew}
              onEdit={handleEdit}
              onDelete={handleDelete}
              reportData={(report134Cache.data?.data as any[]) || []}
            />
          </div>
        )}

        {activeTab === 'config' && (
          <div className="space-y-6">
            <ConfigurationView config={config} />
          </div>
        )}
      </main>
      
      {/* Modal de Detalhamento */}
      <AcompanhamentoDetailModal
        acompanhamento={modalAcompanhamento}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        reportData={(report134Cache.data?.data as any[]) || []}
      />
      
      {/* Modal de Criação/Edição */}
      {createModalOpen && (
        <CreateAcompanhamentoModal 
          onClose={() => {
            setCreateModalOpen(false);
            setEditingAcompanhamento(null);
          }} 
          onCreate={handleCreateAcompanhamento}
          availableCourses={extractUniqueCoursesFromReport((report134Cache.data?.data as any[]) || [])}
          editingData={editingAcompanhamento}
        />
      )}
    </div>
  );
}

// ============================================================================
// DASHBOARD CONTENT
// ============================================================================

function DashboardContent({
  masterData,
  summaries,
  cacheStats,
}: {
  masterData: any;
  summaries: any;
  cacheStats: any;
}) {
  // Ocultar o widget do YouTube por padrão; habilite com NEXT_PUBLIC_SHOW_YOUTUBE_WIDGET=true
  const showYouTubeWidget = process.env.NEXT_PUBLIC_SHOW_YOUTUBE_WIDGET === 'true';
  const isLoading = masterData.isLoading || summaries.isLoading;
  const hasError = masterData.isError || summaries.isError;

  if (hasError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
          <h3 className="text-lg font-medium text-red-800">
            Erro ao carregar dados
          </h3>
        </div>
        <p className="text-sm text-red-700 mt-2">
          {masterData.error?.message || summaries.error?.message || 'Erro desconhecido'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showYouTubeWidget && (
        <>
          {/* YouTube Analytics Widget */}
          <YouTubeWidget />
        </>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12 bg-slate-50/50 dark:bg-gray-800/30 rounded-xl border border-slate-200/60 dark:border-gray-700/50">
          <RefreshCw className="h-8 w-8 text-slate-400 dark:text-gray-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 dark:text-gray-400">Carregando dados do Moodle...</p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// STATUS CARD COMPONENT
// ============================================================================

function StatusCard({
  title,
  value,
  icon,
  isLoading,
  color = 'blue',
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  isLoading: boolean;
  color: 'blue' | 'green' | 'purple' | 'orange';
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200/60 dark:border-gray-700 p-6 hover:shadow-md transition-all duration-200">
      <div className="flex items-center">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-slate-600 dark:text-gray-400">{title}</p>
          {isLoading ? (
            <div className="h-6 w-16 bg-slate-200 dark:bg-gray-700 rounded animate-pulse mt-1"></div>
          ) : (
            <p className="text-2xl font-bold text-slate-900 dark:text-gray-100">{value}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// TEST CONNECTION VIEW
// ============================================================================

function TestConnectionView({
  testMutation,
  client,
  runReportMutation,
}: {
  testMutation: any;
  client: any;
  runReportMutation: any;
}) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Testes Manuais
        </h3>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={() => testMutation.mutate()}
            disabled={testMutation.isPending}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {testMutation.isPending ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                Testando...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Testar Conexão
              </>
            )}
          </button>

          <button
            onClick={() => runReportMutation.mutate(80)}
            disabled={runReportMutation.isPending}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50"
          >
            {runReportMutation.isPending ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                Testando...
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Testar Relatório 80
              </>
            )}
          </button>
        </div>

        {testMutation.data !== undefined && (
          <div className={`mt-4 p-4 rounded-lg ${
            testMutation.data ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {testMutation.data ? '✅ Conexão bem-sucedida!' : '❌ Falha na conexão'}
          </div>
        )}

        {testMutation.isError && (
          <div className="mt-4 p-4 rounded-lg bg-red-50 text-red-800">
            Erro na Conexão: {testMutation.error?.message}
          </div>
        )}

        {runReportMutation.data && (
          <div className="mt-4 p-4 rounded-lg bg-green-50 text-green-800">
            <h4 className="font-bold mb-2">✅ Teste de Relatório bem-sucedido!</h4>
            <pre className="text-xs bg-white p-2 rounded overflow-auto">
              {JSON.stringify(runReportMutation.data, null, 2)}
            </pre>
          </div>
        )}

        {runReportMutation.isError && (
          <div className="mt-4 p-4 rounded-lg bg-red-50 text-red-800">
            Erro no Relatório: {runReportMutation.error?.message}
          </div>
        )}
      </div>

      {client && (
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="text-md font-medium text-gray-900 mb-4">
            Informações do Cliente
          </h4>
          <div className="text-sm text-gray-600 space-y-2">
            <p>Cliente inicializado: ✅</p>
            <p>Cache ativo: ✅</p>
            <p>Timeout: 2 minutos</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// CONFIGURATION VIEW
// ============================================================================

function ConfigurationView({ config }: { config: any }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
        <Settings className="h-5 w-5 mr-2" />
        Configuração Atual
      </h3>
      
      {config ? (
        <div className="space-y-3 text-sm">
          <div>
            <span className="font-medium text-gray-700">URL Base:</span>
            <span className="ml-2 text-gray-600">{config.baseUrl}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Token:</span>
            <span className="ml-2 text-gray-600 font-mono">
              {config.token.substring(0, 8)}...
            </span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Categoria Padrão:</span>
            <span className="ml-2 text-gray-600">{config.defaultCategory}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Timeout:</span>
            <span className="ml-2 text-gray-600">{config.timeout / 1000}s</span>
          </div>
        </div>
      ) : (
        <p className="text-gray-600">Nenhuma configuração encontrada.</p>
      )}
    </div>
  );
}

// ============================================================================
// CONFIGURATION NEEDED VIEW
// ============================================================================

// ============================================================================
// REPORT 134 VIEW
// ============================================================================

function Report134View({
  status,
  forceUpdate,
}: {
  status: any;
  forceUpdate: any;
}) {
  const restoreFromFile = useRestoreReport134FromFile();
  const [forcingCache, setForcingCache] = useState(false);
  const [lastUpdateMsg, setLastUpdateMsg] = useState<string | null>(null);

  // Helpers para formatar datas do status
  const lastFetchDate: Date | null = status?.full?.lastFetch
    ? new Date(status.full.lastFetch)
    : null;
  const nextScheduledDate: Date | null = status?.full?.nextScheduled
    ? new Date(status.full.nextScheduled)
    : null;
  const fmt = (d: Date | null) => d ? d.toLocaleString('pt-BR') : '—';
  return (
    <div className="space-y-6">
      {/* Seção de teste removida para produção */}

      {/* Header do Relatório 134 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900 flex items-center">
              <FileText className="h-6 w-6 mr-2 text-blue-600" />
              Relatório 134 - Principal do Sistema
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Cache diário atualizado às 5h da manhã | ID: {REPORT_134_CONFIG.id}
            </p>
            <p className="text-xs text-orange-600 font-medium mt-1">
              🔥 DADOS PUROS: Busca sem filtros, filtragem será feita após cache
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => restoreFromFile.mutate()}
              disabled={restoreFromFile.isPending}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              title="Restaurar do último XLSX salvo"
            >
              {restoreFromFile.isPending ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Restaurar do XLSX
            </button>
            
            <button
              onClick={() => {
                setForcingCache(true);
                forceUpdate.mutate(undefined, {
                  onSuccess: (payload: any) => {
                    const when = payload?.lastFetch ? new Date(payload.lastFetch) : new Date();
                    const durMs = typeof payload?.fetchDuration === 'number' ? payload.fetchDuration : 0;
                    const secs = Math.round(durMs / 100) / 10;
                    setLastUpdateMsg(`Atualizado em ${when.toLocaleString('pt-BR')} • ${secs || 0}s`);
                  },
                  onSettled: () => setForcingCache(false),
                });
              }}
              disabled={forcingCache}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {forcingCache ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Forçar Atualização
            </button>
          </div>
        </div>

        {/* Infos de atualização */}
        <div className="flex flex-wrap items-center gap-4 mb-2 text-xs text-gray-600">
          <span><span className="font-medium">Última atualização:</span> {fmt(lastFetchDate)}</span>
          <span>•</span>
          <span><span className="font-medium">Próx. agendamento:</span> {fmt(nextScheduledDate)}</span>
          {lastUpdateMsg && (
            <span className="ml-2 px-2 py-1 rounded bg-green-50 text-green-700 border border-green-200">{lastUpdateMsg}</span>
          )}
        </div>

  {/* Status Cards essenciais */}
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
    <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center">
              <Database className="h-5 w-5 text-green-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-green-900">Cache Completo</p>
                <p className="text-xs text-green-700">
                  {status.full.available ? '✅ Disponível' : '⏳ Pendente'}
                </p>
              </div>
            </div>
          </div>

    <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-purple-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-purple-900">Total Registros</p>
                <p className="text-xs text-purple-700">
      {status.full.totalRows || 0}
                </p>
              </div>
            </div>
          </div>

    <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-orange-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-orange-900">Próx. Atualização</p>
                <p className="text-xs text-orange-700">
                  {status.full.nextScheduled ? 
                    new Date(status.full.nextScheduled).toLocaleDateString('pt-BR') : 
                    'Hoje às 5h'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Seções de amostra e documentação removidas para produção */}
    </div>
  );
}

// ============================================================================
// CONFIGURATION NEEDED VIEW
// ============================================================================

function ConfigurationNeededView() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background)' }}>
      <div className="text-center max-w-md">
        <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Configuração Necessária
        </h1>
        <p className="text-gray-600 mb-6">
          Para usar o dashboard, é necessário configurar as credenciais do Moodle.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
          <h3 className="font-medium text-blue-900 mb-2">Informações Necessárias:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• URL base do Moodle</li>
            <li>• Token de acesso à API</li>
            <li>• Categoria padrão (opcional)</li>
          </ul>
        </div>
        <p className="text-xs text-gray-500 mt-4">
          Verifique se o arquivo .env.local está configurado corretamente.
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// MODAL DE CRIAÇÃO DE ACOMPANHAMENTO
// ============================================================================

interface CreateAcompanhamentoModalProps {
  onClose: () => void;
  onCreate: (dados: { nome: string; descricao: string; cursos: any[] }) => void;
  availableCourses: any[];
  editingData?: Acompanhamento | null;
}

function CreateAcompanhamentoModal({ onClose, onCreate, availableCourses, editingData }: CreateAcompanhamentoModalProps) {
  // Estados iniciais baseados nos dados de edição ou valores padrão
  const [nome, setNome] = useState(editingData?.nome || '');
  const [descricao, setDescricao] = useState(editingData?.descricao || '');
  const [selectedCourses, setSelectedCourses] = useState<any[]>(editingData?.cursos || []);
  const [searchTerm, setSearchTerm] = useState('');
  const [draggedCourse, setDraggedCourse] = useState<any>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [hoveredCourse, setHoveredCourse] = useState<string | null>(null);

  // Debug: log para verificar estrutura dos cursos
  console.log('📚 Available courses:', availableCourses.length, 'total');
  if (availableCourses.length > 0) {
    console.log('📖 Sample course:', availableCourses[0]);
    console.log('🔍 Course fields:', Object.keys(availableCourses[0]));
  }

  const filteredCourses = availableCourses.filter(course => {
    const isAlreadySelected = selectedCourses.some(c => c.courseid === course.courseid);
    const matchesSearch = course.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.shortname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.course_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.course_shortname?.toLowerCase().includes(searchTerm.toLowerCase());
    return !isAlreadySelected && matchesSearch;
  });

  const handleDragStart = (e: React.DragEvent, course: any) => {
    setDraggedCourse(course);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedCourse(null);
    setIsDragOver(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Só remove o highlight se realmente saiu da drop zone
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (draggedCourse) {
      // Priorizar o nome real do curso ao invés de "Curso X"
      const courseName = draggedCourse.course_name || 
                        draggedCourse.course_fullname ||
                        draggedCourse.fullname ||
                        draggedCourse.nome || 
                        draggedCourse.shortname || 
                        draggedCourse.course_shortname || 
                        `Curso ${draggedCourse.courseid}`;
      
      const newCourse = {
        ...draggedCourse,
        id: `${draggedCourse.courseid}-${Date.now()}`, // ID único para reordenação
        nome: courseName, // Nome real do curso como principal
        relatorios: [],
        ativo: true
      };
      
      setSelectedCourses(prev => [...prev, newCourse]);
      setDraggedCourse(null);
      
      // Som de sucesso para novo curso
      playSound('success');
      
      // Efeito visual borrachudo na área de drop
      const dropArea = e.currentTarget as HTMLElement;
      dropArea.style.transform = 'scale(1.05)';
      dropArea.style.background = 'linear-gradient(45deg, #10b981, #3b82f6)';
      
      setTimeout(() => {
        dropArea.style.transform = '';
        dropArea.style.background = '';
      }, 400);
    }
  };

  const handleRemoveCourse = (courseId: string) => {
    console.log('🗑️ Removendo curso:', courseId);
    setSelectedCourses(prev => {
      const newCourses = prev.filter(c => c.id !== courseId);
      console.log('📝 Cursos restantes:', newCourses.length);
      return newCourses;
    });
  };

  // Handle drop back to available list (remove from selected)
  const handleDropBackToAvailable = (e: React.DragEvent) => {
    e.preventDefault();
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      
      if (data.type === 'selected' && data.course) {
        setSelectedCourses(prev => prev.filter(c => c.id !== data.course.id));
      }
    } catch (error) {
      console.error('Erro no drop back:', error);
    }
  };

  // Estados para animações e feedback
  const [isDragging, setIsDragging] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const [dragOverY, setDragOverY] = useState<number | null>(null);

  // Feedback sonoro mais suave e orgânico
  const playSound = (type: 'drop' | 'pickup' | 'success') => {
    try {
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      
      // Volume baixo e suave
      const baseVolume = 0.03;
      
      if (type === 'pickup') {
        // Som suave de "pegar"
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, context.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(550, context.currentTime + 0.15);
        gainNode.gain.setValueAtTime(baseVolume, context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.15);
        oscillator.start(context.currentTime);
        oscillator.stop(context.currentTime + 0.15);
      } else if (type === 'drop') {
        // Som suave de "encaixe"
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(330, context.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(220, context.currentTime + 0.2);
        gainNode.gain.setValueAtTime(baseVolume, context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.2);
        oscillator.start(context.currentTime);
        oscillator.stop(context.currentTime + 0.2);
      } else if (type === 'success') {
        // Som satisfatório mas suave de sucesso
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(330, context.currentTime); // E4
        oscillator.frequency.setValueAtTime(415, context.currentTime + 0.1); // G#4
        oscillator.frequency.setValueAtTime(523, context.currentTime + 0.2); // C5
        gainNode.gain.setValueAtTime(baseVolume * 1.5, context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.3);
        oscillator.start(context.currentTime);
        oscillator.stop(context.currentTime + 0.3);
      }
    } catch (error) {
      console.log('Audio não suportado:', error);
    }
  };

  const handleReorderCourses = (dragIndex: number, hoverIndex: number) => {
    setSelectedCourses(prev => {
      const newCourses = [...prev];
      const draggedItem = newCourses[dragIndex];
      newCourses.splice(dragIndex, 1);
      newCourses.splice(hoverIndex, 0, draggedItem);
      return newCourses;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nome.trim()) {
      onCreate({ 
        nome: nome.trim(), 
        descricao: descricao.trim(),
        cursos: selectedCourses.map(course => ({
          courseid: course.courseid,
          nome: course.nome,
          relatorios: course.relatorios || [],
          ativo: course.ativo !== false
        }))
      });
    }
  };

  const courseColors = [
    'from-blue-500 to-blue-600',
    'from-green-500 to-green-600', 
    'from-purple-500 to-purple-600',
    'from-orange-500 to-orange-600',
    'from-pink-500 to-pink-600',
    'from-indigo-500 to-indigo-600',
    'from-teal-500 to-teal-600',
    'from-red-500 to-red-600'
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {editingData ? '✏️ Editar Acompanhamento' : '✨ Criar Novo Acompanhamento'}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Arraste os cursos para adicionar ao seu acompanhamento
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg"
          >
            ✕
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-1 overflow-hidden">
          {/* Painel esquerdo - Informações básicas e cursos selecionados */}
          <div className="w-1/3 p-6 border-r border-gray-200 dark:border-gray-700 flex flex-col">
            <div className="space-y-4 mb-6">
              <div>
                <label htmlFor="nome" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  📝 Nome do Acompanhamento *
                </label>
                <input
                  id="nome"
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                  placeholder="Ex: Capacitação Judicial 2025"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="descricao" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  📄 Descrição
                </label>
                <textarea
                  id="descricao"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 resize-none"
                  placeholder="Descrição opcional do acompanhamento..."
                />
              </div>
            </div>

            {/* Área de Drop - Cursos Selecionados */}
            <div className="flex-1 flex flex-col min-h-0">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                🎯 Cursos Selecionados ({selectedCourses.length})
              </h3>
              
              <div
                className={`flex-1 border-3 border-dashed rounded-xl p-4 transition-all duration-500 overflow-hidden flex flex-col ${
                  isDragOver 
                    ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 scale-105 shadow-2xl transform rotate-1' 
                    : selectedCourses.length === 0
                      ? 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/30'
                      : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800/50'
                }`}
                style={{
                  transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                  transformOrigin: 'center',
                }}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {selectedCourses.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                    <div className="text-4xl mb-3">🎯</div>
                    <p className="text-center font-medium">Arraste cursos aqui</p>
                    <p className="text-xs text-center mt-1">Os cursos aparecerão na ordem que você adicionar</p>
                  </div>
                ) : (
                  <div className="flex flex-col flex-1 min-h-0">
                    <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                      <div className="space-y-3">
                        {selectedCourses.map((course, index) => (
                          <div key={course.id} className="relative">
                            {/* Espaço que se abre quando arrasta por cima */}
                            {dropTargetIndex === index && draggedIndex !== null && draggedIndex !== index && (
                              <div className="h-16 bg-blue-200 dark:bg-blue-800 border-2 border-dashed border-blue-400 rounded-xl mb-3 flex items-center justify-center animate-pulse">
                                <span className="text-blue-600 dark:text-blue-300 text-sm font-medium">
                                  ↓ Solte aqui ↓
                                </span>
                              </div>
                            )}
                            
                            <div
                              className={`group relative bg-gradient-to-r ${courseColors[index % courseColors.length]} p-4 rounded-xl text-white shadow-lg transform transition-all duration-300 ease-out cursor-move select-none ${
                                draggedIndex === index 
                                  ? 'opacity-50 scale-95 rotate-3 z-50' // Item sendo arrastado fica semi-transparente
                                  : dropTargetIndex === index
                                    ? 'scale-105 shadow-2xl'
                                    : 'hover:scale-102 hover:shadow-xl'
                              }`}
                              style={{
                                transformOrigin: 'center',
                                transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                              }}
                              draggable
                              onDragStart={(e) => {
                                console.log('🏁 Iniciando drag do curso:', course.nome, 'índice:', index);
                                setIsDragging(true);
                                setDraggedIndex(index);
                                playSound('pickup');
                                
                                e.dataTransfer.setData('text/plain', JSON.stringify({
                                  type: 'selected',
                                  courseId: course.id,
                                  index: index,
                                  course: course
                                }));
                                e.dataTransfer.effectAllowed = 'move';
                              }}
                              onDragEnd={() => {
                                console.log('🏁 Finalizando drag');
                                setIsDragging(false);
                                setDraggedIndex(null);
                                setDropTargetIndex(null);
                                setDragOverY(null);
                              }}
                              onDragOver={(e) => {
                                e.preventDefault();
                                if (draggedIndex !== null && draggedIndex !== index) {
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  const y = e.clientY;
                                  const middle = rect.top + rect.height / 2;
                                  
                                  // Determina se vai inserir antes ou depois baseado na posição do mouse
                                  if (y < middle) {
                                    setDropTargetIndex(index);
                                  } else {
                                    setDropTargetIndex(index + 1);
                                  }
                                  setDragOverY(y);
                                }
                              }}
                              onDrop={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                
                                try {
                                  const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                                  console.log('🎯 Drop sobre curso:', course.nome, 'índice atual:', index);
                                  
                                  if (data.type === 'selected' && data.index !== undefined && data.index !== index) {
                                    const newSelected = [...selectedCourses];
                                    const draggedCourse = newSelected[data.index];
                                    
                                    // Remove o curso da posição original
                                    newSelected.splice(data.index, 1);
                                    
                                    // Determina a posição de inserção
                                    let insertIndex = index;
                                    if (data.index < index) {
                                      insertIndex = index - 1;
                                    }
                                    if (dropTargetIndex !== null && dropTargetIndex <= selectedCourses.length) {
                                      insertIndex = dropTargetIndex;
                                      if (data.index < dropTargetIndex) {
                                        insertIndex = dropTargetIndex - 1;
                                      }
                                    }
                                    
                                    // Garante que o índice esteja dentro dos limites
                                    insertIndex = Math.max(0, Math.min(insertIndex, newSelected.length));
                                    
                                    newSelected.splice(insertIndex, 0, draggedCourse);
                                    
                                    console.log('🔄 Nova ordem:', newSelected.map((c, i) => `${i+1}. ${c.nome}`));
                                    setSelectedCourses(newSelected);
                                    playSound('success');
                                  }
                                } catch (error) {
                                  console.error('Erro no drop:', error);
                                }
                                
                                // Reset dos estados
                                setDropTargetIndex(null);
                                setDragOverY(null);
                              }}
                              onClick={(e) => {
                                if (isDragging) {
                                  e.preventDefault();
                                  e.stopPropagation();
                                }
                              }}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1 pr-3">
                                  <div className="font-semibold text-base leading-tight mb-2 line-clamp-2">
                                    {course.nome}
                                  </div>
                                  <div className="text-xs opacity-90">
                                    ID: {course.courseid}
                                  </div>
                                </div>
                                
                                {/* Botão de remoção */}
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleRemoveCourse(course.id);
                                    playSound('drop');
                                  }}
                                  className="flex items-center justify-center w-7 h-7 bg-red-500 hover:bg-red-600 rounded-lg transition-all duration-200 hover:scale-110 text-white font-bold text-sm shadow-lg z-20"
                                  type="button"
                                  title="Remover curso"
                                >
                                  🗑️
                                </button>
                              </div>
                              
                              {/* Indicador de posição */}
                              <div className={`absolute top-2 left-2 bg-black bg-opacity-30 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold text-white border border-white border-opacity-20 transition-all duration-300 ${
                                draggedIndex === index ? 'bg-yellow-500 animate-pulse' : ''
                              }`}>
                                {index + 1}
                              </div>
                              
                              {/* Indicador visual quando está sendo arrastado */}
                              {draggedIndex === index && (
                                <div className="absolute inset-0 border-2 border-dashed border-yellow-300 rounded-xl animate-pulse pointer-events-none">
                                </div>
                              )}
                            </div>
                            
                            {/* Espaço que se abre no final da lista */}
                            {index === selectedCourses.length - 1 && dropTargetIndex === selectedCourses.length && draggedIndex !== null && (
                              <div className="h-16 bg-blue-200 dark:bg-blue-800 border-2 border-dashed border-blue-400 rounded-xl mt-3 flex items-center justify-center animate-pulse">
                                <span className="text-blue-600 dark:text-blue-300 text-sm font-medium">
                                  ↓ Solte aqui ↓
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {isDragOver && (
                      <div className="border-2 border-dashed border-blue-400 bg-blue-100 dark:bg-blue-900/30 rounded-xl p-4 text-center text-blue-600 dark:text-blue-400 animate-pulse mt-3">
                        <div className="text-2xl mb-1">⬇️</div>
                        <p className="text-sm font-medium">Solte aqui para adicionar</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Painel direito - Lista de cursos disponíveis */}
          <div className="flex-1 p-6 flex flex-col">
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                🔍 Buscar Cursos Disponíveis
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Digite para buscar cursos..."
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
              />
            </div>

            {/* Lista de cursos disponíveis */}
            <div 
              className="flex-1 overflow-y-auto border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl p-2 transition-all duration-200"
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.classList.add('border-red-400', 'bg-red-50', 'dark:bg-red-900/20');
              }}
              onDragLeave={(e) => {
                e.currentTarget.classList.remove('border-red-400', 'bg-red-50', 'dark:bg-red-900/20');
              }}
              onDrop={(e) => {
                e.currentTarget.classList.remove('border-red-400', 'bg-red-50', 'dark:bg-red-900/20');
                handleDropBackToAvailable(e);
              }}
            >
              {filteredCourses.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                  <div className="text-4xl mb-3">📚</div>
                  <p className="text-center font-medium">
                    {searchTerm ? 'Nenhum curso encontrado' : availableCourses.length === selectedCourses.length ? 'Todos os cursos foram adicionados' : 'Digite para buscar cursos'}
                  </p>
                  <p className="text-xs text-center mt-2 text-gray-400">
                    Arraste cursos selecionados aqui para removê-los
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {filteredCourses.map((course) => (
                    <div
                      key={course.courseid}
                      className={`group relative bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl p-4 cursor-grab active:cursor-grabbing transition-all duration-300 ${
                        draggedCourse?.courseid === course.courseid 
                          ? 'opacity-40 scale-90 rotate-6 shadow-2xl border-blue-500' 
                          : 'hover:border-blue-400 hover:shadow-xl hover:scale-105 hover:-translate-y-2 hover:rotate-1'
                      } ${hoveredCourse === course.courseid ? 'border-blue-400 shadow-xl scale-105' : ''}`}
                      style={{
                        transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)', // Efeito borrachudo
                        transformOrigin: 'center',
                      }}
                      draggable
                      onDragStart={(e) => {
                        handleDragStart(e, course);
                        playSound('pickup');
                        
                        // Efeito visual no curso sendo arrastado
                        if (e.currentTarget) {
                          e.currentTarget.style.transform = 'scale(1.1) rotate(-3deg)';
                          setTimeout(() => {
                            if (e.currentTarget) {
                              e.currentTarget.style.transform = '';
                            }
                          }, 200);
                        }
                      }}
                      onDragEnd={() => {
                        handleDragEnd();
                        playSound('drop');
                      }}
                      onMouseEnter={() => {
                        setHoveredCourse(course.courseid);
                        // Efeito sutil de entrada
                        const element = document.querySelector(`[data-course-id="${course.courseid}"]`) as HTMLElement;
                        if (element) {
                          element.style.transform = 'scale(1.02)';
                        }
                      }}
                      onMouseLeave={() => {
                        setHoveredCourse(null);
                        // Reset do efeito
                        const element = document.querySelector(`[data-course-id="${course.courseid}"]`) as HTMLElement;
                        if (element) {
                          element.style.transform = '';
                        }
                      }}
                      data-course-id={course.courseid}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900 dark:text-white text-base leading-tight mb-2">
                            {course.nome}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            ID: {course.courseid}
                          </div>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-blue-500">
                          <div className="text-lg">⤴️</div>
                        </div>
                      </div>
                      
                      {/* Indicador visual de drag */}
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-10 rounded-xl transition-opacity duration-200"></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </form>
        
        {/* Footer com botões */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <div>💡 Arraste cursos da direita para a esquerda para selecioná-los</div>
            <div>🔄 Arraste um curso sobre outro para trocar as posições</div>
            <div>🗑️ Arraste cursos selecionados de volta para a direita para removê-los</div>
          </div>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-500 transition-all duration-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={!nome.trim()}
              className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {editingData ? '✏️ Salvar Alterações' : '✨ Criar Acompanhamento'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}