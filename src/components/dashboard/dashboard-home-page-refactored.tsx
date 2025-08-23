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
  
  const { theme, setTheme, removeAcompanhamento, addAcompanhamento, updateAcompanhamento } = useMoodleStore();
  const client = useSafeMoodleClient();
  
  // Estado do modal de detalhamento
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAcompanhamento, setModalAcompanhamento] = useState<Acompanhamento | null>(null);
  const { config, filters } = useMoodleStore();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'acompanhamentos' | 'report134' | 'usuarios' | 'config'>('dashboard');

  // Hook para buscar dados do cache local com fallback para arquivos de storage
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
    if (window.confirm(`Tem certeza que deseja excluir o acompanhamento "${acompanhamento.nome}"?`)) {
      removeAcompanhamento(acompanhamento.id);
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
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      {/* Header fixo */}
      <header className="sticky top-0 z-40 border-b" style={{ 
        backgroundColor: 'var(--background)',
        borderColor: 'var(--border)',
      }}>
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Moodle Dashboard
            </div>
            <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              v2.0 | NextAuth
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Menu do usuário - novo componente de autenticação */}
            <UserMenu />
            
            {/* Toggle de tema */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-lg border bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {theme === 'dark' ? '🌞' : '🌙'}
            </button>
          </div>
        </div>

        {/* Navegação por tabs */}
        <nav className="flex space-x-0 px-6 border-t" style={{ borderColor: 'var(--border)' }}>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'dashboard' 
                ? 'border-blue-600 text-blue-600 bg-blue-50/50' 
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span>Dashboard</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('acompanhamentos')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'acompanhamentos' 
                ? 'border-blue-600 text-blue-600 bg-blue-50/50' 
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center space-x-2">
              <BookOpen className="h-4 w-4" />
              <span>Acompanhamentos</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('report134')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'report134' 
                ? 'border-blue-600 text-blue-600 bg-blue-50/50' 
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>Report 134</span>
            </div>
          </button>

          {/* Tab de usuários só para admin */}
          {session?.user?.role === 'ADMIN' && (
            <button
              onClick={() => setActiveTab('usuarios')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'usuarios' 
                  ? 'border-blue-600 text-blue-600 bg-blue-50/50' 
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Usuários</span>
              </div>
            </button>
          )}

          <button
            onClick={() => setActiveTab('config')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'config' 
                ? 'border-blue-600 text-blue-600 bg-blue-50/50' 
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Config</span>
            </div>
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
