import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET: retorna o ID do acompanhamento ativo do usuário autenticado
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { activeAcompanhamentoId: true }
    })
    return NextResponse.json({ activeAcompanhamentoId: user?.activeAcompanhamentoId || null })
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// PUT: atualiza o ID do acompanhamento ativo do usuário autenticado
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { activeAcompanhamentoId } = await request.json()
    await prisma.user.update({
      where: { id: session.user.id },
      data: { activeAcompanhamentoId }
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
