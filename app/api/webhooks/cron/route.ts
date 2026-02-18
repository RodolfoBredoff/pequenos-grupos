import { NextResponse } from 'next/server';
import { runAllChecks } from '@/lib/alerts/checker';
import { getSSMParameter } from '@/lib/aws/ssm-client';

/**
 * GET /api/webhooks/cron
 * Endpoint para executar verificações automáticas (faltas consecutivas, aniversários)
 * Deve ser chamado diariamente via cron job
 */
export async function GET(request: Request) {
  try {
    // Verificar autenticação via header (CRON_SECRET)
    const authHeader = request.headers.get('authorization');
    const cronSecret = await getSSMParameter('/pequenos-grupos/app/cron-secret', true) 
      || process.env.CRON_SECRET;

    if (!cronSecret) {
      return NextResponse.json(
        { error: 'CRON_SECRET não configurado' },
        { status: 500 }
      );
    }

    // Verificar token
    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Executar verificações
    const results = await runAllChecks();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results: {
        absenceAlerts: results.absenceAlerts,
        birthdayNotifications: results.birthdayNotifications,
      },
    });
  } catch (error) {
    console.error('Erro ao executar cron:', error);
    return NextResponse.json(
      {
        error: 'Erro ao processar verificações',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
