/**
 * Componente de Debug para monitorar o uso da quota da YouTube API
 * Exibe estatísticas em tempo real do consumo diário
 */

import React from 'react';
import { youtubeQuotaMonitor } from '@/lib/youtube-quota-monitor';
import { useMoodleStore } from '@/store/moodle-store';
import { Youtube, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

export function YouTubeQuotaDebug() {
  const { theme } = useMoodleStore();
  const [stats, setStats] = React.useState(youtubeQuotaMonitor.getUsageStats());
  
  // Atualizar stats a cada 5 segundos
  React.useEffect(() => {
    const interval = setInterval(() => {
      setStats(youtubeQuotaMonitor.getUsageStats());
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  const getStatusColor = () => {
    if (stats.percentageUsed > 90) return 'red';
    if (stats.percentageUsed > 50) return 'yellow';
    return 'green';
  };
  
  const getStatusIcon = () => {
    const color = getStatusColor();
    const className = `h-4 w-4 ${
      color === 'red' ? 'text-red-500' : 
      color === 'yellow' ? 'text-yellow-500' : 
      'text-green-500'
    }`;
    
    if (color === 'red') return <XCircle className={className} />;
    if (color === 'yellow') return <AlertTriangle className={className} />;
    return <CheckCircle className={className} />;
  };
  
  return (
    <div className={`fixed bottom-4 right-4 w-80 rounded-lg border p-4 shadow-lg ${
      theme === 'dark' 
        ? 'bg-slate-800 border-slate-700' 
        : 'bg-white border-slate-200'
    }`}>
      <div className="flex items-center gap-2 mb-3">
        <Youtube className="h-5 w-5 text-red-500" />
        <h3 className={`font-semibold text-sm ${
          theme === 'dark' ? 'text-white' : 'text-slate-900'
        }`}>
          YouTube API Quota Monitor
        </h3>
        {getStatusIcon()}
      </div>
      
      <div className="space-y-2">
        {/* Progress bar */}
        <div className={`w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2`}>
          <div 
            className={`h-2 rounded-full transition-all ${
              getStatusColor() === 'red' ? 'bg-red-500' :
              getStatusColor() === 'yellow' ? 'bg-yellow-500' :
              'bg-green-500'
            }`}
            style={{ width: `${Math.min(stats.percentageUsed, 100)}%` }}
          />
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className={`p-2 rounded ${
            theme === 'dark' ? 'bg-slate-700' : 'bg-slate-100'
          }`}>
            <div className={`font-medium ${
              theme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}>
              {stats.totalCalls.toLocaleString()} / 10,000
            </div>
            <div className={`${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
            }`}>
              Calls Hoje
            </div>
          </div>
          
          <div className={`p-2 rounded ${
            theme === 'dark' ? 'bg-slate-700' : 'bg-slate-100'
          }`}>
            <div className={`font-medium ${
              theme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}>
              {stats.percentageUsed.toFixed(1)}%
            </div>
            <div className={`${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
            }`}>
              Usado
            </div>
          </div>
          
          <div className={`p-2 rounded ${
            theme === 'dark' ? 'bg-slate-700' : 'bg-slate-100'
          }`}>
            <div className={`font-medium ${
              theme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}>
              {stats.channelInfoCalls}
            </div>
            <div className={`${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
            }`}>
              Channel Calls
            </div>
          </div>
          
          <div className={`p-2 rounded ${
            theme === 'dark' ? 'bg-slate-700' : 'bg-slate-100'
          }`}>
            <div className={`font-medium ${
              theme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}>
              {stats.remainingCalls.toLocaleString()}
            </div>
            <div className={`${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
            }`}>
              Restantes
            </div>
          </div>
        </div>
        
        {/* Reset button para desenvolvimento */}
        {process.env.NODE_ENV === 'development' && (
          <button
            onClick={() => {
              youtubeQuotaMonitor.resetQuota();
              setStats(youtubeQuotaMonitor.getUsageStats());
            }}
            className={`w-full mt-2 p-2 text-xs font-medium rounded transition-colors ${
              theme === 'dark'
                ? 'bg-slate-600 hover:bg-slate-500 text-white'
                : 'bg-slate-200 hover:bg-slate-300 text-slate-900'
            }`}
          >
            Reset Quota (DEV)
          </button>
        )}
      </div>
    </div>
  );
}
