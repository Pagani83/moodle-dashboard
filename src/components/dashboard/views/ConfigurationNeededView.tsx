import React from 'react';
import { AlertCircle } from 'lucide-react';

export function ConfigurationNeededView() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background)' }}>
      <div className="text-center max-w-md">
        <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Configuração Necessária
        </h1>
        <p className="text-gray-600 mb-6">
          Para usar o dashboard, é necessário configurar as credenciais do Moodle.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
          <h3 className="font-medium text-blue-900 mb-2">Informações Necessárias:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• URL base do Moodle</li>
            <li>• Token de acesso à API</li>
            <li>• Categoria padrão (opcional)</li>
          </ul>
        </div>
        <p className="text-xs text-gray-500 mt-4">
          Verifique se o arquivo .env.local está configurado corretamente.
        </p>
      </div>
    </div>
  );
}
