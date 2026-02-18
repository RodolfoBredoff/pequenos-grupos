import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin-session';
import { query, queryMany } from '@/lib/db/postgres';

/**
 * GET /api/admin/groups
 * Lista todos os grupos com seus líderes e contagem de membros
 */
export async function GET() {
  try {
    await requireAdmin();

    const groups = await queryMany<{
      id: string;
      name: string;
      organization_id: string;
      organization_name: string;
      default_meeting_day: number;
      default_meeting_time: string;
      leader_id: string | null;
      leader_name: string | null;
      leader_email: string | null;
      member_count: number;
      created_at: string;
    }>(
      `SELECT 
        g.id,
        g.name,
        g.organization_id,
        o.name as organization_name,
        g.default_meeting_day,
        g.default_meeting_time,
        l.id as leader_id,
        l.full_name as leader_name,
        l.email as leader_email,
        COUNT(DISTINCT m.id) FILTER (WHERE m.is_active = TRUE) as member_count,
        g.created_at
       FROM groups g
       LEFT JOIN organizations o ON o.id = g.organization_id
       LEFT JOIN leaders l ON l.group_id = g.id
       LEFT JOIN members m ON m.group_id = g.id
       GROUP BY g.id, g.name, g.organization_id, o.name, g.default_meeting_day, 
                g.default_meeting_time, l.id, l.full_name, l.email, g.created_at
       ORDER BY g.name ASC`
    );

    return NextResponse.json(groups);
  } catch (error) {
    console.error('Erro ao listar grupos:', error);
    return NextResponse.json({ error: 'Erro ao listar grupos' }, { status: 500 });
  }
}

/**
 * POST /api/admin/groups
 * Cria um novo grupo
 */
export async function POST(request: Request) {
  try {
    await requireAdmin();

    const { name, organization_id, default_meeting_day, default_meeting_time } =
      await request.json();

    if (!name || !organization_id || default_meeting_day === undefined || !default_meeting_time) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: name, organization_id, default_meeting_day, default_meeting_time' },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO groups (organization_id, name, default_meeting_day, default_meeting_time)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [organization_id, name, default_meeting_day, default_meeting_time]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Erro ao criar grupo:', error);
    return NextResponse.json({ error: 'Erro ao criar grupo' }, { status: 500 });
  }
}
