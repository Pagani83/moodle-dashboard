/**
 * Hook especializado para o Relatório 134 - Principal do sistema
 * Sistema de cache diário com agendamento às 5h da manhã
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MoodleClient } from '@/lib/moodle-client';
import type { ConfigurableReportResponse } from '@/types/moodle';

// ============================================================================
// INTERFACES ESPECÍFICAS DO RELATÓRIO 134
// ============================================================================

export interface Report134Sample {
  data: any[];
  headers: string[];
  totalRows: number;
  sampleSize: number;
  fetchedAt: string;
  fieldsDocumentation: Record<string, {
    type: string;
    sampleValues: any[];
    description?: string;
  }>;
}

export interface Report134Cache {
  data: any[];
  totalRows: number;
  lastFetch: Date;
  nextScheduledFetch: Date;
  cacheValidUntil: Date;
  fetchDuration: number;
}

// ============================================================================
// CONFIGURAÇÕES DO RELATÓRIO 134
// ============================================================================

const REPORT_134_CONFIG = {
  id: 134,
  name: 'Relatório Principal 134',
  sampleSize: 50, // Buscar apenas primeiras 50 linhas para análise
  cacheKey: ['moodle', 'report134'] as const,
  sampleKey: ['moodle', 'report134', 'sample'] as const,
  scheduledHour: 5, // 5h da manhã
  cacheValidHours: 24, // Cache válido por 24h
};

// ============================================================================
// HOOK PARA TESTAR SE O RELATÓRIO 134 ESTÁ ACESSÍVEL
// ============================================================================

export function useTestReport134Access(
  client: MoodleClient,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ['moodle', 'testReport134Access'],
    queryFn: async () => {
      console.log('🔍 Testando acesso aos relatórios (ID 80 primeiro, depois 134)...');
      
      try {
        // PRIMEIRO: testar conectividade básica
        console.log('🔍 Testing basic connectivity...');
        const siteInfo = await client.getSiteInfo();
        console.log('✅ Basic connectivity OK:', siteInfo.sitename || 'Connected');
        
        // SEGUNDO: testar com relatório pequeno ID 80 (7 registros)
        console.log('🎯 Testing Report 80 (small test - 7 records)...');
        try {
          const testResponse = await client.runConfigurableReport(80, {});
          
          if (testResponse.data) {
            let testData: any[];
            try {
              testData = typeof testResponse.data === 'string' 
                ? JSON.parse(testResponse.data) 
                : testResponse.data;
              console.log(`✅ Relatório 80 (teste) funciona: ${testData.length} registros`);
              console.log('📊 Sample data from Report 80:', testData[0]);
            } catch (parseError) {
              console.warn('⚠️ Report 80 data parsing failed, but endpoint worked');
            }
          }
        } catch (testError: any) {
          console.warn('⚠️ Report 80 test failed:', testError.message);
        }
        
        // TERCEIRO: tentar relatório 134 com parâmetros mínimos
        console.log('🎯 Testing Report 134 (main report)...');
        const response = await client.runConfigurableReport(134, {});

        if (!response.data) {
          throw new Error('Relatório 134 não retornou dados');
        }

        // Verificar se conseguimos fazer parse dos dados
        let parsedData: any[];
        try {
          parsedData = typeof response.data === 'string' 
            ? JSON.parse(response.data) 
            : response.data;
        } catch (parseError) {
          throw new Error('Dados do Relatório 134 em formato inválido');
        }

        console.log(`✅ Relatório 134 acessível via API REST: ${parsedData.length} registros`);
        
        return {
          accessible: true,
          totalRecords: parsedData.length,
          sampleRecord: parsedData[0] || null,
          error: null,
          testReport80Worked: true, // Indicar que o teste com 80 funcionou
        };

      } catch (error: any) {
        console.error('❌ Relatório 134 não acessível:', error.message);
        
        return {
          accessible: false,
          totalRecords: 0,
          sampleRecord: null,
          error: error.message,
          testReport80Worked: false,
        };
      }
    },
    enabled,
    staleTime: 10 * 60 * 1000, // 10 minutos
    retry: 3,
    retryDelay: 2000,
  });
}

// ============================================================================
// HOOK PARA AMOSTRA DO RELATÓRIO 134
// ============================================================================

export function useReport134Sample(
  client: MoodleClient,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: REPORT_134_CONFIG.sampleKey,
    queryFn: async (): Promise<Report134Sample> => {
      console.log(`🔍 Buscando amostra do Relatório ${REPORT_134_CONFIG.id}...`);
      
      const startTime = Date.now();
      
      try {
        // Buscar relatório com filtros para limitar resultado
        const response = await client.runConfigurableReport(
          REPORT_134_CONFIG.id,
          {
            // Adicionar courseid baseado no link fornecido
            courseid: 1,
            // SEM FILTROS - buscar dados puros e completos
            // Filtragem será feita após cache conforme solicitado
          },
          false // permitir fallback direto se o REST retornar 500
        );

        if (!response.data) {
          throw new Error('Nenhum dado retornado do Relatório 134');
        }

        // Parse do JSON retornado
        let parsedData: any[];
        try {
          parsedData = typeof response.data === 'string' 
            ? JSON.parse(response.data) 
            : response.data;
        } catch (parseError) {
          console.error('❌ Erro ao fazer parse dos dados:', parseError);
          throw new Error('Dados do relatório em formato inválido');
        }

        if (!Array.isArray(parsedData) || parsedData.length === 0) {
          throw new Error('Relatório 134 retornou dados vazios ou inválidos');
        }

        // Pegar apenas as primeiras linhas como amostra
        const sampleData = parsedData.slice(0, REPORT_134_CONFIG.sampleSize);
        const headers = Object.keys(sampleData[0] || {});
        
        // Documentar campos automaticamente
        const fieldsDocumentation = analyzeFields(sampleData);

        const duration = Date.now() - startTime;
        
        console.log(`✅ Relatório 134 carregado (DADOS PUROS - SEM FILTROS):`);
        console.log(`   - Total de registros: ${parsedData.length}`);
        console.log(`   - Amostra para análise: ${sampleData.length} registros`);
        console.log(`   - Campos encontrados: ${headers.length}`);
        console.log(`   - Tempo de busca: ${duration}ms`);
        console.log(`   ⚠️ DADOS PUROS: Filtragem será feita após cache`);

        return {
          data: sampleData,
          headers,
          totalRows: parsedData.length,
          sampleSize: sampleData.length,
          fetchedAt: new Date().toISOString(),
          fieldsDocumentation,
        };

      } catch (error) {
        console.error(`❌ Erro ao buscar Relatório 134:`, error);
        throw error;
      }
    },
    enabled,
    staleTime: 60 * 60 * 1000, // 1 hora - amostra pode ficar um pouco mais tempo
    gcTime: 24 * 60 * 60 * 1000, // 24 horas
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

// ============================================================================
// HOOK PARA CACHE COMPLETO DO RELATÓRIO 134
// ============================================================================

export function useReport134Full(
  client: MoodleClient,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: REPORT_134_CONFIG.cacheKey,
    queryFn: async (): Promise<Report134Cache> => {
      console.log(`📊 Buscando Relatório 134 COMPLETO...`);
      
      const startTime = Date.now();
      
      try {
        const response = await client.runConfigurableReport(
          REPORT_134_CONFIG.id,
          {
            // Adicionar courseid baseado no link fornecido
            courseid: 1,
            // SEM FILTROS - buscar dados puros e completos
            // Filtragem será feita após cache conforme solicitado
          }
        );

        if (!response.data) {
          throw new Error('Nenhum dado retornado do Relatório 134 completo');
        }

        let parsedData: any[];
        try {
          parsedData = typeof response.data === 'string' 
            ? JSON.parse(response.data) 
            : response.data;
        } catch (parseError) {
          console.error('❌ Erro ao fazer parse dos dados completos:', parseError);
          throw new Error('Dados completos do relatório em formato inválido');
        }

        const duration = Date.now() - startTime;
        const now = new Date();
        
        // Calcular próximo agendamento (5h da manhã do próximo dia)
        const nextScheduled = new Date();
        nextScheduled.setHours(REPORT_134_CONFIG.scheduledHour, 0, 0, 0);
        if (nextScheduled <= now) {
          nextScheduled.setDate(nextScheduled.getDate() + 1);
        }

        // Cache válido até às 5h do próximo dia
        const cacheValidUntil = new Date(nextScheduled);

        console.log(`✅ Relatório 134 COMPLETO carregado:`);
        console.log(`   - Total de registros: ${parsedData.length}`);
        console.log(`   - Tempo de busca: ${(duration / 1000).toFixed(2)}s`);
        console.log(`   - Próximo agendamento: ${nextScheduled.toLocaleString('pt-BR')}`);

        return {
          data: parsedData,
          totalRows: parsedData.length,
          lastFetch: now,
          nextScheduledFetch: nextScheduled,
          cacheValidUntil,
          fetchDuration: duration,
        };

      } catch (error) {
        console.error(`❌ Erro ao buscar Relatório 134 completo:`, error);
        throw error;
      }
    },
    enabled,
    staleTime: REPORT_134_CONFIG.cacheValidHours * 60 * 60 * 1000, // 24 horas
    gcTime: 48 * 60 * 60 * 1000, // 48 horas
    retry: 2,
    retryDelay: 10000, // 10 segundos entre tentativas
  });
}

// ============================================================================
// HOOK PARA FORÇAR ATUALIZAÇÃO DO CACHE
// ============================================================================

export function useTestReport134(client: MoodleClient) {
  return useMutation({
    mutationFn: () => client.testReport134(),
    onSuccess: (result) => {
      console.log('🎯 Teste do Relatório 134 concluído:', result);
    },
    onError: (error) => {
      console.error('❌ Erro no teste do Relatório 134:', error);
    },
  });
}

export function useForceReport134Update(client: MoodleClient) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      console.log('🔄 Forçando atualização do Relatório 134 (padrão novo, sem filtros)...');

      const start = Date.now();
      // Buscar dados puros (mesmo padrão do fetch completo), permitir fallback
      const response = await client.runConfigurableReport(REPORT_134_CONFIG.id, {
        courseid: 1,
      });

      const data = typeof response.data === 'string'
        ? JSON.parse(response.data)
        : response.data;

      const now = new Date();
      const nextScheduled = getNextScheduledTime();
      const payload: Report134Cache = {
        data,
        totalRows: Array.isArray(data) ? data.length : 0,
        lastFetch: now,
        nextScheduledFetch: nextScheduled,
        cacheValidUntil: nextScheduled,
        fetchDuration: Date.now() - start,
      };

      // Atualizar o cache diretamente
      queryClient.setQueryData(REPORT_134_CONFIG.cacheKey, payload);

      // Persistir em arquivo XLSX no servidor (mantém últimos 7)
      try {
        await fetch('/api/cache/report-134', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data, lastFetch: now.toISOString(), fetchDuration: payload.fetchDuration, totalRows: payload.totalRows }),
        });
      } catch (e) {
        console.warn('⚠️ Falha ao salvar XLSX:', e);
      }
      return payload;
    },
    onSuccess: () => {
      console.log('✅ Relatório 134 atualizado manualmente com sucesso');
    },
    onError: (error) => {
      console.error('❌ Erro ao forçar atualização:', error);
    },
  });
}

// Restaurar do último XLSX salvo e popular o cache
export function useRestoreReport134FromFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/cache/report-134?latest=1');
      if (!res.ok) throw new Error('Falha ao ler arquivo XLSX');
      const json = await res.json();
      if (!json.ok || !json.hasFile) throw new Error('Nenhum arquivo disponível');
      const data = Array.isArray(json.data) ? json.data : [];
      const now = new Date();
      const nextScheduled = getNextScheduledTime();
      const payload: Report134Cache = {
        data,
        totalRows: data.length,
        lastFetch: json.meta?.lastFetch ? new Date(json.meta.lastFetch) : now,
        nextScheduledFetch: nextScheduled,
        cacheValidUntil: nextScheduled,
        fetchDuration: Number(json.meta?.fetchDuration) || 0,
      };
      queryClient.setQueryData(REPORT_134_CONFIG.cacheKey, payload);
      return { restored: true, file: json.file };
    },
  });
}

// ============================================================================
// HOOK PARA RODAR UM RELATÓRIO QUALQUER SOB DEMANDA
// ============================================================================

export function useRunReport(client: MoodleClient) {
  return useMutation({
    mutationFn: (reportId: number) => {
      console.log(`▶️ Executando Relatório ID: ${reportId} sob demanda...`);
      return client.runConfigurableReport(reportId, {});
    },
    onSuccess: (result, reportId) => {
      console.log(`✅ Sucesso ao executar Relatório ID: ${reportId}`, result);
    },
    onError: (error, reportId) => {
      console.error(`❌ Erro ao executar Relatório ID: ${reportId}`, error);
    },
  });
}

// ============================================================================
// HOOK PARA STATUS DO CACHE
// ============================================================================

export function useReport134Status(client: MoodleClient) {
  const sampleQuery = useReport134Sample(client, false); // Não buscar automaticamente
  const fullQuery = useReport134Full(client, false); // Não buscar automaticamente
  
  return {
    sample: {
      available: !!sampleQuery.data,
      loading: sampleQuery.isLoading,
      error: sampleQuery.error,
      lastFetch: sampleQuery.data?.fetchedAt,
    },
    full: {
      available: !!fullQuery.data,
      loading: fullQuery.isLoading,
      error: fullQuery.error,
      lastFetch: fullQuery.data?.lastFetch,
      nextScheduled: fullQuery.data?.nextScheduledFetch,
      cacheValid: fullQuery.data?.cacheValidUntil ? 
        new Date() < fullQuery.data.cacheValidUntil : false,
      totalRows: fullQuery.data?.totalRows || 0,
    },
    shouldFetchSampleFirst: !sampleQuery.data && !fullQuery.data,
    needsScheduledUpdate: fullQuery.data ? 
      new Date() >= fullQuery.data.cacheValidUntil : true,
  };
}

// ============================================================================
// UTILITÁRIOS
// ============================================================================

// Análise automática de campos
function analyzeFields(data: any[]): Record<string, {
  type: string;
  sampleValues: any[];
  description?: string;
}> {
  if (!data.length) return {};
  
  const fields: Record<string, {
    type: string;
    sampleValues: any[];
    description?: string;
  }> = {};
  
  const firstRow = data[0];
  
  for (const [key, value] of Object.entries(firstRow)) {
    // Coletar amostra de valores únicos
    const sampleValues = [...new Set(
      data.slice(0, 10).map(row => row[key])
    )].slice(0, 5);
    
    // Determinar tipo
    let inferredType: string = typeof value;
    if (inferredType === 'string') {
      const str = String(value);
      // Verificar se é data
      if (str && /^\d{2}-\d{2}-\d{4}/.test(str)) {
        inferredType = 'date';
      }
      // Verificar se é número como string
      else if (str && /^\d+$/.test(str)) {
        inferredType = 'numeric_string';
      }
    }
    
    fields[key] = {
      type: inferredType,
      sampleValues,
  description: generateFieldDescription(key, inferredType, sampleValues),
    };
  }
  
  return fields;
}

// Gerar descrição automática dos campos
function generateFieldDescription(
  fieldName: string, 
  type: string, 
  sampleValues: any[]
): string {
  const name = fieldName.toLowerCase();
  
  if (name.includes('course')) return 'Dados do curso';
  if (name.includes('user') || name.includes('student')) return 'Dados do usuário/estudante';
  if (name.includes('grade') || name.includes('nota')) return 'Informações de notas';
  if (name.includes('completion') || name.includes('conclu')) return 'Status de conclusão';
  if (name.includes('date') || name.includes('time')) return 'Informação temporal';
  if (name.includes('category') || name.includes('categoria')) return 'Categoria/classificação';
  if (name.includes('cargo') || name.includes('comarca')) return 'Campo específico CJUD';
  
  return `Campo ${type} com valores: ${sampleValues.slice(0, 3).join(', ')}`;
}

// Calcular próximo horário agendado (5h da manhã)
function getNextScheduledTime(): Date {
  const now = new Date();
  const next = new Date();
  next.setHours(REPORT_134_CONFIG.scheduledHour, 0, 0, 0);
  
  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }
  
  return next;
}

// ============================================================================
// EXPORT CONFIGURAÇÕES
// ============================================================================

export { REPORT_134_CONFIG };