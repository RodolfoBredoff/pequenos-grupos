import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { getCurrentLeader } from '@/lib/db/queries';
import { query } from '@/lib/db/postgres';

/**
 * POST /api/members
 * Cria um novo membro. O campo birth_date é opcional.
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
    const { full_name, phone, birth_date, member_type } = data;

    if (!full_name || !phone || !member_type) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: full_name, phone, member_type' },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO members (group_id, full_name, phone, birth_date, member_type)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [leader.group_id, full_name, phone, birth_date || null, member_type]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Erro ao criar membro:', error);
    return NextResponse.json(
      { error: 'Erro ao criar membro' },
      { status: 500 }
    );
  }
}
