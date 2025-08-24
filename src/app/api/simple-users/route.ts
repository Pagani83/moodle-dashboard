import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

// In-memory storage for users (temporary solution for production)
let users: any[] = []

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    if (body.action === 'setup') {
      // Create default users if empty
      if (users.length === 0) {
        const defaultUsers = [
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

        for (const userData of defaultUsers) {
          const hashedPassword = await bcrypt.hash(userData.password, 12)
          
          const user = {
            id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            email: userData.email,
            name: userData.name,
            password: hashedPassword,
            role: userData.role,
            active: true,
            createdAt: new Date().toISOString(),
            lastLogin: null
          }
          
          users.push(user)
        }

        return NextResponse.json({
          success: true,
          message: `Successfully created ${users.length} users`,
          users: users.map(u => ({ ...u, password: undefined }))
        })
      } else {
        return NextResponse.json({
          message: 'Users already exist',
          userCount: users.length,
          users: users.map(u => ({ ...u, password: undefined }))
        })
      }
    }

    if (body.action === 'create') {
      const { email, name, password, role } = body
      
      // Check if user already exists
      const existingUser = users.find(u => u.email === email)
      if (existingUser) {
        return NextResponse.json({ error: 'User already exists' }, { status: 409 })
      }

      const hashedPassword = await bcrypt.hash(password, 12)
      
      const newUser = {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        email,
        name,
        password: hashedPassword,
        role,
        active: true,
        createdAt: new Date().toISOString(),
        lastLogin: null
      }
      
      users.push(newUser)

      return NextResponse.json({
        success: true,
        user: { ...newUser, password: undefined },
        message: 'User created successfully'
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Error in simple-users API:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    return NextResponse.json({
      userCount: users.length,
      users: users.map(u => ({ ...u, password: undefined }))
    })
  } catch (error) {
    console.error('Error getting users:', error)
    return NextResponse.json(
      { error: 'Failed to get users' },
      { status: 500 }
    )
  }
}