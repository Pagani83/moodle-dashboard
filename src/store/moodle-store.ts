/**
 * Store Zustand para gerenciamento de estado do Moodle
 * Complementa React Query para configurações e estado da UI
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { 
  MoodleConfig, 
  DashboardFilters, 
  Acompanhamento,
  TipoRelatorio,
  StudentStatus 
} from '@/types/moodle';

// ============================================================================
// INTERFACES DO STORE
// ============================================================================

interface MoodleStore {
  // Configuração
  config: MoodleConfig | null;
  isConfigured: boolean;
  
  // Filtros ativos
  filters: DashboardFilters;
  
  // Acompanhamentos
  acompanhamentos: Acompanhamento[];
  acompanhamentoAtivo: string | null;
  
  // UI State
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark';
  dashboardView: 'cards' | 'table' | 'grid';
  
  // Actions - Configuração
  setConfig: (config: MoodleConfig) => void;
  clearConfig: () => void;
  
  // Actions - Filtros
  setFilters: (filters: Partial<DashboardFilters>) => void;
  clearFilters: () => void;
  
  // Actions - Acompanhamentos
  addAcompanhamento: (acompanhamento: Omit<Acompanhamento, 'id' | 'criado_em' | 'atualizado_em'>) => void;
  updateAcompanhamento: (id: string, updates: Partial<Acompanhamento>) => void;
  removeAcompanhamento: (id: string) => void;
  setAcompanhamentoAtivo: (id: string | null) => void;
  
  // Actions - UI
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setDashboardView: (view: 'cards' | 'table' | 'grid') => void;
}

// ============================================================================
// VALORES PADRÃO
// ============================================================================

const defaultFilters: DashboardFilters = {
  category: 22, // CJUD padrão
  status: undefined,
  startDate: undefined,
  endDate: undefined,
  cursos: undefined,
};

const defaultConfig: MoodleConfig = {
  baseUrl: '/api/moodle',
  token: '',
  timeout: 900000, // 15 minutos
  defaultCategory: 22,
};

// ============================================================================
// STORE PRINCIPAL
// ============================================================================

export const useMoodleStore = create<MoodleStore>()(
  persist(
    (set, get) => ({
      // Estado inicial
      config: null,
      isConfigured: false,
      
      filters: defaultFilters,
      
      acompanhamentos: [],
      acompanhamentoAtivo: null,
      
      sidebarCollapsed: false,
      theme: 'light',
      dashboardView: 'cards',

      // Configuração
      setConfig: (config) => {
        set({ 
          config, 
          isConfigured: Boolean(config.token && config.baseUrl) 
        });
      },

      clearConfig: () => {
        set({ 
          config: null, 
          isConfigured: false 
        });
      },

      // Filtros
      setFilters: (newFilters) => {
        const currentFilters = get().filters;
        set({ 
          filters: { ...currentFilters, ...newFilters } 
        });
      },

      clearFilters: () => {
        set({ filters: defaultFilters });
      },

      // Acompanhamentos
      addAcompanhamento: (acompanhamentoData) => {
        const now = new Date().toISOString();
        const newAcompanhamento: Acompanhamento = {
          id: `acomp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          criado_em: now,
          atualizado_em: now,
          ...acompanhamentoData,
        };

        set((state) => ({
          acompanhamentos: [...state.acompanhamentos, newAcompanhamento],
        }));
      },

      updateAcompanhamento: (id, updates) => {
        set((state) => ({
          acompanhamentos: state.acompanhamentos.map((acomp) =>
            acomp.id === id
              ? { ...acomp, ...updates, atualizado_em: new Date().toISOString() }
              : acomp
          ),
        }));
      },

      removeAcompanhamento: (id) => {
        set((state) => ({
          acompanhamentos: state.acompanhamentos.filter((acomp) => acomp.id !== id),
          acompanhamentoAtivo: state.acompanhamentoAtivo === id ? null : state.acompanhamentoAtivo,
        }));
      },

      setAcompanhamentoAtivo: (id) => {
        set({ acompanhamentoAtivo: id });
      },

      // UI
      toggleSidebar: () => {
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }));
      },

      setTheme: (theme) => {
        set({ theme });
      },

      setDashboardView: (dashboardView) => {
        set({ dashboardView });
      },
    }),
    {
      name: 'moodle-store-v2',
      storage: createJSONStorage(() => localStorage),
      // Apenas persistir configurações e preferências, não dados temporários
      partialize: (state) => ({
        config: state.config,
        isConfigured: state.isConfigured,
        acompanhamentos: state.acompanhamentos,
        theme: state.theme,
        dashboardView: state.dashboardView,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);

// ============================================================================
// STORE PARA CONFIGURAÇÕES TEMPORÁRIAS
// ============================================================================

interface TempConfigStore {
  // Configurações de desenvolvimento
  debugMode: boolean;
  showApiCalls: boolean;
  mockData: boolean;
  
  // Configurações de cache
  cacheEnabled: boolean;
  cacheTtl: number;
  
  // Configurações de relatórios
  selectedReports: number[];
  reportFilters: Record<string, any>;
  
  // Actions
  setDebugMode: (enabled: boolean) => void;
  setShowApiCalls: (enabled: boolean) => void;
  setMockData: (enabled: boolean) => void;
  setCacheEnabled: (enabled: boolean) => void;
  setCacheTtl: (minutes: number) => void;
  setSelectedReports: (reportIds: number[]) => void;
  setReportFilters: (filters: Record<string, any>) => void;
}

export const useTempConfigStore = create<TempConfigStore>((set) => ({
  // Estado inicial
  debugMode: false,
  showApiCalls: true,
  mockData: false,
  cacheEnabled: true,
  cacheTtl: 30,
  selectedReports: [134, 200, 201, 202, 203], // Relatório principal 134 + consultas auxiliares
  reportFilters: {},

  // Actions
  setDebugMode: (enabled) => set({ debugMode: enabled }),
  setShowApiCalls: (enabled) => set({ showApiCalls: enabled }),
  setMockData: (enabled) => set({ mockData: enabled }),
  setCacheEnabled: (enabled) => set({ cacheEnabled: enabled }),
  setCacheTtl: (minutes) => set({ cacheTtl: minutes }),
  setSelectedReports: (reportIds) => set({ selectedReports: reportIds }),
  setReportFilters: (filters) => set({ reportFilters: filters }),
}));

// ============================================================================
// HOOKS UTILITÁRIOS
// ============================================================================

// Hook para acompanhamento ativo
export const useActiveAcompanhamento = () => {
  const { acompanhamentos, acompanhamentoAtivo } = useMoodleStore();
  return acompanhamentos.find(a => a.id === acompanhamentoAtivo) || null;
};

// Hook para verificar se está configurado
export const useIsConfigured = () => {
  return useMoodleStore(state => state.isConfigured);
};

// Hook para configuração atual
export const useMoodleConfig = () => {
  return useMoodleStore(state => state.config);
};

// Hook para filtros ativos
export const useActiveFilters = () => {
  return useMoodleStore(state => state.filters);
};

// Hook para tema
export const useTheme = () => {
  const { theme, setTheme } = useMoodleStore();
  return { theme, setTheme };
};

// ============================================================================
// ACTIONS COMPOSTAS
// ============================================================================

// Inicializar configuração automaticamente das variáveis de ambiente
export const initializeDevConfig = () => {
  const { setConfig, isConfigured } = useMoodleStore.getState();
  
  // Se já está configurado, não sobrescrever
  if (isConfigured) {
    console.log('✅ Moodle já configurado');
    return;
  }
  
  // Obter configuração das variáveis de ambiente
  const envConfig: MoodleConfig = {
    baseUrl: process.env.NEXT_PUBLIC_MOODLE_BASE_URL || defaultConfig.baseUrl,
    token: process.env.NEXT_PUBLIC_MOODLE_TOKEN || '',
    timeout: defaultConfig.timeout,
    defaultCategory: parseInt(process.env.NEXT_PUBLIC_MOODLE_DEFAULT_CATEGORY || '22', 10),
  };

  console.log('🔧 Tentando configurar Moodle:', {
    hasBaseUrl: !!envConfig.baseUrl,
    hasToken: !!envConfig.token,
    baseUrl: envConfig.baseUrl.substring(0, 30) + '...'
  });

  if (envConfig.token && envConfig.baseUrl && envConfig.baseUrl !== '/api/moodle') {
    setConfig(envConfig);
    console.log('✅ Configuração Moodle inicializada das variáveis de ambiente');
    return true;
  } else {
    console.log('ℹ️ Variáveis de ambiente do Moodle não encontradas - configuração manual necessária');
    return false;
  }
};

// Reset completo do estado
export const resetAllStores = () => {
  useMoodleStore.getState().clearConfig();
  useMoodleStore.getState().clearFilters();
  useMoodleStore.setState({
    acompanhamentos: [],
    acompanhamentoAtivo: null,
    sidebarCollapsed: false,
    dashboardView: 'cards',
  });
};

// Criar acompanhamento padrão CJUD
export const createDefaultCJUDAcompanhamento = () => {
  const { addAcompanhamento } = useMoodleStore.getState();
  
  const defaultAcompanhamento = {
    nome: 'CJUD - Cursos 2025',
    descricao: 'Acompanhamento padrão dos cursos CJUD para 2025',
    cursos: [], // Será preenchido dinamicamente
    mostrar_card_resumo: true,
  };

  addAcompanhamento(defaultAcompanhamento);
};