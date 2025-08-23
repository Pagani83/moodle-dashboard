import { useQuery } from '@tanstack/react-query';

export const useCachedReport134 = () => {
  const result = useQuery({
    queryKey: ['report134-cache'],
    queryFn: async () => {
      try {
        console.log('📊 Buscando dados frescos do cache/storage...');
        const response = await fetch('/api/cache/report-134?latest=1&t=' + Date.now(), {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          
          // Verificar se tem dados válidos
          if (data.data && Array.isArray(data.data) && data.data.length > 0) {
            console.log('✅ Dados encontrados:', data.data.length, 'registros');
            // Adicionar informação sobre a fonte e timestamp universal
            data.meta = { 
              ...data.meta, 
              source: 'cache',
              lastUpdate: data.meta?.lastFetch || new Date().toISOString(),
              // Usar timestamp universal do arquivo (baseado no sistema de arquivos)
              universalLastUpdate: data.file?.universalLastUpdate || data.meta?.lastFetch || new Date().toISOString()
            };
            return data;
          } else if (data.hasFile === false) {
            console.warn('📁 Nenhum arquivo encontrado no storage');
            return { 
              data: [], 
              meta: { 
                source: 'empty', 
                lastUpdate: null, 
                reason: 'no_files' 
              } 
            };
          }
        }
        
        throw new Error(`Resposta da API inválida: ${response.status}`);
        
      } catch (error) {
        console.error('❌ Erro ao buscar dados:', error);
        // Retornar estrutura vazia em caso de erro
        return { 
          data: [], 
          meta: { 
            lastUpdate: null, 
            source: 'error', 
            error: error instanceof Error ? error.message : 'Erro desconhecido' 
          } 
        };
      }
    },
    staleTime: 30 * 1000, // Cache por 30 segundos para evitar muitas requisições
    gcTime: 5 * 60 * 1000, // 5 minutos para garbage collection
    refetchOnMount: false, // Não fazer refetch automático ao montar
    refetchOnWindowFocus: false, // Não refetch quando usuário voltar à janela
    retry: (failureCount, error) => {
      // Tentar até 2 vezes em caso de erro de rede
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000), // Backoff exponencial mais rápido
  });
  
  return result;
};
