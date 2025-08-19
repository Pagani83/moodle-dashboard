/**
 * Script de Teste da YouTube API
 * Testa diretamente a API para identificar problemas
 */

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

// Configuração do teste
const CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || 'AIzaSyDWubaPpBwhgRA5h62aFRHf3PZB56cMbf0',
  channelHandle: process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_HANDLE || '@cjudtjrs',
  channelId: process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_ID || ''
};

console.log('🔍 TESTE DA YOUTUBE API');
console.log('=' .repeat(50));
console.log('📊 Configuração:');
console.log(`   API Key: ${CONFIG.apiKey ? CONFIG.apiKey.substring(0, 20) + '...' : 'NÃO DEFINIDA'}`);
console.log(`   Channel Handle: ${CONFIG.channelHandle}`);
console.log(`   Channel ID: ${CONFIG.channelId || 'NÃO DEFINIDO'}`);
console.log();

/**
 * Teste 1: Informações básicas do canal
 */
async function testeCanal() {
  console.log('🎯 TESTE 1: Informações do Canal');
  console.log('-'.repeat(40));
  
  try {
    const channelParam = CONFIG.channelId 
      ? `id=${CONFIG.channelId}`
      : `forHandle=${CONFIG.channelHandle.replace('@', '')}`;
    
    const url = `${YOUTUBE_API_BASE}/channels?${channelParam}&part=snippet,statistics&key=${CONFIG.apiKey}`;
    
    console.log(`📡 URL: ${url}`);
    console.log('⏳ Fazendo requisição...');
    
    const startTime = Date.now();
    const response = await fetch(url);
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`⏱️  Tempo de resposta: ${duration}ms`);
    console.log(`🌐 Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ Erro: ${errorText}`);
      return null;
    }
    
    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      console.log('❌ Canal não encontrado');
      return null;
    }
    
    const channel = data.items[0];
    console.log('✅ Canal encontrado!');
    console.log(`   📛 Nome: ${channel.snippet.title}`);
    console.log(`   👥 Inscritos: ${Number(channel.statistics.subscriberCount).toLocaleString()}`);
    console.log(`   👁️  Visualizações: ${Number(channel.statistics.viewCount).toLocaleString()}`);
    console.log(`   🎬 Vídeos: ${Number(channel.statistics.videoCount).toLocaleString()}`);
    
    return channel;
  } catch (error) {
    console.log(`❌ Erro na requisição: ${error.message}`);
    return null;
  }
}

/**
 * Teste 2: Vídeos recentes
 */
async function testeVideos() {
  console.log('\n🎥 TESTE 2: Vídeos Recentes');
  console.log('-'.repeat(40));
  
  try {
    // Primeiro precisamos do ID do canal
    const channelParam = CONFIG.channelId 
      ? `id=${CONFIG.channelId}`
      : `forHandle=${CONFIG.channelHandle.replace('@', '')}`;
    
    const channelUrl = `${YOUTUBE_API_BASE}/channels?${channelParam}&part=id&key=${CONFIG.apiKey}`;
    const channelResponse = await fetch(channelUrl);
    
    if (!channelResponse.ok) {
      console.log(`❌ Erro ao buscar canal: ${channelResponse.status}`);
      return;
    }
    
    const channelData = await channelResponse.json();
    if (!channelData.items?.[0]) {
      console.log('❌ Canal não encontrado');
      return;
    }
    
    const channelId = channelData.items[0].id;
    
    // Buscar vídeos
    const videosUrl = `${YOUTUBE_API_BASE}/search?channelId=${channelId}&part=snippet&order=date&maxResults=5&type=video&key=${CONFIG.apiKey}`;
    
    console.log(`📡 URL: ${videosUrl}`);
    console.log('⏳ Fazendo requisição...');
    
    const startTime = Date.now();
    const response = await fetch(videosUrl);
    const endTime = Date.now();
    
    console.log(`⏱️  Tempo de resposta: ${endTime - startTime}ms`);
    console.log(`🌐 Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ Erro: ${errorText}`);
      return;
    }
    
    const data = await response.json();
    
    console.log(`✅ ${data.items?.length || 0} vídeos encontrados`);
    data.items?.slice(0, 3).forEach((video, i) => {
      console.log(`   ${i + 1}. ${video.snippet.title}`);
      console.log(`      📅 ${new Date(video.snippet.publishedAt).toLocaleDateString('pt-BR')}`);
    });
    
  } catch (error) {
    console.log(`❌ Erro na requisição: ${error.message}`);
  }
}

/**
 * Teste 3: Verificar quotas e limites
 */
async function testeQuotas() {
  console.log('\n📊 TESTE 3: Verificação de Quotas');
  console.log('-'.repeat(40));
  
  // Teste simples para verificar se a API responde
  try {
    const url = `${YOUTUBE_API_BASE}/videos?part=snippet&id=dQw4w9WgXcQ&key=${CONFIG.apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ API está respondendo normalmente');
      console.log(`   Quota usage por requisição: ~1 unidade`);
    } else {
      console.log(`❌ Problema com a API: ${response.status}`);
      
      if (response.status === 403) {
        console.log('   🚫 Possíveis causas:');
        console.log('   - API Key inválida ou expirada');
        console.log('   - YouTube Data API não está ativada no projeto');
        console.log('   - Quota excedida (limite diário: 10,000 unidades)');
        console.log('   - Restrições de IP ou domínio');
      }
      
      if (data.error?.message) {
        console.log(`   📝 Mensagem de erro: ${data.error.message}`);
      }
    }
  } catch (error) {
    console.log(`❌ Erro na conexão: ${error.message}`);
  }
}

/**
 * Função principal
 */
async function executarTestes() {
  const startTime = Date.now();
  
  await testeCanal();
  await testeVideos();
  await testeQuotas();
  
  const totalTime = Date.now() - startTime;
  
  console.log('\n📋 RESUMO');
  console.log('=' .repeat(50));
  console.log(`⏱️  Tempo total: ${totalTime}ms`);
  console.log(`🗓️  Data/Hora: ${new Date().toLocaleString('pt-BR')}`);
  
  console.log('\n💡 PRÓXIMOS PASSOS:');
  console.log('1. Se tudo funcionou: O problema pode estar no código React');
  console.log('2. Se erro 403: Gerar nova API key');
  console.log('3. Se timeout/lento: Problema de rede ou delay artificial');
  console.log('4. Se canal não encontrado: Verificar handle/ID do canal');
}

// Executar apenas se estiver sendo chamado diretamente
if (typeof window === 'undefined') {
  // Node.js
  executarTestes().catch(console.error);
} else {
  // Browser
  window.testarYouTubeAPI = executarTestes;
  console.log('Use: testarYouTubeAPI() no console do navegador');
}

export { executarTestes as testarYouTubeAPI };
