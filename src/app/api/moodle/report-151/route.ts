import { NextRequest, NextResponse } from 'next/server';
import { createMoodleClient } from '@/lib/moodle-client';
import type { MoodleConfig } from '@/types/moodle';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('🎯 Report 151 API called');
    
    // Configuração do cliente Moodle
    const config: MoodleConfig = {
      baseUrl: process.env.NEXT_PUBLIC_MOODLE_BASE_URL || 'https://cjud.tjrs.jus.br/webservice/rest',
      token: process.env.NEXT_PUBLIC_MOODLE_TOKEN || '',
      timeout: 30 * 60 * 1000, // 30 minutos para relatórios pesados
      defaultCategory: 1, // Categoria padrão
    };
    
    if (!config.token) {
      return NextResponse.json(
        { error: 'MOODLE_TOKEN não configurado' }, 
        { status: 500 }
      );
    }
    
    console.log('🔧 Creating Moodle client...');
    const client = createMoodleClient(config);
    
    console.log('📊 Fetching Report 151 data...');
    const startTime = Date.now();
    
    // Buscar dados do Relatório 151
    const data = await client.getReport151();
    
    const duration = Date.now() - startTime;
    console.log(`✅ Report 151 completed: ${data.length} records in ${duration}ms`);
    
    // Retornar dados brutos (array)
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
  } catch (error: any) {
    console.error('❌ Report 151 API Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch Report 151', 
        message: error.message,
        details: error.stack 
      }, 
      { status: 500 }
    );
  }
}