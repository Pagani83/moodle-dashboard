'use client';

import React, { useState, useEffect } from 'react';
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
import { UserMenu } from '@/components/auth/user-menu';
import { UserManagement } from '@/components/admin/user-management';
import { useSession } from 'next-auth/react';
import { useMoodleStore } from '@/store/moodle-store';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
import { useAcompanhamentosSync } from '@/hooks/use-acompanhamentos';
import { clearLocalAcompanhamentos } from '@/utils/clear-local-acompanhamentos';
import type { Acompanhamento } from '@/types/moodle';

// Componentes extraídos
import {
  useCachedReport134,
  extractUniqueCoursesFromReport,
  StatusCard,
  ConfigurationNeededView,
  ConfigurationView,
  TestConnectionView,
  DashboardContent,
  Report134View,
  CreateAcompanhamentoModal
} from './index';

export function DashboardHomePage() {
  const { isConfigured, needsConfiguration } = useMoodleStatus();
  const { data: session } = useSession();
  
  const { theme, setTheme } = useMoodleStore();
  const client = useSafeMoodleClient();
  
  // Limpar acompanhamentos locais obsoletos
  React.useEffect(() => {
    clearLocalAcompanhamentos();
  }, []);
  
  // Use API sync hook for persistent storage
  const { createAcompanhamento, updateAcompanhamento, deleteAcompanhamento } = useAcompanhamentosSync();
  
  // Estado do modal de detalhamento
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAcompanhamento, setModalAcompanhamento] = useState<Acompanhamento | null>(null);
  const { config, filters } = useMoodleStore();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'acompanhamentos' | 'report134' | 'usuarios' | 'config'>('dashboard');


  // Hook para buscar dados do cache local com fallback para arquivos de storage
  const report134Cache = useCachedReport134();
  console.log('Dashboard - report134Cache.error:', report134Cache.error);

  // Estado para modal de criação/edição
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingAcompanhamento, setEditingAcompanhamento] = useState<Acompanhamento | null>(null);

  // Funções para gerenciar acompanhamentos
  const handleCreateNew = () => {
    setEditingAcompanhamento(null); // Garantir que não está em modo de edição
    setCreateModalOpen(true);
  };

  const handleCreateAcompanhamento = async (dados: { nome: string; descricao: string; cursos: any[] }) => {
    try {
      const base = {
        nome: dados.nome,
        descricao: dados.descricao,
        cursos: dados.cursos,
        mostrar_card_resumo: true,
        criado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString()
      };

      if (editingAcompanhamento) {
        // Editando acompanhamento existente
        await updateAcompanhamento({ id: editingAcompanhamento.id, ...base });
        setEditingAcompanhamento(null);
      } else {
        // Criando novo acompanhamento
        await createAcompanhamento(base);
      }
      setCreateModalOpen(false);
    } catch (error) {
      console.error('Erro ao salvar acompanhamento:', error);
      alert('Erro ao salvar acompanhamento. Tente novamente.');
    }
  };

  const handleEdit = (acompanhamento: Acompanhamento) => {
    setEditingAcompanhamento(acompanhamento);
    setCreateModalOpen(true);
  };

  const handleDelete = async (acompanhamento: Acompanhamento) => {
    if (window.confirm(`Tem certeza que deseja excluir o acompanhamento "${acompanhamento.nome}"?`)) {
      try {
        await deleteAcompanhamento(acompanhamento.id);
      } catch (error) {
        console.error('Erro ao excluir acompanhamento:', error);
        alert('Erro ao excluir acompanhamento. Tente novamente.');
      }
    }
  };

  // Hooks para dados específicos usando cache baseado no arquivo
  const masterData = useDashboardMasterCJUD(
    client!,
    filters.category || 22,
    filters.startDate,
    filters.endDate,
    false // DESATIVADO - focar apenas no Relatório 134
  );

  const summaries = useCourseSummaries(
    client!,
    filters.category || 22,
    false // DESATIVADO - focar apenas no Relatório 134
  );

  const testMutation = useTestConnection(client!);
  const cacheStats = useCacheStats(client!, false); // DESATIVADO
  const runReportMutation = useRunReport(client!);
  
  // Hooks para Report 134 que reaproveita o cache já carregado
  const status = useReport134Status(client!);
  const forceUpdate = useForceReport134Update(client!);

  const queryClient = useQueryClient();

  // Configuração precisa ser feita?
  if (needsConfiguration) {
    return <ConfigurationNeededView />;
  }

  return (
    <div className="min-h-screen transition-colors" style={{ background: 'var(--background)' }}>
      {/* Header que alterna entre temas com bom contraste */}
      <header 
        className="shadow-lg"
        style={{ 
          backgroundColor: theme === 'light' ? '#ffffff' : '#0f172a',
          color: theme === 'light' ? '#1e293b' : '#f8fafc',
          borderBottom: theme === 'light' ? '1px solid #e2e8f0' : '1px solid #374151'
        }}
      >
        <div className="flex items-center justify-between px-6 py-6">
          <div className="flex flex-col space-y-1">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Dashboard Moodle CJUD
            </h1>
            <p 
              className="text-sm"
              style={{ color: theme === 'light' ? '#64748b' : '#94a3b8' }}
            >
              Sistema de acompanhamento e relatórios
            </p>
          </div>

          <div className="flex items-center space-x-4">
            {/* Status dinâmico de conexão e cache */}
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                {report134Cache.isLoading ? (
                  <>
                    <div className="h-2 w-2 bg-yellow-500 rounded-full animate-pulse"></div>
                    <span 
                      className="text-xs"
                      style={{ color: theme === 'light' ? '#eab308' : '#fbbf24' }}
                    >
                      Carregando cache...
                    </span>
                  </>
                ) : report134Cache.error ? (
                  <>
                    <div className="h-2 w-2 bg-red-500 rounded-full"></div>
                    <span 
                      className="text-xs"
                      style={{ color: theme === 'light' ? '#ef4444' : '#f87171' }}
                    >
                      Erro no cache
                    </span>
                  </>
                ) : report134Cache.data?.data && report134Cache.data.data.length > 0 ? (
                  <>
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    <span 
                      className="text-xs"
                      style={{ color: theme === 'light' ? '#22c55e' : '#4ade80' }}
                    >
                      Cache ativo ({report134Cache.data.data.length} registros)
                    </span>
                  </>
                ) : (
                  <>
                    <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
                    <span 
                      className="text-xs"
                      style={{ color: theme === 'light' ? '#64748b' : '#94a3b8' }}
                    >
                      Cache vazio
                    </span>
                  </>
                )}
              </div>
              <button
                onClick={() => {
                  console.log('🔄 Alternando tema de', theme, 'para', theme === 'dark' ? 'light' : 'dark');
                  setTheme(theme === 'dark' ? 'light' : 'dark');
                }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 hover:scale-105"
                style={{ 
                  backgroundColor: theme === 'light' ? '#f1f5f9' : '#334155',
                  color: theme === 'light' ? '#475569' : '#cbd5e1',
                  border: `1px solid ${theme === 'light' ? '#e2e8f0' : '#475569'}`
                }}
                title={`Alternar para modo ${theme === 'dark' ? 'claro' : 'escuro'}`}
              >
                <span className="text-sm">
                  {theme === 'dark' ? '🌞' : '🌙'}
                </span>
                <span>
                  {theme === 'dark' ? 'Claro' : 'Escuro'}
                </span>
              </button>
            </div>
            
            {/* Menu do usuário */}
            <UserMenu />
          </div>
        </div>

        {/* Navegação por abas - estilo original */}
        <nav 
          className="flex space-x-0 px-6"
          style={{ 
            backgroundColor: theme === 'light' ? '#f8fafc' : '#1e293b',
            borderBottom: theme === 'light' ? '1px solid #e2e8f0' : '1px solid #374151'
          }}
        >
          <button
            onClick={() => setActiveTab('dashboard')}
            className="px-4 py-3 text-sm font-medium transition-colors"
            style={{ 
              backgroundColor: activeTab === 'dashboard' ? '#2563eb' : 'transparent',
              color: activeTab === 'dashboard' 
                ? '#ffffff' 
                : (theme === 'light' ? '#475569' : '#cbd5e1')
            }}
          >
            Dashboard
          </button>

          <button
            onClick={() => setActiveTab('acompanhamentos')}
            className="px-4 py-3 text-sm font-medium transition-colors"
            style={{ 
              backgroundColor: activeTab === 'acompanhamentos' ? '#2563eb' : 'transparent',
              color: activeTab === 'acompanhamentos' 
                ? '#ffffff' 
                : (theme === 'light' ? '#475569' : '#cbd5e1')
            }}
          >
            Acompanhamentos
          </button>

          <button
            onClick={() => setActiveTab('report134')}
            className="px-4 py-3 text-sm font-medium transition-colors"
            style={{ 
              backgroundColor: activeTab === 'report134' ? '#2563eb' : 'transparent',
              color: activeTab === 'report134' 
                ? '#ffffff' 
                : (theme === 'light' ? '#475569' : '#cbd5e1')
            }}
          >
            Relatório 134
          </button>

          {/* Tab de usuários só para admin */}
          {session?.user?.role === 'ADMIN' && (
            <button
              onClick={() => setActiveTab('usuarios')}
              className="px-4 py-3 text-sm font-medium transition-colors"
              style={{ 
                backgroundColor: activeTab === 'usuarios' ? '#2563eb' : 'transparent',
                color: activeTab === 'usuarios' 
                  ? '#ffffff' 
                  : (theme === 'light' ? '#475569' : '#cbd5e1')
              }}
            >
              Usuários
            </button>
          )}

          <button
            onClick={() => setActiveTab('config')}
            className="px-4 py-3 text-sm font-medium transition-colors"
            style={{ 
              backgroundColor: activeTab === 'config' ? '#2563eb' : 'transparent',
              color: activeTab === 'config' 
                ? '#ffffff' 
                : (theme === 'light' ? '#475569' : '#cbd5e1')
            }}
          >
            Configurações
          </button>
        </nav>
      </header>

      {/* Conteúdo principal */}
      <main className="px-6 py-6">
        {activeTab === 'dashboard' && (
          <DashboardContent
            masterData={masterData}
            summaries={summaries}
            cacheStats={cacheStats}
            report134Cache={report134Cache}
          />
        )}

        {activeTab === 'report134' && (
          <Report134View
            status={status}
            forceUpdate={forceUpdate}
            report134Cache={report134Cache}
          />
        )}

        {activeTab === 'acompanhamentos' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className={`text-3xl font-bold ${
                  theme === 'dark' ? 'text-white' : 'text-slate-900'
                }`}>
                  Acompanhamentos de Cursos
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
            <TestConnectionView
              testMutation={testMutation}
              client={client}
              runReportMutation={runReportMutation}
            />
          </div>
        )}
        
        {activeTab === 'usuarios' && (
          <div className="space-y-6">
            <UserManagement />
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
