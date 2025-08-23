import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testYouTubeAPI() {
  console.log('🔍 Testando API do YouTube...\n');
  
  const apiKey = process.env.YOUTUBE_API_KEY;
  console.log('API Key encontrada:', apiKey ? `${apiKey.substring(0, 10)}...` : 'NÃO ENCONTRADA');
  
  if (!apiKey) {
    console.error('❌ YOUTUBE_API_KEY não encontrada no .env.local');
    return;
  }
  
  // Teste 1: Buscar vídeos recentes do canal
  try {
    console.log('\n📹 Buscando vídeos do canal...');
    const channelResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/search?` +
      `key=${apiKey}&` +
      `channelId=UCuaFvcY4MKadobkPt9_BxbA&` + // Canal do Moodle (exemplo)
      `part=snippet&` +
      `order=date&` +
      `maxResults=5&` +
      `type=video`
    );
    
    if (!channelResponse.ok) {
      const errorText = await channelResponse.text();
      console.error('❌ Erro na busca de vídeos:', channelResponse.status, errorText);
    } else {
      const channelData = await channelResponse.json();
      console.log('✅ Vídeos encontrados:', channelData.items?.length || 0);
      
      if (channelData.items && channelData.items.length > 0) {
        console.log('📝 Últimos vídeos:');
        channelData.items.forEach((video, index) => {
          console.log(`  ${index + 1}. ${video.snippet.title}`);
          console.log(`     Data: ${new Date(video.snippet.publishedAt).toLocaleDateString('pt-BR')}`);
        });
      }
    }
  } catch (error) {
    console.error('❌ Erro ao buscar vídeos:', error.message);
  }
  
  // Teste 2: Buscar por termo específico
  try {
    console.log('\n🔎 Buscando por "moodle tutorial"...');
    const searchResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/search?` +
      `key=${apiKey}&` +
      `q=moodle tutorial&` +
      `part=snippet&` +
      `order=relevance&` +
      `maxResults=3&` +
      `type=video&` +
      `publishedAfter=2024-01-01T00:00:00Z` // Vídeos de 2024 em diante
    );
    
    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error('❌ Erro na busca por termo:', searchResponse.status, errorText);
    } else {
      const searchData = await searchResponse.json();
      console.log('✅ Resultados encontrados:', searchData.items?.length || 0);
      
      if (searchData.items && searchData.items.length > 0) {
        console.log('📝 Vídeos de "moodle tutorial":');
        searchData.items.forEach((video, index) => {
          console.log(`  ${index + 1}. ${video.snippet.title}`);
          console.log(`     Canal: ${video.snippet.channelTitle}`);
          console.log(`     Data: ${new Date(video.snippet.publishedAt).toLocaleDateString('pt-BR')}`);
        });
      }
    }
  } catch (error) {
    console.error('❌ Erro na busca por termo:', error.message);
  }
  
  // Teste 3: Verificar quota restante (aproximado)
  try {
    console.log('\n📊 Testando quota da API...');
    const quotaTest = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?` +
      `key=${apiKey}&` +
      `part=snippet&` +
      `id=dQw4w9WgXcQ` // Rick Roll como teste padrão
    );
    
    if (quotaTest.ok) {
      console.log('✅ API funcionando - quota disponível');
    } else {
      const errorText = await quotaTest.text();
      console.log('⚠️ Possível problema de quota:', quotaTest.status, errorText);
    }
  } catch (error) {
    console.error('❌ Erro no teste de quota:', error.message);
  }
  
  console.log('\n🏁 Teste concluído!');
}

testYouTubeAPI();
