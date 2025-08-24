import { NextRequest, NextResponse } from 'next/server'
import { initializeUsers, getUserByEmail } from '@/lib/simple-users-storage'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    console.log('🔍 Debug auth - email:', email)
    console.log('🔍 Debug auth - password provided:', !!password)
    
    // Initialize users
    const users = await initializeUsers()
    console.log('🔍 Debug auth - total users:', users.length)
    console.log('🔍 Debug auth - user emails:', users.map(u => u.email))
    
    // Find user
    const user = getUserByEmail(email)
    console.log('🔍 Debug auth - user found:', !!user)
    
    if (user) {
      console.log('🔍 Debug auth - user active:', user.active)
      console.log('🔍 Debug auth - user role:', user.role)
      
      // Check password
      const isValid = await bcrypt.compare(password, user.password)
      console.log('🔍 Debug auth - password valid:', isValid)
      
      return NextResponse.json({
        success: true,
        debug: {
          userFound: !!user,
          userActive: user?.active,
          userRole: user?.role,
          passwordValid: isValid,
          totalUsers: users.length,
          userEmails: users.map(u => u.email)
        }
      })
    } else {
      return NextResponse.json({
        success: false,
        debug: {
          userFound: false,
          totalUsers: users.length,
          userEmails: users.map(u => u.email)
        }
      })
    }
    
  } catch (error) {
    console.error('🔍 Debug auth error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      debug: {
        errorType: typeof error,
        errorMessage: error instanceof Error ? error.message : String(error)
      }
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    // Just initialize and return user count
    const users = await initializeUsers()
    
    return NextResponse.json({
      success: true,
      totalUsers: users.length,
      userEmails: users.map(u => u.email),
      users: users.map(u => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        active: u.active,
        createdAt: u.createdAt
      }))
    })
  } catch (error) {
    console.error('🔍 Debug auth GET error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}