import { NextResponse } from 'next/server'
import { getAllUsers } from '@/lib/user-storage'

export async function GET() {
  const users = getAllUsers()
  return NextResponse.json({ 
    count: users.length,
    users: users.map(u => ({ 
      id: u.id, 
      email: u.email, 
      name: u.name, 
      role: u.role,
      active: u.active,
      hasPassword: !!u.password
    }))
  })
}
