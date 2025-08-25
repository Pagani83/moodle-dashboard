import React from 'react';
import { CheckCircle, XCircle, Loader, RefreshCw, Database, Clock, TrendingUp, Activity, BarChart3 } from 'lucide-react';

export interface SourceDataSegment {
  label: string;
  count: number;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'yellow' | 'indigo' | 'pink';
  icon?: React.ComponentType<{ className?: string }>;
}

interface ModernSourceCardProps {
  title: string;
  subtitle?: string;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  errorMessage?: string;
  totalRecords?: number;
  dataSegments?: SourceDataSegment[];
  lastUpdate?: Date;
  nextScheduledFetch?: Date;
  onRefresh?: () => void;
  onRetry?: () => void;
  showProgress?: boolean;
  customIcon?: React.ComponentType<{ className?: string }>;
  description?: string;
  customProgress?: {
    percentage: number;
    message: string;
  };
}

export function ModernSourceCard({
  title,
  subtitle,
  isLoading,
  isSuccess,
  isError,
  errorMessage,
  totalRecords = 0,
  dataSegments = [],
  lastUpdate,
  nextScheduledFetch,
  onRefresh,
  onRetry,
  showProgress = true,
  customIcon,
  description,
  customProgress,
}: ModernSourceCardProps) {
  const formatDate = (date?: Date) => {
    if (!date) return 'N/A';
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusIcon = () => {
    if (isLoading) return <Loader className="h-6 w-6 text-blue-500 animate-spin" />;
    if (isSuccess) return <CheckCircle className="h-6 w-6 text-green-500" />;
    if (isError) return <XCircle className="h-6 w-6 text-red-500" />;
    if (customIcon) {
      const Icon = customIcon;
      return <Icon className="h-6 w-6 text-gray-500" />;
    }
    return <Database className="h-6 w-6 text-gray-500" />;
  };

  const getStatusText = () => {
    if (isLoading) return 'Sincronizando dados...';
    if (isSuccess) return 'Dados atualizados';
    if (isError) return 'Erro na sincronização';
    return 'Aguardando sincronização';
  };

  const getStatusColor = () => {
    if (isLoading) return 'text-blue-600 dark:text-blue-400';
    if (isSuccess) return 'text-green-600 dark:text-green-400';
    if (isError) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const getBorderColor = () => {
    if (isLoading) return 'border-blue-200 dark:border-blue-800';
    if (isSuccess) return 'border-green-200 dark:border-green-800';
    if (isError) return 'border-red-200 dark:border-red-800';
    return 'border-gray-200 dark:border-gray-700';
  };

  // Calcular progresso (usar customProgress se disponível)
  const progress = customProgress 
    ? customProgress.percentage 
    : isSuccess ? 100 : isLoading ? 85 : isError ? 0 : 0;
  
  const progressMessage = customProgress 
    ? customProgress.message 
    : 'Sincronização';

  const getColorClasses = (color: SourceDataSegment['color']) => {
    const colorMap = {
      blue: {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        border: 'border-blue-200 dark:border-blue-700',
        text: 'text-blue-900 dark:text-blue-100',
        subtext: 'text-blue-600 dark:text-blue-400',
        progress: 'bg-blue-500',
        progressBg: 'bg-blue-100 dark:bg-blue-900/30',
      },
      green: {
        bg: 'bg-green-50 dark:bg-green-900/20',
        border: 'border-green-200 dark:border-green-700',
        text: 'text-green-900 dark:text-green-100',
        subtext: 'text-green-600 dark:text-green-400',
        progress: 'bg-green-500',
        progressBg: 'bg-green-100 dark:bg-green-900/30',
      },
      purple: {
        bg: 'bg-purple-50 dark:bg-purple-900/20',
        border: 'border-purple-200 dark:border-purple-700',
        text: 'text-purple-900 dark:text-purple-100',
        subtext: 'text-purple-600 dark:text-purple-400',
        progress: 'bg-purple-500',
        progressBg: 'bg-purple-100 dark:bg-purple-900/30',
      },
      orange: {
        bg: 'bg-orange-50 dark:bg-orange-900/20',
        border: 'border-orange-200 dark:border-orange-700',
        text: 'text-orange-900 dark:text-orange-100',
        subtext: 'text-orange-600 dark:text-orange-400',
        progress: 'bg-orange-500',
        progressBg: 'bg-orange-100 dark:bg-orange-900/30',
      },
      red: {
        bg: 'bg-red-50 dark:bg-red-900/20',
        border: 'border-red-200 dark:border-red-700',
        text: 'text-red-900 dark:text-red-100',
        subtext: 'text-red-600 dark:text-red-400',
        progress: 'bg-red-500',
        progressBg: 'bg-red-100 dark:bg-red-900/30',
      },
      yellow: {
        bg: 'bg-yellow-50 dark:bg-yellow-900/20',
        border: 'border-yellow-200 dark:border-yellow-700',
        text: 'text-yellow-900 dark:text-yellow-100',
        subtext: 'text-yellow-600 dark:text-yellow-400',
        progress: 'bg-yellow-500',
        progressBg: 'bg-yellow-100 dark:bg-yellow-900/30',
      },
      indigo: {
        bg: 'bg-indigo-50 dark:bg-indigo-900/20',
        border: 'border-indigo-200 dark:border-indigo-700',
        text: 'text-indigo-900 dark:text-indigo-100',
        subtext: 'text-indigo-600 dark:text-indigo-400',
        progress: 'bg-indigo-500',
        progressBg: 'bg-indigo-100 dark:bg-indigo-900/30',
      },
      pink: {
        bg: 'bg-pink-50 dark:bg-pink-900/20',
        border: 'border-pink-200 dark:border-pink-700',
        text: 'text-pink-900 dark:text-pink-100',
        subtext: 'text-pink-600 dark:text-pink-400',
        progress: 'bg-pink-500',
        progressBg: 'bg-pink-100 dark:bg-pink-900/30',
      },
    };
    return colorMap[color];
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 ${getBorderColor()} hover:shadow-xl transition-all duration-300 overflow-hidden max-w-md w-full`}>
      {/* Header */}
      <div className="p-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                {title}
              </h3>
              {subtitle && (
                <p className="text-xs text-gray-600 dark:text-gray-400">{subtitle}</p>
              )}
              <p className={`text-xs font-medium ${getStatusColor()}`}>
                {getStatusText()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {(isError || isSuccess) && (onRefresh || onRetry) && (
              <button
                onClick={isError ? onRetry : onRefresh}
                disabled={isLoading}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={isError ? "Tentar novamente" : "Atualizar dados"}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''} text-gray-600 dark:text-gray-400`} />
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {showProgress && (
          <div className="mb-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {progressMessage}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {Math.round(progress)}%
              </span>
            </div>
            
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
              <div className="relative h-full">
                <div 
                  className={`h-full transition-all duration-1000 ease-out ${
                    isSuccess 
                      ? 'bg-gradient-to-r from-green-400 to-green-600' 
                      : isLoading 
                        ? 'bg-gradient-to-r from-blue-400 to-blue-600 animate-pulse' 
                        : isError 
                          ? 'bg-gradient-to-r from-red-400 to-red-600'
                          : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                  style={{ width: `${progress}%` }}
                />
                
                {isLoading && (
                  <div className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="px-4 pb-3">
        {/* Segmentos na primeira linha */}
        {dataSegments.length > 0 && (
          <div className="grid grid-cols-2 gap-3 mb-3">
            {dataSegments.slice(0, 2).map((segment, index) => {
              const colors = getColorClasses(segment.color);
              const Icon = segment.icon || BarChart3;
              
              return (
                <div key={index} className={`text-center p-2 ${colors.bg} rounded-lg`}>
                  <Icon className={`h-5 w-5 ${colors.subtext} mx-auto mb-1`} />
                  <div className={`text-lg font-bold ${colors.text}`}>
                    {segment.count.toLocaleString('pt-BR')}
                  </div>
                  <div className={`text-xs ${colors.subtext}`}>{segment.label}</div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Total na segunda linha, ocupando toda a largura */}
        <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <Database className="h-5 w-5 text-gray-600 dark:text-gray-400 mx-auto mb-1" />
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {totalRecords.toLocaleString('pt-BR')}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Total Combinado</div>
        </div>

        {/* Sub-progress bars para segmentos */}
        {isSuccess && dataSegments.length > 0 && totalRecords > 0 && (
          <div className={`mt-3 grid gap-2 ${dataSegments.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
            {dataSegments.map((segment, index) => {
              const colors = getColorClasses(segment.color);
              const segmentProgress = (segment.count / totalRecords) * 100;
              
              return (
                <div key={index} className="text-center">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{segment.label}</div>
                  <div className={colors.progressBg + ' rounded-full h-2'}>
                    <div 
                      className={colors.progress + ' h-2 rounded-full transition-all duration-500'}
                      style={{ width: `${segmentProgress}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Description */}
      {description && (
        <div className="px-4 pb-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-100 dark:border-gray-600">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>Última atualização: {formatDate(lastUpdate)}</span>
          </div>
          {nextScheduledFetch && (
            <div className="flex items-center gap-1">
              <span>Próxima: {formatDate(nextScheduledFetch)}</span>
            </div>
          )}
        </div>
        
        {/* Error Message */}
        {isError && errorMessage && (
          <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
            <p className="text-xs text-red-600 dark:text-red-400">{errorMessage}</p>
          </div>
        )}
      </div>

      {/* CSS para animação shimmer */}
      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 1.5s infinite;
        }
      `}</style>
    </div>
  );
}