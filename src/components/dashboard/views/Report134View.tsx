import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { 
  FileText, 
  RefreshCw, 
  Download, 
  Database, 
  Calendar, 
  Clock 
} from 'lucide-react';
import { 
  useRestoreReport134FromFile, 
  REPORT_134_CONFIG 
} from '@/hooks/use-report-134';

interface Report134ViewProps {
  status: any;
  forceUpdate: any;
  report134Cache: any;
}

export function Report134View({
  status,
  forceUpdate,
  report134Cache,
}: Report134ViewProps) {
  const queryClient = useQueryClient();
  const restoreFromFile = useRestoreReport134FromFile();
  const [forcingCache, setForcingCache] = useState(false);
  const [lastUpdateMsg, setLastUpdateMsg] = useState<string | null>(null);

  // Helpers para formatar datas do status - usando dados do cache ativo
  // Usar timestamp universal do arquivo (mais confiável que cookies/localStorage)
  const lastFetchDate: Date | null = report134Cache.data?.meta?.universalLastUpdate
    ? new Date(report134Cache.data.meta.universalLastUpdate)
    : report134Cache.data?.meta?.lastFetch
    ? new Date(report134Cache.data.meta.lastFetch)
    : report134Cache.data?.meta?.lastUpdate
    ? new Date(report134Cache.data.meta.lastUpdate)
    : null;
  const nextScheduledDate: Date | null = status?.full?.nextScheduled
    ? new Date(status.full.nextScheduled)
    : null;
  const fmt = (d: Date | null) => d ? d.toLocaleString('pt-BR') : '—';
  
  return (
    <div className="space-y-6">
      {/* Seção de teste removida para produção */}

      {/* Header do Relatório 134 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900 flex items-center">
              <FileText className="h-6 w-6 mr-2 text-blue-600" />
              Relatório 134 - Principal do Sistema
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {lastFetchDate 
                ? `Última atualização: ${fmt(lastFetchDate)} | Próxima às 5:00 AM UTC` 
                : 'Cache diário atualizado às 5h da manhã'
              } | ID: {REPORT_134_CONFIG.id}
            </p>
            <p className="text-xs text-orange-600 font-medium mt-1">
              🔥 DADOS PUROS: Busca sem filtros, filtragem será feita após cache
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => restoreFromFile.mutate()}
              disabled={restoreFromFile.isPending}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              title="Restaurar do último XLSX salvo"
            >
              {restoreFromFile.isPending ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Restaurar do XLSX
            </button>
            
            <button
              onClick={() => {
                setForcingCache(true);
                forceUpdate.mutate(undefined, {
                  onSuccess: (payload: any) => {
                    // Sempre atualizar timestamp após sucesso da API
                    const when = payload?.timestamp || payload?.universalTimestamp || payload?.lastFetch || new Date();
                    const durMs = typeof payload?.fetchDuration === 'number' ? payload.fetchDuration : 0;
                    const secs = Math.round(durMs / 100) / 10;
                    setLastUpdateMsg(`Atualizado em ${new Date(when).toLocaleString('pt-BR')} • ${secs || 0}s`);
                    
                    // Aguardar um pouco antes de invalidar cache para garantir que API terminou
                    setTimeout(() => {
                      queryClient.invalidateQueries({ queryKey: ['report134-cache'] });
                    }, 2000); // 2 segundos para dar tempo da API salvar
                  },
                  onSettled: () => setForcingCache(false),
                });
              }}
              disabled={forcingCache}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {forcingCache ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Forçar Atualização
            </button>
          </div>
        </div>

        {/* Infos de atualização */}
        <div className="flex flex-wrap items-center gap-4 mb-2 text-xs text-gray-600">
          <span className="flex items-center gap-1">
            <span className="font-medium">Última atualização:</span> 
            <span className={`${
              lastFetchDate && (Date.now() - lastFetchDate.getTime()) < 6 * 60 * 60 * 1000 
                ? 'text-green-600 font-medium' 
                : 'text-orange-600'
            }`}>
              {fmt(lastFetchDate)}
            </span>
            {lastFetchDate && (Date.now() - lastFetchDate.getTime()) < 60 * 60 * 1000 && (
              <span className="inline-flex h-2 w-2 bg-green-400 rounded-full animate-pulse ml-1" title="Dados muito recentes (< 1h)"></span>
            )}
          </span>
          <span>•</span>
          <span><span className="font-medium">Próx. agendamento:</span> {fmt(nextScheduledDate)}</span>
          {lastUpdateMsg && (
            <span className="ml-2 px-2 py-1 rounded bg-green-50 text-green-700 border border-green-200">{lastUpdateMsg}</span>
          )}
        </div>

        {/* Status Cards essenciais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center">
              <Database className="h-5 w-5 text-green-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-green-900">Cache Completo</p>
                <p className="text-xs text-green-700">
                  {status.full.available ? '✅ Disponível' : '⏳ Pendente'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-purple-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-purple-900">Total Registros</p>
                <p className="text-xs text-purple-700">
                  {status.full.totalRows || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-orange-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-orange-900">Próx. Atualização</p>
                <p className="text-xs text-orange-700">
                  {status.full.nextScheduled ? 
                    new Date(status.full.nextScheduled).toLocaleDateString('pt-BR') : 
                    'Hoje às 5h'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Seções de amostra e documentação removidas para produção */}
    </div>
  );
}
