'use client';

import React, { useState } from 'react';
import { 
  useMoodleStatus, 
  useSafeMoodleClient 
} from '@/providers/moodle-provider';
import { useCombinedReport } from '@/hooks/useCombinedReport';
import { UserMenu } from '@/components/auth/user-menu';
import { UserManagement } from '@/components/admin/user-management';
import { useSession } from 'next-auth/react';
import { useMoodleStore } from '@/store/moodle-store';
import { useQueryClient } from '@tanstack/react-query';
import {
  BookOpen,
} from 'lucide-react';
import { AcompanhamentosGrid } from './acompanhamentos-grid';
import { AcompanhamentoDetailModal } from './acompanhamento-detail-modal';
import { useAcompanhamentosSync } from '@/hooks/use-acompanhamentos';
import type { Acompanhamento } from '@/types/moodle';

// Componentes extraídos
import {
  extractUniqueCoursesFromReport,
  ConfigurationNeededView,
  ConfigurationView,
  DashboardContent,
  CreateAcompanhamentoModal
} from './index';
import { SourceReportsView } from './views/SourceReportsView';

export function DashboardHomePage() {
  const { isConfigured, needsConfiguration } = useMoodleStatus();
  const { data: session } = useSession();
  
  const { theme, setTheme } = useMoodleStore();
  const client = useSafeMoodleClient();
  
  const { createAcompanhamento, updateAcompanhamento, deleteAcompanhamento } = useAcompanhamentosSync();
  
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAcompanhamento, setModalAcompanhamento] = useState<Acompanhamento | null>(null);
  const { config } = useMoodleStore();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'acompanhamentos' | 'sources' | 'usuarios' | 'config'>('dashboard');

  const combinedReport = useCombinedReport();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingAcompanhamento, setEditingAcompanhamento] = useState<Acompanhamento | null>(null);

  const handleCreateNew = () => {
    setEditingAcompanhamento(null);
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
        await updateAcompanhamento({ id: editingAcompanhamento.id, ...base });
        setEditingAcompanhamento(null);
      } else {
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

  const queryClient = useQueryClient();

  if (needsConfiguration) {
    return <ConfigurationNeededView />;
  }

  return (
    <div className="min-h-screen transition-colors" style={{ background: 'var(--background)' }}>
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
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                {combinedReport.isFetching || combinedReport.isLoading ? (
                  <>
                    <div className="h-2 w-2 bg-yellow-500 rounded-full animate-pulse"></div>
                    <span 
                      className="text-xs"
                      style={{ color: theme === 'light' ? '#eab308' : '#fbbf24' }}
                    >
                      Carregando cache...
                    </span>
                  </>
                ) : combinedReport.isError ? (
                  <>
                    <div className="h-2 w-2 bg-red-500 rounded-full"></div>
                    <span 
                      className="text-xs"
                      style={{ color: theme === 'light' ? '#ef4444' : '#f87171' }}
                    >
                      Erro no cache
                    </span>
                  </>
                ) : combinedReport.data?.data && combinedReport.data.data.length > 0 ? (
                  <>
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    <span 
                      className="text-xs"
                      style={{ color: theme === 'light' ? '#22c55e' : '#4ade80' }}
                    >
                      Cache ativo ({combinedReport.data.totalRecords} registros)
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
            
            <UserMenu />
          </div>
        </div>

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
            onClick={() => setActiveTab('sources')}
            className="px-4 py-3 text-sm font-medium transition-colors"
            style={{ 
              backgroundColor: activeTab === 'sources' ? '#2563eb' : 'transparent',
              color: activeTab === 'sources' 
                ? '#ffffff' 
                : (theme === 'light' ? '#475569' : '#cbd5e1')
            }}
          >
            Fontes
          </button>

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

      <main className="px-6 py-6">
        {activeTab === 'dashboard' && (
          <DashboardContent
            masterData={{}}
            summaries={{}}
            cacheStats={{}}
            report134Cache={{}}
            combinedReport={combinedReport}
          />
        )}

        {activeTab === 'sources' && (
          <SourceReportsView />
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
            
            <AcompanhamentosGrid 
              onOpenDetailModal={(acompanhamento) => {
                setModalAcompanhamento(acompanhamento);
                setModalOpen(true);
              }}
              onCreateNew={handleCreateNew}
              onEdit={handleEdit}
              onDelete={handleDelete}
              reportData={(combinedReport.data?.data as any[]) || []}
            />
          </div>
        )}

        {activeTab === 'config' && (
          <div className="space-y-6">
            <ConfigurationView config={config} />
          </div>
        )}
        
        {activeTab === 'usuarios' && (
          <div className="space-y-6">
            <UserManagement />
          </div>
        )}
      </main>
      
      <AcompanhamentoDetailModal
        acompanhamento={modalAcompanhamento}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        reportData={(combinedReport.data?.data as any[]) || []}
      />
      
      {createModalOpen && (
        <CreateAcompanhamentoModal 
          onClose={() => {
            setCreateModalOpen(false);
            setEditingAcompanhamento(null);
          }} 
          onCreate={handleCreateAcompanhamento}
          availableCourses={extractUniqueCoursesFromReport((combinedReport.data?.data as any[]) || [])}
          editingData={editingAcompanhamento}
        />
      )}
    </div>
  );
}
