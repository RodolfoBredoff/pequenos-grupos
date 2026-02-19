import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { getCurrentLeader } from '@/lib/db/queries';
import { query, queryOne } from '@/lib/db/postgres';
import { canManageSecretaries, SECRETARY_FORBIDDEN_MESSAGE } from '@/lib/auth/permissions';

/**
 * DELETE /api/secretaries/[id]
 * Remove um secretário do grupo. Apenas líderes podem executar esta ação.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const leader = await getCurrentLeader();

    if (!leader?.group_id) {
      return NextResponse.json({ error: 'Líder não está vinculado a um grupo' }, { status: 400 });
    }

    if (!canManageSecretaries(leader.role)) {
      return NextResponse.json({ error: SECRETARY_FORBIDDEN_MESSAGE }, { status: 403 });
    }

    const { id } = await params;

    // Garantir que o secretário pertence ao grupo do líder
    const secretary = await queryOne<{ id: string; group_id: string; role: string }>(
      `SELECT id, group_id, role FROM leaders WHERE id = $1`,
      [id]
    );

    if (!secretary || secretary.group_id !== leader.group_id || secretary.role !== 'secretary') {
      return NextResponse.json({ error: 'Secretário não encontrado' }, { status: 404 });
    }

    // Remove o vínculo de secretário (deleta o registro de leader)
    await query(`DELETE FROM leaders WHERE id = $1`, [id]);
    // Remove também a conta de usuário para manter consistência
    await query(`DELETE FROM users WHERE id = $1`, [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao remover secretário:', error);
    return NextResponse.json({ error: 'Erro ao remover secretário' }, { status: 500 });
  }
}
