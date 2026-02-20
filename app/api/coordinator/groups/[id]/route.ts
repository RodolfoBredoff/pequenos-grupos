import { NextResponse } from 'next/server';
import { requireCoordinator } from '@/lib/auth/coordinator-session';
import { query, queryOne, queryMany } from '@/lib/db/postgres';

async function verifyGroupOwnership(groupId: string, orgId: string) {
  return queryOne<{ id: string }>(
    `SELECT id FROM groups WHERE id = $1 AND organization_id = $2`,
    [groupId, orgId]
  );
}

/**
 * GET /api/coordinator/groups/[id]
 * Returns a single group with its leaders and members.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const coordinator = await requireCoordinator();
    const { id } = await params;

    const group = await queryOne<{
      id: string;
      name: string;
      default_meeting_day: number;
      default_meeting_time: string;
      organization_id: string;
    }>(
      `SELECT id, name, default_meeting_day, default_meeting_time, organization_id
       FROM groups WHERE id = $1 AND organization_id = $2`,
      [id, coordinator.organization_id]
    );

    if (!group) {
      return NextResponse.json({ error: 'Grupo não encontrado' }, { status: 404 });
    }

    const [leaders, members] = await Promise.all([
      queryMany<{ id: string; full_name: string; email: string; phone: string | null; role: string }>(
        `SELECT id, full_name, email, phone, role FROM leaders
         WHERE group_id = $1 AND role IN ('leader','secretary')
         ORDER BY full_name ASC`,
        [id]
      ),
      queryMany<{ id: string; full_name: string; member_type: string; is_active: boolean }>(
        `SELECT id, full_name, member_type, is_active FROM members
         WHERE group_id = $1
         ORDER BY full_name ASC`,
        [id]
      ),
    ]);

    return NextResponse.json({ group, leaders, members });
  } catch (error) {
    console.error('Erro ao buscar grupo:', error);
    return NextResponse.json({ error: 'Acesso negado ou erro interno' }, { status: 403 });
  }
}

/**
 * PUT /api/coordinator/groups/[id]
 * Updates a group's settings.
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const coordinator = await requireCoordinator();
    const { id } = await params;

    const existing = await verifyGroupOwnership(id, coordinator.organization_id);
    if (!existing) {
      return NextResponse.json({ error: 'Grupo não encontrado' }, { status: 404 });
    }

    const { name, default_meeting_day, default_meeting_time } = await request.json();

    const updates: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (name !== undefined) { updates.push(`name = $${idx++}`); values.push(name); }
    if (default_meeting_day !== undefined) { updates.push(`default_meeting_day = $${idx++}`); values.push(default_meeting_day); }
    if (default_meeting_time !== undefined) { updates.push(`default_meeting_time = $${idx++}`); values.push(default_meeting_time); }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 });
    }

    values.push(id);
    const result = await query(
      `UPDATE groups SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${idx} RETURNING *`,
      values
    );

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar grupo:', error);
    return NextResponse.json({ error: 'Acesso negado ou erro interno' }, { status: 403 });
  }
}

/**
 * DELETE /api/coordinator/groups/[id]
 * Deletes a group.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const coordinator = await requireCoordinator();
    const { id } = await params;

    const existing = await verifyGroupOwnership(id, coordinator.organization_id);
    if (!existing) {
      return NextResponse.json({ error: 'Grupo não encontrado' }, { status: 404 });
    }

    await query(`DELETE FROM groups WHERE id = $1`, [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao remover grupo:', error);
    return NextResponse.json({ error: 'Acesso negado ou erro interno' }, { status: 403 });
  }
}
