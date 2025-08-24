
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    // Primeiro, verificar se existem usuários no banco
    const userCount = await prisma.user.count()
    
    // Se não existem usuários, criar os usuários padrão automaticamente
    if (userCount === 0) {
      console.log('🔧 No users found, creating default users...')
      
      // Criar usuário admin padrão
      const adminHash = await bcrypt.hash('admin123', 12)
      await prisma.user.create({
        data: {
          email: 'admin@moodle.local',
          name: 'Administrator', 
          password: adminHash,
          role: 'ADMIN',
          active: true,
        }
      })
      
      // Criar seu usuário admin
      const yourHash = await bcrypt.hash('cjud@2233', 12)
      await prisma.user.create({
        data: {
          email: 'mmpagani@tjrs.jus.br',
          name: 'Maikon Pagani',
          password: yourHash,
          role: 'ADMIN', 
          active: true,
        }
      })
      
      // Criar usuário Márcia
      const marciaHash = await bcrypt.hash('cjud@dicaf', 12)
      await prisma.user.create({
        data: {
          email: 'marciacampos@tjrs.jus.br',
          name: 'Marcia Campos',
          password: marciaHash,
          role: 'USER',
          active: true, 
        }
      })
      
      return NextResponse.json({
        message: 'Default users created successfully',
        users: [
          { email: 'admin@moodle.local', role: 'ADMIN' },
          { email: 'mmpagani@tjrs.jus.br', role: 'ADMIN' },
          { email: 'marciacampos@tjrs.jus.br', role: 'USER' }
        ]
      })
    }
    
    // Se já existem usuários, verificar o secret para criação manual
    const { email, password, name, secret } = await request.json()
    
    if (secret !== 'create-admin-2025') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!email || !password || !name) {
      return NextResponse.json({ 
        error: 'Email, password, and name are required' 
      }, { status: 400 })
    }

    // Verificar se o usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json({ 
        error: 'User already exists',
        user: { id: existingUser.id, email: existingUser.email, name: existingUser.name, role: existingUser.role }
      }, { status: 409 })
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 12)

    // Criar o usuário
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'ADMIN',
      }
    })

    console.log('✅ Admin user created:', user.email)

    return NextResponse.json({
      message: 'Admin user created successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    })
  } catch (error) {
    console.error('❌ Error creating admin user:', error)
    return NextResponse.json({
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}