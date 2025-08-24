# Continue Session - Moodle Dashboard

## Contexto do Projeto
- **Projeto:** Dashboard Moodle com Next.js 15, TypeScript, Prisma, NextAuth v5
- **Repositório:** `https://github.com/Pagani83/moodle-dashboard.git`
- **Working Directory:** `C:\Users\Mike\Projects\moodle_dash`
- **Branch:** main
- **Último commit:** `6174780` - "fix: remove emailVerified field references and use Tailwind CSS v4"

## Problema Principal Resolvido
✅ **Acompanhamentos não persistiam no banco** - Era salvo apenas no Zustand local storage
- Prisma schema refatorado para relação 1:N (Acompanhamento → AcompanhamentoCurso)  
- API `/api/acompanhamentos` corrigida para usar nova estrutura
- Frontend atualizado para usar API calls em vez de Zustand store
- Layout dos cards melhorado (spacing e grid)

## Problema Atual - Deploy Vercel FALHANDO
🚨 **Build local funciona perfeitamente** (`npm run build` ✅) mas **Vercel deployment falha**

**Erro:** `Cannot find module '../lightningcss.linux-x64-gnu.node'`
**Causa:** Tailwind CSS v4 tem incompatibilidade com ambiente Linux do Vercel

### URLs de Deploy
- **Produção funcionando (commit antigo):** `https://moodle-dashboard-pw6erbbh6-pagani83s-projects.vercel.app`
- **Últimos deploys:** Todos falhando com erro Tailwind CSS v4

## Estado Atual da Solução (EM PROGRESSO)
Estava fazendo downgrade Tailwind CSS v4 → v3 quando sessão ficou longa:

### ✅ Já Modificado:
1. **package.json:**
   - Removido: `"@tailwindcss/postcss": "^4"` e `"tailwindcss": "^4"`
   - Adicionado: `"autoprefixer": "^10.4.20"`, `"postcss": "^8.4.49"`, `"tailwindcss": "^3.4.16"`

2. **postcss.config.mjs:**
   ```js
   // DE (v4):
   plugins: ["@tailwindcss/postcss"]
   
   // PARA (v3):
   plugins: {
     tailwindcss: {},
     autoprefixer: {},
   }
   ```

### 🔄 Próximos Passos IMEDIATOS:
1. `rm -rf node_modules package-lock.json && npm install` (estava executando quando interrompido)
2. `npm run build` (testar se funciona)
3. `git add . && git commit -m "fix: downgrade to Tailwind CSS v3 for Vercel compatibility"`
4. `git push` (triggar novo deploy)
5. Verificar se deploy Vercel funciona

## Usuários Admin Configurados (Auto-criação)
Sistema cria automaticamente quando banco vazio:
- `admin@moodle.local` / `admin123` (ADMIN)
- `mmpagani@tjrs.jus.br` / `cjud@2233` (ADMIN) - **usuário do Maikon**
- `marciacampos@tjrs.jus.br` / `cjud@dicaf` (USER)

**Implementação:** `src/lib/auth.ts` - auto-criação no primeiro login + endpoint `/api/init-db`

## Correções Importantes Já Feitas
✅ **Campo emailVerified removido** de todos os arquivos:
- `prisma/seed.ts`
- `src/lib/auth.ts` 
- `src/app/api/init-db/route.ts`
- `src/app/api/create-admin/route.ts`

✅ **Schema Prisma atualizado** - sem campo emailVerified (projeto não usa verificação de email)

## Ferramentas Disponíveis
- Vercel CLI autenticado (`vercel --version` = 46.0.2)
- Git configurado
- Prisma Client gerado e funcionando
- Build local funcionando perfeitamente

## Objetivo Final
✅ Deploy Vercel funcionando com Tailwind CSS v3
✅ Usuários admin disponíveis para login em produção
✅ Sistema de acompanhamentos persistindo no banco de dados

## Status dos TODOs
- [x] Corrigir erro do Tailwind CSS v4 nos deploys  
- [x] Fazer commit e deploy das correções
- [ ] **Downgrade para Tailwind CSS v3 - v4 ainda tem problemas no Vercel** (EM PROGRESSO)

**IMPORTANTE:** Continuar de onde parou o downgrade do Tailwind CSS v4 para v3 para resolver o problema de deploy no Vercel.