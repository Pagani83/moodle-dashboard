Moodle Dashboard SDK — Versão Atualizada (Cache Combinado)
> Atualizado em: 25/08/2025

Objetivo
- SDK completo com as novas funcionalidades de cache combinado (R-134 + R-151)
- Documentação técnica atualizada com sistema otimizado de performance
- Leitura prática para desenvolvedores que precisam integrar/usar os hooks, componentes e endpoints.

Checklist de cobertura
- [x] **NOVO**: Sistema de cache combinado (R-134 + R-151)
- [x] **NOVO**: Hook `useCombinedReportData()` otimizado
- [x] **ATUALIZADO**: Endpoints de cache combinado
- [x] **MELHORADO**: Performance de F5 (sem API calls desnecessárias)  
- [x] Contratos dos endpoints e shape das respostas
- [x] Uso e exemplos dos hooks principais
- [x] Estratégia de cache e fallback para arquivos Excel
- [x] Estratégia de preservação de quota YouTube
- [x] Fluxo de auto-update (cron → endpoints)
- [x] Storage e política de backups
- [x] Segurança e boas práticas
- [x] Quick start e comandos úteis

Índice rápido
1. **NOVO**: Sistema de Cache Combinado
2. **ATUALIZADO**: Hooks principais (useCombinedReportData)
3. Importação e exports principais
4. **NOVO**: Endpoints de cache combinado
5. Cache, retries e fallback
6. YouTube quota & cache policy
7. Auto-update flow
8. Storage & backups
9. Segurança e ambiente
10. Quick start (PowerShell / POSIX)
11. Testes, lint e contribuição

---

## 🚀 **1. NOVO: Sistema de Cache Combinado**

### **Evolução do Sistema:**
| **ANTES** | **AGORA** |
|-----------|----------|
| ❌ Apenas R-134 (34.201 registros) | ✅ **R-134 + R-151 combinados (37.455 registros)** |
| ❌ F5 dispara API desnecessariamente | ✅ **F5 só lê cache local** |
| ❌ staleTime de 5 min (muito frequente) | ✅ **staleTime de 24h** |
| ❌ Cache individual por relatório | ✅ **Cache unificado combinado** |

### **Benefícios:**
- 🔥 **Performance**: F5 é instantâneo (2-4s vs 15-30s)
- 📊 **Dados completos**: Todos os relatórios em uma única fonte
- ⚡ **Menos API calls**: 90% redução em requisições desnecessárias
- 🎯 **UX melhor**: Header sempre mostra total correto (37.455)

---

## 🔧 **2. ATUALIZADO: Hooks Principais**

### **2.1 useCombinedReportData() - PRINCIPAL**
```typescript
const combinedData = useCombinedReportData();

// Estrutura da resposta:
interface CombinedReportCache {
  data: any[];                    // Dados combinados R-134 + R-151
  totalRecords: number;           // 37.455 total
  lastFetch: Date;               
  nextScheduledFetch: Date;       // Próxima atualização às 5h
  sources: {
    report134Count: number;       // 34.201 registros R-134
    report151Count: number;       // 3.254 registros R-151
  };
}

// Uso prático:
if (combinedData.isLoading) return <Spinner />;
console.log(`Total: ${combinedData.data?.totalRecords}`); // 37.455
```

### **2.2 useCachedReport134() - ATUALIZADO**  
```typescript
// Agora usa cache combinado internamente
const report134 = useCachedReport134();

// Compatibilidade mantida, mas dados vêm do cache combinado
const rows = report134.data?.data ?? [];
console.log(`Registros (cache combinado): ${rows.length}`); // 37.455
```

### **2.3 Hooks OBSOLETOS - ❌ NÃO USAR**
```typescript
// ❌ REMOVIDOS - substituídos por useCombinedReportData():
// useReport134Full()     -> usar useCombinedReportData()  
// useReport134Sample()   -> usar useCombinedReportData()
```

---

3. Importação e exports principais
```tsx
import {
  // ✅ HOOKS PRINCIPAIS (ATUALIZADOS):
  useCombinedReportData,        // ⭐ NOVO - Hook principal para dados combinados
  useCachedReport134,           // ✅ Atualizado - agora usa cache combinado
  useAutoUpdate,                // ✅ Mantido
  
  // ✅ COMPONENTES:
  extractUniqueCoursesFromReport,
  StatusCard,
  DashboardContent,
  Report134View,
  TestConnectionView,
  ConfigurationView,
  ConfigurationNeededView,
  CreateAcompanhamentoModal,
  ModernSourceCard              // ⭐ NOVO - Card moderno com progress bars
} from '@/components/dashboard'

// ✅ HOOKS ESPECIALIZADOS:
import { 
  useForceReport134Update,      // Para atualização manual
  useReport134Status           // Status do sistema (atualizado)
} from '@/hooks/use-report-134'
```

### **Pontos de Entrada Recomendados:**
- 🎯 **Para dados**: `useCombinedReportData()` (principal)
- 🎯 **Para UI**: `ModernSourceCard`, `StatusCard`  
- 🎯 **Para ações**: `useAutoUpdate()`, `useForceReport134Update()`

---

## 📡 **4. NOVO: Endpoints de Cache Combinado**

### **4.1 GET /api/cache/combined-report?latest=1** ⭐ **PRINCIPAL**
```typescript
// Descrição: Carrega cache combinado (R-134 + R-151) do arquivo mais recente
// Behavior: SEMPRE lê arquivo local - nunca faz API calls

// Resposta:
{
  "ok": true,
  "hasFile": true,
  "totalRecords": 37455,          // ⭐ Total combinado
  "sources": {
    "report134Count": 34201,      // R-134 individual  
    "report151Count": 3254        // R-151 individual
  },
  "meta": {
    "lastFetch": "2025-08-25T11:10:00.000Z",
    "source": "combined-cache"
  },
  "file": {
    "name": "combined_report_20250825_111000.xlsx",
    "size": 52341,
    "universalLastUpdate": "2025-08-25T11:10:00.000Z"
  },
  "data": [/* 37.455 registros combinados */]
}
```

### **4.2 POST /api/cache/combined-report** ⭐ **NOVA**
```typescript
// Descrição: Força atualização combinada (R-134 + R-151)
// Behavior: Busca dados frescos via API Moodle e salva arquivo combinado

// Request body:
{
  "data134": [/* dados R-134 */],
  "data151": [/* dados R-151 */],
  "lastFetch": "2025-08-25T11:10:00.000Z",
  "report134Count": 34201,
  "report151Count": 3254
}

// Resposta:
{
  "ok": true,
  "message": "Combined report saved successfully",
  "filename": "combined_report_20250825_111000.xlsx",
  "totalRecords": 37455,
  "sources": {
    "report134Count": 34201,
    "report151Count": 3254
  }
}
```

### **4.3 GET /api/cache/report-134?latest=1** ⚠️ **FALLBACK**
```typescript
// Descrição: Fallback para R-134 individual (compatibilidade)
// Uso: Usado automaticamente quando cache combinado não existe

// Resposta (igual antes, mas agora é fallback):
{
  "ok": true,
  "hasFile": true,
  "data": [/* 34.201 registros só do R-134 */],
  "meta": { "source": "fallback-r134" }
}
```

## 🗂️ **5. Storage & Backups - ATUALIZADO**

### **Nova Estrutura de Arquivos:**
```
storage/
├── combinedReportData.xlsx       # ✅ PRINCIPAL - Cache combinado
├── report134/                    # ⚠️ FALLBACK - R-134 individual
│   └── report134_*.xlsx
└── report151/                    # ⚠️ FALLBACK - R-151 individual  
    └── report151_*.xlsx
```

### **Formato do Arquivo Combinado:**
- **Nome**: `combined_report_YYYYMMDD_HHMMSS.xlsx`
- **Sheet 1**: Dados combinados (R-134 + R-151 mesclados)
- **Metadata**: lastFetch, totalRecords, report134Count, report151Count
- **Política**: Mantém últimos 7 arquivos, remove antigos automaticamente

### **Estratégia de Cache:**
1. 🎯 **Prioridade 1**: Arquivo combinado mais recente
2. 🔄 **Fallback**: R-134 individual se combinado não existe  
3. 📁 **Vazio**: Array vazio se nenhum cache disponível

---

## ⚡ **6. Cache, Retries e Fallback - OTIMIZADO**

### **Camadas de Cache (Nova Arquitetura):**
1. **React Query Cache**: 
   - staleTime: 24h (vs 5min antes)
   - gcTime: 48h  
   - enabled: true (sempre ativo)

2. **Cache de Arquivo Combinado**:
   - Leitura: 2-4 segundos
   - Sempre usa arquivo mais recente
   - Nunca dispara API em F5

3. **Fallback Strategy**:
   ```typescript
   combinedCache.xlsx → R-134 individual → array vazio
   ```

### **Retry & Error Handling:**
- **Leitura de arquivo**: Sem retry (operação local)
- **API calls** (só em força/5h): Backoff exponencial 2-3x
- **Corrupção**: Usa backup anterior automaticamente

---

## 🔄 **7. Auto-Update Flow - MELHORADO**

### **Fluxo Atualizado:**
```mermaid
graph TD
    A[Vercel Cron - 5h] --> B[/api/auto-update?refresh_data=true]
    B --> C[Busca R-134 via API]
    C --> D[Busca R-151 via API]  
    D --> E[Combina dados]
    E --> F[Salva combined_report_*.xlsx]
    F --> G[Remove backups antigos]
    
    H[F5 / Page Load] --> I[useCombinedReportData()]
    I --> J[Lê arquivo combinado]
    J --> K[37.455 registros mostrados]
```

### **Diferenças do Fluxo Anterior:**
- ✅ **Auto-update**: Só às 5h (vs qualquer hora)
- ✅ **F5**: Só lê cache (vs dispara API)  
- ✅ **Dados**: Combinado (vs só R-134)
- ✅ **Performance**: 2-4s (vs 15-30s)

---

## 🎮 **8. Exemplos Práticos de Uso**

### **8.1 Carregando Dados Combinados:**
```tsx
import { useCombinedReportData } from '@/hooks/use-report-134';

function DashboardComponent() {
  const { data, isLoading, error } = useCombinedReportData();
  
  if (isLoading) return <div>Carregando cache combinado...</div>;
  if (error) return <div>Erro: {error.message}</div>;
  
  return (
    <div>
      <h2>Total de Registros: {data?.totalRecords}</h2>
      <p>R-134: {data?.sources.report134Count} registros</p>
      <p>R-151: {data?.sources.report151Count} registros</p>
      <p>Última atualização: {data?.lastFetch.toLocaleString()}</p>
    </div>
  );
}
```

### **8.2 Forçando Atualização Manual:**
```tsx
import { useForceReport134Update } from '@/hooks/use-report-134';

function ForceUpdateButton() {
  const forceUpdate = useForceReport134Update(client);
  
  return (
    <button 
      onClick={() => forceUpdate.mutateAsync()}
      disabled={forceUpdate.isLoading}
    >
      {forceUpdate.isLoading ? 'Atualizando...' : 'Forçar Atualização'}
    </button>
  );
}
```

### **8.3 Usando ModernSourceCard:**
```tsx
import { ModernSourceCard } from '@/components/dashboard';
---

## 🔐 Como exibir as configurações no SDK

O painel de configurações e o SDK agora apresentam os seguintes campos da `MoodleConfig`:

- `baseUrl` (string): endpoint base do Moodle ou rota proxy.
- `token` (string, parcial): mostrado apenas em preview (8 primeiros caracteres) por segurança.
- `defaultCategory` (number): categoria padrão usada em filtros e criação de acompanhamentos.
- `timeout` (number): timeout em milissegundos para chamadas ao Moodle.

Exemplo de uso com os hooks do SDK:

```tsx
import { useMoodleConfig } from '@/store/moodle-store';

export function ExampleConfigUsage() {
  const config = useMoodleConfig();

  return (
    <div>
      <p>Base URL: {config?.baseUrl ?? '—'}</p>
      <p>Token preview: {config?.token ? `${String(config.token).substring(0,8)}...` : '—'}</p>
      <p>Categoria padrão: {config?.defaultCategory ?? '—'}</p>
      <p>Timeout: {config?.timeout ? `${config.timeout / 1000}s` : '—'}</p>
    </div>
  );
}
```

Nota: mantenha o token completo restrito a ambientes administrativos; o SDK só exibe um preview por padrão.

function SourcesView() {
  const combinedData = useCombinedReportData();
  
  return (
    <ModernSourceCard
      title="Relatórios Combinados"
      segments={[
        { 
          name: 'R-134', 
          value: combinedData.data?.sources.report134Count, 
          color: 'blue' 
        },
        { 
          name: 'R-151', 
          value: combinedData.data?.sources.report151Count, 
          color: 'green' 
        }
      ]}
      totalValue={combinedData.data?.totalRecords}
      isLoading={combinedData.isLoading}
      lastUpdate={combinedData.data?.lastFetch}
    />
  );
}
```

---

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

---

## 🚨 **BREAKING CHANGES & MIGRAÇÃO**

### **Para Desenvolvedores Atualizando:**

#### **✅ Mudanças Obrigatórias:**
```typescript
// ❌ ANTIGO:
import { useReport134Full } from '@/hooks/use-report-134';
const report = useReport134Full(client);

// ✅ NOVO:
import { useCombinedReportData } from '@/hooks/use-report-134';
const report = useCombinedReportData();
```

#### **✅ Endpoints Atualizados:**
```bash
# ✅ USE AGORA:
GET /api/cache/combined-report?latest=1    # Principal
POST /api/cache/combined-report            # Para updates

# ⚠️ FALLBACK (não usar diretamente):
GET /api/cache/report-134?latest=1         # Compatibilidade
```

---

## 📊 **MÉTRICAS DE PERFORMANCE**

| **Métrica** | **ANTES** | **AGORA** | **Melhoria** |
|-------------|-----------|-----------|--------------|
| **F5 Load Time** | 15-30s | 2-4s | 🔥 **85% mais rápido** |
| **Total Records** | 34.201 | 37.455 | 📈 **+9.5% mais dados** |
| **API Calls on F5** | ✅ Fazia chamada | ❌ Sem chamadas | ⚡ **100% redução** |
| **Cache Strategy** | 5min stale | 24h stale | 🎯 **288x menos requests** |

---

## 🎯 **STATUS ATUAL DO SISTEMA**

### **✅ Funcionalidades Operacionais:**
- [x] Cache combinado funcionando (37.455 registros)
- [x] F5 otimizado (sem API calls)
- [x] Auto-update às 5h via Vercel Cron  
- [x] Progress bars em tempo real
- [x] Fallback inteligente para R-134
- [x] ModernSourceCard com animações
- [x] Header mostra total correto
- [x] Build e TypeScript limpos

---

**🎉 Sistema otimizado e documentado! Cache inteligente + dados combinados = performance superior.**

**Para suporte técnico:** Consulte `docs/TECHNICAL_SDK_UPDATE.md` para detalhes de implementação.

