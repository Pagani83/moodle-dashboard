/**
 * API Route para trigger de rebuild automático
 * Pode ser chamada por cron jobs externos ou Vercel Cron
 */
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get('token');
    const refreshData = url.searchParams.get('refresh_data') === 'true';
    
    // Verificar token de autorização para segurança
    const expectedToken = process.env.CRON_SECRET;
    
    if (expectedToken && token !== expectedToken) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    // Log da atualização
    const timestamp = new Date().toISOString();
    console.log(`🕔 Auto-update triggered at: ${timestamp}, refresh_data: ${refreshData}`);

    let dataRefreshResult = null;
    
    // Se solicitado, força refresh dos dados do Moodle
    if (refreshData) {
      try {
        console.log('🔄 Triggering Moodle data refresh...');
        
        // Chamar a API que força uma nova busca de dados do Moodle
        // (isso vai invalidar cache e buscar dados frescos)
        const baseUrl = url.origin;
        const refreshResponse = await fetch(`${baseUrl}/api/cache/report-134?force_refresh=true`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (refreshResponse.ok) {
          dataRefreshResult = await refreshResponse.json();
          console.log('✅ Moodle data refresh completed');
        } else {
          console.log('⚠️ Moodle data refresh failed, continuing anyway');
          dataRefreshResult = { error: 'Failed to refresh Moodle data' };
        }
      } catch (error) {
        console.log('⚠️ Data refresh error:', error);
        dataRefreshResult = { error: 'Data refresh exception' };
      }
    }

    // Informações da atualização
    const updateInfo = {
      message: 'Auto-update triggered successfully',
      timestamp,
      dataRefreshed: refreshData,
      dataRefreshResult,
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
