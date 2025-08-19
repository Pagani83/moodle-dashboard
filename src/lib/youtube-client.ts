/**
 * Cliente para YouTube Data API v3
 * Permite buscar estatísticas do canal, crescimento de inscritos, etc.
 */

export interface YouTubeConfig {
  apiKey: string;
  channelId?: string;
  channelHandle?: string; // @seucanal
}

export interface ChannelStatistics {
  subscriberCount: number;
  videoCount: number;
  viewCount: number;
  hiddenSubscriberCount: boolean;
}

export interface ChannelInfo {
  id: string;
  title: string;
  description: string;
  customUrl: string;
  publishedAt: string;
  thumbnails: {
    default: { url: string };
    medium: { url: string };
    high: { url: string };
  };
  statistics: ChannelStatistics;
}

export interface VideoStatistics {
  id: string;
  title: string;
  publishedAt: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  duration: string;
}

export interface AnalyticsData {
  date: string;
  subscribersGained: number;
  subscribersLost: number;
  netGrowth: number;
  views: number;
  estimatedMinutesWatched: number;
}

export interface ChannelMetrics28Days {
  totalSubscribers: number;
  totalViews: number;
  totalVideos: number;
  growthRate: number;
  avgRecentViews: number;
  engagementRate: number;
  // Métricas específicas de 28 dias
  views28Days: number;
  viewsGrowth28Days: number;
  subscribersGrowth28Days: number;
  watchTime28Days: number;
  watchTimeGrowth28Days: number;
  impressions28Days: number;
  impressionsGrowth28Days: number;
  clickThroughRate28Days: number;
}

export class YouTubeClient {
  private config: YouTubeConfig;
  private baseUrl = 'https://www.googleapis.com/youtube/v3';

  constructor(config: YouTubeConfig) {
    this.config = config;
  }

  /**
   * Buscar informações básicas do canal
   */
  async getChannelInfo(): Promise<ChannelInfo> {
    const channelParam = this.config.channelId 
      ? `id=${this.config.channelId}`
      : `forHandle=${this.config.channelHandle?.replace('@', '')}`;

    const response = await fetch(
      `${this.baseUrl}/channels?${channelParam}&part=snippet,statistics&key=${this.config.apiKey}`
    );

    if (!response.ok) {
      throw new Error(`YouTube API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      throw new Error('Canal não encontrado');
    }

    const channel = data.items[0];
    
    return {
      id: channel.id,
      title: channel.snippet.title,
      description: channel.snippet.description,
      customUrl: channel.snippet.customUrl || '',
      publishedAt: channel.snippet.publishedAt,
      thumbnails: channel.snippet.thumbnails,
      statistics: {
        subscriberCount: parseInt(channel.statistics.subscriberCount || '0'),
        videoCount: parseInt(channel.statistics.videoCount || '0'),
        viewCount: parseInt(channel.statistics.viewCount || '0'),
        hiddenSubscriberCount: channel.statistics.hiddenSubscriberCount || false
      }
    };
  }

  /**
   * Buscar vídeos recentes do canal
   */
  async getRecentVideos(maxResults: number = 10): Promise<VideoStatistics[]> {
    // Primeiro, pegar o channel ID se só temos o handle
    let channelId = this.config.channelId;
    
    if (!channelId && this.config.channelHandle) {
      const channelInfo = await this.getChannelInfo();
      channelId = channelInfo.id;
    }

    if (!channelId) {
      throw new Error('Channel ID ou Handle é necessário');
    }

    // Buscar vídeos
    const searchResponse = await fetch(
      `${this.baseUrl}/search?channelId=${channelId}&part=snippet&order=date&type=video&maxResults=${maxResults}&key=${this.config.apiKey}`
    );

    if (!searchResponse.ok) {
      throw new Error(`YouTube Search Error: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();
    const videoIds = searchData.items.map((item: any) => item.id.videoId).join(',');

    // Buscar estatísticas dos vídeos
    const statsResponse = await fetch(
      `${this.baseUrl}/videos?id=${videoIds}&part=snippet,statistics,contentDetails&key=${this.config.apiKey}`
    );

    if (!statsResponse.ok) {
      throw new Error(`YouTube Videos Error: ${statsResponse.status}`);
    }

    const statsData = await statsResponse.json();

    return statsData.items.map((video: any) => ({
      id: video.id,
      title: video.snippet.title,
      publishedAt: video.snippet.publishedAt,
      viewCount: parseInt(video.statistics.viewCount || '0'),
      likeCount: parseInt(video.statistics.likeCount || '0'),
      commentCount: parseInt(video.statistics.commentCount || '0'),
      duration: video.contentDetails.duration
    }));
  }

  /**
   * Calcular crescimento de inscritos (simulado - API real requer YouTube Analytics)
   * Em produção, você usaria YouTube Analytics API para dados históricos reais
   */
  async getSubscriberGrowth(days: number = 30): Promise<AnalyticsData[]> {
    // NOTA: Esta é uma implementação simulada
    // Para dados reais de crescimento, você precisaria:
    // 1. YouTube Analytics API (requer autorização OAuth2)
    // 2. Ser proprietário do canal
    // 3. Ter acesso ao YouTube Studio
    
    const currentStats = await this.getChannelInfo();
    const data: AnalyticsData[] = [];
    
    // Simular dados de crescimento baseado em estatísticas atuais
    const baseGrowth = Math.floor(currentStats.statistics.subscriberCount * 0.001); // 0.1% do total
    
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      // Simular variação diária (+/- 50% do crescimento base)
      const variation = Math.random() * 0.5 + 0.75; // 0.75 a 1.25
      const gained = Math.floor(baseGrowth * variation);
      const lost = Math.floor(gained * 0.3); // 30% de perda em relação ao ganho
      
      data.push({
        date: date.toISOString().split('T')[0],
        subscribersGained: gained,
        subscribersLost: lost,
        netGrowth: gained - lost,
        views: Math.floor(Math.random() * 10000) + 5000,
        estimatedMinutesWatched: Math.floor(Math.random() * 50000) + 10000
      });
    }
    
    return data;
  }

  /**
   * Buscar trending videos (mais populares recentes)
   */
  async getTrendingVideos(maxResults: number = 5): Promise<VideoStatistics[]> {
    let channelId = this.config.channelId;
    
    if (!channelId && this.config.channelHandle) {
      const channelInfo = await this.getChannelInfo();
      channelId = channelInfo.id;
    }

    const response = await fetch(
      `${this.baseUrl}/search?channelId=${channelId}&part=snippet&order=viewCount&type=video&publishedAfter=${this.getDateDaysAgo(90)}&maxResults=${maxResults}&key=${this.config.apiKey}`
    );

    if (!response.ok) {
      throw new Error(`YouTube Trending Error: ${response.status}`);
    }

    const searchData = await response.json();
    const videoIds = searchData.items.map((item: any) => item.id.videoId).join(',');

    const statsResponse = await fetch(
      `${this.baseUrl}/videos?id=${videoIds}&part=snippet,statistics&key=${this.config.apiKey}`
    );

    const statsData = await statsResponse.json();

    return statsData.items.map((video: any) => ({
      id: video.id,
      title: video.snippet.title,
      publishedAt: video.snippet.publishedAt,
      viewCount: parseInt(video.statistics.viewCount || '0'),
      likeCount: parseInt(video.statistics.likeCount || '0'),
      commentCount: parseInt(video.statistics.commentCount || '0'),
      duration: ''
    }));
  }

  private getDateDaysAgo(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString();
  }

  /**
   * Formatar números grandes (1.5K, 2.3M, etc.)
   */
  static formatCount(count: number): string {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + 'M';
    }
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K';
    }
    return count.toString();
  }

  /**
   * Converter duração ISO 8601 do YouTube para minutos
   */
  static parseDuration(isoDuration: string): number {
    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    
    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');
    
    return hours * 60 + minutes + seconds / 60;
  }
}

// Factory function
export function createYouTubeClient(config: YouTubeConfig): YouTubeClient {
  return new YouTubeClient(config);
}

export default YouTubeClient;
