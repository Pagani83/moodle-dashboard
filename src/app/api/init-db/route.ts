import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    console.log('🚀 Database initialization started...')
    
    // Verificar se já existem usuários
    const userCount = await prisma.user.count()
    console.log('👥 Current user count:', userCount)
    
    if (userCount > 0) {
      const users = await prisma.user.findMany({
        select: { email: true, name: true, role: true }
      })
      return NextResponse.json({
        message: 'Database already initialized',
        userCount,
        users
      })
    }
    
    console.log('🔧 Creating default users...')
    
    // Criar usuários padrão
    const users = [
      {
        email: 'admin@moodle.local',
        name: 'Administrator',
        password: await bcrypt.hash('admin123', 12),
        role: 'ADMIN' as const
      },
      {
        email: 'mmpagani@tjrs.jus.br',
        name: 'Maikon Pagani',
        password: await bcrypt.hash('cjud@2233', 12),
        role: 'ADMIN' as const
      },
      {
        email: 'marciacampos@tjrs.jus.br',
        name: 'Marcia Campos',
        password: await bcrypt.hash('cjud@dicaf', 12),
        role: 'USER' as const
      }
    ]
    
    const createdUsers = []
    
    for (const userData of users) {
      console.log('👤 Creating user:', userData.email)
      const user = await prisma.user.create({
        data: {
          email: userData.email,
          name: userData.name,
          password: userData.password,
          role: userData.role,
          active: true,
          emailVerified: new Date()
        }
      })
      
      createdUsers.push({
        email: user.email,
        name: user.name,
        role: user.role
      })
    }
    
    console.log('✅ Database initialization completed!')
    
    return NextResponse.json({
      message: 'Database initialized successfully',
      users: createdUsers
    })
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error)
    return NextResponse.json({
      error: 'Database initialization failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

export async function POST() {
  // Mesmo comportamento para POST
  return GET()
}