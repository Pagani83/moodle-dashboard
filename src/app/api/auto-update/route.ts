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
        
        // Forçar atualização do relatório combinado (134 + 151)
        const baseUrl = url.origin;
        
        // Buscar dados frescos dos dois relatórios
        const [report134Response, report151Response] = await Promise.all([
          fetch(`${baseUrl}/api/moodle/report-134`, {
            headers: { 'X-Force-Refresh': 'true' }
          }),
          fetch(`${baseUrl}/api/moodle/report-151`, {
            headers: { 'X-Force-Refresh': 'true' }
          })
        ]);
        
        if (report134Response.ok && report151Response.ok) {
          const data134 = await report134Response.json();
          const data151 = await report151Response.json();
          
          // Salvar no cache combinado
          const refreshResponse = await fetch(`${baseUrl}/api/cache/combined-report`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              data134: Array.isArray(data134) ? data134 : [],
              data151: Array.isArray(data151) ? data151 : [],
              lastFetch: new Date().toISOString(),
              fetchDuration: 0,
              report134Count: Array.isArray(data134) ? data134.length : 0,
              report151Count: Array.isArray(data151) ? data151.length : 0,
            })
          });
          
          dataRefreshResult = refreshResponse.ok ? await refreshResponse.json() : { error: 'Cache save failed' };
        } else {
          dataRefreshResult = { error: 'Failed to fetch combined reports' };
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
