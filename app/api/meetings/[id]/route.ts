import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { getCurrentLeader } from '@/lib/db/queries';
import { query, queryOne } from '@/lib/db/postgres';
import { canManageMeetings, SECRETARY_FORBIDDEN_MESSAGE } from '@/lib/auth/permissions';

/**
 * PUT /api/meetings/[id]
 * Atualiza uma reunião (data, horário, cancelamento, notas)
 * Apenas o líder do grupo pode editar reuniões do seu grupo
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    // Verificar se a reunião pertence ao grupo do líder
    const existing = await queryOne<{ id: string; group_id: string; meeting_date: string }>(
      `SELECT id, group_id, meeting_date FROM meetings WHERE id = $1`,
      [id]
    );

    if (!existing || existing.group_id !== leader.group_id) {
      return NextResponse.json(
        { error: 'Reunião não encontrada' },
        { status: 404 }
      );
    }

    const data = await request.json();
    const { meeting_date, meeting_time, is_cancelled, title, notes } = data;

    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (meeting_date !== undefined) {
      updates.push(`meeting_date = $${paramIndex++}`);
      values.push(meeting_date);
    }
    if (meeting_time !== undefined) {
      updates.push(`meeting_time = $${paramIndex++}`);
      values.push(meeting_time || null);
    }
    if (is_cancelled !== undefined) {
      updates.push(`is_cancelled = $${paramIndex++}`);
      values.push(is_cancelled);
    }
    if (title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      values.push(title || null);
    }
    if (notes !== undefined) {
      updates.push(`notes = $${paramIndex++}`);
      values.push(notes || null);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 });
    }

    values.push(id);
    const result = await query(
      `UPDATE meetings SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar reunião:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar reunião' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/meetings/[id]
 * Remove uma reunião futura do grupo
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    const existing = await queryOne<{ id: string; group_id: string }>(
      `SELECT id, group_id FROM meetings WHERE id = $1`,
      [id]
    );

    if (!existing || existing.group_id !== leader.group_id) {
      return NextResponse.json({ error: 'Reunião não encontrada' }, { status: 404 });
    }

    await query(`DELETE FROM meetings WHERE id = $1`, [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao remover reunião:', error);
    return NextResponse.json(
      { error: 'Erro ao remover reunião' },
      { status: 500 }
    );
  }
}
