import React from 'react';
import { CheckCircle, XCircle, Loader, RefreshCw } from 'lucide-react';

interface SourceCardProps {
  title: string;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  errorMessage?: string;
  recordCount?: number;
  onRetry?: () => void;
  lastUpdate?: string;
}

export function SourceCard({
  title,
  isLoading,
  isSuccess,
  isError,
  errorMessage,
  recordCount,
  onRetry,
  lastUpdate,
}: SourceCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        {isLoading && <Loader className="h-5 w-5 text-blue-500 animate-spin" />}
        {isSuccess && <CheckCircle className="h-5 w-5 text-green-500" />}
        {isError && <XCircle className="h-5 w-5 text-red-500" />}
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{title}</h3>
      </div>
      <div className="flex items-center space-x-3">
        {isLoading && <span className="text-gray-600 dark:text-gray-400">Carregando...</span>}
        {isSuccess && (
          <span className="text-gray-600 dark:text-gray-400">
            {recordCount !== undefined ? `${recordCount} registros` : 'Concluído'}
            {lastUpdate && ` (Atualizado: ${lastUpdate})`}
          </span>
        )}
        {isError && (
          <span className="text-red-600 dark:text-red-400 text-sm">
            Erro: {errorMessage || 'Desconhecido'}
          </span>
        )}
        {isError && onRetry && (
          <button
            onClick={onRetry}
            className="ml-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Tentar novamente"
          >
            <RefreshCw className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </button>
        )}
      </div>
    </div>
  );
}