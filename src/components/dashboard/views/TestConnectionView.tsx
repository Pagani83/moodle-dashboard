import React from 'react';
import { RefreshCw, CheckCircle, Eye } from 'lucide-react';

interface TestConnectionViewProps {
  testMutation: any;
  client: any;
  runReportMutation: any;
}

export function TestConnectionView({
  testMutation,
  client,
  runReportMutation,
}: TestConnectionViewProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Testes Manuais
        </h3>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={() => testMutation.mutate()}
            disabled={testMutation.isPending}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {testMutation.isPending ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                Testando...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Testar Conexão
              </>
            )}
          </button>

          <button
            onClick={() => runReportMutation.mutate(80)}
            disabled={runReportMutation.isPending}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50"
          >
            {runReportMutation.isPending ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                Testando...
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Testar Relatório 80
              </>
            )}
          </button>
        </div>

        {testMutation.data !== undefined && (
          <div className={`mt-4 p-4 rounded-lg ${
            testMutation.data ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {testMutation.data ? '✅ Conexão bem-sucedida!' : '❌ Falha na conexão'}
          </div>
        )}

        {testMutation.isError && (
          <div className="mt-4 p-4 rounded-lg bg-red-50 text-red-800">
            Erro na Conexão: {testMutation.error?.message}
          </div>
        )}

        {runReportMutation.data && (
          <div className="mt-4 p-4 rounded-lg bg-green-50 text-green-800">
            <h4 className="font-bold mb-2">✅ Teste de Relatório bem-sucedido!</h4>
            <pre className="text-xs bg-white p-2 rounded overflow-auto">
              {JSON.stringify(runReportMutation.data, null, 2)}
            </pre>
          </div>
        )}

        {runReportMutation.isError && (
          <div className="mt-4 p-4 rounded-lg bg-red-50 text-red-800">
            Erro no Relatório: {runReportMutation.error?.message}
          </div>
        )}
      </div>

      {client && (
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="text-md font-medium text-gray-900 mb-4">
            Informações do Cliente
          </h4>
          <div className="text-sm text-gray-600 space-y-2">
            <p>Cliente inicializado: ✅</p>
            <p>Cache ativo: ✅</p>
            <p>Timeout: 2 minutos</p>
          </div>
        </div>
      )}
    </div>
  );
}
