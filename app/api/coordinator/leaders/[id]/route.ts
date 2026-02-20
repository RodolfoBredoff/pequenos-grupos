import { NextResponse } from 'next/server';
import { requireCoordinator } from '@/lib/auth/coordinator-session';
import { query, queryOne } from '@/lib/db/postgres';

/**
 * PUT /api/coordinator/leaders/[id]
 * Updates a leader/secretary in the coordinator's org.
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const coordinator = await requireCoordinator();
    const { id } = await params;

    const existing = await queryOne<{ id: string }>(
      `SELECT id FROM leaders WHERE id = $1 AND organization_id = $2 AND role IN ('leader','secretary')`,
      [id, coordinator.organization_id]
    );

    if (!existing) {
      return NextResponse.json({ error: 'Líder não encontrado' }, { status: 404 });
    }

    const { full_name, phone, group_id, role } = await request.json();

    if (group_id) {
      const groupCheck = await query(
        `SELECT id FROM groups WHERE id = $1 AND organization_id = $2`,
        [group_id, coordinator.organization_id]
      );
      if (groupCheck.rows.length === 0) {
        return NextResponse.json({ error: 'Grupo não pertence à sua organização' }, { status: 403 });
      }
    }

    const updates: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (full_name !== undefined) { updates.push(`full_name = $${idx++}`); values.push(full_name); }
    if (phone !== undefined) { updates.push(`phone = $${idx++}`); values.push(phone || null); }
    if (group_id !== undefined) { updates.push(`group_id = $${idx++}`); values.push(group_id || null); }
    if (role !== undefined && (role === 'leader' || role === 'secretary')) {
      updates.push(`role = $${idx++}`);
      values.push(role);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 });
    }

    values.push(id);
    const result = await query(
      `UPDATE leaders SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar líder:', error);
    return NextResponse.json({ error: 'Acesso negado ou erro interno' }, { status: 403 });
  }
}

/**
 * DELETE /api/coordinator/leaders/[id]
 * Removes a leader from the coordinator's org.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const coordinator = await requireCoordinator();
    const { id } = await params;

    const existing = await queryOne<{ id: string }>(
      `SELECT id FROM leaders WHERE id = $1 AND organization_id = $2 AND role IN ('leader','secretary')`,
      [id, coordinator.organization_id]
    );

    if (!existing) {
      return NextResponse.json({ error: 'Líder não encontrado' }, { status: 404 });
    }

    await query(`DELETE FROM leaders WHERE id = $1`, [id]);
    await query(`DELETE FROM users WHERE id = $1`, [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao remover líder:', error);
    return NextResponse.json({ error: 'Acesso negado ou erro interno' }, { status: 403 });
  }
}
