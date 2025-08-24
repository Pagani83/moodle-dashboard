Moodle Dashboard SDK — Versão Otimizada

Resumo
- Versão condensada do `SDK.md` que mantém todas as informações essenciais: componentes/exports, hooks principais, estratégias de cache e quota do YouTube, endpoints de auto-update e storage, exemplos de uso e práticas de segurança.
- Objetivo: leitura rápida para desenvolvedores e mantenedores.

Importação principal
```tsx
import {
  useCachedReport134,
  extractUniqueCoursesFromReport,
  StatusCard,
  DashboardContent,
  TestConnectionView,
  ConfigurationView,
  ConfigurationNeededView,
  Report134View,
  CreateAcompanhamentoModal
} from '@/components/dashboard'
```

Visão geral dos artefatos
- Hooks: `useCachedReport134`, `useAutoUpdate`, `useCourseExtraction` (extractUniqueCoursesFromReport).
- Components: `StatusCard`, views (`DashboardContent`, `Report134View`, etc.), modals (`CreateAcompanhamentoModal`).
- Clientes: `moodle-client.ts`, `youtube-client.ts`.
- Backend: `/api/auto-update`, `/api/cache/report-134`, rotas `auth`, `users`, `acompanhamentos`.

Contratos rápidos (inputs/outputs)
- `useCachedReport134()` → { data, isLoading, error } ; data: { meta, data[] }
- `/api/cache/report-134?latest=1` (GET) → { ok, hasFile, file, meta, data }
- `/api/cache/report-134?force_refresh=true` (POST) → { ok, refreshTriggered, message }
- `/api/auto-update?token=CRON_SECRET[&refresh_data=true]` (GET) → { message, timestamp, dataRefreshed }

Principais características e decisões de design
- Cache em camadas: React Query (short fresh window), fallback para arquivo Excel em `storage/report134/` e backup rotativo (últimos 7).
- YouTube quota preservation: cache agressivo (1–6h), single-call per session, quota monitor visual.
- Auto-update: Vercel Cron → `/api/auto-update` → opcional `force_refresh` que aciona POST em `/api/cache/report-134`.
- Storage: arquivos Excel com sheets `meta` e `data`; nomes com timestamp UTC e `temp_refresh` marker durante refresh.

Hooks principais (uso exemplar)
- useCachedReport134
```tsx
const { data, isLoading, error } = useCachedReport134()
// data?.data => array de registros do report
// data?.meta?.lastFetch => ISO timestamp
```
- useAutoUpdate (mutação)
```tsx
const autoUpdate = useAutoUpdate()
autoUpdate.mutate(true) // força refresh
```
- extractUniqueCoursesFromReport
```tsx
const unique = extractUniqueCoursesFromReport(reportData)
// retorna [{ courseid, nome, shortname, fullname }]
```

Componentes e props importantes
- StatusCard: { title, value, icon, isLoading, color }
- DashboardContent: { masterData, summaries, cacheStats, report134Cache }
- Report134View: { status, forceUpdate, report134Cache }

Endpoints e exemplos rápidos
- GET latest cache
  - GET `/api/cache/report-134?latest=1`
- Force refresh
  - POST `/api/cache/report-134?force_refresh=true` (protegido por token internamente)
- Auto-update (cron)
  - GET `/api/auto-update?token=${CRON_SECRET}`
  - Force via `/api/auto-update?token=${CRON_SECRET}&refresh_data=true`

Storage & Backup
- Local: `storage/report134/report134_YYYYMMDD_HHMMSS.xlsx` + `temp_refresh_*.txt` durante atualização.
- Política: manter últimos 7 arquivos, nome em UTC, sheets `meta` (metadados) e `data` (linhas do report).

Erro e retries
- Timeouts e falhas no fetch → fallback para arquivo mais recente.
- Retry com backoff exponencial para fetch do Moodle.
- Arquivo corrompido → usar backup anterior automaticamente.

Segurança (essenciais)
- Variáveis de ambiente críticas: `DATABASE_URL`, `NEXTAUTH_SECRET`, `CRON_SECRET`, `NEXT_PUBLIC_YOUTUBE_API_KEY`.
- Nunca comitar `.env.local`.
- Restringir chaves de API por referrer/domínio e usar secret managers em produção.

Quick start resumido
1. npm install
2. copy .env.example .env.local (ou Copy-Item no PowerShell)
3. preencher `NEXTAUTH_SECRET` e `CRON_SECRET` (use openssl rand -base64 32)
4. npx prisma migrate dev; npx prisma generate
5. npm run dev

Dicas de contribuição
- Rode lint e typecheck antes de PR: `npm run lint`, `npm run typecheck` (se configurados).
- Escreva testes pequenos para hooks (mock de `fetch`/Prisma) e para a lógica de `extractUniqueCoursesFromReport`.

Resumo de integração rápida (para revisores)
- Mantenha comportamento inalterado: todos os endpoints, hooks e contratos são os mesmos do `SDK.md` completo.
- Esta versão é uma leitura condensada para desenvolvedores; o `SDK.md` original continua sendo a referência detalhada.

Finais
- Arquivo criado para leitura rápida e onboarding. Se quiser, posso gerar uma versão markdown ainda mais curta (one-pager) ou extrair um `README` específico para contributors com comandos `npm run check` e exemplos de testes.
