'use client';

import React, { useState } from 'react';
import { 
  Play, 
  Users, 
  Eye, 
  Calendar, 
  TrendingUp, 
  Video,
  ChevronUp,
  ChevronDown,
  Youtube
} from 'lucide-react';
import { useMoodleStore } from '@/store/moodle-store';

// Componente de demonstração do YouTube para testar sem API key
export function YouTubeDemoWidget({ className = '' }: { className?: string }) {
  const { theme } = useMoodleStore();
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Dados simulados para demonstração
  const demoData = {
    channel: {
      title: "Canal CJUD Educacional",
      subscriberCount: "15240",
      viewCount: "892456",
      videoCount: "127",
      publishedAt: "2019-03-15T10:30:00Z"
    },
    recentVideos: [
      {
        id: "1",
        title: "Introdução ao Sistema de Justiça Digital",
        viewCount: "2341",
        publishedAt: "2024-01-15T14:30:00Z",
        thumbnailUrl: "/api/placeholder/320/180"
      },
      {
        id: "2", 
        title: "Capacitação em Direito Digital para Servidores",
        viewCount: "1876",
        publishedAt: "2024-01-10T09:15:00Z",
        thumbnailUrl: "/api/placeholder/320/180"
      },
      {
        id: "3",
        title: "Workshop: Inovação no Judiciário",
        viewCount: "3214",
        publishedAt: "2024-01-05T16:45:00Z",
        thumbnailUrl: "/api/placeholder/320/180"
      }
    ],
    growth: [
      { date: '2024-01-01', subscribers: 14800 },
      { date: '2024-01-08', subscribers: 14920 },
      { date: '2024-01-15', subscribers: 15080 },
      { date: '2024-01-22', subscribers: 15240 }
    ]
  };

  const formatNumber = (num: string | number) => {
    const n = typeof num === 'string' ? parseInt(num) : num;
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toString();
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  return (
    <div className={`rounded-xl border p-6 transition-all duration-300 ${
      theme === 'dark' 
        ? 'bg-slate-800 border-slate-700' 
        : 'bg-white border-slate-200'
    } ${className}`}>
      
      {/* Header */}
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
            <Youtube className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className={`font-semibold ${
              theme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}>
              YouTube Analytics
            </h3>
            <p className={`text-sm ${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
            }`}>
              {demoData.channel.title}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded-full text-xs font-medium">
            DEMO
          </div>
          {isExpanded ? (
            <ChevronUp className={`w-5 h-5 ${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
            }`} />
          ) : (
            <ChevronDown className={`w-5 h-5 ${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
            }`} />
          )}
        </div>
      </div>

      {/* Estatísticas compactas sempre visíveis */}
      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1">
            <Users className="w-4 h-4 text-red-600" />
            <span className={`text-lg font-semibold ${
              theme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}>
              {formatNumber(demoData.channel.subscriberCount)}
            </span>
          </div>
          <p className={`text-xs ${
            theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
          }`}>
            Inscritos
          </p>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-1">
            <Eye className="w-4 h-4 text-blue-600" />
            <span className={`text-lg font-semibold ${
              theme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}>
              {formatNumber(demoData.channel.viewCount)}
            </span>
          </div>
          <p className={`text-xs ${
            theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
          }`}>
            Visualizações
          </p>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-1">
            <Video className="w-4 h-4 text-green-600" />
            <span className={`text-lg font-semibold ${
              theme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}>
              {demoData.channel.videoCount}
            </span>
          </div>
          <p className={`text-xs ${
            theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
          }`}>
            Vídeos
          </p>
        </div>
      </div>

      {/* Conteúdo expandido */}
      {isExpanded && (
        <div className="mt-6 space-y-6">
          {/* Estatísticas detalhadas */}
          <div className={`p-4 rounded-lg ${
            theme === 'dark' ? 'bg-slate-700' : 'bg-slate-50'
          }`}>
            <h4 className={`font-medium mb-3 ${
              theme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}>
              Crescimento Recente
            </h4>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className={`text-sm ${
                theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
              }`}>
                +{demoData.growth[demoData.growth.length - 1].subscribers - demoData.growth[0].subscribers} inscritos este mês
              </span>
            </div>
          </div>

          {/* Vídeos recentes */}
          <div>
            <h4 className={`font-medium mb-3 ${
              theme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}>
              Vídeos Recentes
            </h4>
            <div className="space-y-3">
              {demoData.recentVideos.slice(0, 3).map((video) => (
                <div 
                  key={video.id} 
                  className={`flex gap-3 p-3 rounded-lg ${
                    theme === 'dark' ? 'bg-slate-700' : 'bg-slate-50'
                  }`}
                >
                  <div className="w-16 h-12 bg-gray-300 rounded flex items-center justify-center">
                    <Play className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${
                      theme === 'dark' ? 'text-white' : 'text-slate-900'
                    }`}>
                      {video.title}
                    </p>
                    <div className={`flex items-center gap-4 text-xs ${
                      theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                    }`}>
                      <span>{formatNumber(video.viewCount)} visualizações</span>
                      <span>{formatDate(video.publishedAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Aviso sobre API */}
          <div className={`p-4 rounded-lg ${
            theme === 'dark' 
              ? 'bg-yellow-900/20 border border-yellow-800' 
              : 'bg-yellow-50 border border-yellow-200'
          }`}>
            <p className={`text-sm ${
              theme === 'dark' ? 'text-yellow-200' : 'text-yellow-800'
            }`}>
              <strong>Modo Demonstração:</strong> Para dados reais, configure uma API Key válida do YouTube no arquivo .env.local
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
