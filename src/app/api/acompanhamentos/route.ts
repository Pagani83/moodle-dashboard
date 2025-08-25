import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { Acompanhamento } from '@/types/moodle'

export async function GET() {
  try {
    console.log('🔍 API acompanhamentos - GET called')
    const session = await auth()
    console.log('🔍 API acompanhamentos - session:', session?.user?.email)
    
    if (!session?.user) {
      console.log('❌ API acompanhamentos - Unauthorized: no session or user')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id!
    console.log('🔍 API acompanhamentos - userId:', userId)
    
    // Test simple query first
    console.log('🔍 Testing simple acompanhamento query...')
    const simpleCount = await prisma.acompanhamento.count({ where: { userId } })
    console.log('✅ Simple count for user', userId, ':', simpleCount)
    
    // Check if there are ANY acompanhamentos for this user
    const userAcompanhamentos = await prisma.acompanhamento.findMany({ 
      where: { userId },
      include: { cursos: true },
      orderBy: { createdAt: 'desc' }
    })
    console.log('✅ Found', userAcompanhamentos.length, 'acompanhamentos for user', userId)
    
    // Convert to frontend format
    const acompanhamentos = userAcompanhamentos.map((item: any) => {
      console.log('🔍 Processing acompanhamento:', item.id, 'with', item.cursos?.length || 0, 'cursos')
      return {
        id: item.id,
        nome: item.nome,
        descricao: item.descricao,
        mostrar_card_resumo: item.mostrar_card_resumo,
        criado_em: item.createdAt.toISOString(),
        atualizado_em: item.updatedAt.toISOString(),
        cursos: (item.cursos || []).map((curso: any) => ({
          courseid: parseInt(curso.courseId),
          nome: curso.courseName,
          shortname: curso.shortName || '',
          fullname: curso.fullName,
          ativo: curso.ativo,
          status: curso.status,
          progress: curso.progress,
          grade: curso.grade,
          relatorios: [
            { tipo: 'configurable_reports', ativo: true, params: { reportId: 134 } }
          ]
        }))
      }
    })
    
    console.log('✅ Successfully processed', acompanhamentos.length, 'acompanhamentos')
    
    return NextResponse.json({ 
      acompanhamentos,
      userId,
      count: acompanhamentos.length,
      debug: {
        rawCount: simpleCount,
        processedCount: acompanhamentos.length
      }
    })
    
    /* COMMENTED OUT UNTIL PRISMA IS FIXED
    // Test database connection first
    await prisma.$connect()
    console.log('✅ Database connected successfully')
    
    // Fetch acompanhamentos from database with cursos
    let dbAcompanhamentos
    try {
      console.log('🔍 Executing Prisma query for userId:', userId)
      dbAcompanhamentos = await prisma.acompanhamento.findMany({
        where: { userId },
        include: {
          cursos: true
        },
        orderBy: { createdAt: 'desc' }
      })
      console.log('✅ Prisma query successful, found:', dbAcompanhamentos.length, 'items')
    } catch (prismaError) {
      console.error('❌ Prisma query failed:', prismaError)
      console.error('❌ Prisma error details:', {
        message: prismaError.message,
        code: prismaError.code,
        meta: prismaError.meta
      })
      throw new Error(`Database query failed: ${prismaError.message}`)
    }
    */
    
    /* TEMPORARILY COMMENTED OUT
    console.log('🔍 Found', dbAcompanhamentos.length, 'acompanhamentos for user', userId)
    
    // Convert database format to frontend format
    const acompanhamentos: Acompanhamento[] = dbAcompanhamentos.map((item: any) => {
      console.log('🔍 Processing acompanhamento:', item.id, 'with', item.cursos?.length || 0, 'cursos')
      return {
        id: item.id,
        nome: item.nome,
        descricao: item.descricao,
        mostrar_card_resumo: item.mostrar_card_resumo,
        criado_em: item.createdAt.toISOString(),
        atualizado_em: item.updatedAt.toISOString(),
        cursos: (item.cursos || []).map((curso: any) => ({
          courseid: parseInt(curso.courseId),
          nome: curso.courseName,
          shortname: curso.shortName || '',
          fullname: curso.fullName,
          ativo: curso.ativo,
          status: curso.status,
          progress: curso.progress,
          grade: curso.grade,
          relatorios: [
            { tipo: 'configurable_reports', ativo: true, params: { reportId: 134 } }
          ]
        }))
      }
    })
    
    console.log('✅ Successfully processed', acompanhamentos.length, 'acompanhamentos')
    
    return NextResponse.json({ 
      acompanhamentos,
      userId,
      count: acompanhamentos.length 
    })
    */
  } catch (error) {
    console.error('❌ Error fetching acompanhamentos:', error)
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown'
    })
    
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🎆 POST /api/acompanhamentos called')
    
    const session = await auth()
    console.log('🔍 POST - Session user:', session?.user?.email)
    
    if (!session?.user) {
      console.log('❌ POST - Unauthorized: no session')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id!
    console.log('🔍 POST - userId:', userId)
    
    const acompanhamento = await request.json()
    console.log('📝 POST - Received data:', JSON.stringify(acompanhamento, null, 2))
    
    // Validate required fields
    if (!acompanhamento.nome || typeof acompanhamento.nome !== 'string') {
      console.log('❌ POST - Missing or invalid nome field:', acompanhamento.nome)
      return NextResponse.json({ error: 'Nome is required and must be a string' }, { status: 400 })
    }
    
    if (!acompanhamento.cursos || !Array.isArray(acompanhamento.cursos) || acompanhamento.cursos.length === 0) {
      console.log('❌ POST - Missing or empty cursos array:', acompanhamento.cursos)
      return NextResponse.json({ error: 'At least one curso is required' }, { status: 400 })
    }
    
    // Validate curso structure
    for (let i = 0; i < acompanhamento.cursos.length; i++) {
      const curso = acompanhamento.cursos[i]
      if (!curso.courseid) {
        console.log(`❌ POST - Missing courseid in curso ${i}:`, curso)
        return NextResponse.json({ error: `Curso ${i + 1} is missing courseid` }, { status: 400 })
      }
      if (!curso.nome || typeof curso.nome !== 'string') {
        console.log(`❌ POST - Missing or invalid nome in curso ${i}:`, curso)
        return NextResponse.json({ error: `Curso ${i + 1} is missing or has invalid name` }, { status: 400 })
      }
    }
    
    console.log('🔍 POST - Validation passed, creating acompanhamento...')

    // Create new acompanhamento in database with cursos
    console.log('🚀 POST - Starting Prisma create...')
    
    const createData = {
      nome: acompanhamento.nome,
      descricao: acompanhamento.descricao || '',
      mostrar_card_resumo: acompanhamento.mostrar_card_resumo ?? true,
      userId: userId,
      cursos: {
        create: acompanhamento.cursos.map((curso: any) => {
          console.log('🔍 POST - Processing curso:', curso.nome)
          const cursoData = {
            courseId: String(curso.courseid),
            courseName: curso.nome,
            shortName: curso.shortname || '',
            fullName: curso.fullname || curso.nome,
            ativo: curso.ativo ?? true,
            status: 'CURSANDO' as const,
            progress: 0.0,
          }
          console.log('📝 POST - Curso data:', JSON.stringify(cursoData, null, 2))
          return cursoData
        })
      }
    }
    
    console.log('📝 POST - Create data:', JSON.stringify(createData, null, 2))
    
    // Test database connection first
    console.log('🔗 Testing database connection...')
    await prisma.$queryRaw`SELECT 1 as test`
    console.log('✅ Database connection test passed')
    
    const dbAcompanhamento = await prisma.acompanhamento.create({
      data: createData,
      include: {
        cursos: true
      }
    })
    
    console.log('✅ POST - Acompanhamento created with ID:', dbAcompanhamento.id)
    console.log('✅ POST - Created with', dbAcompanhamento.cursos?.length || 0, 'cursos')

    // Convert back to frontend format
    const newAcompanhamento: Acompanhamento = {
      id: dbAcompanhamento.id,
      nome: dbAcompanhamento.nome,
      descricao: dbAcompanhamento.descricao,
      mostrar_card_resumo: dbAcompanhamento.mostrar_card_resumo,
      criado_em: dbAcompanhamento.createdAt.toISOString(),
      atualizado_em: dbAcompanhamento.updatedAt.toISOString(),
      cursos: dbAcompanhamento.cursos.map((curso: any) => ({
        courseid: parseInt(curso.courseId),
        nome: curso.courseName,
        shortname: curso.shortName,
        fullname: curso.fullName,
        ativo: curso.ativo,
        status: curso.status,
        progress: curso.progress,
        grade: curso.grade,
        relatorios: [
          { tipo: 'configurable_reports', ativo: true, params: { reportId: 134 } }
        ]
      }))
    }
    
    console.log(`✅ POST - Successfully created acompanhamento for user ${userId}:`, newAcompanhamento.nome)
    console.log('📊 POST - Final response data:', JSON.stringify(newAcompanhamento, null, 2))

    return NextResponse.json({ 
      acompanhamento: newAcompanhamento,
      message: 'Acompanhamento created successfully',
      debug: {
        userId,
        dbId: dbAcompanhamento.id,
        cursosCount: dbAcompanhamento.cursos?.length || 0
      }
    }, { status: 201 })
  } catch (error) {
    console.error('❌ POST - Error creating acompanhamento:', error)
    console.error('❌ POST - Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown',
      code: (error as any)?.code,
      meta: (error as any)?.meta,
      clientVersion: (error as any)?.clientVersion
    })
    
    // Handle unique constraint violation
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json({ 
        error: 'Já existe um acompanhamento com este curso' 
      }, { status: 409 })
    }
    
    return NextResponse.json({ 
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      code: (error as any)?.code,
      meta: (error as any)?.meta
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
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

    if (!id) {
      return NextResponse.json({ error: 'Acompanhamento ID required' }, { status: 400 })
    }

    console.log('Updating acompanhamento:', id, updates)

    // First, update the main acompanhamento
    const updateData: any = {}
    if (updates.nome !== undefined) updateData.nome = updates.nome
    if (updates.descricao !== undefined) updateData.descricao = updates.descricao
    if (updates.mostrar_card_resumo !== undefined) updateData.mostrar_card_resumo = updates.mostrar_card_resumo

    // Update acompanhamento and handle cursos if provided
    let dbAcompanhamento
    if (updates.cursos) {
      // Delete existing cursos and create new ones
      await prisma.acompanhamentoCurso.deleteMany({
        where: { acompanhamentoId: id }
      })
      
      dbAcompanhamento = await prisma.acompanhamento.update({
        where: { id, userId },
        data: {
          ...updateData,
          cursos: {
            create: updates.cursos.map((curso: any) => ({
              courseId: String(curso.courseid),
              courseName: curso.nome,
              shortName: curso.shortname || '',
              fullName: curso.fullname || curso.nome,
              ativo: curso.ativo ?? true,
              status: curso.status || 'CURSANDO',
              progress: curso.progress || 0,
              grade: curso.grade
            }))
          }
        },
        include: { cursos: true }
      })
    } else {
      dbAcompanhamento = await prisma.acompanhamento.update({
        where: { id, userId },
        data: updateData,
        include: { cursos: true }
      })
    }

    // Convert back to frontend format
    const updatedAcompanhamento: Acompanhamento = {
      id: dbAcompanhamento.id,
      nome: dbAcompanhamento.nome,
      descricao: dbAcompanhamento.descricao,
      mostrar_card_resumo: dbAcompanhamento.mostrar_card_resumo,
      criado_em: dbAcompanhamento.createdAt.toISOString(),
      atualizado_em: dbAcompanhamento.updatedAt.toISOString(),
      cursos: dbAcompanhamento.cursos.map((curso: any) => ({
        courseid: parseInt(curso.courseId),
        nome: curso.courseName,
        shortname: curso.shortName,
        fullname: curso.fullName,
        ativo: curso.ativo,
        status: curso.status,
        progress: curso.progress,
        grade: curso.grade,
        relatorios: [
          { tipo: 'configurable_reports', ativo: true, params: { reportId: 134 } }
        ]
      }))
    }

    return NextResponse.json({ 
      acompanhamento: updatedAcompanhamento,
      message: 'Acompanhamento updated successfully' 
    })
  } catch (error) {
    console.error('Error updating acompanhamento:', error)
    
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return NextResponse.json({ error: 'Acompanhamento not found' }, { status: 404 })
    }
    
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

    console.log('Deleting acompanhamento:', id)

    // Delete acompanhamento from database (cursos will be deleted by cascade)
    await prisma.acompanhamento.delete({
      where: {
        id: id,
        userId: userId
      }
    })

    return NextResponse.json({ 
      message: 'Acompanhamento deleted successfully' 
    })
  } catch (error) {
    console.error('Error deleting acompanhamento:', error)
    
    if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
      return NextResponse.json({ error: 'Acompanhamento not found' }, { status: 404 })
    }
    
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
