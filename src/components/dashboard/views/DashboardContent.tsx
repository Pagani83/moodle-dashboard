import React from 'react';
import { AlertCircle, Database, BookOpen, FileText, RefreshCw } from 'lucide-react';
import { YouTubeWidget } from '../../youtube/youtube-widget';


interface DashboardContentProps {
  masterData?: any;
  summaries?: any;
  cacheStats?: any;
  report134Cache?: any;
  combinedReport?: any; // Novo: relatório combinado opcional
}

export function DashboardContent({
  masterData = {},
  summaries = {},
  cacheStats = {},
  report134Cache = {},
  combinedReport = {},
}: DashboardContentProps) {
  // Mostrar o widget do YouTube por padrão; oculte com NEXT_PUBLIC_SHOW_YOUTUBE_WIDGET=false
  const showYouTubeWidget = process.env.NEXT_PUBLIC_SHOW_YOUTUBE_WIDGET !== 'false';
  const isLoading = (masterData.isLoading || false) || (summaries.isLoading || false) || (combinedReport.isLoading || false);
  const hasError = masterData.isError || summaries.isError;

  // Estados de carregamento específicos para mostrar progresso detalhado
  const loadingStates = [
    { name: 'Dashboard Master', loading: masterData.isLoading || false, icon: Database },
    { name: 'Resumos de Cursos', loading: summaries.isLoading || false, icon: BookOpen },
    { name: 'Cache Report 134', loading: report134Cache.isLoading || false, icon: FileText },
  ];

  const activeLoadings = loadingStates.filter(state => state.loading);

  if (hasError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
          <h3 className="text-lg font-medium text-red-800">
            Erro ao carregar dados
          </h3>
        </div>
        <p className="text-sm text-red-700 mt-2">
          {masterData.error?.message || summaries.error?.message || 'Erro desconhecido'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showYouTubeWidget && (
        <>
          {/* YouTube Analytics Widget */}
          <YouTubeWidget />
        </>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12 bg-gradient-to-br from-slate-50 to-slate-100/80 dark:from-gray-800/40 dark:to-gray-800/20 rounded-xl border border-slate-200/60 dark:border-gray-700/50 shadow-sm">
          <div className="relative mb-6">
            <RefreshCw className="h-10 w-10 text-blue-500 dark:text-blue-400 animate-spin mx-auto mb-4" />
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2">
              <div className="w-16 h-16 border-4 border-blue-100 dark:border-blue-900 rounded-full"></div>
              <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-gray-200">
              Carregando Dashboard
            </h3>
            
            {/* Status específico do que está carregando */}
            {activeLoadings.length > 0 && (
              <div className="space-y-2 max-w-md mx-auto">
                {activeLoadings.map((state, index) => {
                  const Icon = state.icon;
                  return (
                    <div key={state.name} className="flex items-center justify-center space-x-3 text-sm text-slate-600 dark:text-gray-400">
                      <Icon className="h-4 w-4 text-blue-500" />
                      <span>Carregando {state.name}...</span>
                      <div className="flex space-x-1">
                        {[0, 1, 2].map((i) => (
                          <div
                            key={i}
                            className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                            style={{
                              animationDelay: `${(index * 0.3) + (i * 0.1)}s`,
                            }}
                          ></div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            <p className="text-slate-600 dark:text-gray-400">
              Processando dados do Moodle e cache local...
            </p>
            
            <div className="flex justify-center items-center space-x-2 mt-4">
              <div className="flex space-x-1">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"
                    style={{
                      animationDelay: `${i * 0.1}s`,
                      animationDuration: '1s'
                    }}
                  ></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
