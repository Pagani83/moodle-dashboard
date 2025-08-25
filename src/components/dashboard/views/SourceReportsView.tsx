import React, { useState, useRef } from 'react';
import { ModernSourceCard } from '../components/ModernSourceCard';
import { RefreshCw, Activity, TrendingUp } from 'lucide-react';

// Importar hooks com cache inteligente
import { useCombinedReport } from '@/hooks/useCombinedReport';

export function SourceReportsView() {

  const combinedReportQuery = useCombinedReport();
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  const handleRefresh = async () => {
    setRefreshing(true);
    setRefreshError(null);
    try {
      const resp = await fetch('/api/cache/combined-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err?.error || `Erro ao atualizar: status ${resp.status}`);
      }
      await combinedReportQuery.refetch();
    } catch (err: any) {
      setRefreshError(err?.message || 'Erro desconhecido ao atualizar');
    } finally {
      setRefreshing(false);
    }
  };

  const formatLastUpdate = (date?: Date) => {
    if (!date) return 'N/A';
    return date.toLocaleString('pt-BR');
  };

  const isLoading = refreshing || combinedReportQuery.isLoading || combinedReportQuery.isFetching;
  const reportData = combinedReportQuery.data;
  // Debug para verificar os dados
  React.useEffect(() => {
    if (reportData) {
      console.log(`🎯 Dados do cache exibidos:
        - Total: ${reportData.totalRecords}
        - R-134: ${reportData.sources?.report134Count || 0}
        - R-151: ${reportData.sources?.report151Count || 0}
        - Soma: ${(reportData.sources?.report134Count || 0) + (reportData.sources?.report151Count || 0)}`);
    }
  }, [reportData]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Fontes de Dados</h2>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Atualizando...' : 'Forçar Atualização'}
        </button>
        {refreshError && (
          <span className="ml-4 text-sm text-red-600 dark:text-red-400">{refreshError}</span>
        )}
      </div>

      {/* Informação sobre o cache inteligente */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
            <span className="text-blue-600 dark:text-blue-400 text-xs">💡</span>
          </div>
          <div>
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 text-sm mb-1">
              Cache Inteligente Ativo
            </h4>
            <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
              Cache sempre usa o <strong>arquivo mais recente</strong>. Atualização automática <strong>às 5h da manhã</strong>. 
              Use "Atualizar" para forçar nova sincronização quando necessário.
            </p>
          </div>
        </div>
      </div>

      {/* Card Moderno do Relatório Combinado */}
      <ModernSourceCard
        title="Relatório Unificado"
        subtitle="Dados combinados dos Relatórios 134 e 151"
        isLoading={isLoading}
        isSuccess={combinedReportQuery.isSuccess}
        isError={combinedReportQuery.isError}
        errorMessage={combinedReportQuery.error?.message}
        totalRecords={reportData?.totalRecords || 0}
        dataSegments={[
          {
            label: 'R-134',
            count: reportData?.sources?.report134Count || 0,
            color: 'blue',
            icon: Activity,
          },
          {
            label: 'R-151',
            count: reportData?.sources?.report151Count || 0,
            color: 'green',
            icon: TrendingUp,
          }
        ]}
        lastUpdate={reportData?.file?.universalLastUpdate ? new Date(reportData.file.universalLastUpdate) : undefined}
        nextScheduledFetch={undefined}
        onRefresh={handleRefresh}
        onRetry={handleRefresh}
        description="Fonte principal de dados para análises e relatórios do sistema"
      />
    </div>
  );
}