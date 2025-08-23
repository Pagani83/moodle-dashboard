/**
 * Configuração do React Query Client
 * Otimizado para integração com Moodle API
 */

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Configurações baseadas na estratégia de cache descoberta
      staleTime: 5 * 60 * 1000, // 5 minutos padrão
      gcTime: 30 * 60 * 1000, // 30 minutos garbage collection
      retry: 3, // Voltar para 3 - necessário para APIs instáveis do Moodle
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Backoff exponencial
      
      // Configurações para melhor UX
      refetchOnWindowFocus: false,
      refetchOnMount: true, // Voltar para true - necessário para carregar dados
      refetchOnReconnect: true,
      
      // Error handling
      throwOnError: false,
    },
    mutations: {
      retry: 1,
      retryDelay: 2000,
    },
  },
});

// Configurações específicas por tipo de query
export const QUERY_CONFIGS = {
  // Dados estáticos/raros de mudar
  static: {
    staleTime: 24 * 60 * 60 * 1000, // 24 horas
    gcTime: 48 * 60 * 60 * 1000, // 48 horas
  },
  
  // Dados que mudam ocasionalmente
  moderate: {
    staleTime: 60 * 60 * 1000, // 1 hora
    gcTime: 2 * 60 * 60 * 1000, // 2 horas
  },
  
  // Dados dinâmicos
  dynamic: {
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 15 * 60 * 1000, // 15 minutos
  },
  
  // YouTube API - OTIMIZADO PARA POUPAR QUOTA
  youtube: {
    staleTime: 60 * 60 * 1000, // 1 hora - muito conservador
    gcTime: 24 * 60 * 60 * 1000, // 24 horas - manter por muito tempo
    retry: 1, // Apenas 1 tentativa
    refetchOnWindowFocus: false, // NUNCA refetch automaticamente
    refetchOnMount: false, // NUNCA refetch ao montar
    refetchOnReconnect: false, // NUNCA refetch ao reconectar
  },
  
  // Dados em tempo real
  realtime: {
    staleTime: 30 * 1000, // 30 segundos
    gcTime: 2 * 60 * 1000, // 2 minutos
  },
} as const;