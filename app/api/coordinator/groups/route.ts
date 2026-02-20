import { NextResponse } from 'next/server';
import { requireCoordinator } from '@/lib/auth/coordinator-session';
import { query, queryMany } from '@/lib/db/postgres';

/**
 * GET /api/coordinator/groups
 * Returns all groups in the coordinator's organization.
 */
export async function GET() {
  try {
    const coordinator = await requireCoordinator();

    const groups = await queryMany<{
      id: string;
      name: string;
      organization_id: string;
      default_meeting_day: number;
      default_meeting_time: string;
      leader_count: number;
      member_count: number;
      created_at: string;
    }>(
      `SELECT
         g.id,
         g.name,
         g.organization_id,
         g.default_meeting_day,
         g.default_meeting_time,
         COUNT(DISTINCT l.id) FILTER (WHERE l.role IN ('leader','secretary')) AS leader_count,
         COUNT(DISTINCT m.id) FILTER (WHERE m.is_active = TRUE) AS member_count,
         g.created_at
       FROM groups g
       LEFT JOIN leaders l ON l.group_id = g.id
       LEFT JOIN members m ON m.group_id = g.id
       WHERE g.organization_id = $1
       GROUP BY g.id
       ORDER BY g.name ASC`,
      [coordinator.organization_id]
    );

    return NextResponse.json(groups);
  } catch (error) {
    console.error('Erro ao listar grupos:', error);
    return NextResponse.json({ error: 'Acesso negado ou erro interno' }, { status: 403 });
  }
}

/**
 * POST /api/coordinator/groups
 * Creates a new group in the coordinator's organization.
 */
export async function POST(request: Request) {
  try {
    const coordinator = await requireCoordinator();
    const { name, default_meeting_day, default_meeting_time } = await request.json();

    if (!name || default_meeting_day === undefined || !default_meeting_time) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: name, default_meeting_day, default_meeting_time' },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO groups (organization_id, name, default_meeting_day, default_meeting_time)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [coordinator.organization_id, name, default_meeting_day, default_meeting_time]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Erro ao criar grupo:', error);
    return NextResponse.json({ error: 'Acesso negado ou erro interno' }, { status: 403 });
  }
}
