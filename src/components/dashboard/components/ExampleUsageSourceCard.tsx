import React from 'react';
import { ModernSourceCard } from './ModernSourceCard';
import { 
  Users, 
  BookOpen, 
  Award, 
  Calendar,
  FileText,
  BarChart3,
  PieChart,
  Target,
  Clock,
  CheckSquare
} from 'lucide-react';

/**
 * Exemplos de uso do ModernSourceCard para diferentes tipos de fontes de dados
 * 
 * Este arquivo serve como documentação e pode ser usado como referência
 * para implementar novos cards de fontes de dados no futuro.
 */

// EXEMPLO 1: Relatório de Usuários
export function UserReportCard() {
  return (
    <ModernSourceCard
      title="Usuários do Sistema"
      subtitle="Relatório de cadastros e atividade"
      isLoading={false}
      isSuccess={true}
      isError={false}
      totalRecords={1250}
      dataSegments={[
        {
          label: 'Ativos',
          count: 980,
          color: 'green',
          icon: Users,
        },
        {
          label: 'Inativos',
          count: 270,
          color: 'red',
          icon: Users,
        }
      ]}
      lastUpdate={new Date()}
      nextScheduledFetch={new Date(Date.now() + 24 * 60 * 60 * 1000)}
      showProgress={true}
      description="Dados dos usuários cadastrados e sua atividade no sistema"
    />
  );
}

// EXEMPLO 2: Relatório de Cursos
export function CourseReportCard() {
  return (
    <ModernSourceCard
      title="Relatório de Cursos"
      subtitle="Status e progresso dos cursos"
      isLoading={false}
      isSuccess={true}
      isError={false}
      totalRecords={45}
      dataSegments={[
        {
          label: 'Ativos',
          count: 38,
          color: 'blue',
          icon: BookOpen,
        },
        {
          label: 'Concluídos',
          count: 7,
          color: 'green',
          icon: Award,
        }
      ]}
      lastUpdate={new Date()}
      customIcon={BookOpen}
      showProgress={true}
      description="Relatório completo sobre o status dos cursos disponíveis"
    />
  );
}

// EXEMPLO 3: Dados de Performance
export function PerformanceReportCard() {
  return (
    <ModernSourceCard
      title="Métricas de Performance"
      subtitle="Dados de desempenho do sistema"
      isLoading={true}
      isSuccess={false}
      isError={false}
      totalRecords={0}
      dataSegments={[]}
      showProgress={true}
      customIcon={BarChart3}
      description="Métricas em tempo real do desempenho do sistema"
    />
  );
}

// EXEMPLO 4: Relatório com Múltiplos Segmentos
export function DetailedReportCard() {
  return (
    <ModernSourceCard
      title="Relatório Detalhado"
      subtitle="Análise completa com múltiplas categorias"
      isLoading={false}
      isSuccess={true}
      isError={false}
      totalRecords={3450}
      dataSegments={[
        {
          label: 'Pendentes',
          count: 1200,
          color: 'yellow',
          icon: Clock,
        },
        {
          label: 'Aprovados',
          count: 1890,
          color: 'green',
          icon: CheckSquare,
        },
        {
          label: 'Rejeitados',
          count: 360,
          color: 'red',
          icon: Target,
        }
      ]}
      lastUpdate={new Date()}
      nextScheduledFetch={new Date(Date.now() + 6 * 60 * 60 * 1000)} // 6 horas
      showProgress={true}
      description="Análise detalhada com categorização completa dos dados"
    />
  );
}

// EXEMPLO 5: Fonte de Dados Externa
export function ExternalApiCard() {
  return (
    <ModernSourceCard
      title="API Externa"
      subtitle="Sincronização com sistema terceiro"
      isLoading={false}
      isSuccess={false}
      isError={true}
      errorMessage="Falha na conexão com a API externa"
      totalRecords={0}
      dataSegments={[]}
      showProgress={true}
      customIcon={FileText}
      description="Integração com sistema externo para importação de dados"
      onRetry={() => console.log('Tentando reconectar...')}
    />
  );
}

// EXEMPLO 6: Fonte de Dados Simples (sem segmentos)
export function SimpleReportCard() {
  return (
    <ModernSourceCard
      title="Relatório Simples"
      isLoading={false}
      isSuccess={true}
      isError={false}
      totalRecords={892}
      lastUpdate={new Date()}
      showProgress={false} // Sem barra de progresso
      customIcon={PieChart}
      description="Fonte de dados simples sem segmentação"
    />
  );
}

/**
 * GUIA DE CORES DISPONÍVEIS:
 * 
 * - 'blue': Azul (dados principais, relatórios padrão)
 * - 'green': Verde (sucessos, aprovações, ativos)
 * - 'red': Vermelho (erros, rejeitados, inativos)
 * - 'yellow': Amarelo (pendentes, alertas, aguardando)
 * - 'purple': Roxo (análises especiais, dados premium)
 * - 'orange': Laranja (dados importantes, destaques)
 * - 'indigo': Índigo (dados técnicos, sistema)
 * - 'pink': Rosa (categorias especiais, personalizações)
 * 
 * ÍCONES RECOMENDADOS:
 * 
 * - Users: usuários, pessoas
 * - BookOpen: cursos, educação
 * - Award: certificações, conquistas
 * - BarChart3, PieChart: dados estatísticos
 * - FileText: documentos, relatórios
 * - Target: objetivos, metas
 * - CheckSquare: tarefas concluídas
 * - Clock: tempo, agendamentos
 * - Activity: atividades, movimento
 * - TrendingUp: crescimento, performance
 * - Database: dados, armazenamento
 */