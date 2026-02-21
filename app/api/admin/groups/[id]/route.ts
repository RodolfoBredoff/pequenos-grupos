import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin-session';
import { query, queryOne, queryMany } from '@/lib/db/postgres';

/**
 * GET /api/admin/groups/[id]
 * Detalhes completos de um grupo: configurações, líder, membros, reuniões recentes
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const [group, members, recentMeetings] = await Promise.all([
      queryOne<{
        id: string;
        name: string;
        organization_id: string;
        organization_name: string;
        default_meeting_day: number;
        default_meeting_time: string;
        leader_id: string | null;
        leader_name: string | null;
        leader_email: string | null;
        leader_phone: string | null;
        created_at: string;
        updated_at: string;
      }>(
        `SELECT 
          g.id, g.name, g.organization_id, o.name as organization_name,
          g.default_meeting_day, g.default_meeting_time,
          l.id as leader_id, l.full_name as leader_name, l.email as leader_email, l.phone as leader_phone,
          g.created_at, g.updated_at
         FROM groups g
         LEFT JOIN organizations o ON o.id = g.organization_id
         LEFT JOIN leaders l ON l.group_id = g.id
         WHERE g.id = $1`,
        [id]
      ),
      queryMany<{
        id: string;
        full_name: string;
        phone: string;
        birth_date: string;
        member_type: string;
        is_active: boolean;
        created_at: string;
      }>(
        `SELECT id, full_name, phone, birth_date, member_type, is_active, created_at
         FROM members WHERE group_id = $1 ORDER BY full_name ASC`,
        [id]
      ),
      queryMany<{
        id: string;
        meeting_date: string;
        is_cancelled: boolean;
        attendance_count: number;
      }>(
        `SELECT m.id, m.meeting_date, m.is_cancelled,
                (COUNT(a.id) FILTER (WHERE a.is_present = TRUE)::int + COALESCE(MAX(ag.guest_count), 0)) as attendance_count
         FROM meetings m
         LEFT JOIN attendance a ON a.meeting_id = m.id
         LEFT JOIN (SELECT meeting_id, COUNT(*)::int as guest_count FROM attendance_guests GROUP BY meeting_id) ag ON ag.meeting_id = m.id
         WHERE m.group_id = $1
         GROUP BY m.id, m.meeting_date, m.is_cancelled
         ORDER BY m.meeting_date DESC
         LIMIT 10`,
        [id]
      ),
    ]);

    if (!group) {
      return NextResponse.json({ error: 'Grupo não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ group, members, recentMeetings });
  } catch (error) {
    console.error('Erro ao buscar grupo:', error);
    return NextResponse.json({ error: 'Erro ao buscar grupo' }, { status: 500 });
  }
}

/**
 * PUT /api/admin/groups/[id]
 * Atualiza dados do grupo (nome, dia, horário, líder)
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const data = await request.json();

    const { name, default_meeting_day, default_meeting_time, leader_id } = data;

    // Atualizar grupo
    if (name !== undefined || default_meeting_day !== undefined || default_meeting_time !== undefined) {
      const updates: string[] = [];
      const values: unknown[] = [];
      let i = 1;

      if (name !== undefined) { updates.push(`name = $${i++}`); values.push(name); }
      if (default_meeting_day !== undefined) { updates.push(`default_meeting_day = $${i++}`); values.push(default_meeting_day); }
      if (default_meeting_time !== undefined) { updates.push(`default_meeting_time = $${i++}`); values.push(default_meeting_time); }

      values.push(id);
      await query(
        `UPDATE groups SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${i}`,
        values
      );
    }

    // Atualizar líder do grupo
    if (leader_id !== undefined) {
      // Desvincular líder atual do grupo
      await query(
        `UPDATE leaders SET group_id = NULL WHERE group_id = $1`,
        [id]
      );

      if (leader_id) {
        // Vincular novo líder
        await query(
          `UPDATE leaders SET group_id = $1 WHERE id = $2`,
          [id, leader_id]
        );
      }
    }

    const updated = await queryOne(
      `SELECT g.*, l.id as leader_id, l.full_name as leader_name
       FROM groups g
       LEFT JOIN leaders l ON l.group_id = g.id
       WHERE g.id = $1`,
      [id]
    );

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Erro ao atualizar grupo:', error);
    return NextResponse.json({ error: 'Erro ao atualizar grupo' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/groups/[id]
 * Remove um grupo (cascata: remove membros, reuniões, etc.)
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    await query(`DELETE FROM groups WHERE id = $1`, [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao remover grupo:', error);
    return NextResponse.json({ error: 'Erro ao remover grupo' }, { status: 500 });
  }
}
