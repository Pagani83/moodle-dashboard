# Moodle Dashboard SDK

Uma coleção de componentes React reutilizáveis e utilitários para criação de dashboards educacionais modernos.

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
Layout principal do dashboard educacional.

```tsx
import { DashboardHomePage } from '@/components/dashboard/dashboard-home-page'

<DashboardHomePage />
```

**Funcionalidades:**
- ✅ Navegação por abas
- ✅ Grid responsivo
- ✅ Integração com estado global
- ✅ Layout adaptativo

### `<AcompanhamentosView />`
Grid de acompanhamentos educacionais.

```tsx
import { AcompanhamentosView } from '@/components/dashboard/acompanhamentos-view'

<AcompanhamentosView />
```

**Funcionalidades:**
- ✅ Filtros por status (CURSANDO/REPROVADO_EVADIDO)
- ✅ Paginação automática
- ✅ Busca em tempo real
- ✅ Exportação Excel

## 🔧 Hooks Customizados

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

---

**SDK desenvolvido para facilitar a criação de dashboards educacionais modernos e performáticos.**
