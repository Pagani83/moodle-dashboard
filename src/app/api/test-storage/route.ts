import { NextResponse } from 'next/server'
import { getAllUsers } from '@/lib/user-storage'

export async function GET() {
  try {
    const users = getAllUsers()
    console.log('Users in storage:', users.length)
    return NextResponse.json({ 
      status: 'success', 
      userCount: users.length,
      users: users.map(u => ({ id: u.id, email: u.email, name: u.name, role: u.role }))
    })
  } catch (error) {
    console.error('Error in test endpoint:', error)
    return NextResponse.json({ 
      status: 'error', 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
