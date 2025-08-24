import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    // Check if users already exist
    const userCount = await prisma.user.count()
    
    if (userCount > 0) {
      return NextResponse.json({ 
        message: 'Users already exist',
        userCount 
      })
    }

    // Create default users
    const defaultUsers = [
      { 
        email: 'admin@moodle.local', 
        name: 'Administrator', 
        password: 'admin123', 
        role: 'ADMIN' as const 
      },
      { 
        email: 'mmpagani@tjrs.jus.br', 
        name: 'Maikon Pagani', 
        password: 'cjud@2233', 
        role: 'ADMIN' as const 
      },
      { 
        email: 'marciacampos@tjrs.jus.br', 
        name: 'Marcia Campos', 
        password: 'cjud@dicaf', 
        role: 'USER' as const 
      }
    ]

    const createdUsers = []

    for (const userData of defaultUsers) {
      const hashedPassword = await bcrypt.hash(userData.password, 12)
      
      const user = await prisma.user.create({
        data: {
          email: userData.email,
          name: userData.name,
          password: hashedPassword,
          role: userData.role,
          active: true,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          active: true,
          createdAt: true
        }
      })
      
      createdUsers.push(user)
    }

    return NextResponse.json({
      success: true,
      message: `Successfully created ${createdUsers.length} users`,
      users: createdUsers
    })

  } catch (error) {
    console.error('Error setting up users:', error)
    return NextResponse.json(
      { error: 'Failed to setup users', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Just check if users exist
    const userCount = await prisma.user.count()
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        createdAt: true,
        lastLogin: true
      }
    })

    return NextResponse.json({
      userCount,
      users
    })

  } catch (error) {
    console.error('Error checking users:', error)
    return NextResponse.json(
      { error: 'Failed to check users' },
      { status: 500 }
    )
  }
}