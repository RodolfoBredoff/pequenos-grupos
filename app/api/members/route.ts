import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { createMember, getCurrentLeader } from '@/lib/db/queries';

/**
 * POST /api/members
 * Cria um novo membro
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

    const member = await createMember({
      full_name,
      phone,
      birth_date: birth_date || null,
      member_type,
    });

    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar membro:', error);
    return NextResponse.json(
      { error: 'Erro ao criar membro' },
      { status: 500 }
    );
  }
}
