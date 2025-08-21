# Configuração de Auto-Update para Vercel

## 🕔 Sistema de Atualização Automática às 5AM

### Variáveis de Ambiente Necessárias:

#### Para Vercel:
```bash
CRON_SECRET=your-secret-token-here
```

#### Para GitHub Actions:
```bash
# No GitHub Settings > Secrets and Variables > Actions
VERCEL_TOKEN=your-vercel-token
VERCEL_ORG_ID=your-org-id  
VERCEL_PROJECT_ID=your-project-id
```

## 📋 Como configurar:

### 1. **Vercel Cron Jobs** (Mais simples):
- ✅ Arquivo `vercel.json` já criado
- ✅ API route `/api/auto-update` já criada  
- 🔧 **Próximo passo**: Adicionar `CRON_SECRET` no Vercel Dashboard
- 🕔 **Horário**: 5:00 AM UTC diariamente

### 2. **GitHub Actions** (Mais controle):
- ✅ Workflow `.github/workflows/daily-update.yml` já criado
- 🔧 **Próximo passo**: Commit e push dos arquivos
- 🕔 **Horário**: 5:00 AM UTC diariamente
- 📝 **Faz**: Commit automático que triggera rebuild no Vercel

### 3. **Webhook Externo** (Manual):
```bash
# Chamada manual para testar:
curl -X GET https://seu-app.vercel.app/api/auto-update \
  -H "Authorization: Bearer your-secret-token"
```

## 🌍 Ajuste de Fuso Horário:

Para **5 AM Brasil (UTC-3)**:
```yaml
# No cron: '0 8 * * *'  (8 AM UTC = 5 AM Brasil)
```

Para **5 AM Portugal (UTC+0)**:
```yaml  
# No cron: '0 5 * * *'  (5 AM UTC = 5 AM Portugal)
```

## 🔒 Segurança:
- Token secret obrigatório para evitar abusos
- Logs de todas as execuções
- Rate limiting automático do Vercel
