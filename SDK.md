# Moodle Dashboard SDK

Uma coleção de componentes React reutilizáveis e utilitários para criação de dashboards educacionais modernos **com sistema de autenticação integrado** e **arquitetura modular avançada**.

## 🏗️ **Arquitetura Modular (NOVO)**

### **Componentes Dashboard Refatorados**

O dashboard foi completamente refatorado em uma arquitetura modular. Todos os componentes podem ser importados individualmente:

```tsx
import { 
  // Hooks customizados
  useCachedReport134,
  extractUniqueCoursesFromReport,
  
  // Componentes de Cards
  StatusCard,
  
  // Views principais
  DashboardContent,
  TestConnectionView,
  ConfigurationView,
  ConfigurationNeededView,
  Report134View,
  
  // Modais
  CreateAcompanhamentoModal
} from '@/components/dashboard'
```

### 🎯 **Hooks Customizados**

#### `useCachedReport134()`
Hook para gerenciar cache do Report 134 com fallback para arquivos.

```tsx
import { useCachedReport134 } from '@/components/dashboard/hooks/useCachedReport134'

function MyComponent() {
  const report134Cache = useCachedReport134()
  
  return (
    <div>
      <p>Registros: {report134Cache.data?.data?.length || 0}</p>
      <p>Última atualização: {report134Cache.data?.meta?.lastUpdate}</p>
    </div>
  )
}
```

**Funcionalidades:**
- ✅ Cache inteligente de 30 segundos
- ✅ Fallback para arquivos de storage
- ✅ Timestamps universais
- ✅ Retry automático com backoff exponencial
- ✅ Error handling robusto

#### `extractUniqueCoursesFromReport()`
Utilitário para extrair cursos únicos dos dados do Report 134.

```tsx
import { extractUniqueCoursesFromReport } from '@/components/dashboard/hooks/useCourseExtraction'

function CourseSelector({ reportData }) {
  const uniqueCourses = extractUniqueCoursesFromReport(reportData)
  
  return (
    <select>
      {uniqueCourses.map(course => (
        <option key={course.courseid} value={course.courseid}>
          {course.nome}
        </option>
      ))}
    </select>
  )
}
```

**Funcionalidades:**
- ✅ Remove duplicatas baseado no course_id
- ✅ Prioriza nomes reais dos cursos
- ✅ Ordenação alfabética automática
- ✅ Campos padronizados (nome, shortname, fullname)

### 🎴 **Componentes de Cards**

#### `<StatusCard />`
Card reutilizável para exibição de status e métricas.

```tsx
import { StatusCard } from '@/components/dashboard/cards/StatusCard'
import { Database } from 'lucide-react'

<StatusCard
  title="Total de Cursos"
  value={1234}
  icon={<Database className="h-5 w-5" />}
  isLoading={false}
  color="blue"
/>
```

**Props:**
- `title: string` - Título do card
- `value: string | number` - Valor a ser exibido
- `icon: React.ReactNode` - Ícone do card
- `isLoading: boolean` - Estado de carregamento
- `color?: 'blue' | 'green' | 'purple' | 'orange'` - Cor do tema

**Funcionalidades:**
- ✅ Skeleton loading automático
- ✅ 4 esquemas de cores predefinidos
- ✅ Responsivo e acessível
- ✅ Hover effects suaves

### 🖼️ **Views Principais**

#### `<DashboardContent />`
Conteúdo principal do dashboard com estados de loading.

```tsx
import { DashboardContent } from '@/components/dashboard/views/DashboardContent'

<DashboardContent
  masterData={masterDataQuery}
  summaries={summariesQuery}
  cacheStats={cacheStatsQuery}
  report134Cache={report134Cache}
/>
```

**Props:**
- `masterData: any` - Dados principais do dashboard
- `summaries: any` - Resumos de cursos
- `cacheStats: any` - Estatísticas de cache
- `report134Cache: any` - Cache do Report 134

#### `<TestConnectionView />`
Interface para testes de conectividade com o Moodle.

```tsx
import { TestConnectionView } from '@/components/dashboard/views/TestConnectionView'

<TestConnectionView
  testMutation={testConnectionMutation}
  client={moodleClient}
  runReportMutation={runReportMutation}
/>
```

#### `<ConfigurationView />`
Visualização da configuração atual do sistema.

```tsx
import { ConfigurationView } from '@/components/dashboard/views/ConfigurationView'

<ConfigurationView config={moodleConfig} />
```

#### `<ConfigurationNeededView />`
Tela de configuração inicial quando o sistema não está configurado.

```tsx
import { ConfigurationNeededView } from '@/components/dashboard/views/ConfigurationNeededView'

<ConfigurationNeededView />
```

#### `<Report134View />`
Interface completa para gerenciamento do Report 134.

```tsx
import { Report134View } from '@/components/dashboard/views/Report134View'

<Report134View
  status={report134Status}
  forceUpdate={forceUpdateMutation}
  report134Cache={report134Cache}
/>
```

### 🪟 **Modais Complexos**

#### `<CreateAcompanhamentoModal />`
Modal avançado para criação/edição de acompanhamentos com drag & drop.

```tsx
import { CreateAcompanhamentoModal } from '@/components/dashboard/modals/CreateAcompanhamentoModal'

<CreateAcompanhamentoModal
  onClose={() => setModalOpen(false)}
  onCreate={(dados) => handleCreate(dados)}
  availableCourses={coursesList}
  editingData={editingAcompanhamento} // opcional para edição
/>
```

**Props:**
- `onClose: () => void` - Callback para fechar modal
- `onCreate: (dados) => void` - Callback para criar/editar
- `availableCourses: any[]` - Lista de cursos disponíveis
- `editingData?: Acompanhamento` - Dados para edição (opcional)

**Funcionalidades:**
- ✅ Interface drag & drop intuitiva
- ✅ Busca em tempo real de cursos
- ✅ Reordenação visual de cursos selecionados
- ✅ Validação de formulários
- ✅ Feedback sonoro e visual
- ✅ Suporte a edição e criação
- ✅ Responsivo e acessível

### 📑 **Import Centralizado**

Todos os componentes podem ser importados de forma centralizada:

```tsx
import { 
  useCachedReport134,
  StatusCard,
  DashboardContent,
  CreateAcompanhamentoModal 
} from '@/components/dashboard'
```

Ou individualmente para tree shaking otimizado:

```tsx
import { StatusCard } from '@/components/dashboard/cards/StatusCard'
import { useCachedReport134 } from '@/components/dashboard/hooks/useCachedReport134'
```

## 🎯 Hooks Avançados

### `useCachedReport134()`
**Hook especializado** para cache inteligente do Report 134 com fallback strategies.

```tsx
import { useCachedReport134 } from '@/components/dashboard/hooks/useCachedReport134'

const { 
  data, 
  isLoading, 
  error, 
  refetch 
} = useCachedReport134()
```

**Funcionalidades:**
- ✅ **Cache inteligente**: 30 segundos stale time
- ✅ **Retry automático**: Exponential backoff
- ✅ **Fallback strategies**: Graceful degradation
- ✅ **Error recovery**: Automatic retry logic
- ✅ **Performance**: Optimistic updates

### `useCourseExtraction()`
**Hook para extração** de cursos únicos do Report 134.

```tsx
import { useCourseExtraction } from '@/components/dashboard/hooks/useCourseExtraction'

const { extractUniqueCoursesFromReport } = useCourseExtraction()

const courses = extractUniqueCoursesFromReport(reportData)
```

### `useReport134()`
Hook principal para dados do Report 134.

```tsx
import { useReport134 } from '@/hooks/use-report-134'

const { 
  data, 
  isLoading, 
  error, 
  refetch 
} = useReport134()
```

## 🔐 Sistema de Autenticação

### `<AuthProvider />`
Provider de contexto para gerenciar autenticação em toda a aplicação.

```tsx
import { AuthProvider } from '@/providers/auth-provider'

function App({ children }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  )
}
```

### `<UserMenu />`
Componente de menu do usuário com informações de sessão.

```tsx
import { UserMenu } from '@/components/auth/user-menu'

<UserMenu />
```

**Funcionalidades:**
- ✅ Exibe nome e role do usuário
- ✅ Indicador visual de permissões (ADMIN/USER)
- ✅ Botão de logout
- ✅ Avatar personalizado

### `<UserManagement />` 
Interface administrativa para gerenciamento de usuários.

```tsx
import { UserManagement } from '@/components/admin/user-management'

// Apenas para usuários ADMIN
{session?.user?.role === 'ADMIN' && <UserManagement />}
```

**Funcionalidades:**
- ✅ CRUD completo de usuários
- ✅ Controle de roles (ADMIN/USER)
- ✅ Ativar/desativar usuários
- ✅ Interface modal para criação/edição
- ✅ Validação de formulários

### Hook `useSession`
Hook para acessar dados da sessão atual.

```tsx
import { useSession } from 'next-auth/react'

function MyComponent() {
  const { data: session, status } = useSession()
  
  if (status === 'loading') return <p>Carregando...</p>
  if (status === 'unauthenticated') return <p>Não autenticado</p>
  
  return <p>Olá, {session?.user?.name}!</p>
}
```

## 📦 Componentes Principais

### `<YouTubeWidget />`
Widget compacto para exibição de métricas do YouTube.

```tsx
import { YouTubeWidget } from '@/components/youtube/youtube-widget'

<YouTubeWidget />
```

**Props:**
- Nenhuma prop necessária (configurado via env vars)

**Funcionalidades:**
- ✅ Dados em tempo real da YouTube API
- ✅ Layout compacto (256px width)
- ✅ Estado retrátil/expansível
- ✅ Cache inteligente (5min)
- ✅ Tema dark/light automático

### `<DashboardHomePage />`
**Layout principal do dashboard educacional** com **autenticação integrada** e **arquitetura modular**.

```tsx
import { DashboardHomePage } from '@/components/dashboard/dashboard-home-page'

<DashboardHomePage />
```

**Funcionalidades:**
- ✅ **Arquitetura refatorada**: De 1599 → 278 linhas
- ✅ **Componentes modulares**: Imports centralizados
- ✅ Navegação por abas com controle de acesso
- ✅ Menu de usuário integrado
- ✅ Timestamps universais
- ✅ Grid responsivo
- ✅ Integração com estado global
- ✅ Layout adaptativo
- ✅ Proteção baseada em roles
- ✅ **Performance otimizada**: Code splitting natural

**Componentes Internos:**
- `DashboardContent` - Conteúdo principal
- `Report134View` - Interface do Report 134
- `ConfigurationView` - Configurações
- `TestConnectionView` - Testes de conectividade
- `UserManagement` - Gerenciamento de usuários (Admin)
- `CreateAcompanhamentoModal` - Modal de criação avançado

### `<AcompanhamentosView />`
Grid de acompanhamentos educacionais com funcionalidades avançadas.

```tsx
import { AcompanhamentosView } from '@/components/dashboard/acompanhamentos-view'

<AcompanhamentosView />
```

**Funcionalidades:**
- ✅ Filtros por status (CURSANDO/REPROVADO_EVADIDO)
- ✅ Paginação automática
- ✅ Busca em tempo real
- ✅ Exportação Excel

## � Configuração de Autenticação

### Middleware de Proteção
O sistema inclui middleware automático para proteger rotas.

```typescript
// middleware.ts
import { withAuth } from "next-auth/middleware"

export default withAuth(
  function middleware(req) {
    // Lógica de proteção personalizada
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Verificações de autorização
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ]
}
```

### Configuração NextAuth.js
Arquivo de configuração principal da autenticação.

```typescript
// src/lib/auth.ts
import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        // Lógica de autenticação
        return user
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.role = user.role
      return token
    },
    async session({ session, token }) {
      session.user.role = token.role
      return session
    }
  }
})
```

### Variáveis de Ambiente Necessárias
```env
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=sua_chave_secreta_forte
```

## �🔧 Hooks Customizados

### `useYoutube()`
Hook para dados do YouTube com cache.

```tsx
import { useYoutube } from '@/hooks/use-youtube'

const { data, isLoading, error } = useYoutube()
```

**Retorna:**
```typescript
{
  data: {
    subscriberCount: number
    viewCount: number
    videoCount: number
    channelTitle: string
    customUrl: string
    thumbnails: YouTubeChannelThumbnails
  }
  isLoading: boolean
  error: Error | null
  refetch: () => void
}
```

### `useMoodle()`
Hook para dados do Moodle.

```tsx
import { useMoodle } from '@/hooks/use-moodle'

const { courses, users, isLoading } = useMoodle()
```

### `useReport134()`
Hook específico para relatório 134.

```tsx
import { useReport134 } from '@/hooks/use-report-134'

const { data, isLoading, exportToExcel } = useReport134()
```

## 🎨 Sistema de Tema

### `useThemeStore()`
Store Zustand para gerenciamento de tema.

```tsx
import { useThemeStore } from '@/store/moodle-store'

const { theme, toggleTheme } = useThemeStore()
```

### `<ThemeProvider />`
Provider para contexto de tema.

```tsx
import { ThemeProvider } from '@/providers/theme-provider'

<ThemeProvider>
  <App />
</ThemeProvider>
```

## 🛡️ Proteção de Rotas e Componentes

### Proteção por Role
Exemplo de como proteger componentes baseado no role do usuário:

```tsx
import { useSession } from 'next-auth/react'

function AdminOnlyComponent() {
  const { data: session } = useSession()
  
  if (session?.user?.role !== 'ADMIN') {
    return <div>Acesso negado</div>
  }
  
  return <div>Conteúdo administrativo</div>
}
```

### Wrapper de Autenticação
Componente para verificar autenticação:

```tsx
function ProtectedRoute({ children, requiredRole = null }) {
  const { data: session, status } = useSession()
  
  if (status === 'loading') return <Loading />
  if (status === 'unauthenticated') return <LoginForm />
  if (requiredRole && session?.user?.role !== requiredRole) {
    return <Unauthorized />
  }
  
  return children
}

// Uso
<ProtectedRoute requiredRole="ADMIN">
  <UserManagement />
</ProtectedRoute>
```

### Redirecionamento Automático
Middleware já configurado para:
- ✅ Redirecionar usuários não autenticados para `/auth/signin`
- ✅ Proteger todas as rotas exceto API auth e assets
- ✅ Preservar URL de destino após login

## 📊 Clientes de API

### `YouTubeClient`
Cliente para YouTube Data API v3.

```tsx
import { youtubeClient } from '@/lib/youtube-client'

// Buscar informações do canal
const channelInfo = await youtubeClient.getChannelInfo()

// Buscar estatísticas
const metrics = await youtubeClient.getChannelMetrics28Days()
```

### `MoodleClient`
Cliente para Moodle Web Services.

```tsx
import { moodleClient } from '@/lib/moodle-client'

// Buscar cursos
const courses = await moodleClient.getCourses()

// Buscar usuários
const users = await moodleClient.getUsers()
```

## 🎯 Utilitários

### `YouTubeUtils`
Utilitários para formatação de dados do YouTube.

```tsx
import { YouTubeUtils } from '@/hooks/use-youtube'

// Formatar números grandes
const formatted = YouTubeUtils.formatViews(123456) // "123K"

// Formatar tempo de assistência
const watchTime = YouTubeUtils.formatWatchTime(7200) // "2h"
```

### `QueryClient`
Configuração centralizada do React Query.

```tsx
import { queryClient } from '@/lib/query-client'

// Configurações:
// - gcTime: 10 minutos
// - staleTime: 5 minutos
// - retry: 3 tentativas
// - refetchOnWindowFocus: false
```

## 📝 Tipos TypeScript

### `YouTubeChannel`
```typescript
interface YouTubeChannel {
  id: string
  snippet: {
    title: string
    description: string
    customUrl: string
    thumbnails: YouTubeChannelThumbnails
  }
  statistics: {
    viewCount: string
    subscriberCount: string
    hiddenSubscriberCount: boolean
    videoCount: string
  }
}
```

### `MoodleCourse`
```typescript
interface MoodleCourse {
  id: number
  fullname: string
  shortname: string
  categoryid: number
  status: 'CURSANDO' | 'REPROVADO_EVADIDO'
  startdate: number
  enddate: number
}
```

## 🚀 Exemplo de Uso Completo

```tsx
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '@/providers/theme-provider'
import { DashboardHomePage } from '@/components/dashboard/dashboard-home-page'
import { YouTubeWidget } from '@/components/youtube/youtube-widget'

const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <div className="min-h-screen bg-background">
          <header className="border-b p-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold">Moodle Dashboard</h1>
              <YouTubeWidget />
            </div>
          </header>
          
          <main className="container mx-auto p-4">
            <DashboardHomePage />
          </main>
        </div>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
```

## 📦 Build como Biblioteca

Para usar como biblioteca externa:

```bash
# 1. Build dos componentes
npm run build

# 2. Configurar package.json
{
  "name": "@Pagani83/moodle-dashboard-sdk",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js"
    }
  }
}

# 3. Publicar
npm publish
```

## 🔒 Requisitos

- **React** 19+
- **TypeScript** 5+
- **Tailwind CSS** 4+
- **TanStack Query** 5+
- **Zustand** 4+

## 📈 Performance

- **Tree Shaking**: Componentes importados individualmente
- **Code Splitting**: Lazy loading automático
- **Cache Strategy**: React Query otimizado
- **Bundle Size**: ~50kb gzipped por componente

## 🤝 Contribuição SDK

Para contribuir com o SDK:

1. Fork o repositório
2. Crie componentes em `src/components/`
3. Adicione hooks em `src/hooks/`
4. Documente no SDK.md
5. Teste com exemplos
6. Submeta Pull Request

## 📝 Changelog

### v2.0.0 - Sistema de Autenticação
- ✅ **NextAuth.js v5** - Sistema completo de autenticação
- ✅ **Role-based Access** - Controle ADMIN/USER
- ✅ **UserManagement** - Interface administrativa
- ✅ **Middleware Protection** - Proteção automática de rotas
- ✅ **JWT Sessions** - Sessões persistentes
- ✅ **UserMenu Component** - Menu com informações do usuário

### v1.5.0 - Timestamps Universais
- ✅ **Universal Timestamps** - Exibição consistente em qualquer timezone
- ✅ **Auto-refresh** - Atualização automática a cada 30 segundos
- ✅ **Real-time Updates** - Sincronização em tempo real

### v1.0.0 - Versão Inicial
- ✅ **Dashboard Base** - Layout principal
- ✅ **YouTube Integration** - Widget de métricas
- ✅ **Moodle Client** - Integração com LMS
- ✅ **Report System** - Sistema de relatórios

---

**SDK desenvolvido para facilitar a criação de dashboards educacionais modernos e performáticos.**
