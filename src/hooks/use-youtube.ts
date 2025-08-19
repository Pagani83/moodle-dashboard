/**
 * Hook para integração com YouTube Data API
 * Permite buscar dados do canal, crescimento, vídeos, etc.
 */

import { useQuery } from '@tanstack/react-query';
import { YouTubeClient, type ChannelInfo, type VideoStatistics, type AnalyticsData } from '@/lib/youtube-client';

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
  return useQuery({
    queryKey: ['youtube', 'channel', config.channelHandle || config.channelId],
    queryFn: async (): Promise<ChannelInfo> => {
      if (!config.apiKey) {
        throw new Error('YouTube API Key não configurada. Defina NEXT_PUBLIC_YOUTUBE_API_KEY no .env.local');
      }
      
      const client = new YouTubeClient(config);
      return await client.getChannelInfo();
    },
    enabled: enabled && !!config.apiKey,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos (substitui cacheTime)
  });
}

// ============================================================================
// HOOK - VÍDEOS RECENTES
// ============================================================================

export function useYouTubeRecentVideos(
  maxResults: number = 10,
  config: typeof DEFAULT_CONFIG = DEFAULT_CONFIG,
  enabled: boolean = true
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
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos
  });
}

// ============================================================================
// HOOK - CRESCIMENTO DE INSCRITOS (SIMULADO)
// ============================================================================

export function useYouTubeGrowth(
  days: number = 30,
  config: typeof DEFAULT_CONFIG = DEFAULT_CONFIG,
  enabled: boolean = true
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
    staleTime: 60 * 60 * 1000, // 1 hora
    gcTime: 2 * 60 * 60 * 1000, // 2 horas
  });
}

// ============================================================================
// HOOK - VÍDEOS TRENDING
// ============================================================================

export function useYouTubeTrending(
  maxResults: number = 5,
  config: typeof DEFAULT_CONFIG = DEFAULT_CONFIG,
  enabled: boolean = true
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
    staleTime: 30 * 60 * 1000, // 30 minutos
    gcTime: 60 * 60 * 1000, // 1 hora
  });
}

// ============================================================================
// HOOK CONSOLIDADO - DASHBOARD COMPLETO
// ============================================================================

export function useYouTubeDashboard(
  config: typeof DEFAULT_CONFIG = DEFAULT_CONFIG,
  enabled: boolean = true
) {
  const channelQuery = useYouTubeChannel(config, enabled);
  const recentVideosQuery = useYouTubeRecentVideos(8, config, enabled);
  const growthQuery = useYouTubeGrowth(30, config, enabled);
  const trendingQuery = useYouTubeTrending(3, config, enabled);

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
