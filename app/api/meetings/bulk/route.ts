import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { getCurrentLeader } from '@/lib/db/queries';
import { query } from '@/lib/db/postgres';
import { canManageMeetings, SECRETARY_FORBIDDEN_MESSAGE } from '@/lib/auth/permissions';

/**
 * POST /api/meetings/bulk
 * Creates multiple meetings at once. Duplicate dates for the group are silently ignored.
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

    if (!canManageMeetings(leader.role)) {
      return NextResponse.json({ error: SECRETARY_FORBIDDEN_MESSAGE }, { status: 403 });
    }

    const data = await request.json();
    const { dates, title, meeting_type } = data as {
      dates: string[];
      title?: string | null;
      meeting_type?: 'regular' | 'special_event';
    };

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

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    for (const d of dates) {
      if (!dateRegex.test(d)) {
        return NextResponse.json(
          { error: `Data inválida: ${d}` },
          { status: 400 }
        );
      }
    }

    const type = meeting_type === 'special_event' ? 'special_event' : 'regular';
    const meetingTitle = title?.trim() || null;

    let created = 0;
    for (const meetingDate of dates) {
      const result = await query(
        `INSERT INTO meetings (group_id, meeting_date, title, meeting_type, is_cancelled)
         VALUES ($1, $2, $3, $4, FALSE)
         ON CONFLICT (group_id, meeting_date) DO NOTHING`,
        [leader.group_id, meetingDate, meetingTitle, type]
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
