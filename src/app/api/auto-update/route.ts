/**
 * API Route para trigger de rebuild automático
 * Pode ser chamada por cron jobs externos ou Vercel Cron
 */
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Verificar se tem token de autorização para segurança
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET;
    
    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    // Log da atualização
    const timestamp = new Date().toISOString();
    console.log(`🕔 Auto-update triggered at: ${timestamp}`);

    // Você pode adicionar aqui lógicas específicas como:
    // - Limpar cache
    // - Atualizar dados
    // - Notificar sistemas externos
    
    // Informações da atualização
    const updateInfo = {
      message: 'Auto-update triggered successfully',
      timestamp,
      nextUpdate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h depois
      version: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',
      environment: process.env.VERCEL_ENV || 'development'
    };

    return NextResponse.json(updateInfo);
    
  } catch (error) {
    console.error('❌ Auto-update error:', error);
    return NextResponse.json(
      { 
        error: 'Auto-update failed', 
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Mesma lógica para POST requests
  return GET(request);
}
