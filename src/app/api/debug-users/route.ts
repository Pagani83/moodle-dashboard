import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const users = await prisma.user.findMany()
  return NextResponse.json({ 
    count: users.length,
    users: users.map((u: any) => ({ 
      id: u.id, 
      email: u.email, 
      name: u.name, 
      role: u.role,
      active: u.active,
      hasPassword: !!u.password
    }))
  })
}
