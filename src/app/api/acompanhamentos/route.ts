import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import type { Acompanhamento } from '@/types/moodle'

// Temporary storage - in production, use a database
let userAcompanhamentos: Record<string, Acompanhamento[]> = {}

export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id!
    const acompanhamentos = userAcompanhamentos[userId] || []
    
    return NextResponse.json({ 
      acompanhamentos,
      userId,
      count: acompanhamentos.length 
    })
  } catch (error) {
    console.error('Error fetching acompanhamentos:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id!
    const acompanhamento = await request.json()

    // Initialize user data if doesn't exist
    if (!userAcompanhamentos[userId]) {
      userAcompanhamentos[userId] = []
    }

    // Add new acompanhamento
    const newAcompanhamento: Acompanhamento = {
      ...acompanhamento,
      id: acompanhamento.id || Date.now().toString(),
      createdAt: acompanhamento.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: userId // Associate with user
    }

    userAcompanhamentos[userId].push(newAcompanhamento)

    return NextResponse.json({ 
      acompanhamento: newAcompanhamento,
      message: 'Acompanhamento created successfully' 
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating acompanhamento:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id!
    const { id, ...updates } = await request.json()

    if (!userAcompanhamentos[userId]) {
      return NextResponse.json({ error: 'Acompanhamento not found' }, { status: 404 })
    }

    const acompanhamentoIndex = userAcompanhamentos[userId].findIndex(a => a.id === id)
    
    if (acompanhamentoIndex === -1) {
      return NextResponse.json({ error: 'Acompanhamento not found' }, { status: 404 })
    }

    // Update acompanhamento
    userAcompanhamentos[userId][acompanhamentoIndex] = {
      ...userAcompanhamentos[userId][acompanhamentoIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    }

    return NextResponse.json({ 
      acompanhamento: userAcompanhamentos[userId][acompanhamentoIndex],
      message: 'Acompanhamento updated successfully' 
    })
  } catch (error) {
    console.error('Error updating acompanhamento:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id!
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Acompanhamento ID required' }, { status: 400 })
    }

    if (!userAcompanhamentos[userId]) {
      return NextResponse.json({ error: 'Acompanhamento not found' }, { status: 404 })
    }

    const initialLength = userAcompanhamentos[userId].length
    userAcompanhamentos[userId] = userAcompanhamentos[userId].filter(a => a.id !== id)

    if (userAcompanhamentos[userId].length === initialLength) {
      return NextResponse.json({ error: 'Acompanhamento not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      message: 'Acompanhamento deleted successfully',
      deletedId: id 
    })
  } catch (error) {
    console.error('Error deleting acompanhamento:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
