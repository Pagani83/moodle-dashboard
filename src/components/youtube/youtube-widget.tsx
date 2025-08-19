/**
 * Widget YouTube para Dashboard - Versão Retrátil
 * Mostra estatísticas do canal, crescimento de inscritos, vídeos recentes
 */

import React, { useState } from 'react';
import { 
  Users, 
  Eye, 
  Youtube,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { useMoodleStore } from '@/store/moodle-store';
import { useYouTubeDashboard, YouTubeUtils } from '@/hooks/use-youtube';
import { YouTubeDemoWidget } from './youtube-demo-widget';

interface YouTubeWidgetProps {
  channelHandle?: string;
  channelId?: string;
  apiKey?: string;
  className?: string;
}

export function YouTubeWidget({ 
  channelHandle,
  channelId,
  apiKey,
  className = ''
}: YouTubeWidgetProps = {}) {
  const { theme } = useMoodleStore();
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Usar variáveis de ambiente se não passadas como props
  const finalApiKey = apiKey || process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
  const finalChannelHandle = channelHandle || process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_HANDLE;
  const finalChannelId = channelId || process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_ID;
  
  // Se não há configuração, mostrar demo
  if (!finalApiKey || (!finalChannelHandle && !finalChannelId)) {
    return <YouTubeDemoWidget />;
  }
  
  const config = {
    apiKey: finalApiKey,
    channelHandle: finalChannelHandle || '@defaultchannel',
    channelId: finalChannelId
  };

  const {
    channel,
    isLoading,
    isError,
    error,
    refetch,
    metrics
  } = useYouTubeDashboard(config);

  if (isError) {
    return (
      <div className={`rounded-xl border p-6 ${
        theme === 'dark' 
          ? 'bg-slate-800 border-slate-700' 
          : 'bg-white border-slate-200'
      } ${className}`}>
        <div className="text-center">
          <Youtube className={`h-12 w-12 mx-auto mb-3 ${
            theme === 'dark' ? 'text-red-400' : 'text-red-500'
          }`} />
          <h3 className={`font-semibold mb-2 ${
            theme === 'dark' ? 'text-white' : 'text-slate-900'
          }`}>
            Erro ao carregar dados do YouTube
          </h3>
          <p className={`text-sm mb-4 ${
            theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
          }`}>
            {error?.message || 'Verifique sua API Key e configurações'}
          </p>
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Dica:</strong> Verifique se sua API key e configurações estão corretas no arquivo .env.local
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`rounded-xl border ${
        theme === 'dark' 
          ? 'bg-slate-800 border-slate-700' 
          : 'bg-white border-slate-200'
      } ${className}`}>
        <div className="animate-pulse">
          <div className="flex items-center gap-3 p-4 border-b border-slate-200 dark:border-slate-700">
            <div className={`w-8 h-8 rounded-full ${
              theme === 'dark' ? 'bg-slate-600' : 'bg-slate-300'
            }`} />
            <div className="flex-1">
              <div className={`h-3 rounded mb-2 ${
                theme === 'dark' ? 'bg-slate-600' : 'bg-slate-300'
              }`} />
              <div className={`h-2 rounded w-2/3 ${
                theme === 'dark' ? 'bg-slate-700' : 'bg-slate-200'
              }`} />
            </div>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[1, 2].map(i => (
                <div key={i} className={`p-3 rounded-lg ${
                  theme === 'dark' ? 'bg-slate-700' : 'bg-slate-100'
                }`}>
                  <div className={`h-3 rounded mb-2 ${
                    theme === 'dark' ? 'bg-slate-600' : 'bg-slate-200'
                  }`} />
                  <div className={`h-6 rounded ${
                    theme === 'dark' ? 'bg-slate-600' : 'bg-slate-200'
                  }`} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!channel) return null;

  return (
    <div className={`w-64 rounded-xl border ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-red-900/10 to-red-800/10 border-red-800'
        : 'bg-gradient-to-br from-red-50 to-red-100 border-red-200'
    } ${className}`}>
      {/* Header Retrátil */}
      <div className={`${isExpanded ? 'border-b' : ''} ${
        theme === 'dark' ? 'border-red-800' : 'border-red-200'
      }`}>
        <div className={`flex items-center justify-between p-4`}>
          <div className="flex items-center gap-3 flex-1">
            <Youtube className={`h-7 w-7 ${
              theme === 'dark' ? 'text-red-400' : 'text-red-500'
            }`} />
            <div className="flex-1 min-w-0">
              <h3 className={`font-semibold text-sm ${
                theme === 'dark' ? 'text-white' : 'text-slate-900'
              }`}>
                Estatísticas YouTube
              </h3>
              <a 
                href={YouTubeUtils.getChannelUrl(channel.id)}
                target="_blank"
                rel="noopener noreferrer"
                className={`block text-xs hover:underline mb-2 ${
                  theme === 'dark' ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-500'
                }`}
              >
                @cjudtjrs
              </a>
              
              {/* Estatísticas sempre visíveis quando retraído */}
              {!isExpanded && (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Users className={`h-4 w-4 ${
                      theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                    }`} />
                    <span className={`text-sm font-semibold ${
                      theme === 'dark' ? 'text-white' : 'text-slate-900'
                    }`}>
                      {(metrics?.totalSubscribers || 0).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className={`h-4 w-4 ${
                      theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'
                    }`} />
                    <span className={`text-sm font-semibold ${
                      theme === 'dark' ? 'text-white' : 'text-slate-900'
                    }`}>
                      {YouTubeUtils.formatViews(metrics?.totalViews || 0)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center">
            {/* Botão de expandir/retrair */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`p-1.5 rounded-lg transition-colors ${
                theme === 'dark'
                  ? 'text-slate-400 hover:text-white hover:bg-slate-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Conteúdo principal - só mostra quando expandido */}
      {isExpanded && (
        <div className="p-4">
          {/* Estatísticas reais disponíveis pela API pública */}
          <div className="grid grid-cols-1 gap-3">
            <StatCard
              icon={<Users className="h-4 w-4" />}
              label="Total de Inscritos"
              value={(metrics?.totalSubscribers || 0).toLocaleString('pt-BR')}
              theme={theme}
              color="blue"
            />
            <StatCard
              icon={<Eye className="h-4 w-4" />}
              label="Total de Visualizações"
              value={YouTubeUtils.formatViews(metrics?.totalViews || 0)}
              theme={theme}
              color="emerald"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Componente de card de estatística
function StatCard({ 
  icon, 
  label, 
  value, 
  theme, 
  color 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string; 
  theme: string; 
  color: 'blue' | 'emerald' | 'violet';
}) {
  const colorClasses = {
    blue: theme === 'dark' 
      ? 'bg-blue-900/20 border-blue-700 text-blue-400' 
      : 'bg-blue-50 border-blue-200 text-blue-600',
    emerald: theme === 'dark' 
      ? 'bg-emerald-900/20 border-emerald-700 text-emerald-400' 
      : 'bg-emerald-50 border-emerald-200 text-emerald-600',
    violet: theme === 'dark' 
      ? 'bg-violet-900/20 border-violet-700 text-violet-400' 
      : 'bg-violet-50 border-violet-200 text-violet-600'
  };

  return (
    <div className={`p-3 rounded-lg border ${colorClasses[color]}`}>
      <div className="flex items-center gap-2">
        {icon}
        <div className="flex-1">
          <p className={`text-xs font-medium ${
            theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
          }`}>
            {label}
          </p>
          <p className="text-lg font-bold">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}
