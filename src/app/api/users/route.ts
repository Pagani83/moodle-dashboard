import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import bcrypt from 'bcryptjs'
import { 
  getAllUsers, 
  createUser, 
  updateUser, 
  deleteUser as deleteUserFromStorage,
  getUserByEmail,
  type User 
} from '@/lib/user-storage'

export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all users and return without passwords
    const allUsers = getAllUsers()
    const safeUsers = allUsers.map(({ password, ...user }) => user)
    return NextResponse.json({ users: safeUsers })
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

    const { name, email, role, password } = await request.json()

    // Validate input
    if (!name || !email || !role || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if user already exists
    if (getUserByEmail(email)) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create new user using centralized storage
    const newUser = createUser({
      name,
      email,
      password: hashedPassword,
      role: role as 'ADMIN' | 'USER',
      active: true,
      lastLogin: null
    })

    // Return user without password
    const { password: _, ...safeUser } = newUser
    return NextResponse.json({ user: safeUser }, { status: 201 })
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

    const { id, name, email, role, active, password } = await request.json()

    // Prepare updates object
    const updates: Partial<Omit<User, 'id' | 'createdAt'>> = {
      ...(name && { name }),
      ...(email && { email }),
      ...(role && { role }),
      ...(active !== undefined && { active })
    }

    // Update password if provided
    if (password) {
      updates.password = await bcrypt.hash(password, 12)
    }

    // Update user using centralized storage
    const updatedUser = updateUser(id, updates)
    
    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Return user without password
    const { password: _, ...safeUser } = updatedUser
    return NextResponse.json({ user: safeUser })
  } catch (error) {
    console.error('Error updating user:', error)
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

    // Get user to check if it exists and get role
    const allUsers = getAllUsers()
    const userToDelete = allUsers.find(u => u.id === id)
    
    if (!userToDelete) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Prevent deleting the last admin
    if (userToDelete.role === 'ADMIN') {
      const adminCount = allUsers.filter(u => u.role === 'ADMIN' && u.active).length
      if (adminCount <= 1) {
        return NextResponse.json({ error: 'Cannot delete the last admin user' }, { status: 400 })
      }
    }

    // Delete user using centralized storage
    const deleted = deleteUserFromStorage(id)
    
    if (!deleted) {
      return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
    }

    return NextResponse.json({ message: 'User deleted successfully' })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
