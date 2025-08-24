import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  const users = [
    {
      email: 'admin@moodle.local',
      name: 'Administrator',
      password: 'admin123',
      role: 'ADMIN'
    },
    {
      email: 'mmpagani@tjrs.jus.br',
      name: 'Maikon Pagani',
      password: 'cjud@2233',
      role: 'ADMIN'
    },
    {
      email: 'marciacampos@tjrs.jus.br',
      name: 'Marcia Campos',
      password: 'cjud@dicaf',
      role: 'USER'
    }
  ]

  for (const userData of users) {
    const hashedPassword = await bcrypt.hash(userData.password, 12)
    
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email }
    })

    if (existingUser) {
      console.log(`🔄 Updating user: ${userData.email}`)
      await prisma.user.update({
        where: { email: userData.email },
        data: {
          name: userData.name,
          password: hashedPassword,
          role: userData.role as 'ADMIN' | 'USER',
          active: true
        }
      })
    } else {
      console.log(`➕ Creating user: ${userData.email}`)
      await prisma.user.create({
        data: {
          email: userData.email,
          name: userData.name,
          password: hashedPassword,
          role: userData.role as 'ADMIN' | 'USER',
          active: true
        }
      })
    }
  }

  console.log('✅ Seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })