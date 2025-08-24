Quick start — Moodle Dashboard

Este arquivo adiciona um "Quick Start" e uma checklist de segurança sem alterar nenhum arquivo existente.

1) Objetivo

- Fornecer passos rápidos para rodar o projeto localmente (incluindo PowerShell/Windows).
- Reforçar boas práticas de segurança (secrets, chaves, produção).

2) Quick start (Windows PowerShell)

Observação: execute estes comandos no diretório raiz do projeto (`moodle_dash`).

Instalar dependências:

```powershell
npm install
```

Criar o arquivo de ambiente a partir do exemplo:

```powershell
copy .env.example .env.local
# ou (PowerShell mais explícito)
# Copy-Item .env.example .env.local
```

Recomendações rápidas para `.env.local`:

- Defina `DATABASE_URL` (em dev o valor padrão é `file:./dev.db`).
- Gere uma `NEXTAUTH_SECRET` forte: use uma ferramenta externa (ex.: OpenSSL) e cole o valor no arquivo.
- Preencha `CRON_SECRET` e `NEXT_PUBLIC_YOUTUBE_API_KEY` conforme necessidade.

Exemplo de geração de secret (se você tiver OpenSSL instalado):

```powershell
# Gera uma chave base64 (PowerShell)
# Em alguns Windows pode ser necessário usar o OpenSSL do WSL ou Git Bash
openssl rand -base64 32
```

Rodar migrations e gerar cliente Prisma:

```powershell
npx prisma migrate dev
npx prisma generate
```

Rodar em modo de desenvolvimento (para PowerShell):

```powershell
# Export temporário de variável de ambiente em PowerShell
$env:NEXTAUTH_URL = "http://localhost:3001"; npm run dev
```

Acesse:

- App: http://localhost:3001
- Login: http://localhost:3001/auth/signin

3) Criar usuário admin (recomendado em dev)

- Use `seed-users.js` para popular o banco em dev ou o utilitário `create-admin-script.js` no console do navegador apontado para o app em execução.
- Não armazene credenciais reais em repositórios públicos.

4) Segurança — checklist mínima

- Nunca comite `.env.local` nem chaves em arquivos de texto no repositório.
- Gere `NEXTAUTH_SECRET` e `CRON_SECRET` com entropia alta (ex.: `openssl rand -base64 32`).
- Restrinja `NEXT_PUBLIC_YOUTUBE_API_KEY` por referer/domínio no Google Cloud Console.
- Em produção, prefira um banco gerenciado (Postgres/MySQL) em vez de SQLite local.
- Use um secret manager (Vercel Secrets, AWS Secrets Manager, Azure Key Vault) para armazenar chaves em produção.
- Rotacione chaves e segredos periodicamente.

5) Observabilidade e saúde

- Verifique o endpoint `/api/auto-update?token=CRON_SECRET` para confirmar que o cron pode ser acionado (se implementado).
- Tenha um pequeno health-check que retorne status do último auto-update, se necessário.

6) Próximos passos sugeridos

- Documentar um `Quick start` específico para contribuintes (com Node/NPM versions e linter/tests).
- Adicionar um script `npm run check` que rode lint + typecheck rápido antes de commits.

---

Arquivo criado automaticamente: docs/QUICK_START_AND_SECURITY.md
