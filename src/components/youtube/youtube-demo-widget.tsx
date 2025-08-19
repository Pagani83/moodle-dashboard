'use client';

import React from 'react';
import { Play, Users, Eye, Calendar, TrendingUp, Video } from 'lucide-react';

// Componente de demonstração do YouTube para testar sem API key
export function YouTubeDemoWidget() {
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
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
            <Play className="w-5 h-5 text-white fill-current" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              YouTube Analytics
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {demoData.channel.title}
            </p>
          </div>
        </div>
        <div className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 px-3 py-1 rounded-full text-sm font-medium">
          DEMO
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-red-600" />
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Inscritos
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatNumber(demoData.channel.subscriberCount)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Eye className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Visualizações
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatNumber(demoData.channel.viewCount)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Video className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Vídeos
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {demoData.channel.videoCount}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8 text-purple-600" />
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Desde
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatDate(demoData.channel.publishedAt)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Crescimento */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Crescimento de Inscritos
          </h3>
          <div className="space-y-2">
            {demoData.growth.map((point, index) => (
              <div key={point.date} className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {formatDate(point.date)}
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatNumber(point.subscribers)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/30 rounded-lg">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-green-800 dark:text-green-200">
                +440 inscritos este mês
              </span>
            </div>
          </div>
        </div>

        {/* Vídeos Recentes */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Video className="w-5 h-5" />
            Vídeos Recentes
          </h3>
          <div className="space-y-3">
            {demoData.recentVideos.map((video) => (
              <div key={video.id} className="flex gap-3 p-3 bg-white dark:bg-gray-700 rounded-lg">
                <div className="w-16 h-12 bg-gray-300 dark:bg-gray-600 rounded flex items-center justify-center">
                  <Play className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {video.title}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 mt-1">
                    <span>{formatNumber(video.viewCount)} views</span>
                    <span>•</span>
                    <span>{formatDate(video.publishedAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-white text-xs font-bold">!</span>
          </div>
          <div>
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-1">
              Modo Demonstração
            </h4>
            <p className="text-sm text-blue-800 dark:text-blue-300">
              Este é um preview com dados simulados. Para ver dados reais do seu canal, 
              configure a <code className="bg-blue-200 dark:bg-blue-800 px-1 rounded">NEXT_PUBLIC_YOUTUBE_API_KEY</code> 
              no arquivo <code className="bg-blue-200 dark:bg-blue-800 px-1 rounded">.env.local</code>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
