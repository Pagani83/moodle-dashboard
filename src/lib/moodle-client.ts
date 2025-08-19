/**
 * Cliente TypeScript para Moodle REST API e Configurable Reports
 * Baseado nas descobertas da implementação Python
 * 
 * Funcionalidades:
 * - 7 endpoints funcionais do Configurable Reports
 * - API REST padrão do Moodle
 * - Sistema de cache inteligente
 * - Performance otimizada para 16k+ registros
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios';
import type {
  MoodleConfig,
  MoodleClientParams,
  MoodleFunction,
  MoodleResponse,
  Course,
  User,
  ConfigurableReportResponse,
  DashboardMasterRecord,
  CacheEntry,
  CacheStats,
} from '@/types/moodle';

export class MoodleClient {
  private axiosInstance: AxiosInstance;
  private config: MoodleConfig;
  private cache = new Map<string, CacheEntry>();

  private maskToken(text: string): string {
    // Mask both wstoken= and token= occurrences in URLs or bodies
    const masked = text
      .replace(/wstoken=[^&]+/g, `wstoken=${this.config.token.substring(0, 8)}...***`)
      .replace(/token=[^&]+/g, `token=${this.config.token.substring(0, 8)}...***`);
    return masked;
  }

  constructor(config: MoodleConfig) {
    this.config = config;
    
    this.axiosInstance = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout || 1800000, // 30 minutos para queries pesadas
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json, text/plain, */*',
        'Cache-Control': 'no-cache',
      },
      // Configurações para CORS e network
      withCredentials: false,
      maxRedirects: 5,
      // Permitir respostas grandes (JSON volumoso)
      maxBodyLength: Infinity as unknown as number,
      maxContentLength: Infinity as unknown as number,
      validateStatus: (status) => status >= 200 && status < 300,
    });

    // Interceptor para logging e debugging
    this.axiosInstance.interceptors.request.use((config) => {
      console.log(`🚀 Moodle API: ${config.params?.wsfunction || 'unknown'}`);
      return config;
    });

    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('❌ Moodle API Error:', error.message);
        throw error;
      }
    );
  }

  // ============================================================================
  // CACHE MANAGEMENT
  // ============================================================================

  private getCacheKey(func: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        result[key] = params[key];
        return result;
      }, {} as Record<string, any>);
    
    return `${func}:${JSON.stringify(sortedParams)}`;
  }

  private isValidCache<T>(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }

  private setCache<T>(key: string, data: T, ttlMinutes: number = 30): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000,
    });
  }

  private getCache<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    if (entry && this.isValidCache(entry)) {
      return entry.data;
    }
    
    if (entry) {
      this.cache.delete(key);
    }
    
    return null;
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheStats(): CacheStats {
    const entries = Array.from(this.cache.values());
    return {
      total_cached: entries.length,
      completed_cached: entries.filter(e => this.isValidCache(e)).length,
      needs_check: entries.filter(e => !this.isValidCache(e)).length,
      last_completion: entries.length > 0 
        ? new Date(Math.max(...entries.map(e => e.timestamp)))
        : null,
    };
  }

  // ============================================================================
  // CORE API METHODS
  // ============================================================================

  // Build the absolute REST server URL, regardless of how baseUrl was provided
  private getRestServerUrl(): string {
    // Normalize base URL by trimming trailing slashes
    const base = (this.config.baseUrl || '').trim().replace(/\/+$/, '');
    const isBrowser = typeof window !== 'undefined';
  const proxyPrefix = '/api/moodle';
  const origin = isBrowser ? window.location.origin : '';

    if (!base) return '/webservice/rest/server.php';

    // If base is absolute and we're in the browser with a different origin, go through the proxy
    if (isBrowser && /^https?:/i.test(base)) {
      try {
        const baseUrl = new URL(base);
        if (window.location.origin !== baseUrl.origin) {
          // Map to proxy path, preserving the rest of the URL path
      if (/server\.php$/i.test(base)) return `${origin}${proxyPrefix}/webservice/rest/server.php`;
      if (/\/webservice\/rest$/i.test(base)) return `${origin}${proxyPrefix}/webservice/rest/server.php`;
      return `${origin}${proxyPrefix}/webservice/rest/server.php`;
        }
      } catch {
        // ignore URL parse errors and fall back
      }
    }

    // If already points to server.php
  if (/server\.php$/i.test(base)) return isBrowser && base.startsWith('/') ? `${origin}${base}` : base;

    // If points to /webservice/rest
    if (/\/webservice\/rest$/i.test(base)) {
      return isBrowser && base.startsWith('/') ? `${origin}${base}/server.php` : `${base}/server.php`;
    }

    // If base is a relative proxy prefix (e.g., /api/moodle), append REST path under that prefix
    if (base.startsWith('/')) return isBrowser ? `${origin}${base}/webservice/rest/server.php` : `${base}/webservice/rest/server.php`;

    // Otherwise (absolute Moodle root), append full path
    return `${base}/webservice/rest/server.php`;
  }

  private async makeRequest<T = any>(
    wsfunction: MoodleFunction,
    params: Record<string, any> = {},
    useCache: boolean = true,
    cacheTtlMinutes: number = 30
  ): Promise<T> {
    const cacheKey = this.getCacheKey(wsfunction, params);
    
    // Verificar cache primeiro
    if (useCache) {
      const cachedData = this.getCache<T>(cacheKey);
      if (cachedData) {
        console.log(`💾 Cache hit: ${wsfunction}`);
        return cachedData;
      }
    }

    // Validar parâmetros antes de enviar
    const cleanParams: Record<string, any> = {};
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        cleanParams[key] = value;
      }
    }

    const requestParams: MoodleClientParams = {
      wstoken: this.config.token,
      moodlewsrestformat: 'json',
      wsfunction,
      ...cleanParams,
    };

    console.log('🚀 Making request:', {
      wsfunction,
      cleanParams,
      hasToken: !!this.config.token,
      tokenLength: this.config.token.length,
    });

    try {
      // Prefer GET with query params, matching the working URL pattern
      console.log('📤 GET params:', this.maskToken(new URLSearchParams(requestParams as any).toString()));
      const response: AxiosResponse<MoodleResponse<T> | any> = await this.axiosInstance.get(
        this.getRestServerUrl(),
        {
          params: requestParams,
          headers: {
            'Accept': 'application/json, text/plain, */*',
          },
        }
      );

      // Verificar erros do Moodle
      if (response.data.exception || response.data.errorcode) {
        throw new Error(
          `Moodle API Error: ${response.data.message || response.data.exception}`
        );
      }

      const data = (response.data && (response.data as MoodleResponse<T>).data !== undefined)
        ? (response.data as MoodleResponse<T>).data
        : response.data;
      
      // Salvar no cache se solicitado
      if (useCache) {
        this.setCache(cacheKey, data, cacheTtlMinutes);
      }

      return data as T;
    } catch (error) {
      console.error(`❌ API Error [${wsfunction}]:`, error);
      throw error;
    }
  }

  // ============================================================================
  // CONFIGURABLE REPORTS API - ACESSO DIRETO VIA HTTP
  // ============================================================================

  async runConfigurableReport(
    reportId: number,
    filters: Record<string, any> = {},
    restOnly: boolean = false
  ): Promise<ConfigurableReportResponse> {
    console.log(`📊 Fetching Configurable Report ${reportId} via REST (GET)...${restOnly ? ' [REST only]' : ''}`);

    // Only try the endpoint that is available in this Moodle instance
    const endpointsToTry = [
      'block_configurable_reports_get_report_data',
    ];

  const errors: Array<{ endpoint: string; status?: number; message: string }> = [];
  for (const wsfunction of endpointsToTry) {
      try {
        const requestParams = {
          wstoken: this.config.token,
          moodlewsrestformat: 'json',
          wsfunction,
          reportid: reportId,
          courseid: filters.courseid ?? 1,
          ...filters,
        } as Record<string, any>;

        console.log('📤 GET request:', this.maskToken(new URLSearchParams(Object.entries(requestParams)).toString()));

        const response = await this.axiosInstance.get(this.getRestServerUrl(), {
          params: requestParams,
          headers: {
            'Accept': 'application/json',
            // Simulate typical client for compatibility if needed
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
          timeout: 1800000,
          validateStatus: (status) => status < 500,
        });

        console.log(`📥 Response from ${wsfunction}:`, {
          status: response.status,
          statusText: response.statusText,
          hasData: !!response.data,
          dataType: typeof response.data,
        });

        if (response.status >= 400) {
          console.log(`⚠️ HTTP ${response.status} from ${wsfunction}:`, response.data);
          errors.push({ endpoint: wsfunction, status: response.status, message: JSON.stringify(response.data).slice(0, 500) });
          // If 500 (server error), consider fallback only for specific heavy reports
          const allowDirectFallback = !restOnly && reportId === 134;
          if (allowDirectFallback && response.status === 500) {
            console.log('⚠️ 500 from REST endpoint, falling back to direct viewreport.php');
            return this.runConfigurableReportDirect(reportId, filters);
          }
          continue;
        }

  if (response.data && (response.data.exception || response.data.errorcode)) {
          console.log(`⚠️ Moodle error from ${wsfunction}:`, response.data.message || response.data.exception);
          errors.push({ endpoint: wsfunction, message: response.data.message || response.data.exception });
          continue;
        }

        const data = (response.data && response.data.data !== undefined)
          ? response.data.data
          : response.data;

        console.log(`✅ Success with ${wsfunction}!`);
        return {
          data: data,
          warnings: response.data?.warnings || '',
        };
      } catch (error: any) {
        console.log(`⚠️ ${wsfunction} failed:`, {
          message: error.message,
          code: error.code,
          status: error.response?.status,
        });
        errors.push({ endpoint: wsfunction, status: error.response?.status, message: error.message });
        // try next
      }
    }

    if (!restOnly && reportId === 134) {
      console.log('🔄 All REST endpoints failed, trying direct HTTP approach for report 134...');
      return this.runConfigurableReportDirect(reportId, filters);
    }
    throw new Error(
      `Todos os endpoints REST falharam para o relatório ${reportId}. Detalhes: ` +
      errors.map(e => `${e.endpoint}${e.status ? ' ['+e.status+']' : ''}: ${e.message}`).join(' | ')
    );
  }

  private async runConfigurableReportDirect(
    reportId: number,
    filters: Record<string, any> = {}
  ): Promise<ConfigurableReportResponse> {
    console.log(`🔗 Direct HTTP access to Configurable Report ${reportId}...`);

    // A URL base para acesso direto aos relatórios configuráveis.
    const isBrowser = typeof window !== 'undefined';
    const origin = isBrowser ? window.location.origin : '';
    const base = (this.config.baseUrl || '').replace(/\/+$/, '');
    let reportUrl: string;
    if (isBrowser && /^https?:/i.test(base)) {
      // Route through proxy to avoid CORS in browser
      reportUrl = `${origin}/api/moodle/blocks/configurable_reports/viewreport.php`;
    } else if (isBrowser && base.startsWith('/')) {
      reportUrl = `${origin}${base.replace(/\/webservice\/rest\/?$/i, '')}/blocks/configurable_reports/viewreport.php`;
    } else {
      reportUrl = `${base.replace(/\/webservice\/rest\/?$/i, '')}/blocks/configurable_reports/viewreport.php`;
    }

    const params = new URLSearchParams({
      id: reportId.toString(),
      courseid: (filters.courseid || '1').toString(),
      format: 'json',
      token: this.config.token,
      ...filters,
    });

  const fullUrl = `${reportUrl}?${params.toString()}`;

    // Mascarar token na URL nos logs por segurança
    console.log(`📍 Direct URL: ${this.maskToken(fullUrl)}`);

    try {
  const response = await this.axiosInstance.get(fullUrl, {
        timeout: 1800000, // 30 minutos
        validateStatus: (status) => status >= 200 && status < 300,
        headers: {
          'User-Agent': 'Moodle-Client-TypeScript/1.0 (Direct-Access)',
          'Accept': 'application/json, */*',
        }
      });

      console.log(`✅ Success with Direct HTTP access!`);
      console.log(`📦 Response type: ${typeof response.data}`);

      // O Moodle com acesso direto pode retornar JSON diretamente
      // ou uma string JSON que precisa ser parseada.
      let processedData;
      if (typeof response.data === 'string') {
        try {
          processedData = JSON.parse(response.data);
          console.log('✅ Parsed JSON string response');
        } catch (e) {
          console.error('❌ Failed to parse JSON response string:', e);
          throw new Error('Invalid JSON response from direct report access.');
        }
      } else {
        processedData = response.data;
      }
      
      return {
        data: processedData,
        warnings: '',
      };

    } catch (error: any) {
      console.error(`❌ Direct HTTP access failed for Report ${reportId}:`, {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      // Se o acesso direto falhar, lança um erro claro.
      throw new Error(`Não foi possível acessar o Relatório ${reportId} via acesso direto. Verifique a URL, permissões e o token.`);
    }
  }

  // Métodos removidos - apenas acesso direto via HTTP implementado acima

  // ============================================================================
  // RELATÓRIO 134 - PRINCIPAL DO SISTEMA
  // ============================================================================

  async getReport134(
    category: number = 22,
    startDate?: string,
    endDate?: string,
    sampleOnly: boolean = false
  ): Promise<any[]> {
    console.log(`🎯 Fetching Report 134${sampleOnly ? ' (sample)' : ' (full)'}...`);
    
    const filters: Record<string, any> = {
      courseid: 1, // Baseado no link fornecido
      // SEM FILTROS DE CATEGORIA OU DATA
      // Buscar dados puros e completos conforme solicitado
      // Filtragem será feita após ter os dados em cache
    };

    // Ignorar parâmetros de categoria e data - buscar tudo puro
    // A filtragem será feita posteriormente no frontend/cache

    try {
      const response = await this.runConfigurableReport(134, filters);
      
      if (!response.data) {
        console.warn('⚠️ No data returned from Report 134');
        return [];
      }

      // Parse do JSON retornado
      let parsedData: any[];
      try {
        parsedData = typeof response.data === 'string' 
          ? JSON.parse(response.data) 
          : response.data;
      } catch (parseError) {
        console.error('❌ Failed to parse Report 134 data:', parseError);
        return [];
      }

      console.log(`✅ Report 134${sampleOnly ? ' sample' : ' full'}: ${parsedData.length} records loaded`);
      
      return parsedData;

    } catch (error) {
      console.error('❌ Error fetching Report 134:', error);
      throw error;
    }
  }

  // ============================================================================
  // DASHBOARD MASTER CJUD (Relatório 134) - INTERFACE DE COMPATIBILIDADE
  // ============================================================================

  async getDashboardMasterCJUD(
    category: number = 22,
    startDate?: string,
    endDate?: string
  ): Promise<DashboardMasterRecord[]> {
    console.log('🎯 Fetching Dashboard Master CJUD data...');
    
    const filters: Record<string, any> = {
      FILTER_CATEGORY: category,
    };

    // Adicionar filtros de data se fornecidos
    if (startDate) {
      filters.FILTER_START_DATE = Math.floor(new Date(startDate).getTime() / 1000);
    }
    if (endDate) {
      filters.FILTER_END_DATE = Math.floor(new Date(endDate).getTime() / 1000);
    }

    try {
      const response = await this.runConfigurableReport(134, filters);
      
      if (!response.data) {
        console.warn('⚠️ No data returned from Dashboard Master CJUD');
        return [];
      }

      // Parse do JSON retornado
      let parsedData: any[];
      try {
        parsedData = typeof response.data === 'string' 
          ? JSON.parse(response.data) 
          : response.data;
      } catch (parseError) {
        console.error('❌ Failed to parse Dashboard Master data:', parseError);
        return [];
      }

      console.log(`✅ Dashboard Master CJUD: ${parsedData.length} records loaded`);
      
      // Transformar dados para o formato TypeScript
      return parsedData.map(record => ({
        ...record,
        // Garantir tipos corretos
        course_id: Number(record.course_id),
        user_id: Number(record.user_id),
        category_id: Number(record.category_id),
        progress_percentage: Number(record.progress_percentage) || 0,
        activities_completed: Number(record.activities_completed) || 0,
        total_activities: Number(record.total_activities) || 0,
        avg_max_grade: Number(record.avg_max_grade) || 0,
        total_quizzes: Number(record.total_quizzes) || 0,
        days_in_course: Number(record.days_in_course) || 0,
        is_completed: Number(record.is_completed) || 0,
        timecompleted: record.timecompleted ? Number(record.timecompleted) : null,
      })) as DashboardMasterRecord[];

    } catch (error) {
      console.error('❌ Error fetching Dashboard Master CJUD:', error);
      throw error;
    }
  }

  // ============================================================================
  // CONSULTAS OTIMIZADAS (IDs 200-203)
  // ============================================================================

  // CONSULTA 1: Sumários por Curso (ID 200)
  async getCourseSummaries(category: number = 22): Promise<any[]> {
    console.log('📈 Fetching Course Summaries...');
    
    const response = await this.runConfigurableReport(200, {
      FILTER_CATEGORY: category,
    });

    if (!response.data) return [];
    
    const data = typeof response.data === 'string' 
      ? JSON.parse(response.data) 
      : response.data;
      
    console.log(`✅ Course Summaries: ${data.length} courses loaded`);
    return data;
  }

  // CONSULTA 2: Conclusões por Período (ID 201)
  async getCompletionsByPeriod(
    category: number = 22,
    startDate?: string,
    endDate?: string
  ): Promise<any[]> {
    console.log('📅 Fetching Completions by Period...');
    
    const filters: Record<string, any> = {
      FILTER_CATEGORY: category,
    };

    if (startDate) {
      filters.FILTER_START_DATE = Math.floor(new Date(startDate).getTime() / 1000);
    }
    if (endDate) {
      filters.FILTER_END_DATE = Math.floor(new Date(endDate).getTime() / 1000);
    }

    const response = await this.runConfigurableReport(201, filters);
    
    if (!response.data) return [];
    
    const data = typeof response.data === 'string' 
      ? JSON.parse(response.data) 
      : response.data;
      
    console.log(`✅ Completions by Period: ${data.length} completions loaded`);
    return data;
  }

  // CONSULTA 3: Estudantes Ativos (ID 202)
  async getActiveStudents(category: number = 22): Promise<any[]> {
    console.log('👥 Fetching Active Students...');
    
    const response = await this.runConfigurableReport(202, {
      FILTER_CATEGORY: category,
    });

    if (!response.data) return [];
    
    const data = typeof response.data === 'string' 
      ? JSON.parse(response.data) 
      : response.data;
      
    console.log(`✅ Active Students: ${data.length} students loaded`);
    return data;
  }

  // CONSULTA 4: Análise de Atividades (ID 203)
  async getActivityAnalysis(category: number = 22): Promise<any[]> {
    console.log('🎯 Fetching Activity Analysis...');
    
    const response = await this.runConfigurableReport(203, {
      FILTER_CATEGORY: category,
    });

    if (!response.data) return [];
    
    const data = typeof response.data === 'string' 
      ? JSON.parse(response.data) 
      : response.data;
      
    console.log(`✅ Activity Analysis: ${data.length} activities loaded`);
    return data;
  }

  // ============================================================================
  // STANDARD MOODLE REST API (uso mínimo conforme estratégia)
  // ============================================================================

  async getCourses(categoryId?: number): Promise<Course[]> {
    const params = categoryId ? { categoryid: categoryId } : {};
    return this.makeRequest('core_course_get_courses', params, true, 120);
  }

  async getCategories(parentId: number = 0): Promise<any[]> {
    return this.makeRequest(
      'core_course_get_categories_by_parent',
      { parentid: parentId },
      true,
      120
    );
  }

  async getEnrolledUsers(courseId: number): Promise<User[]> {
    console.log(`👥 Fetching enrolled users for course ${courseId}...`);
    
    // Usar parâmetros corretos descobertos na sessão anterior
    const params = {
      courseid: courseId,
      // NÃO usar "options" - causa o problema de 0 estudantes
    };

    return this.makeRequest('core_enrol_get_enrolled_users', params, true, 30);
  }

  async getCourseCompletion(courseId: number, userId: number): Promise<any> {
    return this.makeRequest(
      'core_completion_get_course_completion_status',
      { courseid: courseId, userid: userId },
      true,
      15
    );
  }

  async getSiteInfo(): Promise<any> {
    return this.makeRequest('core_webservice_get_site_info', {}, true, 1440); // 24h cache
  }

  // Método para listar relatórios configuráveis disponíveis
  async getConfigurableReports(): Promise<any[]> {
    console.log('📋 Fetching available configurable reports...');
    try {
      return await this.makeRequest('block_configurable_reports_get_reports', {}, true, 60);
    } catch (error) {
      console.warn('⚠️ block_configurable_reports_get_reports not available, trying alternative...');
      try {
        return await this.makeRequest('local_configurable_reports_get_reports', {}, true, 60);
      } catch (altError) {
        console.error('❌ No configurable reports endpoints available');
        return [];
      }
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  async testConnection(): Promise<boolean> {
    try {
      const siteInfo = await this.getSiteInfo();
      console.log('✅ Moodle connection successful:', siteInfo.sitename);
      return true;
    } catch (error) {
      console.error('❌ Moodle connection failed:', error);
      return false;
    }
  }

  async testReport134(): Promise<{
    available: boolean;
    accessible: boolean;
    error?: string;
    sampleData?: any[];
    testReport80?: any;
  }> {
    console.log('🎯 Testando acesso aos relatórios...');
    
    try {
      // O bloco de teste com fetch nativo foi comentado para remover o erro
      // de "unreachable code" e focar no fluxo principal com axios.
      /*
      // PRIMEIRO: Teste de conectividade básica com fetch nativo
      console.log('🧪 Testing site info with native fetch...');
      const siteInfo = await this.testWithFetch('core_webservice_get_site_info');
      console.log('✅ Site info success:', siteInfo.sitename || 'Connected');
      
      // SEGUNDO: Teste do relatório 80 (pequeno) com fetch
      console.log('🧪 Testing Report 80 with native fetch...');
      const report80Data = await this.testWithFetch('block_configurable_reports_get_report_data', { reportid: 80, courseid: 1 });
      console.log('✅ Report 80 fetch success:', {
        dataType: typeof report80Data,
        hasData: !!report80Data,
      });
      
      // TERCEIRO: Se chegou aqui, tentar relatório 134
      console.log('🧪 Testing Report 134 with native fetch...');
      const report134Data = await this.testWithFetch('block_configurable_reports_get_report_data', { reportid: 134, courseid: 1 });
      console.log('✅ Report 134 fetch success!');
      
      return {
        available: true,
        accessible: true,
        sampleData: Array.isArray(report134Data) ? report134Data.slice(0, 3) : [report134Data],
        testReport80: { success: true, data: report80Data },
      };
      */
      
      // Teste de conectividade básica com axios
      console.log('🔍 Testing basic Moodle connectivity with axios...');
      const siteInfoAxios = await this.getSiteInfo();
      console.log('✅ Basic connectivity OK:', siteInfoAxios.sitename || 'Connected');
      
      // Teste com relatório pequeno ID 80 (apenas 7 registros)
      console.log('🧪 Testing Report 80 (small - 7 records) first...');
      let testReport80Result = null;
      try {
        const report80Response = await this.runConfigurableReport(80, { courseid: 1 });
        if (report80Response.data) {
          let report80Data = typeof report80Response.data === 'string' 
            ? JSON.parse(report80Response.data) 
            : report80Response.data;
          console.log(`✅ Report 80 SUCCESS: ${report80Data.length} records`);
          console.log('📊 Report 80 sample:', report80Data[0]);
          testReport80Result = {
            success: true,
            records: report80Data.length,
            sample: report80Data[0]
          };
        }
      } catch (report80Error: any) {
        console.warn('⚠️ Report 80 failed:', report80Error.message);
        testReport80Result = {
          success: false,
          error: report80Error.message
        };
      }
      
      // Teste do Relatório 134 com parâmetros mínimos como no Python
      console.log('🎯 Testing Report 134 with minimal parameters...');
      const response = await this.runConfigurableReport(134, { courseid: 1 });

      if (!response.data) {
        return {
          available: true,
          accessible: false,
          error: 'Relatório 134 encontrado mas não retornou dados',
          testReport80: testReport80Result,
        };
      }

      let parsedData: any[];
      try {
        parsedData = typeof response.data === 'string' 
          ? JSON.parse(response.data) 
          : response.data;
      } catch (parseError) {
        console.error('❌ Parse error:', parseError);
        return {
          available: true,
          accessible: false,
          error: 'Dados do Relatório 134 em formato inválido',
          testReport80: testReport80Result,
        };
      }

      console.log(`✅ Relatório 134 acessível via API REST: ${parsedData.length} registros`);
      console.log('📊 Sample data type:', typeof parsedData[0]);
      console.log('📊 Sample keys:', Object.keys(parsedData[0] || {}));
      
      return {
        available: true,
        accessible: true,
        sampleData: parsedData.slice(0, 3), // Primeiros 3 registros como amostra
        testReport80: testReport80Result,
      };

    } catch (error: any) {
      console.error('❌ Erro ao testar Relatório 134:', error);
      console.error('❌ Error details:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
      });
      
      return {
        available: false,
        accessible: false,
        error: error.message || 'Erro desconhecido',
      };
    }
  }

  async testConfigurableReports(): Promise<{
    available: boolean;
    reportCount: number;
    functionalEndpoints: string[];
  }> {
    const results = {
      available: false,
      reportCount: 0,
      functionalEndpoints: [] as string[],
    };

    try {
      // Testar endpoint principal
      const reports = await this.getConfigurableReports();
      results.available = true;
      results.reportCount = reports.length;
      results.functionalEndpoints.push('block_configurable_reports_get_reports');

      // Testar outros endpoints descobertos
      const testEndpoints = [
        'block_configurable_reports_run_report',
        'block_configurable_reports_get_data',
        'block_configurable_reports_view_report',
        'local_configurable_reports_get_reports',
        'local_configurable_reports_run_report',
      ];

      for (const endpoint of testEndpoints) {
        try {
          if (endpoint.includes('run_report')) {
            // Testar com relatório ID mínimo
            await this.makeRequest(endpoint as MoodleFunction, { reportid: 1 }, false);
          } else {
            await this.makeRequest(endpoint as MoodleFunction, {}, false);
          }
          results.functionalEndpoints.push(endpoint);
        } catch (error) {
          console.log(`⚠️ Endpoint ${endpoint} not functional`);
        }
      }

      console.log('✅ Configurable Reports test completed:', results);
      return results;

    } catch (error) {
      console.error('❌ Configurable Reports not available:', error);
      return results;
    }
  }

  // Teste simples com fetch nativo (bypass axios)
  async testWithFetch(wsfunction: string, params: Record<string, any> = {}): Promise<any> {
    console.log(`🧪 Testing ${wsfunction} with native fetch...`);
    
    const serverUrl = this.getRestServerUrl();
    const formParams = new URLSearchParams({
      wstoken: this.config.token,
      moodlewsrestformat: 'json',
      wsfunction,
      ...params,
    });
    
    console.log('📤 Fetch details:', {
      url: serverUrl,
      wsfunction,
      params,
      bodyLength: formParams.toString().length,
    });
    
    try {
      // Use GET to mirror the working example URL
      const response = await fetch(`${serverUrl}?${formParams.toString()}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        mode: 'cors',
        credentials: 'omit',
      });
      
      console.log('📥 Fetch response details:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        type: response.type,
        url: response.url,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('✅ Fetch success:', { 
        dataType: typeof data, 
        keys: Object.keys(data),
        hasException: !!data.exception,
        hasError: !!data.errorcode,
      });
      
      if (data.exception || data.errorcode) {
        throw new Error(`Moodle Error: ${data.message || data.exception}`);
      }
      
      return data;
      
    } catch (error: any) {
      console.error('❌ Fetch error:', {
        message: error.message,
        name: error.name,
        cause: error.cause,
      });
      throw error;
    }
  }

  // Helper para converter timestamp Unix para data brasileira
  formatDate(timestamp: number | null): string {
    if (!timestamp || timestamp === 0) return 'Nunca';
    
    return new Date(timestamp * 1000).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  // Helper para calcular status do estudante baseado na lógica CJUD
  calculateStudentStatus(
    isCompleted: boolean,
    isSuspended: boolean,
    lastAccess: number,
    enrollmentStatus: number,
    enrollmentEndDate?: number
  ): string {
    if (isCompleted) return 'CONCLUÍDO';
    if (isSuspended || enrollmentStatus === 1) return 'USUÁRIO_SUSPENSO';
    
    const now = Math.floor(Date.now() / 1000);
    
    // Se nunca acessou
    if (lastAccess === 0) return 'NUNCA_ACESSOU';
    
    // Verificar se a inscrição expirou
    if (enrollmentEndDate && enrollmentEndDate < now) {
      return 'REPROVADO_EVADIDO'; // Não concluiu e inscrição expirou
    }
    
    // Se não concluiu mas inscrição ainda ativa
    return 'CURSANDO';
  }
}

// Factory function para criar instância do cliente
export function createMoodleClient(config: MoodleConfig): MoodleClient {
  return new MoodleClient(config);
}

// Export default para facilitar importação
export default MoodleClient;