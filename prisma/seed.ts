import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Check if admin user already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@moodle.local' }
  })

  if (existingAdmin) {
    console.log('👤 Admin user already exists, skipping creation')
  } else {
    // Create default admin user
    const hashedPassword = await bcrypt.hash('admin123', 12)
    
    const admin = await prisma.user.create({
      data: {
        email: 'admin@moodle.local',
        name: 'Administrator',
        password: hashedPassword,
        role: 'ADMIN',
        active: true,
        emailVerified: new Date()
      }
    })
    
    console.log('✅ Created admin user:', admin.email)
  }

  // Check if your user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: 'mmpagani@tjrs.jus.br' }
  })

  if (existingUser) {
    console.log('👤 Your user already exists, skipping creation')
  } else {
    // Create your admin user
    const hashedPassword = await bcrypt.hash('cjud@2233', 12)
    
    const user = await prisma.user.create({
      data: {
        email: 'mmpagani@tjrs.jus.br',
        name: 'Maikon Pagani',
        password: hashedPassword,
        role: 'ADMIN',
        active: true,
        emailVerified: new Date()
      }
    })
    
    console.log('✅ Created your admin user:', user.email)
  }

  // Check if Marcia's user already exists
  const existingMarcia = await prisma.user.findUnique({
    where: { email: 'marciacampos@tjrs.jus.br' }
  })

  if (existingMarcia) {
    console.log('👤 Marcia user already exists, skipping creation')
  } else {
    // Create Marcia's user
    const hashedPassword = await bcrypt.hash('cjud@dicaf', 12)
    
    const marcia = await prisma.user.create({
      data: {
        email: 'marciacampos@tjrs.jus.br',
        name: 'Marcia Campos',
        password: hashedPassword,
        role: 'USER',
        active: true,
        emailVerified: new Date()
      }
    })
    
    console.log('✅ Created Marcia user:', marcia.email)
  }

  console.log('🎉 Database seed completed!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })