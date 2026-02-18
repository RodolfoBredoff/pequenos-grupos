import { NextResponse } from 'next/server';
import { runAllChecks } from '@/lib/alerts/checker';

/**
 * GET /api/cron/check-alerts
 * Rota chamada diariamente por um cron externo (GitHub Actions, AWS EventBridge, etc.).
 * Protegida pelo header Authorization: Bearer <CRON_SECRET>.
 *
 * Exemplo de chamada via curl:
 *   curl -H "Authorization: Bearer SEU_CRON_SECRET" https://seudominio.com/api/cron/check-alerts
 *
 * Variável de ambiente necessária: CRON_SECRET
 */
export async function GET(request: Request) {
  try {
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret) {
      const authHeader = request.headers.get('authorization');
      const token = authHeader?.replace('Bearer ', '');
      if (token !== cronSecret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const result = await runAllChecks();

    return NextResponse.json({
      ok: true,
      absenceAlerts: result.absenceAlerts,
      birthdayNotifications: result.birthdayNotifications,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Erro no cron de alertas:', error);
    return NextResponse.json(
      { error: 'Erro ao executar verificações' },
      { status: 500 }
    );
  }
}
