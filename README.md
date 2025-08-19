# 📊 Moodle Dashboard - Sistema de Gestão Educacional

Um dashboard moderno e completo para gestão de dados do Moodle com integração YouTube, desenvolvido em **Next.js 15**, **TypeScript** e **Tailwind CSS**.

## ✨ Funcionalidades

### 📚 **Gestão Moodle**
- ✅ Dashboard principal com estatísticas de cursos
- ✅ Visualização de acompanhamentos por status (CURSANDO/REPROVADO_EVADIDO)
- ✅ Grids responsivos com filtros avançados
- ✅ Sistema de cache inteligente para relatórios
- ✅ Exportação de dados para Excel
- ✅ Modais detalhados para cada curso

### 📺 **Integração YouTube**
- ✅ Widget compacto com estatísticas em tempo real
- ✅ Dados da YouTube Data API v3 (inscritos, visualizações)
- ✅ Layout retrátil/expansível
- ✅ Cache inteligente (5min refresh)
- ✅ Link direto para o canal

### 🎨 **Interface**
- ✅ Design responsivo e moderno
- ✅ Tema dark/light mode
- ✅ Componentes reutilizáveis
- ✅ Animações suaves
- ✅ Tipografia otimizada

## 🚀 Tecnologias

### **Core**
- **Next.js 15** - Framework React com App Router
- **TypeScript** - Tipagem estática
- **Tailwind CSS v4** - Estilização utilitária
- **React 19** - Interface reativa

### **Estado e Cache**
- **Zustand** - Gerenciamento de estado global
- **TanStack Query v5** - Cache e sincronização de dados
- **React Hook Form** - Formulários performáticos

### **Dados e APIs**
- **Axios** - Cliente HTTP
- **Moodle Web Services** - Integração com LMS
- **YouTube Data API v3** - Estatísticas do canal
- **ExcelJS** - Exportação de planilhas

### **UI/UX**
- **Lucide React** - Ícones modernos
- **Recharts** - Gráficos interativos
- **Zod** - Validação de schemas

## 📦 Instalação

### **Pré-requisitos**
- Node.js 18+ 
- npm/yarn/pnpm
- Conta Google (YouTube API)

### **1. Clone o Repositório**
```bash
git clone https://github.com/Pagani83/moodle-dashboard.git
cd moodle-dashboard
```

### **2. Instale Dependências**
```bash
npm install
# ou
yarn install
# ou
pnpm install
```

### **3. Configure Variáveis de Ambiente**
```bash
cp .env.example .env.local
```

Edite `.env.local`:
```env
# YouTube Data API
NEXT_PUBLIC_YOUTUBE_API_KEY=sua_api_key_aqui
NEXT_PUBLIC_YOUTUBE_CHANNEL_HANDLE=@cjudtjrs

# Configuração do servidor
PORT=3001

# Moodle (se aplicável)
MOODLE_BASE_URL=https://seu-moodle.com
MOODLE_TOKEN=seu_token_aqui
```

### **4. Execute o Projeto**
```bash
npm run dev
# ou
yarn dev
# ou
pnpm dev
```

Acesse: [http://localhost:3001](http://localhost:3001)

## 🔧 Configuração da YouTube API

### **1. Criar Projeto no Google Cloud**
1. Acesse [Google Cloud Console](https://console.cloud.google.com)
2. Crie um novo projeto
3. Ative a **YouTube Data API v3**

### **2. Criar Credenciais**
1. Vá em **APIs e Serviços > Credenciais**
2. Clique em **Criar Credenciais > Chave de API**
3. Copie a chave gerada

### **3. Configurar Restrições (Recomendado)**
- **Restrições de aplicativo**: Referenciadores HTTP
- **URLs autorizados**: Adicione seus domínios
- **Restrições de API**: Apenas YouTube Data API v3

## 📁 Estrutura do Projeto

```
moodle-dashboard/
├── src/
│   ├── app/                    # App Router (Next.js 15)
│   │   ├── api/               # API Routes
│   │   ├── globals.css        # Estilos globais
│   │   ├── layout.tsx         # Layout raiz
│   │   └── page.tsx           # Página inicial
│   ├── components/            # Componentes React
│   │   ├── dashboard/         # Componentes do dashboard
│   │   ├── youtube/           # Widget YouTube
│   │   ├── theme/             # Tema dark/light
│   │   └── ui/                # Componentes base
│   ├── hooks/                 # Custom Hooks
│   │   ├── use-moodle.ts     # Hooks do Moodle
│   │   ├── use-youtube.ts    # Hooks do YouTube
│   │   └── use-report-134.ts # Hook de relatórios
│   ├── lib/                   # Utilitários
│   │   ├── moodle-client.ts  # Cliente Moodle
│   │   ├── youtube-client.ts # Cliente YouTube
│   │   └── query-client.ts   # Config React Query
│   ├── providers/             # Context Providers
│   ├── store/                 # Zustand Stores
│   ├── styles/                # CSS customizado
│   └── types/                 # Definições TypeScript
├── public/                    # Assets estáticos
├── storage/                   # Arquivos de cache
└── backup/                    # Backups e configs
```

## 🎯 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev          # Servidor de desenvolvimento (porta 3001)

# Produção
npm run build        # Build para produção
npm run start        # Servidor de produção
npm run lint         # Verificar código
```

## 🌐 Deploy

### **Vercel (Recomendado)**
1. Conecte seu repositório GitHub ao Vercel
2. Configure as variáveis de ambiente
3. Deploy automático a cada push

### **Outras Plataformas**
- **Netlify**: Build command: `npm run build`, Publish: `.next`
- **Railway**: Detecção automática Next.js
- **DigitalOcean**: App Platform com Node.js

## 📊 Funcionalidades em Detalhes

### **Dashboard Moodle**
- Grid de acompanhamentos com filtros
- Modais detalhados por curso
- Sistema de status educacional
- Cache de relatórios para performance
- Exportação Excel automática

### **Widget YouTube**
- **Dados em tempo real** da API oficial
- **Layout compacto** (256px de largura)
- **Estados retrátil/expansível**
- **Cache inteligente** (5 minutos)
- **Link direto** para o canal

## 🔒 Segurança

### **APIs**
- Chaves de API em variáveis de ambiente
- Validação de dados com Zod
- Rate limiting natural do React Query

### **Dados**
- Cache local temporário
- Não armazena dados sensíveis
- HTTPS obrigatório em produção

## 🐛 Troubleshooting

### **Erro: API Key inválida**
```
Verifique se NEXT_PUBLIC_YOUTUBE_API_KEY está correta
Confirme se YouTube Data API v3 está ativada
```

### **Erro: Canal não encontrado**
```
Verifique NEXT_PUBLIC_YOUTUBE_CHANNEL_HANDLE
Use formato @nomecanal
```

### **Erro: CORS**
```
Configure referenciadores HTTP na Google Cloud Console
Adicione seu domínio às restrições
```

## 📈 Performance

- **Build Size**: ~2.5MB gzipped
- **First Load**: < 2s
- **Core Web Vitals**: Otimizado
- **Cache Strategy**: 5min stale, 10min garbage collection

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit as mudanças (`git commit -m 'feat: adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença **MIT**. Veja [LICENSE](LICENSE) para mais detalhes.

## 👨‍💻 Autor

**Desenvolvido com ❤️ para gestão educacional moderna**

- 🌐 **Demo**: [moodle-dashboard.vercel.app](https://moodle-dashboard.vercel.app)
- 📧 **GitHub**: [@Pagani83](https://github.com/Pagani83)
- 📺 **YouTube**: [@cjudtjrs](https://youtube.com/@cjudtjrs)

---

⭐ **Se este projeto foi útil, considere dar uma estrela no GitHub!**

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
