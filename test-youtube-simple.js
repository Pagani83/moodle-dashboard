/**
 * Teste Simples da YouTube API - Node.js
 * Execute com: node test-youtube-simple.js
 */

const https = require('https');
const { URL } = require('url');

// Configuração
const API_KEY = 'AIzaSyDWubaPpBwhgRA5h62aFRHf3PZB56cMbf0';
const CHANNEL_HANDLE = 'cjudtjrs';

console.log('🔍 TESTE SIMPLES DA YOUTUBE API');
console.log('=' .repeat(50));
console.log(`API Key: ${API_KEY.substring(0, 20)}...`);
console.log(`Canal: @${CHANNEL_HANDLE}`);
console.log();

function testarAPI() {
  const url = `https://www.googleapis.com/youtube/v3/channels?forHandle=${CHANNEL_HANDLE}&part=snippet,statistics&key=${API_KEY}`;
  
  console.log(`📡 Testando URL: ${url}`);
  console.log('⏳ Fazendo requisição...');
  
  const startTime = Date.now();
  
  const urlObj = new URL(url);
  const options = {
    hostname: urlObj.hostname,
    port: 443,
    path: urlObj.pathname + urlObj.search,
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  };

  const req = https.request(options, (res) => {
    const duration = Date.now() - startTime;
    
    console.log(`⏱️  Tempo de resposta: ${duration}ms`);
    console.log(`🌐 Status: ${res.statusCode} ${res.statusMessage}`);
    
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        if (res.statusCode === 200) {
          const response = JSON.parse(data);
          
          if (response.items && response.items.length > 0) {
            const channel = response.items[0];
            console.log('✅ SUCESSO! Canal encontrado:');
            console.log(`   📛 Nome: ${channel.snippet.title}`);
            console.log(`   👥 Inscritos: ${Number(channel.statistics.subscriberCount).toLocaleString()}`);
            console.log(`   👁️  Visualizações: ${Number(channel.statistics.viewCount).toLocaleString()}`);
            console.log(`   🎬 Vídeos: ${Number(channel.statistics.videoCount).toLocaleString()}`);
          } else {
            console.log('❌ Canal não encontrado na resposta');
          }
        } else {
          console.log('❌ ERRO NA API:');
          console.log(`   Status: ${res.statusCode}`);
          
          try {
            const errorData = JSON.parse(data);
            console.log(`   Mensagem: ${errorData.error?.message || 'Erro desconhecido'}`);
            
            if (res.statusCode === 403) {
              console.log('   🚫 ERRO 403 - Possíveis causas:');
              console.log('   - API Key inválida ou expirada');
              console.log('   - YouTube Data API não ativada');
              console.log('   - Quota excedida');
              console.log('   - Restrições de acesso');
            }
          } catch (e) {
            console.log(`   Resposta bruta: ${data}`);
          }
        }
      } catch (error) {
        console.log(`❌ Erro ao processar resposta: ${error.message}`);
        console.log(`   Dados recebidos: ${data}`);
      }
      
      console.log('\n💡 DIAGNÓSTICO:');
      if (res.statusCode === 200) {
        console.log('✅ A API está funcionando! O problema pode estar no código React.');
      } else if (res.statusCode === 403) {
        console.log('🔑 Precisa gerar uma nova API Key.');
      } else {
        console.log('🔧 Problema de configuração ou rede.');
      }
    });
  });

  req.on('error', (error) => {
    console.log(`❌ Erro de conexão: ${error.message}`);
  });

  req.setTimeout(10000, () => {
    console.log('❌ Timeout - Requisição muito lenta');
    req.destroy();
  });

  req.end();
}

// Executar teste
testarAPI();
