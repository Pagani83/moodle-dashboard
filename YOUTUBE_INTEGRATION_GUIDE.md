# Como testar a integração YouTube no Dashboard

## 1. Configure as variáveis de ambiente

1. Copie o arquivo `.env.example` para `.env.local`:
```bash
cp .env.example .env.local
```

2. Obtenha sua API key do YouTube:
   - Acesse: https://console.cloud.google.com/
   - Crie um projeto ou selecione um existente
   - Ative a "YouTube Data API v3"
   - Crie uma chave de API
   - Configure restrições (opcional)

3. Edite o arquivo `.env.local` e adicione:
```env
NEXT_PUBLIC_YOUTUBE_API_KEY=sua_api_key_aqui
NEXT_PUBLIC_YOUTUBE_CHANNEL_HANDLE=@seucanal
```

## 2. Teste a integração

### Modo de desenvolvimento
```bash
npm run dev
```

### Como verificar se está funcionando:

1. **Abra o dashboard** (http://localhost:3000)

2. **Na aba "Dashboard"**, você deve ver:
   - Cards de estatísticas do Moodle (parte superior)
   - Dados do Moodle (seção do meio)
   - **Widget do YouTube (parte inferior)** ← NOVO!

3. **No widget do YouTube**, você deve ver:
   - Estatísticas do canal (inscritos, visualizações, vídeos)
   - Gráfico de crescimento (simulado)
   - Lista dos vídeos mais recentes
   - Modo claro/escuro seguindo o tema do dashboard

## 3. Resolução de problemas

### Se não aparecer o widget:
1. Verifique o console do navegador (F12)
2. Confirme se as variáveis de ambiente estão corretas
3. Teste a API key em: https://developers.google.com/youtube/v3/docs/channels/list

### Se aparecer erro de API:
1. Verifique se a YouTube Data API v3 está ativada
2. Confirme se o canal existe (tente acessar no YouTube)
3. Verifique se não excedeu a quota diária (10.000 unidades/dia)

### Se aparecer erro de CORS:
- A API do YouTube não deve dar erro de CORS pois é chamada server-side

## 4. Personalização

Para personalizar o widget, edite:
- `src/components/youtube/youtube-widget.tsx` - Layout e design
- `src/lib/youtube-client.ts` - Lógica da API
- `src/hooks/use-youtube.ts` - Gerenciamento de dados

## 5. Dados mostrados

### Estatísticas:
- Número de inscritos
- Total de visualizações  
- Número de vídeos
- Data de criação do canal

### Gráfico de crescimento:
- Simulação baseada nos dados atuais
- Crescimento dos últimos 30 dias
- Projeção futura (demo)

### Vídeos recentes:
- Últimos 5 vídeos publicados
- Título, visualizações e data
- Miniatura do vídeo

## 6. Limitações da versão atual

1. **Dados de crescimento são simulados** - Para dados reais, seria necessário:
   - YouTube Analytics API (requer OAuth2)
   - Acesso de proprietário do canal

2. **Cache simples** - Os dados são atualizados a cada consulta:
   - Para produção, considere implementar cache no servidor
   - React Query já faz cache client-side (5 minutos)

3. **Quota da API** - 10.000 unidades/dia grátis:
   - ~100 consultas de vídeos por dia
   - Para uso intensivo, considere planos pagos

## 7. Próximos passos sugeridos

- [ ] Implementar autenticação OAuth2 para dados reais de analytics
- [ ] Adicionar cache no servidor (Redis/MemoryCache)
- [ ] Criar dashboard específico para YouTube com mais métricas
- [ ] Integrar com outras plataformas (Instagram, TikTok, etc.)
- [ ] Adicionar alertas para metas de crescimento

---

**Status**: ✅ Sistema completo e funcional
**Requer**: API key do YouTube e configuração de variáveis de ambiente
**Integração**: Funcionará junto com os dados do Moodle no mesmo dashboard
