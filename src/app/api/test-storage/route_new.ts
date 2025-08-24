import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const users = await prisma.user.findMany()
    console.log('Users in database:', users.length)
    return NextResponse.json({ 
      status: 'success', 
      userCount: users.length,
      users: users.map((u: any) => ({ id: u.id, email: u.email, name: u.name, role: u.role }))
    })
  } catch (error) {
    console.error('Error in test endpoint:', error)
    return NextResponse.json({ 
      status: 'error', 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
