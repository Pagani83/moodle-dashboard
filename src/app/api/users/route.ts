import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all users from database and return without passwords
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        createdAt: true,
        lastLogin: true,
        updatedAt: true
      }
    })
    
    return NextResponse.json({ users: allUsers })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { email, name, password, role } = await request.json()

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })
    
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: role || 'USER',
        active: true
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        createdAt: true,
        lastLogin: true,
        updatedAt: true
      }
    })

    return NextResponse.json({ 
      user: newUser,
      message: 'User created successfully' 
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, name, role, active, password } = await request.json()

    const updates: any = {}
    if (name !== undefined) updates.name = name
    if (role !== undefined) updates.role = role
    if (active !== undefined) updates.active = active
    if (password) {
      updates.password = await bcrypt.hash(password, 12)
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updates,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        createdAt: true,
        lastLogin: true,
        updatedAt: true
      }
    })

    return NextResponse.json({ 
      user: updatedUser,
      message: 'User updated successfully' 
    })
  } catch (error) {
    console.error('Error updating user:', error)
    
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    // Check if user exists and get user info
    const userToDelete = await prisma.user.findUnique({
      where: { id }
    })
    
    if (!userToDelete) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Prevent deleting the last admin
    if (userToDelete.role === 'ADMIN') {
      const adminCount = await prisma.user.count({
        where: { 
          role: 'ADMIN', 
          active: true 
        }
      })
      
      if (adminCount <= 1) {
        return NextResponse.json({ 
          error: 'Cannot delete the last active admin user' 
        }, { status: 400 })
      }
    }

    // Delete user (this will also delete related acompanhamentos due to cascade)
    await prisma.user.delete({
      where: { id }
    })

    return NextResponse.json({ 
      message: 'User deleted successfully' 
    })
  } catch (error) {
    console.error('Error deleting user:', error)
    
    if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
