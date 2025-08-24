Moodle Dashboard SDK — Versão Comprimida (completa)

Objetivo
- Versão condensada e prática do `SDK.md` que mantém detalhes técnicos, contratos, exemplos e boas práticas.
- Leitura rápida para desenvolvedores que precisam integrar/usar os hooks, componentes e endpoints.

Checklist de cobertura
- [x] Contratos dos endpoints e shape das respostas
- [x] Uso e exemplos dos hooks principais
- [x] Estratégia de cache e fallback para arquivos Excel
- [x] Estratégia de preservação de quota YouTube
- [x] Fluxo de auto-update (cron → endpoints)
- [x] Storage e política de backups
- [x] Segurança e boas práticas
- [x] Quick start e comandos úteis

Índice rápido
1. Importação e exports principais
2. Hooks (contratos e exemplos)
3. Endpoints (GET/POST exemplos + respostas)
4. Cache, retries e fallback
5. YouTube quota & cache policy
6. Auto-update flow
7. Storage & backups
8. Segurança e ambiente
9. Quick start (PowerShell / POSIX)
10. Testes, lint e contribuição

1. Importação e exports principais
```tsx
import {
  useCachedReport134,
  useAutoUpdate,
  extractUniqueCoursesFromReport,
  StatusCard,
  DashboardContent,
  Report134View,
  TestConnectionView,
  ConfigurationView,
  ConfigurationNeededView,
  CreateAcompanhamentoModal
} from '@/components/dashboard'
```
Esses são os pontos de entrada recomendados para usar os recursos do SDK.

2. Hooks — contratos e exemplos

2.1 useCachedReport134()
- Assinatura: () => { data?: ReportCache, isLoading: boolean, error?: any, refetch?: () => void }
- ReportCache shape mínimo:
  - meta: { lastFetch: string (ISO), fetchDuration: number, totalRows: number }
  - file?: { name: string, size: number, universalLastUpdate: string, cacheBuster: number }
  - data: Array<Record<string, any>>

Exemplo:
```tsx
const { data, isLoading, error } = useCachedReport134()
if (isLoading) return <Spinner />
const rows = data?.data ?? []
<p>Registros: {rows.length}</p>
```

2.2 useAutoUpdate()
- Assinatura (mutation): { mutate: (force?: boolean) => void, isLoading, error }
- Chama `/api/auto-update?token=CRON_SECRET[&refresh_data=true]`

Exemplo:
```tsx
const autoUpdate = useAutoUpdate()
<button onClick={() => autoUpdate.mutate(true)}>Force Update</button>
```

2.3 extractUniqueCoursesFromReport(reportData)
- Entrada: array de linhas do report
- Saída: [{ courseid, nome, shortname, fullname }]
- Remove duplicatas por `courseid` e ordena por `nome`.

3. Endpoints — resumo e contratos

3.1 GET /api/cache/report-134?latest=1
- Descrição: retorna o arquivo Excel mais recente convertido para JSON ou metadata.
- Resposta (compacta):
```json
{
  "ok": true,
  "hasFile": true,
  "file": {"name":"report134_20250823_125726.xlsx","size":45678,"universalLastUpdate":"2025-08-23T12:57:26.000Z","cacheBuster":1692792000000},
  "meta": {"lastFetch":"2025-08-23T12:57:20.000Z","fetchDuration":3456,"totalRows":1234},
  "data": [ /* linhas do report */ ]
}
```

3.2 POST /api/cache/report-134?force_refresh=true
- Descrição: força fetch de dados do Moodle, escreve novo Excel e atualiza o cache.
- Resposta (compacta):
```json
{ "ok": true, "refreshTriggered": true, "message": "Force refresh completed", "cacheBuster": 1692792480000 }
```

3.3 GET /api/auto-update?token=CRON_SECRET[&refresh_data=true]
- Descrição: endpoint acionado por cron (Vercel Cron ou similar).
- Behavior: sem refresh apenas loga; com refresh_data -> aciona POST `report-134?force_refresh=true`.
- Resposta exemplo:
```json
{ "message":"Auto-update triggered successfully","timestamp":"2025-08-23T12:00:00.000Z","dataRefreshed":true }
```

4. Cache, retries e fallback
- Camadas:
  1. React Query cache (configurada com staleTime curto para UI responsiva)
  2. Cache persistente localStorage para YouTube e dados onde aplicável
  3. Fallback para arquivo Excel em `storage/report134/` quando fetch do Moodle falha
- Retry: backoff exponencial (2-3 tentativas padrão) nas chamadas ao Moodle
- Garbage collection: arquivos temporários limpos periodicamente; mantém últimos 7 backups
- Recomendações: ajustar staleTime conforme necessidade de consistência x quota

5. YouTube — quota preservation strategy
- Objetivo: reduzir chamadas externas drasticamente (aprox. 400 → ~10 por dia)
- Técnicas aplicadas:
  - Cache agressivo (1–6 horas) com fallback persistente em localStorage
  - Single-call strategy: agrega dados necessários numa única request por sessão
  - Monitor visual de quota para equipe (sinaliza quando próximo do limite)
  - Evita chamadas periódicas em componentes; centraliza fetchs no client/daemon
- Boas práticas: restrinja chaves por domínio, use quotas restritas no GCP, e armazene métricas de uso

6. Auto-update flow (detalhado)
- Vercel Cron (configurado em `vercel.json`) dispara `/api/auto-update` diariamente
- Fluxo:
  1. Cron → GET /api/auto-update?token=CRON_SECRET
  2. Se `refresh_data=true`, server chama POST /api/cache/report-134?force_refresh=true
  3. API do backend busca dados do Moodle, escreve novo Excel em `storage/report134/` e atualiza meta
  4. Limpeza: remove backups antigos, mantém os últimos 7
  5. Cliente consulta via `useCachedReport134()` e obtém dados atualizados
- Observability: logs com timestamps e duração de fetch

7. Storage & backups
- Local path: `storage/report134/`
- Nome padrão: `report134_YYYYMMDD_HHMMSS.xlsx` (UTC)
- Arquivo temporário: `temp_refresh_YYYYMMDD_HHMMSS.txt` durante operação
- Sheets: `meta` (metadados) e `data` (linhas)
- Política: manter até 7 arquivos; remover os mais antigos automaticamente
- Corruption handling: se arquivo lido estiver corrompido, usa backup anterior

8. Segurança e ambiente
- Variáveis essenciais:
  - DATABASE_URL (dev: file:./dev.db | prod: postgresql://user:pass@host/db)
  - NEXTAUTH_URL (prod: https://seu-app.vercel.app)
  - NEXTAUTH_SECRET
  - CRON_SECRET
  - NEXT_PUBLIC_YOUTUBE_API_KEY (publica, mas restringir por referrer)
- Boas práticas:
  - Não comitar `.env.local`
  - ✅ Produção: PostgreSQL (Neon.tech, Supabase, ou similar)
  - ✅ Deploy: Vercel com auto-deploy via GitHub
  - Usar secret manager (Vercel/AWS/Azure) para segredos em produção
  - Rotacionar chaves e monitorar acesso
- Nota: tokens públicos (NEXT_PUBLIC_*) são visíveis no cliente — evite colocar segredos neles

9. Quick start (Local + Deploy)

**Desenvolvimento Local:**
```bash
git clone https://github.com/Pagani83/moodle-dashboard.git
cd moodle-dashboard
npm install
cp .env.example .env.local

# Configurar .env.local:
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL=http://localhost:3002
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Setup do banco:
npx prisma generate
npx prisma migrate dev
npm run seed

# Executar:
npm run dev
```

**Deploy em Produção:**
```bash
# 1. Criar PostgreSQL no Neon.tech
# 2. Configurar variáveis no Vercel:
DATABASE_URL=postgresql://user:pass@host.aws.neon.tech/db?sslmode=require
NEXTAUTH_URL=https://seu-app.vercel.app
NEXTAUTH_SECRET=sua_chave_forte

# 3. Deploy automático:
git push origin main

# 4. Usuários criados automaticamente:
# admin@moodle.local / admin123 (ADMIN)
# mmpagani@tjrs.jus.br / cjud@2233 (ADMIN)
# marciacampos@tjrs.jus.br / cjud@dicaf (USER)
```

**Troubleshooting Deploy:**
```bash
# Erro: Can't reach database server
# ✅ Verificar se DATABASE_URL termina com .aws.neon.tech
# ❌ Não pode estar truncada em .aw:5432

# Erro: Authentication failed
# ✅ NEXTAUTH_URL deve ser HTTPS em produção
# ✅ Aguardar 1-2min para variáveis terem efeito

# Testar deploy:
GET https://seu-app.vercel.app/api/debug/users
```

10. Testes, lint e contribuição
- Recomenda-se adicionar/usar scripts:
  - `npm run lint` (eslint)
  - `npm run typecheck` (tsc --noEmit)
  - `npm run test` (jest/vi)
- Testes recomendados:
  - unit: `extractUniqueCoursesFromReport` (happy path + empty + duplicates)
  - integration: `useCachedReport134` mockando fetch e filesystem
  - e2e: fluxo de auto-update simplificado
- PR checklist sugerido:
  - rodar lint e typecheck
  - adicionar/atualizar docs correspondentes
  - incluir testes para novo comportamento

Anexos úteis (mapeamento rápido para o `SDK.md` completo)
- Contratos e exemplos JSON completos → `SDK.md` seções "API Endpoints" e "GET Response" / "POST Response"
- Diagramas e mermaid → `SDK.md` seção "Fluxo de Auto-Update"
- Exemplos auxiliares de `useAutoUpdate` e `useCachedReport134` com uso do `react-query` → `SDK.md` hooks section

Notas finais
- Esta versão é uma implementação leitor‑amigável e técnica para consumo por devs e mantenedores.
- O `SDK.md` completo permanece como referência detalhada.
- Se quiser, adapto para gerar `docs/SDK_FOR_CONTRIBUTORS.md` com checklists de revisão e comandos automatizados.

Arquivo criado: `docs/SDK_COMPRESSED.md`
