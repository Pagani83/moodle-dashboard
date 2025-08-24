// Script para criar usuário admin - execute no console do navegador
// quando estiver na página do seu dashboard no Vercel

async function createAdminUser() {
  try {
    const response = await fetch('/api/create-admin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'mmpagani@tjrs.jus.br',
        password: 'cjud@2233',
        name: 'Maikon Pagani',
        secret: 'create-admin-2025'
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Usuário admin criado com sucesso:', data);
      alert('Usuário admin criado com sucesso!');
    } else {
      console.log('❌ Erro ao criar usuário:', data);
      if (data.error === 'User already exists') {
        console.log('ℹ️ Usuário já existe:', data.user);
        alert('Usuário já existe no banco!');
      } else {
        alert('Erro: ' + data.error);
      }
    }
  } catch (error) {
    console.error('❌ Erro na requisição:', error);
    alert('Erro na requisição: ' + error.message);
  }
}

// Executar a função
createAdminUser();