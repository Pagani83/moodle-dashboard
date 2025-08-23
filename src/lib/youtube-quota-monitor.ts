/**
 * Monitor de Quota da YouTube API
 * Controla e limita o uso da API para evitar esgotar o limite diário de 10.000 calls
 */

const QUOTA_STORAGE_KEY = 'youtube-quota-usage';
const DAILY_QUOTA_LIMIT = 10000;
const CHANNEL_INFO_COST = 1; // Custo estimado por call de channel info
const VIDEO_LIST_COST = 100; // Custo estimado por call de video list

interface QuotaUsage {
  date: string;
  totalCalls: number;
  channelInfoCalls: number;
  videoListCalls: number;
  lastReset: string;
}

class YouTubeQuotaMonitor {
  private getTodayKey(): string {
    return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  }

  private getQuotaUsage(): QuotaUsage {
    if (typeof window === 'undefined') {
      return this.getDefaultUsage();
    }

    try {
      const stored = localStorage.getItem(QUOTA_STORAGE_KEY);
      if (!stored) return this.getDefaultUsage();

      const usage: QuotaUsage = JSON.parse(stored);
      const today = this.getTodayKey();
      
      // Reset se for um novo dia
      if (usage.date !== today) {
        return this.getDefaultUsage();
      }

      return usage;
    } catch (error) {
      console.warn('Erro ao ler quota usage:', error);
      return this.getDefaultUsage();
    }
  }

  private getDefaultUsage(): QuotaUsage {
    return {
      date: this.getTodayKey(),
      totalCalls: 0,
      channelInfoCalls: 0,
      videoListCalls: 0,
      lastReset: new Date().toISOString()
    };
  }

  private saveQuotaUsage(usage: QuotaUsage): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(QUOTA_STORAGE_KEY, JSON.stringify(usage));
    } catch (error) {
      console.warn('Erro ao salvar quota usage:', error);
    }
  }

  /**
   * Verifica se ainda há quota disponível
   */
  public hasQuotaAvailable(callType: 'channel' | 'video' = 'channel'): boolean {
    const usage = this.getQuotaUsage();
    const cost = callType === 'channel' ? CHANNEL_INFO_COST : VIDEO_LIST_COST;
    
    const wouldExceedLimit = (usage.totalCalls + cost) > DAILY_QUOTA_LIMIT;
    
    if (wouldExceedLimit) {
      console.warn(`🚫 YouTube Quota: Limite diário seria excedido. Atual: ${usage.totalCalls}/${DAILY_QUOTA_LIMIT}`);
      return false;
    }

    return true;
  }

  /**
   * Registra o uso de uma API call
   */
  public recordApiCall(callType: 'channel' | 'video' = 'channel'): void {
    const usage = this.getQuotaUsage();
    const cost = callType === 'channel' ? CHANNEL_INFO_COST : VIDEO_LIST_COST;

    usage.totalCalls += cost;
    
    if (callType === 'channel') {
      usage.channelInfoCalls += 1;
    } else {
      usage.videoListCalls += 1;
    }

    this.saveQuotaUsage(usage);

    console.log(`📊 YouTube Quota: ${callType} call registrada. Total hoje: ${usage.totalCalls}/${DAILY_QUOTA_LIMIT}`);
  }

  /**
   * Obtém estatísticas de uso atual
   */
  public getUsageStats(): QuotaUsage & { percentageUsed: number; remainingCalls: number } {
    const usage = this.getQuotaUsage();
    const percentageUsed = (usage.totalCalls / DAILY_QUOTA_LIMIT) * 100;
    const remainingCalls = DAILY_QUOTA_LIMIT - usage.totalCalls;

    return {
      ...usage,
      percentageUsed,
      remainingCalls
    };
  }

  /**
   * Reset manual do contador (para testing ou casos especiais)
   */
  public resetQuota(): void {
    const resetUsage = this.getDefaultUsage();
    this.saveQuotaUsage(resetUsage);
    console.log('🔄 YouTube Quota: Reset manual realizado');
  }

  /**
   * Verifica se deve bloquear calls baseado em percentual de uso
   */
  public shouldBlockCalls(): boolean {
    const stats = this.getUsageStats();
    
    // Bloquear se usar mais de 90% da quota diária
    if (stats.percentageUsed > 90) {
      console.warn(`🔴 YouTube Quota: Uso crítico (${stats.percentageUsed.toFixed(1)}%). Bloqueando calls até reset diário.`);
      return true;
    }

    // Warning se usar mais de 50%
    if (stats.percentageUsed > 50) {
      console.warn(`🟡 YouTube Quota: Uso elevado (${stats.percentageUsed.toFixed(1)}%). Monitore o consumo.`);
    }

    return false;
  }
}

export const youtubeQuotaMonitor = new YouTubeQuotaMonitor();
