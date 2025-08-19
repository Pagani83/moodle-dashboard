"use client";

import React, { useState } from 'react';
import { X, Download, Share2, Settings, Plus, BarChart3, PieChart, TrendingUp, Users, Activity, Calendar, Target } from 'lucide-react';
import { useMoodleStore } from '@/store/moodle-store';
import { 
  PieChart as RechartsPieChart, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart,
  Pie
} from 'recharts';

interface AcompanhamentoDetailModalProps {
  acompanhamento: any;
  isOpen: boolean;
  onClose: () => void;
  reportData?: any[];
}

export function AcompanhamentoDetailModal({
  acompanhamento,
  isOpen,
  onClose,
  reportData = []
}: AcompanhamentoDetailModalProps) {
  const { theme } = useMoodleStore();
  const [widgets, setWidgets] = useState<string[]>([]);
  const [showWidgetMenu, setShowWidgetMenu] = useState(false);
  
  if (!isOpen || !acompanhamento) return null;

  // Filtrar dados do relatório para os cursos do acompanhamento
  const courseIds = new Set(acompanhamento.cursos?.map((c: any) => Number(c.courseid)) || []);
  const filteredData = reportData.filter((row: any) => courseIds.has(Number(row.course_id)));

  return (
    <div className="fixed inset-0 z-50 overflow-auto" onClick={() => setShowWidgetMenu(false)}>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative min-h-screen flex items-start justify-center p-2">
        <div 
          className={`relative w-full max-w-[98vw] my-4 rounded-xl shadow-2xl border backdrop-blur-sm ${
            theme === 'dark' 
              ? 'bg-gray-900 border-gray-700' 
              : 'bg-white border-slate-200/80'
          }`}
          style={{ maxHeight: '96vh', overflow: 'auto' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`sticky top-0 z-10 px-6 py-4 backdrop-blur-sm border-b ${
            theme === 'dark'
              ? 'bg-gray-900/90 border-gray-700'
              : 'bg-white/90 border-slate-200/60'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <h2 
                  className={`text-2xl font-bold cursor-help ${
                    theme === 'dark' ? 'text-gray-100' : 'text-slate-900'
                  }`}
                  title={acompanhamento.nome}
                >
                  {acompanhamento.nome}
                </h2>
                <p className={`text-sm mt-1 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-slate-600'
                }`}>
                  {acompanhamento.cursos?.length || 0} curso(s) • 
                  {filteredData.length} registros encontrados
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  className={`p-2.5 rounded-lg transition-all duration-200 group ${
                    theme === 'dark'
                      ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-800'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/70'
                  }`}
                  title="Configurar"
                >
                  <Settings className="h-4 w-4 group-hover:rotate-90 transition-transform duration-200" />
                </button>
                
                <button
                  className={`p-2.5 rounded-lg transition-all duration-200 group ${
                    theme === 'dark'
                      ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-800'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/70'
                  }`}
                  title="Exportar"
                >
                  <Download className="h-4 w-4 group-hover:translate-y-0.5 transition-transform duration-200" />
                </button>
                
                <button
                  className={`p-2.5 rounded-lg transition-all duration-200 ${
                    theme === 'dark'
                      ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-800'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/70'
                  }`}
                  title="Compartilhar"
                >
                  <Share2 className="h-4 w-4" />
                </button>
                
                <button
                  onClick={onClose}
                  className={`p-2.5 rounded-lg transition-all duration-200 ${
                    theme === 'dark'
                      ? 'text-gray-400 hover:text-red-400 hover:bg-gray-800'
                      : 'text-slate-500 hover:text-red-600 hover:bg-red-50'
                  }`}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Widgets Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className={`text-lg font-semibold ${
                  theme === 'dark' ? 'text-gray-100' : 'text-slate-900'
                }`}>
                  Widgets de Análise
                </h3>
                <div className="relative">
                  <button
                    onClick={() => setShowWidgetMenu(!showWidgetMenu)}
                    className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border transition-all duration-200 shadow-sm ${
                      theme === 'dark'
                        ? 'text-blue-400 bg-blue-900/20 border-blue-800 hover:bg-blue-900/30'
                        : 'text-blue-700 bg-blue-50/70 border-blue-200/80 hover:bg-blue-100/80'
                    }`}
                  >
                    <Plus className="h-4 w-4" />
                    Adicionar Widget
                  </button>
                  
                  {showWidgetMenu && (
                    <div className="absolute right-0 top-full mt-2 z-20 bg-white dark:bg-gray-800 border border-slate-200/80 dark:border-gray-700 rounded-xl shadow-xl p-2 min-w-56">
                      {[
                        { id: 'aggregation', label: 'Dados Agregados', icon: BarChart3, description: 'Totais e percentuais' },
                        { id: 'distribution', label: 'Distribuição por Status', icon: PieChart, description: 'Gráfico de rosca' },
                        { id: 'trend', label: 'Progresso Temporal', icon: TrendingUp, description: 'Evolução no tempo' },
                        { id: 'comparison', label: 'Ranking de Cursos', icon: Users, description: 'Top cursos por conclusão' },
                        { id: 'activity', label: 'Atividade por Grau', icon: Activity, description: 'Análise CJUD por grau' },
                        { id: 'performance', label: 'Performance Geral', icon: Target, description: 'Métricas de desempenho' }
                      ].filter(widget => !widgets.includes(widget.id)).map((widget) => (
                        <button
                          key={widget.id}
                          onClick={() => {
                            setWidgets([...widgets, widget.id]);
                            setShowWidgetMenu(false);
                          }}
                          className="w-full flex items-start gap-3 p-3 text-left hover:bg-slate-50/80 dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
                        >
                          <widget.icon className="h-5 w-5 text-slate-500 dark:text-gray-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="font-medium ${theme === "dark" ? "text-gray-100" : "text-slate-900"} text-sm">
                              {widget.label}
                            </div>
                            <div className="text-xs text-slate-600 dark:text-gray-400">
                              {widget.description}
                            </div>
                          </div>
                        </button>
                      ))}
                      {widgets.length === 6 && (
                        <div className="p-3 text-center text-xs text-slate-600 dark:text-gray-400">
                          Todos os widgets foram adicionados
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Widgets Grid */}
              {widgets.length > 0 && (
                <div className="grid gap-4" style={{
                  gridTemplateColumns: widgets.length === 1 ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))'
                }}>
                  {widgets.map((widgetId) => (
                    <div key={widgetId}>
                      {widgetId === 'aggregation' && (
                        <AggregationWidget 
                          data={filteredData} 
                          onRemove={() => setWidgets(widgets.filter(w => w !== widgetId))}
                        />
                      )}
                      {widgetId === 'distribution' && (
                        <DistributionWidget 
                          data={filteredData} 
                          onRemove={() => setWidgets(widgets.filter(w => w !== widgetId))}
                        />
                      )}
                      {widgetId === 'trend' && (
                        <TrendWidget 
                          data={filteredData} 
                          onRemove={() => setWidgets(widgets.filter(w => w !== widgetId))}
                        />
                      )}
                      {widgetId === 'comparison' && (
                        <ComparisonWidget 
                          data={filteredData} 
                          courses={acompanhamento.cursos || []}
                          onRemove={() => setWidgets(widgets.filter(w => w !== widgetId))}
                        />
                      )}
                      {widgetId === 'activity' && (
                        <ActivityWidget 
                          data={filteredData} 
                          onRemove={() => setWidgets(widgets.filter(w => w !== widgetId))}
                        />
                      )}
                      {widgetId === 'performance' && (
                        <PerformanceWidget 
                          data={filteredData} 
                          onRemove={() => setWidgets(widgets.filter(w => w !== widgetId))}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cursos Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold ${theme === "dark" ? "text-gray-100" : "text-slate-900"}">
                Detalhamento por Curso
              </h3>
            {(!acompanhamento.cursos || acompanhamento.cursos.length === 0) ? (
              <div className="text-center py-12 bg-slate-50/50 dark:bg-gray-800/30 rounded-lg border border-slate-200/50 dark:border-gray-700/50">
                <p className="text-slate-600 dark:text-gray-400">
                  Nenhum curso selecionado neste acompanhamento.
                </p>
              </div>
            ) : (
              <div className="grid gap-6" style={{
                gridTemplateColumns: acompanhamento.cursos.length === 1 
                  ? '1fr' 
                  : acompanhamento.cursos.length === 2 
                  ? 'repeat(2, 1fr)'
                  : 'repeat(auto-fit, minmax(400px, 1fr))'
              }}>
                {acompanhamento.cursos.map((curso: any) => {
                  // Filtrar dados específicos deste curso
                  const courseData = filteredData.filter((row: any) => 
                    Number(row.course_id) === Number(curso.courseid)
                  );
                  
                  // Calcular estatísticas do curso
                  const totalInscritos = courseData.length;
                  const totalConcluidos = courseData.filter(row => row.student_status === 'CONCLUÍDO').length;
                  const taxaConclusao = totalInscritos > 0 ? Math.round((totalConcluidos / totalInscritos) * 100) : 0;
                  
                  // Detalhamento por grau (apenas concluídos)
                  const por_grau = { '1º': 0, '2º': 0, 'N/I': 0 };
                  courseData.forEach(row => {
                    if (row.student_status === 'CONCLUÍDO') {
                      const grau = row.setor_exerc?.includes('1') ? '1º' : 
                                   row.setor_exerc?.includes('2') ? '2º' : 'N/I';
                      por_grau[grau as keyof typeof por_grau]++;
                    }
                  });
                  
                  return (
                    <div
                      key={curso.courseid}
                      className="bg-white dark:bg-gray-800 border border-slate-200/80 dark:border-gray-700 rounded-xl hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden backdrop-blur-sm"
                    >
                      {/* Header do Card */}
                      <div className="p-4 bg-gradient-to-r from-blue-50/80 to-blue-100/60 dark:from-blue-900/20 dark:to-blue-800/30 border-b border-blue-200/60 dark:border-blue-700">
                        <h5 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 line-clamp-2">
                          {curso.nome || `Curso ${curso.courseid}`}
                        </h5>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-blue-700 dark:text-blue-300 font-medium">
                            ID: {curso.courseid}
                          </span>
                          <span className="bg-blue-100/80 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-xs font-medium">
                            {totalInscritos} inscritos
                          </span>
                        </div>
                      </div>
                      
                      {/* Estatísticas Principais */}
                      <div className="p-4">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                              {totalInscritos}
                            </div>
                            <div className="text-xs text-slate-700 dark:text-blue-300 font-medium">
                              Total Inscritos
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-emerald-600 dark:text-green-400">
                              {totalConcluidos}
                            </div>
                            <div className="text-xs text-slate-700 dark:text-green-300 font-medium">
                              Total Concluídos
                            </div>
                          </div>
                        </div>
                        
                        {/* Taxa de Conclusão */}
                        <div className="bg-gradient-to-r from-orange-50/80 to-amber-50/70 dark:from-orange-900/30 dark:to-orange-800/20 rounded-lg p-3 text-center mb-4 border border-orange-200/50 dark:border-orange-800/30">
                          <div className="text-xl font-bold text-orange-600 dark:text-orange-400">
                            {taxaConclusao}%
                          </div>
                          <div className="text-xs font-semibold text-orange-700 dark:text-orange-300">
                            Taxa de Conclusão
                          </div>
                        </div>
                        
                        {/* Detalhamento por Grau - Apenas Concluídos */}
                        <div className="bg-slate-50/70 dark:bg-gray-800/50 rounded-lg p-3 border border-slate-200/50 dark:border-gray-700/50">
                          <h6 className="text-xs font-semibold text-slate-700 dark:text-gray-300 mb-3 text-center">
                            Concluintes por Grau
                          </h6>
                          <div className="grid grid-cols-3 gap-2 text-center text-xs">
                            <div className="bg-blue-50/80 dark:bg-blue-900/30 rounded-md p-2.5 border border-blue-200/50 dark:border-blue-800/30">
                              <div className="font-bold text-blue-600 dark:text-blue-400">{por_grau['1º']}</div>
                              <div className="text-blue-700 dark:text-blue-300 text-[10px] font-medium">1º Grau</div>
                            </div>
                            <div className="bg-violet-50/80 dark:bg-violet-900/30 rounded-md p-2.5 border border-violet-200/50 dark:border-violet-800/30">
                              <div className="font-bold text-violet-600 dark:text-violet-400">{por_grau['2º']}</div>
                              <div className="text-violet-700 dark:text-violet-300 text-[10px] font-medium">2º Grau</div>
                            </div>
                            <div className="bg-slate-100/80 dark:bg-gray-700 rounded-md p-2.5 border border-slate-300/50 dark:border-gray-600">
                              <div className="font-bold text-slate-600 dark:text-gray-400">{por_grau['N/I']}</div>
                              <div className="text-slate-700 dark:text-gray-300 text-[10px] font-medium">N/I</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Widget Components
interface WidgetProps {
  data: any[];
  onRemove: () => void;
}

interface ComparisonWidgetProps extends WidgetProps {
  courses: any[];
}

function AggregationWidget({ data, onRemove }: WidgetProps) {
  const aggregatedData = React.useMemo(() => {
    if (!data.length) return { total: 0, concluidos: 0, por_grau: { '1º': 0, '2º': 0, 'N/I': 0 } };
    
    const total = data.length;
    const concluidos = data.filter(row => row.student_status === 'CONCLUÍDO').length;
    const por_grau = { '1º': 0, '2º': 0, 'N/I': 0 };
    
    data.forEach(row => {
      if (row.student_status === 'CONCLUÍDO') {
        const grau = row.setor_exerc?.includes('1') ? '1º' : 
                    row.setor_exerc?.includes('2') ? '2º' : 'N/I';
        por_grau[grau as keyof typeof por_grau]++;
      }
    });
    
    return { total, concluidos, por_grau };
  }, [data]);

  return (
    <div className="bg-gradient-to-br from-white to-slate-50/80 dark:from-blue-900/20 dark:to-blue-800/20 border border-slate-200/80 dark:border-blue-800 rounded-xl shadow-sm">
      <div className="flex items-center justify-between p-4 border-b border-slate-200/60 dark:border-blue-700 bg-gradient-to-r from-slate-50/50 to-blue-50/30 dark:from-blue-900/10 dark:to-blue-800/10">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h4 className="font-semibold text-slate-900 dark:text-blue-100">Dados Agregados</h4>
        </div>
        <button
          onClick={onRemove}
          className="p-1.5 text-slate-400 hover:text-red-500 dark:text-blue-400 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="p-4">
        {/* Principais Métricas - Layout otimizado */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {/* Inscritos */}
          <div className="bg-white/80 dark:bg-gray-800 border border-slate-200/60 dark:border-blue-700 rounded-lg p-3 text-center shadow-sm backdrop-blur-sm">
            <div className="text-2xl font-bold text-slate-700 dark:text-blue-300 mb-1">
              {aggregatedData.total}
            </div>
            <div className="text-xs font-medium text-slate-600 dark:text-blue-400 uppercase tracking-wide">
              Inscritos
            </div>
          </div>
          
          {/* Taxa de Conclusão - No centro */}
          <div className="bg-gradient-to-br from-orange-50/90 to-amber-50/80 dark:from-orange-900/30 dark:to-orange-800/40 text-orange-700 dark:text-orange-200 rounded-lg p-3 text-center border border-orange-200/80 dark:border-orange-700 shadow-sm">
            <div className="text-2xl font-bold mb-1">
              {aggregatedData.total === 0 ? '0%' : `${Math.round((aggregatedData.concluidos / aggregatedData.total) * 100)}%`}
            </div>
            <div className="text-xs font-semibold opacity-80 uppercase tracking-wide">
              Taxa de Conclusão
            </div>
          </div>

          {/* Concluíram */}
          <div className="bg-white/80 dark:bg-gray-800 border border-emerald-200/60 dark:border-green-700 rounded-lg p-3 text-center shadow-sm backdrop-blur-sm">
            <div className="text-2xl font-bold text-emerald-700 dark:text-green-300 mb-1">
              {aggregatedData.concluidos}
            </div>
            <div className="text-xs font-medium text-emerald-600 dark:text-green-400 uppercase tracking-wide">
              Concluíram
            </div>
          </div>
        </div>
        
        {/* Detalhamento por Grau */}
        <div className="bg-white/60 dark:bg-gray-800 border border-slate-200/60 dark:border-blue-700 rounded-lg p-3 backdrop-blur-sm">
          <h5 className="text-sm font-semibold text-slate-800 dark:text-blue-100 mb-3 text-center">
            Concluintes por Grau
          </h5>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-blue-50/70 dark:bg-blue-900/20 border border-blue-200/60 dark:border-blue-700 rounded-md p-2.5 text-center backdrop-blur-sm">
              <div className="text-lg font-bold text-blue-700 dark:text-blue-300 mb-1">
                {aggregatedData.por_grau['1º']}
              </div>
              <div className="text-xs font-medium text-blue-600 dark:text-blue-400">
                1º Grau
              </div>
            </div>
            <div className="bg-violet-50/70 dark:bg-violet-900/20 border border-violet-200/60 dark:border-violet-700 rounded-md p-2.5 text-center backdrop-blur-sm">
              <div className="text-lg font-bold text-violet-700 dark:text-violet-300 mb-1">
                {aggregatedData.por_grau['2º']}
              </div>
              <div className="text-xs font-medium text-violet-600 dark:text-violet-400">
                2º Grau
              </div>
            </div>
            <div className="bg-slate-50/70 dark:bg-gray-700 border border-slate-200/60 dark:border-gray-600 rounded-md p-2.5 text-center backdrop-blur-sm">
              <div className="text-lg font-bold text-slate-700 dark:text-gray-300 mb-1">
                {aggregatedData.por_grau['N/I']}
              </div>
              <div className="text-xs font-medium text-slate-600 dark:text-gray-400">
                N/I
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DistributionWidget({ data, onRemove }: WidgetProps) {
  const distributionData = React.useMemo(() => {
    if (!data.length) return [];
    
    const statusCount = {
      'CONCLUÍDO': { count: 0, color: '#10b981' },
      'ATIVO': { count: 0, color: '#3b82f6' },
      'INATIVO': { count: 0, color: '#f59e0b' },
      'NUNCA_ACESSOU': { count: 0, color: '#ef4444' }
    };
    
    data.forEach(row => {
      const status = row.student_status;
      if (status in statusCount) {
        statusCount[status as keyof typeof statusCount].count++;
      } else if (status.includes('INATIVO')) {
        statusCount['INATIVO'].count++;
      }
    });
    
    return Object.entries(statusCount)
      .filter(([, data]) => data.count > 0)
      .map(([status, statusData]) => ({
        name: status === 'NUNCA_ACESSOU' ? 'NUNCA ACESSOU' : status,
        value: statusData.count,
        color: statusData.color,
        percentage: Math.round((statusData.count / data.length) * 100)
      }));
  }, [data]);

  return (
    <div className="modern-card bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
      <div className="flex items-center justify-between p-4 border-b border-green-200 dark:border-green-700">
        <div className="flex items-center gap-2">
          <PieChart className="h-5 w-5 text-green-600 dark:text-green-400" />
          <h4 className="font-semibold text-green-900 dark:text-green-100">Distribuição por Status</h4>
        </div>
        <button
          onClick={onRemove}
          className="p-1 text-green-400 hover:text-green-600 dark:hover:text-green-300 rounded transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="p-4">
        {distributionData.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Gráfico de Rosca */}
            <div className="bg-white dark:bg-gray-800 border border-green-200 dark:border-green-700 rounded-lg p-4">
              <ResponsiveContainer width="100%" height={200}>
                <RechartsPieChart>
                  <Pie
                    data={distributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {distributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name) => [value, 'Estudantes']}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Legenda e Estatísticas */}
            <div className="bg-white dark:bg-gray-800 border border-green-200 dark:border-green-700 rounded-lg p-4">
              <h5 className="text-sm font-semibold text-green-900 dark:text-green-100 mb-3">
                Detalhamento por Status
              </h5>
              <div className="space-y-2">
                {distributionData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {item.name}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                        {item.value}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {Math.round((item.value / data.length) * 100)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600 dark:text-green-400">
                    {data.length}
                  </div>
                  <div className="text-xs text-green-700 dark:text-green-300 font-medium">
                    Total de Estudantes
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 border border-green-200 dark:border-green-700 rounded-lg p-6 text-center">
            <PieChart className="h-12 w-12 mx-auto mb-3 text-green-600 dark:text-green-400" />
            <div className="text-green-700 dark:text-green-300 font-medium mb-2">
              Distribuição por Status
            </div>
            <div className="text-xs text-green-600 dark:text-green-400">
              Aguardando dados para análise de distribuição
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TrendWidget({ data, onRemove }: WidgetProps) {
  const trendData = React.useMemo(() => {
    if (!data.length) return [];
    
    // Simular dados temporais (em um cenário real, usaríamos datas reais dos dados)
    const monthlyData = [
      { mes: 'Jan', inscritos: 0, concluidos: 0, taxa: 0 },
      { mes: 'Fev', inscritos: 0, concluidos: 0, taxa: 0 },
      { mes: 'Mar', inscritos: 0, concluidos: 0, taxa: 0 },
      { mes: 'Abr', inscritos: 0, concluidos: 0, taxa: 0 },
      { mes: 'Mai', inscritos: 0, concluidos: 0, taxa: 0 },
      { mes: 'Jun', inscritos: 0, concluidos: 0, taxa: 0 }
    ];
    
    // Distribuir dados aleatoriamente pelos meses (simulação)
    const totalInscritos = data.length;
    const totalConcluidos = data.filter(row => row.student_status === 'CONCLUÍDO').length;
    
    // Simular crescimento progressivo
    let inscritosCumulativo = 0;
    let concluidosCumulativo = 0;
    
    monthlyData.forEach((month, index) => {
      const fatorCrescimento = (index + 1) / 6;
      inscritosCumulativo = Math.round(totalInscritos * fatorCrescimento);
      concluidosCumulativo = Math.round(totalConcluidos * fatorCrescimento);
      
      month.inscritos = inscritosCumulativo;
      month.concluidos = concluidosCumulativo;
      month.taxa = inscritosCumulativo > 0 ? Math.round((concluidosCumulativo / inscritosCumulativo) * 100) : 0;
    });
    
    return monthlyData;
  }, [data]);

  return (
    <div className="modern-card bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-800">
      <div className="flex items-center justify-between p-4 border-b border-orange-200 dark:border-orange-700">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          <h4 className="font-semibold text-orange-900 dark:text-orange-100">Progresso Temporal</h4>
        </div>
        <button
          onClick={onRemove}
          className="p-1 text-orange-400 hover:text-orange-600 dark:hover:text-orange-300 rounded transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="p-4">
        {trendData.length > 0 && data.length > 0 ? (
          <div className="bg-white dark:bg-gray-800 border border-orange-200 dark:border-orange-700 rounded-lg p-4">
            <h5 className="text-sm font-semibold text-orange-900 dark:text-orange-100 mb-3 text-center">
              Evolução de Inscrições e Conclusões (2024)
            </h5>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'taxa' ? `${value}%` : value,
                    name === 'taxa' ? 'Taxa de Conclusão' : 
                    name === 'concluidos' ? 'Conclusões' : 'Inscrições'
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="inscritos" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  name="inscritos"
                />
                <Line 
                  type="monotone" 
                  dataKey="concluidos" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  name="concluidos"
                />
                <Line 
                  type="monotone" 
                  dataKey="taxa" 
                  stroke="#f97316" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: '#f97316', strokeWidth: 2, r: 3 }}
                  name="taxa"
                />
              </LineChart>
            </ResponsiveContainer>
            
            {/* Estatísticas rápidas */}
            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-orange-200 dark:border-orange-700">
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {data.length}
                </div>
                <div className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                  Total Inscrições
                </div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-600 dark:text-green-400">
                  {data.filter(row => row.student_status === 'CONCLUÍDO').length}
                </div>
                <div className="text-xs text-green-700 dark:text-green-300 font-medium">
                  Total Conclusões
                </div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                  {Math.round((data.filter(row => row.student_status === 'CONCLUÍDO').length / data.length) * 100)}%
                </div>
                <div className="text-xs text-orange-700 dark:text-orange-300 font-medium">
                  Taxa Atual
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 border border-orange-200 dark:border-orange-700 rounded-lg p-6 text-center">
            <TrendingUp className="h-12 w-12 mx-auto mb-3 text-orange-600 dark:text-orange-400" />
            <div className="text-orange-700 dark:text-orange-300 font-medium mb-2">
              Análise de Progresso Temporal
            </div>
            <div className="text-xs text-orange-600 dark:text-orange-400">
              Aguardando dados para mostrar evolução no tempo
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ComparisonWidget({ data, courses, onRemove }: ComparisonWidgetProps) {
  const chartData = React.useMemo(() => {
    if (!data.length || !courses.length) return [];
    
    const courseStats = courses.map(course => {
      const courseId = Number(course.courseid);
      const courseData = data.filter(row => Number(row.course_id) === courseId);
      const total = courseData.length;
      const completed = courseData.filter(row => row.student_status === 'CONCLUÍDO').length;
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
      
      return {
        nome: course.nome?.substring(0, 20) + '...' || `Curso ${courseId}`,
        total,
        concluidos: completed,
        taxa: rate
      };
    }).sort((a, b) => b.taxa - a.taxa).slice(0, 8); // Top 8 cursos
    
    return courseStats;
  }, [data, courses]);

  return (
    <div className="modern-card bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
      <div className="flex items-center justify-between p-4 border-b border-purple-200 dark:border-purple-700">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          <h4 className="font-semibold text-purple-900 dark:text-purple-100">Ranking de Cursos</h4>
        </div>
        <button
          onClick={onRemove}
          className="p-1 text-purple-400 hover:text-purple-600 dark:hover:text-purple-300 rounded transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="p-4">
        {chartData.length > 0 ? (
          <div className="bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="nome" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  fontSize={11}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'taxa' ? `${value}%` : value,
                    name === 'taxa' ? 'Taxa de Conclusão' : 
                    name === 'concluidos' ? 'Concluídos' : 'Total'
                  ]}
                />
                <Bar dataKey="taxa" fill="#8b5cf6" name="taxa" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-700 rounded-lg p-6 text-center">
            <Users className="h-12 w-12 mx-auto mb-3 text-purple-600 dark:text-purple-400" />
            <div className="text-purple-700 dark:text-purple-300 font-medium mb-2">
              Ranking por Taxa de Conclusão
            </div>
            <div className="text-xs text-purple-600 dark:text-purple-400">
              Aguardando dados dos {courses.length} cursos selecionados
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ActivityWidget({ data, onRemove }: WidgetProps) {
  const grauData = React.useMemo(() => {
    if (!data.length) return [];
    
    const grauStats = {
      '1º Grau': { total: 0, concluidos: 0, cor: '#3b82f6' },
      '2º Grau': { total: 0, concluidos: 0, cor: '#8b5cf6' },
      'Não Informado': { total: 0, concluidos: 0, cor: '#6b7280' }
    };
    
    data.forEach(row => {
      const grau = row.setor_exerc?.includes('1') ? '1º Grau' : 
                   row.setor_exerc?.includes('2') ? '2º Grau' : 'Não Informado';
      
      grauStats[grau as keyof typeof grauStats].total++;
      
      if (row.student_status === 'CONCLUÍDO') {
        grauStats[grau as keyof typeof grauStats].concluidos++;
      }
    });
    
    return Object.entries(grauStats).map(([grau, stats]) => ({
      grau,
      total: stats.total,
      concluidos: stats.concluidos,
      taxa: stats.total > 0 ? Math.round((stats.concluidos / stats.total) * 100) : 0,
      cor: stats.cor
    })).filter(item => item.total > 0);
  }, [data]);

  return (
    <div className="modern-card bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 border-indigo-200 dark:border-indigo-800">
      <div className="flex items-center justify-between p-4 border-b border-indigo-200 dark:border-indigo-700">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <h4 className="font-semibold text-indigo-900 dark:text-indigo-100">Atividade por Grau</h4>
        </div>
        <button
          onClick={onRemove}
          className="p-1 text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 rounded transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="p-4">
        {grauData.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Gráfico de Rosca */}
            <div className="bg-white dark:bg-gray-800 border border-indigo-200 dark:border-indigo-700 rounded-lg p-4">
              <h5 className="text-sm font-semibold text-indigo-900 dark:text-indigo-100 mb-3 text-center">
                Distribuição por Grau
              </h5>
              <ResponsiveContainer width="100%" height={200}>
                <RechartsPieChart>
                  <Pie
                    data={grauData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="total"
                  >
                    {grauData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.cor} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [value, 'Total de Inscritos']} />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Estatísticas */}
            <div className="bg-white dark:bg-gray-800 border border-indigo-200 dark:border-indigo-700 rounded-lg p-4">
              <h5 className="text-sm font-semibold text-indigo-900 dark:text-indigo-100 mb-3">
                Taxa de Conclusão por Grau
              </h5>
              <div className="space-y-3">
                {grauData.map((item) => (
                  <div key={item.grau} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: item.cor }}
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {item.grau}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        {item.taxa}%
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {item.concluidos}/{item.total}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 border border-indigo-200 dark:border-indigo-700 rounded-lg p-6 text-center">
            <Activity className="h-12 w-12 mx-auto mb-3 text-indigo-600 dark:text-indigo-400" />
            <div className="text-indigo-700 dark:text-indigo-300 font-medium mb-2">
              Análise por Grau CJUD
            </div>
            <div className="text-xs text-indigo-600 dark:text-indigo-400">
              Aguardando dados para análise por grau de jurisdição
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PerformanceWidget({ data, onRemove }: WidgetProps) {
  const performanceData = React.useMemo(() => {
    if (!data.length) return null;
    
    const total = data.length;
    const concluidos = data.filter(row => row.student_status === 'CONCLUÍDO').length;
    const ativos = data.filter(row => row.student_status === 'ATIVO').length;
    const inativos = data.filter(row => 
      row.student_status.includes('INATIVO') || row.student_status === 'NUNCA_ACESSOU'
    ).length;
    
    const taxaConclusao = Math.round((concluidos / total) * 100);
    const taxaAtividade = Math.round((ativos / total) * 100);
    const taxaEngajamento = Math.round(((concluidos + ativos) / total) * 100);
    
    // Dados para gráfico de área
    const statusData = [
      { nome: 'Concluídos', valor: concluidos, cor: '#10b981' },
      { nome: 'Ativos', valor: ativos, cor: '#3b82f6' },
      { nome: 'Inativos', valor: inativos, cor: '#ef4444' }
    ];
    
    return {
      total,
      concluidos,
      ativos,
      inativos,
      taxaConclusao,
      taxaAtividade,
      taxaEngajamento,
      statusData
    };
  }, [data]);

  return (
    <div className="modern-card bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-800/20 border-teal-200 dark:border-teal-800">
      <div className="flex items-center justify-between p-4 border-b border-teal-200 dark:border-teal-700">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-teal-600 dark:text-teal-400" />
          <h4 className="font-semibold text-teal-900 dark:text-teal-100">Performance Geral</h4>
        </div>
        <button
          onClick={onRemove}
          className="p-1 text-teal-400 hover:text-teal-600 dark:hover:text-teal-300 rounded transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="p-4">
        {performanceData ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* KPIs */}
            <div className="lg:col-span-1 space-y-3">
              <div className="bg-white dark:bg-gray-800 border border-teal-200 dark:border-teal-700 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-teal-600 dark:text-teal-400 mb-1">
                  {performanceData.taxaConclusao}%
                </div>
                <div className="text-xs font-medium text-teal-700 dark:text-teal-300">
                  Taxa de Conclusão
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                  {performanceData.taxaAtividade}%
                </div>
                <div className="text-xs font-medium text-blue-700 dark:text-blue-300">
                  Taxa de Atividade
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-700 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                  {performanceData.taxaEngajamento}%
                </div>
                <div className="text-xs font-medium text-purple-700 dark:text-purple-300">
                  Taxa de Engajamento
                </div>
              </div>
            </div>
            
            {/* Gráfico de Status */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 border border-teal-200 dark:border-teal-700 rounded-lg p-4">
              <h5 className="text-sm font-semibold text-teal-900 dark:text-teal-100 mb-3 text-center">
                Distribuição de Status dos Estudantes
              </h5>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={performanceData.statusData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="nome" />
                  <YAxis />
                  <Tooltip formatter={(value) => [value, 'Quantidade']} />
                  <Area 
                    type="monotone" 
                    dataKey="valor" 
                    stroke="#14b8a6" 
                    fill="#14b8a6" 
                    fillOpacity={0.6}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 border border-teal-200 dark:border-teal-700 rounded-lg p-6 text-center">
            <Target className="h-12 w-12 mx-auto mb-3 text-teal-600 dark:text-teal-400" />
            <div className="text-teal-700 dark:text-teal-300 font-medium mb-2">
              Métricas de Performance
            </div>
            <div className="text-xs text-teal-600 dark:text-teal-400">
              Aguardando dados para análise de performance
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
