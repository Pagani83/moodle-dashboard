const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testPrisma() {
  try {
    console.log('🔍 Testing Prisma connection...')
    
    // Test connection
    await prisma.$connect()
    console.log('✅ Connected to database')
    
    // Test query
    const users = await prisma.user.findMany()
    console.log('✅ Query successful - Users count:', users.length)
    
    // Test acompanhamentos table
    const acompanhamentos = await prisma.acompanhamento.findMany()
    console.log('✅ Acompanhamentos query successful - Count:', acompanhamentos.length)
    
  } catch (error) {
    console.error('❌ Prisma error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testPrisma()
