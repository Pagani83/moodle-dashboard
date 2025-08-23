/**
 * Hook para integração com YouTube Data API
 * Permite buscar dados do canal, crescimento, vídeos, etc.
 * 
 * OTIMIZADO PARA POUPAR API QUOTA:
 * - Cache agressivo de 1-6 horas
 * - Sem refetch automático
 * - Apenas 1 tentativa por call
 * - Cache persistente no localStorage
 */

import { useQuery } from '@tanstack/react-query';
import { YouTubeClient, type ChannelInfo, type VideoStatistics, type AnalyticsData } from '@/lib/youtube-client';
import { youtubeQuotaMonitor } from '@/lib/youtube-quota-monitor';

// Cache persistente no localStorage para poupar API calls
const YOUTUBE_CACHE_KEY = 'youtube-data-cache';
const YOUTUBE_CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 horas de cache no localStorage

// Função para ler cache persistente
function getCachedData(key: string) {
  if (typeof window === 'undefined') return null;
  
  try {
    const cached = localStorage.getItem(`${YOUTUBE_CACHE_KEY}-${key}`);
    if (!cached) return null;
    
    const { data, timestamp } = JSON.parse(cached);
    const isExpired = Date.now() - timestamp > YOUTUBE_CACHE_DURATION;
    
    if (isExpired) {
      localStorage.removeItem(`${YOUTUBE_CACHE_KEY}-${key}`);
      return null;
    }
    
    console.log(`📦 YouTube: Usando dados em cache para ${key}`);
    return data;
  } catch (error) {
    console.warn('Erro ao ler cache do YouTube:', error);
    return null;
  }
}

// Função para salvar cache persistente
function setCachedData(key: string, data: any) {
  if (typeof window === 'undefined') return;
  
  try {
    const cacheEntry = {
      data,
      timestamp: Date.now()
    };
    localStorage.setItem(`${YOUTUBE_CACHE_KEY}-${key}`, JSON.stringify(cacheEntry));
    console.log(`💾 YouTube: Dados salvos em cache para ${key}`);
  } catch (error) {
    console.warn('Erro ao salvar cache do YouTube:', error);
  }
}

// Configuração padrão - usa variáveis de ambiente
const DEFAULT_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || '', 
  channelHandle: process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_HANDLE || '@cjudtjrs',
  channelId: undefined as string | undefined,
};

// ============================================================================
// HOOK PRINCIPAL - INFORMAÇÕES DO CANAL
// ============================================================================

export function useYouTubeChannel(
  config: typeof DEFAULT_CONFIG = DEFAULT_CONFIG,
  enabled: boolean = true
) {
  const cacheKey = `channel-${config.channelHandle || config.channelId}`;
  
  return useQuery({
    queryKey: ['youtube', 'channel', config.channelHandle || config.channelId],
    queryFn: async (): Promise<ChannelInfo> => {
      // Primeiro, verificar quota
      if (youtubeQuotaMonitor.shouldBlockCalls()) {
        throw new Error('YouTube API quota diária esgotada. Tente novamente amanhã.');
      }
      
      if (!youtubeQuotaMonitor.hasQuotaAvailable('channel')) {
        throw new Error('YouTube API quota seria excedida com esta chamada.');
      }
      
      // Segundo, tentar usar cache persistente
      const cachedData = getCachedData(cacheKey);
      if (cachedData) {
        return cachedData;
      }
      
      if (!config.apiKey) {
        throw new Error('YouTube API Key não configurada. Defina NEXT_PUBLIC_YOUTUBE_API_KEY no .env.local');
      }
      
      console.log('📞 YouTube API: Buscando dados frescos do canal...');
      
      // Registrar o uso da API ANTES da chamada
      youtubeQuotaMonitor.recordApiCall('channel');
      
      const client = new YouTubeClient(config);
      const data = await client.getChannelInfo();
      
      // Salvar no cache persistente
      setCachedData(cacheKey, data);
      
      return data;
    },
    enabled: enabled && !!config.apiKey && !youtubeQuotaMonitor.shouldBlockCalls(),
    staleTime: 60 * 60 * 1000, // 1 HORA - Cache muito mais longo para poupar API calls
    gcTime: 24 * 60 * 60 * 1000, // 24 HORAS - Manter em memória por muito mais tempo
    retry: 1, // Apenas 1 tentativa para evitar esgotar quota
    retryDelay: 30000, // 30 segundos de delay entre tentativas
    refetchOnWindowFocus: false, // NUNCA refetch ao focar na janela
    refetchOnMount: false, // NUNCA refetch ao montar o componente se já tem dados
    refetchOnReconnect: false, // NUNCA refetch ao reconectar
  });
}

// ============================================================================
// HOOK - VÍDEOS RECENTES
// ============================================================================

export function useYouTubeRecentVideos(
  maxResults: number = 10,
  config: typeof DEFAULT_CONFIG = DEFAULT_CONFIG,
  enabled: boolean = false // DESABILITADO POR PADRÃO para poupar quota
) {
  return useQuery({
    queryKey: ['youtube', 'recentVideos', maxResults, config.channelHandle || config.channelId],
    queryFn: async (): Promise<VideoStatistics[]> => {
      if (!config.apiKey) {
        throw new Error('YouTube API Key não configurada');
      }
      
      const client = new YouTubeClient(config);
      return await client.getRecentVideos(maxResults);
    },
    enabled: enabled && !!config.apiKey,
    staleTime: 2 * 60 * 60 * 1000, // 2 HORAS - Vídeos recentes não mudam muito
    gcTime: 12 * 60 * 60 * 1000, // 12 HORAS
    retry: 1, // Apenas 1 tentativa para evitar esgotar quota
    retryDelay: 30000, // 30 segundos
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
}

// ============================================================================
// HOOK - CRESCIMENTO DE INSCRITOS (SIMULADO)
// ============================================================================

export function useYouTubeGrowth(
  days: number = 30,
  config: typeof DEFAULT_CONFIG = DEFAULT_CONFIG,
  enabled: boolean = false // DESABILITADO POR PADRÃO para poupar quota
) {
  return useQuery({
    queryKey: ['youtube', 'growth', days, config.channelHandle || config.channelId],
    queryFn: async (): Promise<AnalyticsData[]> => {
      if (!config.apiKey) {
        throw new Error('YouTube API Key não configurada');
      }
      
      const client = new YouTubeClient(config);
      return await client.getSubscriberGrowth(days);
    },
    enabled: enabled && !!config.apiKey,
    staleTime: 4 * 60 * 60 * 1000, // 4 HORAS - Analytics mudam ainda menos
    gcTime: 24 * 60 * 60 * 1000, // 24 HORAS
    retry: 1, // Apenas 1 tentativa para evitar esgotar quota
    retryDelay: 30000, // 30 segundos
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
}

// ============================================================================
// HOOK - VÍDEOS TRENDING
// ============================================================================

export function useYouTubeTrending(
  maxResults: number = 5,
  config: typeof DEFAULT_CONFIG = DEFAULT_CONFIG,
  enabled: boolean = false // DESABILITADO POR PADRÃO para poupar quota
) {
  return useQuery({
    queryKey: ['youtube', 'trending', maxResults, config.channelHandle || config.channelId],
    queryFn: async (): Promise<VideoStatistics[]> => {
      if (!config.apiKey) {
        throw new Error('YouTube API Key não configurada');
      }
      
      const client = new YouTubeClient(config);
      return await client.getTrendingVideos(maxResults);
    },
    enabled: enabled && !!config.apiKey,
    staleTime: 6 * 60 * 60 * 1000, // 6 HORAS - Trending videos são mais estáveis
    gcTime: 24 * 60 * 60 * 1000, // 24 HORAS
    retry: 1, // Apenas 1 tentativa para evitar esgotar quota
    retryDelay: 30000, // 30 segundos
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
}

// ============================================================================
// HOOK CONSOLIDADO - DASHBOARD COMPLETO
// ⚠️  CUIDADO: Este hook faz 4 calls simultâneas à YouTube API!
// ⚠️  Use apenas quando precisar de todos os dados.
// ⚠️  Para widget simples, use apenas useYouTubeChannel()
// ============================================================================

export function useYouTubeDashboard(
  config: typeof DEFAULT_CONFIG = DEFAULT_CONFIG,
  enabled: boolean = true
) {
  console.warn('🚨 useYouTubeDashboard: Este hook faz 4 calls simultâneas! Use com parcimônia.');
  
  const channelQuery = useYouTubeChannel(config, enabled);
  const recentVideosQuery = useYouTubeRecentVideos(8, config, enabled && false); // DESABILITADO
  const growthQuery = useYouTubeGrowth(30, config, enabled && false); // DESABILITADO  
  const trendingQuery = useYouTubeTrending(3, config, enabled && false); // DESABILITADO

  return {
    // Dados
    channel: channelQuery.data,
    recentVideos: recentVideosQuery.data,
    growth: growthQuery.data,
    trending: trendingQuery.data,
    
    // Estados
    isLoading: channelQuery.isLoading || recentVideosQuery.isLoading || 
               growthQuery.isLoading || trendingQuery.isLoading,
    
    isError: channelQuery.isError || recentVideosQuery.isError || 
             growthQuery.isError || trendingQuery.isError,
    
    error: channelQuery.error || recentVideosQuery.error || 
           growthQuery.error || trendingQuery.error,

    // Funções de refetch
    refetch: () => {
      channelQuery.refetch();
      recentVideosQuery.refetch();
      growthQuery.refetch();
      trendingQuery.refetch();
    },

    // Dados computados
    metrics: channelQuery.data ? {
      totalSubscribers: channelQuery.data.statistics.subscriberCount,
      totalViews: channelQuery.data.statistics.viewCount,
      totalVideos: channelQuery.data.statistics.videoCount,
      
      // Crescimento nos últimos 30 dias
      growthRate: growthQuery.data ? 
        growthQuery.data.reduce((acc: number, day: AnalyticsData) => 
          acc + (day.subscribersGained - day.subscribersLost), 0) : 0,
      
      // Média de visualizações dos vídeos recentes
      avgRecentViews: recentVideosQuery.data && recentVideosQuery.data.length > 0 ?
        Math.round(recentVideosQuery.data.reduce((acc: number, video: VideoStatistics) => 
          acc + video.viewCount, 0) / recentVideosQuery.data.length) : 0,
      
      // Engagement rate baseado nos vídeos trending
      engagementRate: trendingQuery.data && trendingQuery.data.length > 0 ?
        trendingQuery.data.reduce((acc: number, video: VideoStatistics) => 
          acc + ((video.likeCount + video.commentCount) / video.viewCount), 0
        ) / trendingQuery.data.length * 100 : 0
    } : null
  };
}

// ============================================================================
// UTILITÁRIOS PARA FORMATAÇÃO
// ============================================================================

export const YouTubeUtils = {
  formatCount: (count: number): string => {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + 'M';
    }
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K';
    }
    return count.toLocaleString();
  },

  formatViews: (views: number): string => {
    return YouTubeUtils.formatCount(views);
  },

  formatSubscribers: (subs: number): string => {
    return YouTubeUtils.formatCount(subs) + ' inscritos';
  },

  formatWatchTime: (minutes: number): string => {
    if (minutes < 60) {
      return `${Math.round(minutes)}m`;
    }
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `${hours}h`;
    }
    const days = Math.floor(hours / 24);
    return `${days}d`;
  },

  getVideoThumbnail: (videoId: string, quality: 'default' | 'medium' | 'high' = 'medium'): string => {
    const qualities = {
      default: 'default',
      medium: 'mqdefault', 
      high: 'hqdefault'
    };
    return `https://img.youtube.com/vi/${videoId}/${qualities[quality]}.jpg`;
  },

  getVideoUrl: (videoId: string): string => {
    return `https://www.youtube.com/watch?v=${videoId}`;
  },

  getChannelUrl: (channelId: string): string => {
    return `https://www.youtube.com/channel/${channelId}`;
  },

  timeAgo: (date: string): string => {
    const now = new Date();
    const past = new Date(date);
    const diffInHours = Math.floor((now.getTime() - past.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return `${diffInHours}h atrás`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
      return `${diffInDays}d atrás`;
    }
    
    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths}m atrás`;
  }
};

export default useYouTubeDashboard;
