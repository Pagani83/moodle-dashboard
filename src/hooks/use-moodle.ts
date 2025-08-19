/**
 * Hooks React Query para integração com Moodle API
 * Baseado no cliente TypeScript e descobertas da implementação Python
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MoodleClient, createMoodleClient } from '@/lib/moodle-client';
import type {
  MoodleConfig,
  Course,
  User,
  DashboardMasterRecord,
  DashboardFilters,
  CacheStats,
} from '@/types/moodle';

// ============================================================================
// CONFIGURAÇÃO E CLIENTE
// ============================================================================

// Hook para obter instância do cliente Moodle
export function useMoodleClient(config: MoodleConfig): MoodleClient {
  // TODO: Implementar context/provider para gerenciar instância única
  return createMoodleClient(config);
}

// ============================================================================
// QUERY KEYS CONSTANTS
// ============================================================================

export const MOODLE_QUERY_KEYS = {
  // Dados básicos
  siteInfo: ['moodle', 'siteInfo'] as const,
  categories: (parentId?: number) => ['moodle', 'categories', { parentId }] as const,
  courses: (categoryId?: number) => ['moodle', 'courses', { categoryId }] as const,
  
  // Dashboard principal (Configurable Reports)
  dashboardMaster: (category: number, startDate?: string, endDate?: string) => 
    ['moodle', 'dashboardMaster', { category, startDate, endDate }] as const,
  
  // Consultas otimizadas
  courseSummaries: (category: number) => 
    ['moodle', 'courseSummaries', { category }] as const,
  completionsByPeriod: (category: number, startDate?: string, endDate?: string) => 
    ['moodle', 'completionsByPeriod', { category, startDate, endDate }] as const,
  activeStudents: (category: number) => 
    ['moodle', 'activeStudents', { category }] as const,
  activityAnalysis: (category: number) => 
    ['moodle', 'activityAnalysis', { category }] as const,
  
  // Dados por curso
  enrolledUsers: (courseId: number) => 
    ['moodle', 'enrolledUsers', { courseId }] as const,
  courseCompletion: (courseId: number, userId: number) => 
    ['moodle', 'courseCompletion', { courseId, userId }] as const,
  
  // Configurable Reports
  configurableReports: ['moodle', 'configurableReports'] as const,
  configurableReport: (reportId: number, filters?: Record<string, any>) => 
    ['moodle', 'configurableReport', { reportId, filters }] as const,
} as const;

// ============================================================================
// HOOKS DE DADOS BÁSICOS
// ============================================================================

export function useSiteInfo(client: MoodleClient) {
  return useQuery({
    queryKey: MOODLE_QUERY_KEYS.siteInfo,
    queryFn: () => client.getSiteInfo(),
    staleTime: 24 * 60 * 60 * 1000, // 24 horas
    gcTime: 24 * 60 * 60 * 1000,
  });
}

export function useCategories(client: MoodleClient, parentId: number = 0) {
  return useQuery({
    queryKey: MOODLE_QUERY_KEYS.categories(parentId),
    queryFn: () => client.getCategories(parentId),
    staleTime: 2 * 60 * 60 * 1000, // 2 horas
  });
}

export function useCourses(client: MoodleClient, categoryId?: number) {
  return useQuery({
    queryKey: MOODLE_QUERY_KEYS.courses(categoryId),
    queryFn: () => client.getCourses(categoryId),
    staleTime: 60 * 60 * 1000, // 1 hora
    enabled: categoryId !== undefined,
  });
}

// ============================================================================
// HOOK PRINCIPAL - DASHBOARD MASTER CJUD
// ============================================================================

export function useDashboardMasterCJUD(
  client: MoodleClient,
  category: number = 22,
  startDate?: string,
  endDate?: string,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: MOODLE_QUERY_KEYS.dashboardMaster(category, startDate, endDate),
    queryFn: () => client.getDashboardMasterCJUD(category, startDate, endDate),
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos
    enabled,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

// ============================================================================
// HOOKS PARA CONSULTAS OTIMIZADAS
// ============================================================================

export function useCourseSummaries(
  client: MoodleClient,
  category: number = 22,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: MOODLE_QUERY_KEYS.courseSummaries(category),
    queryFn: () => client.getCourseSummaries(category),
    staleTime: 15 * 60 * 1000, // 15 minutos
    enabled,
  });
}

export function useCompletionsByPeriod(
  client: MoodleClient,
  category: number = 22,
  startDate?: string,
  endDate?: string,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: MOODLE_QUERY_KEYS.completionsByPeriod(category, startDate, endDate),
    queryFn: () => client.getCompletionsByPeriod(category, startDate, endDate),
    staleTime: 10 * 60 * 1000, // 10 minutos
    enabled: enabled && (startDate !== undefined || endDate !== undefined),
  });
}

export function useActiveStudents(
  client: MoodleClient,
  category: number = 22,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: MOODLE_QUERY_KEYS.activeStudents(category),
    queryFn: () => client.getActiveStudents(category),
    staleTime: 5 * 60 * 1000, // 5 minutos (dados mais dinâmicos)
    enabled,
  });
}

export function useActivityAnalysis(
  client: MoodleClient,
  category: number = 22,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: MOODLE_QUERY_KEYS.activityAnalysis(category),
    queryFn: () => client.getActivityAnalysis(category),
    staleTime: 30 * 60 * 1000, // 30 minutos
    enabled,
  });
}

// ============================================================================
// HOOKS PARA DADOS POR CURSO
// ============================================================================

export function useEnrolledUsers(
  client: MoodleClient,
  courseId: number,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: MOODLE_QUERY_KEYS.enrolledUsers(courseId),
    queryFn: () => client.getEnrolledUsers(courseId),
    staleTime: 30 * 60 * 1000, // 30 minutos
    enabled: enabled && courseId > 0,
  });
}

export function useCourseCompletion(
  client: MoodleClient,
  courseId: number,
  userId: number,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: MOODLE_QUERY_KEYS.courseCompletion(courseId, userId),
    queryFn: () => client.getCourseCompletion(courseId, userId),
    staleTime: 15 * 60 * 1000, // 15 minutos
    enabled: enabled && courseId > 0 && userId > 0,
  });
}

// ============================================================================
// HOOKS PARA CONFIGURABLE REPORTS
// ============================================================================

export function useConfigurableReports(client: MoodleClient) {
  return useQuery({
    queryKey: MOODLE_QUERY_KEYS.configurableReports,
    queryFn: () => client.getConfigurableReports(),
    staleTime: 60 * 60 * 1000, // 1 hora
  });
}

export function useConfigurableReport(
  client: MoodleClient,
  reportId: number,
  filters: Record<string, any> = {},
  enabled: boolean = true
) {
  return useQuery({
    queryKey: MOODLE_QUERY_KEYS.configurableReport(reportId, filters),
    queryFn: () => client.runConfigurableReport(reportId, filters),
    staleTime: 10 * 60 * 1000, // 10 minutos
    enabled: enabled && reportId > 0,
  });
}

// ============================================================================
// MUTATIONS PARA TESTES E OPERAÇÕES
// ============================================================================

export function useTestConnection(client: MoodleClient) {
  return useMutation({
    mutationFn: () => client.testConnection(),
    onSuccess: (success) => {
      console.log(success ? '✅ Conexão testada com sucesso' : '❌ Falha na conexão');
    },
  });
}

export function useTestConfigurableReports(client: MoodleClient) {
  return useMutation({
    mutationFn: () => client.testConfigurableReports(),
    onSuccess: (results) => {
      console.log('📊 Teste Configurable Reports:', results);
    },
  });
}

export function useClearCache(client: MoodleClient) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => {
      client.clearCache();
      return Promise.resolve();
    },
    onSuccess: () => {
      // Invalidar todas as queries do Moodle
      queryClient.invalidateQueries({ queryKey: ['moodle'] });
      console.log('🧹 Cache limpo com sucesso');
    },
  });
}

// ============================================================================
// HOOKS COMPOSTOS E UTILITÁRIOS
// ============================================================================

// Hook composto para dashboard completo
export function useDashboardData(
  client: MoodleClient,
  category: number = 22,
  filters?: DashboardFilters
) {
  const masterData = useDashboardMasterCJUD(
    client,
    category,
    filters?.startDate,
    filters?.endDate
  );
  
  const summaries = useCourseSummaries(client, category);
  const activeStudents = useActiveStudents(client, category);
  
  return {
    masterData,
    summaries,
    activeStudents,
    isLoading: masterData.isLoading || summaries.isLoading || activeStudents.isLoading,
    isError: masterData.isError || summaries.isError || activeStudents.isError,
    error: masterData.error || summaries.error || activeStudents.error,
  };
}

// Hook para estatísticas de cache
export function useCacheStats(client: MoodleClient, enabled: boolean = true) {
  return useQuery({
    queryKey: ['moodle', 'cacheStats'],
    queryFn: () => client.getCacheStats(),
    staleTime: 10 * 1000, // 10 segundos
  refetchInterval: enabled ? 30 * 1000 : undefined, // Atualizar a cada 30 segundos
  enabled,
  });
}

// Hook para filtrar dados do dashboard
export function useFilteredDashboardData(
  data: DashboardMasterRecord[] | undefined,
  filters: DashboardFilters
): DashboardMasterRecord[] {
  if (!data) return [];
  
  return data.filter(record => {
    // Filtro por status
    if (filters.status?.length && !filters.status.includes(record.student_status)) {
      return false;
    }
    
    // Filtro por cursos específicos
    if (filters.cursos?.length && !filters.cursos.includes(record.course_id)) {
      return false;
    }
    
    // Filtros de data (se necessário aplicar no frontend)
    if (filters.startDate) {
      const recordDate = new Date(record.course_startdate.split('-').reverse().join('-'));
      const filterDate = new Date(filters.startDate);
      if (recordDate < filterDate) return false;
    }
    
    if (filters.endDate) {
      const recordDate = new Date(record.course_enddate.split('-').reverse().join('-'));
      const filterDate = new Date(filters.endDate);
      if (recordDate > filterDate) return false;
    }
    
    return true;
  });
}

// ============================================================================
// HELPERS E UTILITÁRIOS
// ============================================================================

// Hook para calcular métricas do dashboard
export function useDashboardMetrics(data: DashboardMasterRecord[] | undefined) {
  if (!data?.length) {
    return {
      totalCourses: 0,
      totalStudents: 0,
      completedStudents: 0,
      completionRate: 0,
      activeStudents: 0,
      inactiveStudents: 0,
      avgProgressPercentage: 0,
    };
  }
  
  const uniqueCourses = new Set(data.map(record => record.course_id)).size;
  const totalStudents = data.length;
  const completedStudents = data.filter(record => record.student_status === 'CONCLUÍDO').length;
  const activeStudents = data.filter(record => record.student_status === 'ATIVO').length;
  const inactiveStudents = data.filter(record => 
    record.student_status.includes('INATIVO') || record.student_status === 'NUNCA_ACESSOU'
  ).length;
  
  const completionRate = totalStudents > 0 ? (completedStudents / totalStudents) * 100 : 0;
  const avgProgressPercentage = data.reduce((sum, record) => sum + record.progress_percentage, 0) / totalStudents;
  
  return {
    totalCourses: uniqueCourses,
    totalStudents,
    completedStudents,
    completionRate: Math.round(completionRate * 100) / 100,
    activeStudents,
    inactiveStudents,
    avgProgressPercentage: Math.round(avgProgressPercentage * 100) / 100,
  };
}