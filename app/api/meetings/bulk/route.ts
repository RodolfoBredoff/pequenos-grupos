import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { getCurrentLeader } from '@/lib/db/queries';
import { query } from '@/lib/db/postgres';

/**
 * POST /api/meetings/bulk
 * Cria múltiplos encontros de uma vez.
 * Datas já existentes para o grupo são ignoradas (ON CONFLICT DO NOTHING).
 */
export async function POST(request: Request) {
  try {
    await requireAuth();
    const leader = await getCurrentLeader();

    if (!leader?.group_id) {
      return NextResponse.json(
        { error: 'Líder não está vinculado a um grupo' },
        { status: 400 }
      );
    }

    const data = await request.json();
    const { dates } = data as { dates: string[] };

    if (!Array.isArray(dates) || dates.length === 0) {
      return NextResponse.json(
        { error: 'Informe ao menos uma data' },
        { status: 400 }
      );
    }

    if (dates.length > 200) {
      return NextResponse.json(
        { error: 'Máximo de 200 encontros por vez' },
        { status: 400 }
      );
    }

    // Validar formato das datas (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    for (const d of dates) {
      if (!dateRegex.test(d)) {
        return NextResponse.json(
          { error: `Data inválida: ${d}` },
          { status: 400 }
        );
      }
    }

    // Inserir em lote — datas duplicadas são ignoradas silenciosamente
    let created = 0;
    for (const meetingDate of dates) {
      const result = await query(
        `INSERT INTO meetings (group_id, meeting_date, is_cancelled)
         VALUES ($1, $2, FALSE)
         ON CONFLICT (group_id, meeting_date) DO NOTHING`,
        [leader.group_id, meetingDate]
      );
      created += result.rowCount ?? 0;
    }

    return NextResponse.json({ created, total: dates.length });
  } catch (error) {
    console.error('Erro ao criar encontros em lote:', error);
    return NextResponse.json(
      { error: 'Erro ao criar encontros' },
      { status: 500 }
    );
  }
}
