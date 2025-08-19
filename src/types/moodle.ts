/**
 * Tipos TypeScript para integração com Moodle REST API e Configurable Reports
 * Baseado na especificação OpenAPI e descobertas da implementação Python
 */

// ============================================================================
// TIPOS BÁSICOS DO MOODLE
// ============================================================================

export interface MoodleResponse<T = any> {
  data?: T;
  exception?: string;
  errorcode?: string;
  message?: string;
}

export interface Course {
  id: number;
  shortname: string;
  fullname: string;
  categoryid: number;
  startdate: number; // timestamp UNIX
  enddate: number;   // timestamp UNIX
  visible: number;   // 1=visível, 0=oculto
  format: string;
}

export interface User {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  username: string;
  city?: string;
  country?: string;
  lastaccess: number; // timestamp UNIX
  confirmed: number;
  suspended: number;
}

export interface CompletionStatus {
  completionstatus: {
    completed: boolean;
    timecompleted?: number; // timestamp UNIX
  };
}

// ============================================================================
// CONFIGURABLE REPORTS
// ============================================================================

export interface ConfigurableReportResponse {
  data: string; // JSON string com os dados
  warnings: string;
}

// Dados parseados do Dashboard Master CJUD (Relatório 134)
export interface DashboardMasterRecord {
  // Dados do Curso
  course_id: number;
  course_shortname: string;
  course_fullname: string;
  category_id: number;
  category_name: string;
  course_startdate: string; // formato dd-mm-yyyy
  course_enddate: string;   // formato dd-mm-yyyy
  course_visible: number;
  course_format: string;
  course_ch: string; // carga horária

  // Dados do Usuário
  user_id: number;
  firstname: string;
  lastname: string;
  fullname: string;
  email: string;
  city: string;
  country: string;
  lastaccess: string; // formato dd-mm-yyyy ou 'Nunca'
  confirmed: number;
  suspended: number;

  // Campos CJUD Específicos
  nomecargo: string;    // cargo do usuário
  comarca: string;      // comarca de exercício
  genero: string;       // gênero
  setor_exerc: string;  // setor de exercício
  nomesetor_exerc: string; // nome do setor

  // Progresso e Conclusão
  enrollment_status: number;
  enrollment_start: string;
  enrollment_end: string;
  enrollment_created: string;
  enrollment_modified: string;
  role_name: string;
  role_assigned: string;
  timecompleted: number | null;
  is_completed: number; // 0 ou 1
  completion_date: string; // dd-mm-yyyy ou 'Não Concluído'
  activities_completed: number;
  total_activities: number;
  progress_percentage: number; // 0-100
  avg_max_grade: number;
  total_quizzes: number;
  last_activity: string; // dd-mm-yyyy ou 'Sem Atividade'
  days_in_course: number;

  // Status Consolidado
  student_status: StudentStatus;
}

export type StudentStatus = 
  | 'CONCLUÍDO'
  | 'CURSANDO'
  | 'REPROVADO_EVADIDO'
  | 'NUNCA_ACESSOU'
  | 'SUSPENSO'
  | 'EXPIRADO'
  | 'USUÁRIO_SUSPENSO';

// ============================================================================
// SISTEMA DE ACOMPANHAMENTOS
// ============================================================================

export type TipoRelatorio = 
  | 'completion_by_group'
  | 'quiz_ranking'
  | 'scorm_tracks'
  | 'concluintes_periodo'
  | 'configurable_reports';

export interface RelatorioConfig {
  tipo: TipoRelatorio;
  ativo: boolean;
  params: Record<string, any>;
}

export interface CursoAcompanhamento {
  courseid: number;
  nome: string;
  relatorios: RelatorioConfig[];
  ativo: boolean;
}

export interface Acompanhamento {
  id: string;
  nome: string;
  descricao: string;
  cursos: CursoAcompanhamento[];
  mostrar_card_resumo: boolean;
  criado_em: string;
  atualizado_em: string;
}

// ============================================================================
// DASHBOARD E UI
// ============================================================================

export type CardStatus = 'OK' | 'ERRO' | 'CARREGANDO' | 'DESATIVADO';

export interface CardData {
  courseid: number;
  nome: string;
  total_usuarios: number;
  usuarios_completaram: number;
  taxa_conclusao: number;
  melhor_nota_quiz: number;
  total_tentativas_quiz: number;
  atividades_scorm: number;
  tracks_scorm: number;
  concluintes_periodo: number;
  periodo_inicio: string;
  periodo_fim: string;
  status: CardStatus;
  erro_msg: string;
  ultima_atualizacao: string;
}

export interface ResumoCards {
  total_cursos: number;
  cursos_ativos: number;
  total_usuarios_unicos: number;
  media_taxa_conclusao: number;
  melhor_curso_taxa: string;
  pior_curso_taxa: string;
  ultima_atualizacao: string;
}

// ============================================================================
// CONFIGURAÇÃO E API
// ============================================================================

export interface MoodleConfig {
  baseUrl: string;
  token: string;
  timeout: number;
  defaultCategory: number;
}

export interface MoodleClientParams {
  wstoken: string;
  moodlewsrestformat: 'json' | 'xml';
  wsfunction: string;
  [key: string]: any;
}

// Funções disponíveis no Moodle REST API
export type MoodleFunction = 
  // Core functions
  | 'core_course_get_courses'
  | 'core_course_get_categories_by_parent'
  | 'core_course_get_contents'
  | 'core_enrol_get_enrolled_users'
  | 'core_user_get_users'
  | 'core_completion_get_course_completion_status'
  | 'core_webservice_get_site_info'
  // Configurable Reports (descobertas funcionais) - funcionou no Python
  | 'block_configurable_reports_get_reports'
  | 'block_configurable_reports_run_report'
  | 'block_configurable_reports_get_data'
  | 'block_configurable_reports_get_report'
  | 'block_configurable_reports_get_report_data'  // Função principal que funcionou no Python
  | 'block_configurable_reports_view_report'
  | 'local_configurable_reports_get_reports'
  | 'local_configurable_reports_run_report';

// ============================================================================
// CACHE E PERFORMANCE
// ============================================================================

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live em milissegundos
}

export interface CacheStats {
  total_cached: number;
  completed_cached: number;
  needs_check: number;
  last_completion: Date | null;
}

// ============================================================================
// FILTROS E CONSULTAS
// ============================================================================

export interface DashboardFilters {
  category?: number;
  startDate?: string; // formato yyyy-mm-dd
  endDate?: string;   // formato yyyy-mm-dd
  status?: StudentStatus[];
  cursos?: number[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================================================
// CONSTANTES
// ============================================================================

export const TIPOS_RELATORIO: Record<TipoRelatorio, string> = {
  completion_by_group: 'Conclusão por Grupo',
  quiz_ranking: 'Ranking de Quiz',
  scorm_tracks: 'Trilhas SCORM',
  concluintes_periodo: 'Concluintes por Período',
  configurable_reports: 'Relatório Configurable Reports',
};

export const STATUS_COLORS: Record<StudentStatus, string> = {
  'CONCLUÍDO': 'text-green-600 bg-green-50',
  'CURSANDO': 'text-blue-600 bg-blue-50',
  'REPROVADO_EVADIDO': 'text-orange-600 bg-orange-50',
  'NUNCA_ACESSOU': 'text-gray-600 bg-gray-50',
  'SUSPENSO': 'text-red-600 bg-red-50',
  'EXPIRADO': 'text-red-600 bg-red-50',
  'USUÁRIO_SUSPENSO': 'text-red-600 bg-red-50',
};

export const CARD_STATUS_ICONS: Record<CardStatus, string> = {
  'OK': '🟢',
  'ERRO': '🔴',
  'CARREGANDO': '🟡',
  'DESATIVADO': '⚫',
};