const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function updateUsers() {
  try {
    console.log('🔍 Updating users in database...')
    
    // Create new admin user
    const hashedPassword = await bcrypt.hash('cjud@2233', 12)
    const newAdmin = await prisma.user.upsert({
      where: { email: 'mmpagani@tjrs.jus.br' },
      update: {
        password: hashedPassword // Update password if user exists
      },
      create: {
        email: 'mmpagani@tjrs.jus.br',
        name: 'Marcos Pagani',
        password: hashedPassword,
        role: 'ADMIN',
        active: true
      }
    })
    console.log('✅ Created/Updated admin user:', newAdmin.id, '-', newAdmin.name)
    
    // Remove old admin user
    try {
      await prisma.user.delete({
        where: { email: 'admin@moodle.local' }
      })
      console.log('✅ Removed old admin user')
    } catch (error) {
      console.log('ℹ️ Old admin user not found (already removed)')
    }
    
    // List all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true
      }
    })
    console.log('✅ Current users in database:')
    users.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - ${user.role}`)
    })
    
  } catch (error) {
    console.error('❌ Update error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateUsers()
