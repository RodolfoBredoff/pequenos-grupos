import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { getCurrentLeader } from '@/lib/db/queries';
import { query } from '@/lib/db/postgres';
import { canManageMeetings, SECRETARY_FORBIDDEN_MESSAGE } from '@/lib/auth/permissions';

/**
 * POST /api/meetings
 * Creates a single meeting for the leader's group.
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
    const { meeting_date, meeting_time, title, notes, meeting_type } = data as {
      meeting_date: string;
      meeting_time?: string | null;
      title?: string | null;
      notes?: string | null;
      meeting_type?: 'regular' | 'special_event';
    };

    if (!meeting_date) {
      return NextResponse.json({ error: 'meeting_date é obrigatório' }, { status: 400 });
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(meeting_date)) {
      return NextResponse.json({ error: 'Formato de data inválido (esperado: YYYY-MM-DD)' }, { status: 400 });
    }

    const type = meeting_type === 'special_event' ? 'special_event' : 'regular';

    const result = await query(
      `INSERT INTO meetings (group_id, meeting_date, meeting_time, title, notes, meeting_type, is_cancelled)
       VALUES ($1, $2, $3, $4, $5, $6, FALSE)
       ON CONFLICT (group_id, meeting_date) DO NOTHING
       RETURNING *`,
      [leader.group_id, meeting_date, meeting_time || null, title || null, notes || null, type]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Já existe um encontro nesta data para o grupo' },
        { status: 409 }
      );
    }

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Erro ao criar encontro:', error);
    return NextResponse.json({ error: 'Erro ao criar encontro' }, { status: 500 });
  }
}
