/**
 * Provider principal para integração Moodle
 * Combina React Query, Zustand e configuração do cliente Moodle
 */

'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { MoodleClient, createMoodleClient } from '@/lib/moodle-client';
import { queryClient } from '@/lib/query-client';
import { useMoodleStore, initializeDevConfig } from '@/store/moodle-store';
import type { MoodleConfig } from '@/types/moodle';
import { REPORT_134_CONFIG, type Report134Cache } from '@/hooks/use-report-134';

// ============================================================================
// CONTEXT PARA CLIENTE MOODLE
// ============================================================================

interface MoodleContextValue {
  client: MoodleClient | null;
  isConfigured: boolean;
  config: MoodleConfig | null;
}

const MoodleContext = createContext<MoodleContextValue>({
  client: null,
  isConfigured: false,
  config: null,
});

// ============================================================================
// PROVIDER DO CLIENTE MOODLE
// ============================================================================

interface MoodleClientProviderProps {
  children: React.ReactNode;
}

function MoodleClientProvider({ children }: MoodleClientProviderProps) {
  const { config, isConfigured } = useMoodleStore();

  // Criar cliente apenas quando configurado corretamente
  const client = useMemo(() => {
    if (!config || !isConfigured) {
      return null;
    }

    try {
      return createMoodleClient(config);
    } catch (error) {
      console.error('❌ Failed to create Moodle client:', error);
      return null;
    }
  }, [config, isConfigured]);

  const contextValue: MoodleContextValue = {
    client,
    isConfigured,
    config,
  };

  return (
    <MoodleContext.Provider value={contextValue}>
      {children}
    </MoodleContext.Provider>
  );
}

// ============================================================================
// PROVIDER PRINCIPAL
// ============================================================================

interface MoodleProviderProps {
  children: React.ReactNode;
  enableDevtools?: boolean;
}

export function MoodleProvider({ 
  children, 
  enableDevtools = process.env.NODE_ENV === 'development' 
}: MoodleProviderProps) {
  const [initializationComplete, setInitializationComplete] = useState(false);
  
  // Inicializar configuração automaticamente se as variáveis de ambiente estão disponíveis
  useEffect(() => {
    // Aguardar um pouco para garantir que as env vars estão disponíveis
    const timer = setTimeout(() => {
      try {
        initializeDevConfig();
      } catch (error) {
        console.error('Erro ao inicializar configuração:', error);
      } finally {
        setInitializationComplete(true);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Persistência do cache do React Query no browser
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const persister = createSyncStoragePersister({
        storage: window.localStorage,
        key: 'moodle_dash_query_cache_v1',
        throttleTime: 1000,
      });
      persistQueryClient({
        queryClient,
        persister,
        dehydrateOptions: {
          shouldDehydrateQuery: (q) => {
            // Persiste apenas dados do relatório 134 e dados 'static'
            const key = q.queryKey as any[];
            const is134 = Array.isArray(key) && key.join('|').includes('report134');
            return is134 || q.state.status === 'success';
          },
        },
        maxAge: 24 * 60 * 60 * 1000, // 24h
      });
    } catch (e) {
      console.warn('React Query persistence disabled (storage unavailable):', e);
    }
  }, []);

  // Bootstrap automático: se não houver cache do 134 após a reidratação, restaurar do último XLSX salvo
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let cancelled = false;

    const getNextScheduledTime = () => {
      const now = new Date();
      const next = new Date();
      next.setHours(5, 0, 0, 0); // 5h
      if (next <= now) next.setDate(next.getDate() + 1);
      return next;
    };

    async function bootstrapReport134IfMissing() {
      // Aguarda um tick para a reidratação do React Query concluir
      await Promise.resolve();
      const existing = queryClient.getQueryData(REPORT_134_CONFIG.cacheKey as unknown as any[]);
      if (existing) return; // já existe cache (persisitido ou recém-carregado)
      try {
        const res = await fetch('/api/cache/report-134?latest=1');
        if (!res.ok) return;
        const json = await res.json();
        if (!json?.ok || !json?.hasFile) return;
        const data = Array.isArray(json.data) ? json.data : [];
        const payload: Report134Cache = {
          data,
          totalRows: data.length,
          lastFetch: json.meta?.lastFetch ? new Date(json.meta.lastFetch) : new Date(),
          nextScheduledFetch: getNextScheduledTime(),
          cacheValidUntil: getNextScheduledTime(),
          fetchDuration: Number(json.meta?.fetchDuration) || 0,
        };
        if (!cancelled) {
          queryClient.setQueryData(REPORT_134_CONFIG.cacheKey as unknown as any[], payload);
        }
      } catch (e) {
        console.warn('⚠️ Falha ao restaurar cache 134 automaticamente:', e);
      }
    }

    bootstrapReport134IfMissing();
    return () => { cancelled = true; };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <MoodleClientProvider>
        {children}
      </MoodleClientProvider>
      {enableDevtools && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}

// ============================================================================
// HOOK PARA USAR O CLIENTE MOODLE
// ============================================================================

export function useMoodleClient(): MoodleClient {
  const { client, isConfigured } = useContext(MoodleContext);
  
  if (!isConfigured || !client) {
    throw new Error(
      'Moodle client not configured. Please configure Moodle settings first.'
    );
  }
  
  return client;
}

// ============================================================================
// HOOK PARA VERIFICAR SE ESTÁ CONFIGURADO
// ============================================================================

export function useMoodleStatus() {
  const { client, isConfigured, config } = useContext(MoodleContext);
  
  return {
    isConfigured,
    hasClient: client !== null,
    config,
    needsConfiguration: !isConfigured || !config?.token || !config?.baseUrl,
  };
}

// ============================================================================
// HOOK PARA CONFIGURAÇÃO SEGURA
// ============================================================================

export function useSafeMoodleClient(): MoodleClient | null {
  const { client } = useContext(MoodleContext);
  return client;
}

// ============================================================================
// COMPONENTE DE CONFIGURAÇÃO
// ============================================================================

interface ConfigurationGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ConfigurationGuard({ 
  children, 
  fallback 
}: ConfigurationGuardProps) {
  const { isConfigured } = useMoodleStatus();
  const [checkComplete, setCheckComplete] = useState(false);
  
  // Aguardar um momento para a inicialização automática
  useEffect(() => {
    const timer = setTimeout(() => {
      setCheckComplete(true);
    }, 1000); // 1 segundo para aguardar inicialização

    return () => clearTimeout(timer);
  }, []);
  
  if (!checkComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Inicializando configurações...</p>
        </div>
      </div>
    );
  }
  
  if (!isConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background)' }}>
        {fallback || (
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Configuração Necessária
            </h1>
            <p className="text-gray-600 mb-6">
              Por favor, configure as credenciais do Moodle para continuar.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-md">
              <p className="text-sm text-yellow-800">
                Configure as variáveis de ambiente no Vercel:<br/>
                - NEXT_PUBLIC_MOODLE_BASE_URL<br/>
                - NEXT_PUBLIC_MOODLE_TOKEN
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }
  
  return <>{children}</>;
}

// ============================================================================
// COMPONENTE DE LOADING/ERROR BOUNDARY
// ============================================================================

interface MoodleErrorBoundaryProps {
  children: React.ReactNode;
}

interface MoodleErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class MoodleErrorBoundary extends React.Component<
  MoodleErrorBoundaryProps,
  MoodleErrorBoundaryState
> {
  constructor(props: MoodleErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): MoodleErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('❌ Moodle Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background)' }}>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              Erro na Integração Moodle
            </h1>
            <p className="text-gray-600 mb-4">
              Ocorreu um erro ao conectar com o Moodle.
            </p>
            {this.state.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md">
                <p className="text-sm text-red-800 font-mono">
                  {this.state.error.message}
                </p>
              </div>
            )}
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Recarregar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// COMPONENTE WRAPPER COMPLETO
// ============================================================================

interface MoodleAppWrapperProps {
  children: React.ReactNode;
  enableDevtools?: boolean;
  requireConfiguration?: boolean;
  configurationFallback?: React.ReactNode;
}

export function MoodleAppWrapper({
  children,
  enableDevtools,
  requireConfiguration = true,
  configurationFallback,
}: MoodleAppWrapperProps) {
  return (
    <MoodleErrorBoundary>
      <MoodleProvider enableDevtools={enableDevtools}>
        {requireConfiguration ? (
          <ConfigurationGuard fallback={configurationFallback}>
            {children}
          </ConfigurationGuard>
        ) : (
          children
        )}
      </MoodleProvider>
    </MoodleErrorBoundary>
  );
}