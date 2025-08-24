import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { initializeUsers, getUsers, getUserByEmail, addUser, updateUser } from '@/lib/simple-users-storage'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    if (body.action === 'setup') {
      const users = await initializeUsers()
      return NextResponse.json({
        success: true,
        message: `Successfully initialized ${users.length} users`,
        users: users.map(u => ({ ...u, password: undefined }))
      })
    }

    if (body.action === 'create') {
      const { email, name, password, role } = body
      
      // Check if user already exists
      const existingUser = getUserByEmail(email)
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
      
      addUser(newUser)

      return NextResponse.json({
        success: true,
        user: { ...newUser, password: undefined },
        message: 'User created successfully'
      })
    }

    if (body.action === 'update') {
      const { id, name, role, active, password } = body
      
      const currentUsers = getUsers()
      const existingUser = currentUsers.find(u => u.id === id)
      if (!existingUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      const updates: any = {
        name: name || existingUser.name,
        role: role || existingUser.role,
        active: active !== undefined ? active : existingUser.active,
        updatedAt: new Date().toISOString()
      }

      if (password) {
        updates.password = await bcrypt.hash(password, 12)
      }

      const updatedUser = updateUser(id, updates)

      return NextResponse.json({
        success: true,
        user: { ...updatedUser, password: undefined },
        message: 'User updated successfully'
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
    const users = getUsers()
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