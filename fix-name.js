const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixName() {
  try {
    await prisma.user.update({
      where: { email: 'mmpagani@tjrs.jus.br' },
      data: { name: 'Maikon Pagani' }
    });
    console.log('✅ Nome corrigido para Maikon Pagani');
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixName();