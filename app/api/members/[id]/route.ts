import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { updateMember, getMemberById } from '@/lib/db/queries';

/**
 * PUT /api/members/[id]
 * Atualiza um membro existente
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth();

    const data = await request.json();
    const { full_name, phone, birth_date, member_type, is_active } = data;

    const updateData: any = {};
    if (full_name !== undefined) updateData.full_name = full_name;
    if (phone !== undefined) updateData.phone = phone;
    if (birth_date !== undefined) updateData.birth_date = birth_date;
    if (member_type !== undefined) updateData.member_type = member_type;
    if (is_active !== undefined) updateData.is_active = is_active;

    const member = await updateMember(params.id, updateData);

    if (!member) {
      return NextResponse.json(
        { error: 'Membro não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(member);
  } catch (error) {
    console.error('Erro ao atualizar membro:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar membro' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/members/[id]
 * Remove um membro (soft delete)
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth();

    const success = await updateMember(params.id, { is_active: false });

    if (!success) {
      return NextResponse.json(
        { error: 'Membro não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao remover membro:', error);
    return NextResponse.json(
      { error: 'Erro ao remover membro' },
      { status: 500 }
    );
  }
}
