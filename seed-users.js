const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createUsers() {
  try {
    console.log('Creating users...');
    
    // Admin: mmpagani@tjrs.jus.br
    const adminPassword = await bcrypt.hash('cjud@2233', 12);
    const admin = await prisma.user.upsert({
      where: { email: 'mmpagani@tjrs.jus.br' },
      update: {}, // Se existir, não atualiza
      create: {
        email: 'mmpagani@tjrs.jus.br',
        name: 'Marcelo Pagani',
        password: adminPassword,
        role: 'ADMIN',
        active: true
      }
    });
    console.log('✅ Admin created:', admin.email);
    
    // User: marciacampos@tjrs.jus.br
    const userPassword = await bcrypt.hash('cjud@dicaf', 12);
    const user = await prisma.user.upsert({
      where: { email: 'marciacampos@tjrs.jus.br' },
      update: {}, // Se existir, não atualiza
      create: {
        email: 'marciacampos@tjrs.jus.br',
        name: 'Marcia Campos',
        password: userPassword,
        role: 'USER',
        active: true
      }
    });
    console.log('✅ User created:', user.email);
    
    console.log('\n🎉 Users created successfully!');
    console.log('=================================');
    console.log('ADMIN: mmpagani@tjrs.jus.br / cjud@2233');
    console.log('USER:  marciacampos@tjrs.jus.br / cjud@dicaf');
    console.log('=================================');
    
  } catch (error) {
    console.error('❌ Error creating users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createUsers();