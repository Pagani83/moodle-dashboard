# Deploy no Vercel - Guia Passo a Passo

## 🚀 Pré-requisitos

- [ ] Conta no GitHub
- [ ] Conta no Vercel
- [ ] YouTube API Key configurada
- [ ] Repositório com código atualizado

## 📋 Checklist Pré-Deploy

### ✅ Código
- [x] Build local funcionando (`npm run build`)
- [x] ESLint sem erros (`npm run lint`)
- [x] Variáveis de ambiente documentadas
- [x] README.md atualizado
- [x] SDK.md documentado

### ✅ Configuração
- [x] `.env.example` configurado
- [x] `package.json` com scripts corretos
- [x] `next.config.ts` otimizado
- [x] `vercel.json` (se necessário)

## 🔧 Configuração do Vercel

### **1. Conectar ao GitHub**

1. Acesse [vercel.com](https://vercel.com)
2. Faça login com GitHub
3. Clique em **"New Project"**
4. Selecione seu repositório `moodle-dashboard`
5. Clique em **"Import"**

### **2. Configurar Build Settings**

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "devCommand": "npm run dev"
}
```

### **3. Variáveis de Ambiente**

No painel do Vercel, adicione:

```bash
# YouTube Data API
NEXT_PUBLIC_YOUTUBE_API_KEY=sua_api_key_aqui
NEXT_PUBLIC_YOUTUBE_CHANNEL_HANDLE=@cjudtjrs

# Configuração (opcional)
PORT=3001
NODE_ENV=production
```

**⚠️ Importante:**
- Use apenas `NEXT_PUBLIC_` para variáveis client-side
- Variáveis secretas não devem ter prefixo `NEXT_PUBLIC_`

### **4. Domain Settings (Opcional)**

Se você tem um domínio personalizado:

1. Vá em **Project Settings > Domains**
2. Adicione seu domínio
3. Configure DNS conforme instruções

## 📦 Deploy Automático

### **GitHub Integration**

O Vercel detecta automaticamente:
- ✅ Pushes na branch `main`
- ✅ Pull Requests (preview deployments)
- ✅ Next.js framework
- ✅ Build configuration

### **Deploy Triggers**

```bash
# Deploy automático acontece quando:
git add .
git commit -m "feat: deploy ready"
git push origin main
```

## 🔍 Verificação Pós-Deploy

### **1. Build Logs**

Verifique os logs no dashboard Vercel:
- ✅ Install dependencies
- ✅ Next.js build
- ✅ Static files generation
- ✅ Function deployment

### **2. Teste Funcionalidades**

- [ ] Homepage carrega corretamente
- [ ] YouTube widget mostra dados reais
- [ ] Tema dark/light funciona
- [ ] Navegação entre abas
- [ ] Responsividade mobile

### **3. Performance**

- [ ] Lighthouse Score > 90
- [ ] First Load < 2s
- [ ] Core Web Vitals OK

## 🎯 URLs Importantes

```bash
# Production
https://moodle-dashboard.vercel.app

# Preview (PRs)
https://moodle-dashboard-git-<branch>-<user>.vercel.app

# Branch específica
https://moodle-dashboard-<hash>.vercel.app
```

## 🐛 Troubleshooting

### **Erro: Build Failed**

```bash
# Erro comum: Dependencies
npm ci
npm run build

# Verificar logs no Vercel dashboard
# Checar package.json dependencies
```

### **Erro: Environment Variables**

```bash
# Variáveis não carregadas
# Verificar prefix NEXT_PUBLIC_ para client-side
# Redeployar após mudanças em env vars
```

### **Erro: API Calls**

```bash
# CORS errors
# Configurar YouTube API restrictions
# Adicionar domínio Vercel nas restrictions
```

## 🔒 Segurança em Produção

### **API Keys**
- ✅ YouTube API Key com restrições de domínio
- ✅ Apenas origem vercel.app autorizada
- ✅ Rate limiting natural do React Query

### **Headers Security**
```typescript
// next.config.ts
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
        ],
      },
    ]
  },
}
```

## 📈 Monitoramento

### **Analytics**
- Vercel Analytics (built-in)
- Google Analytics (se necessário)
- Core Web Vitals monitoring

### **Logs**
- Function logs no dashboard
- Real-time debugging
- Error tracking

## 🚀 Deploy Checklist Final

- [ ] **GitHub**: Código commitado e pushed
- [ ] **Vercel**: Projeto importado
- [ ] **Build**: Configurações corretas
- [ ] **Env Vars**: YouTube API configurada
- [ ] **Domain**: Configurado (se aplicável)
- [ ] **Tests**: Funcionalidades verificadas
- [ ] **Performance**: Lighthouse > 90
- [ ] **Security**: API restrictions ativas
- [ ] **Monitor**: Analytics configurado

## 🎉 Pós-Deploy

### **Compartilhamento**
- ✅ URL: https://moodle-dashboard.vercel.app
- ✅ GitHub: Repository público/privado
- ✅ Demo: Screenshot/GIF para README
- ✅ Social: Compartilhar no LinkedIn/Twitter

### **Manutenção**
- 🔄 Updates automáticos via Git
- 📊 Monitorar performance
- 🛡️ Verificar security headers
- 📈 Acompanhar usage analytics

---

**Deploy completado! 🚀 Dashboard educacional no ar com YouTube integration.**
