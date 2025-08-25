import React from 'react';
import { Settings } from 'lucide-react';

interface ConfigurationViewProps {
  config: any;
}

export function ConfigurationView({ config }: ConfigurationViewProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
        <Settings className="h-5 w-5 mr-2" />
        Configuração Atual
      </h3>
      
      {config ? (
        <div className="space-y-3 text-sm">
          <div>
            <span className="font-medium text-gray-700">URL Base:</span>
            <span className="ml-2 text-gray-600">{config.baseUrl ?? '—'}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Token:</span>
            <span className="ml-2 text-gray-600 font-mono">
              {config.token ? `${String(config.token).substring(0, 8)}...` : '—'}
            </span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Categoria Padrão:</span>
            <span className="ml-2 text-gray-600">{config.defaultCategory ?? '—'}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Timeout:</span>
            <span className="ml-2 text-gray-600">{((config.timeout ?? 0) / 1000)}s</span>
          </div>
        </div>
      ) : (
        <p className="text-gray-600">Nenhuma configuração encontrada.</p>
      )}
    </div>
  );
}
