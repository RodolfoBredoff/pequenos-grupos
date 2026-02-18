import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin-session';
import { query, queryOne } from '@/lib/db/postgres';

/**
 * PUT /api/admin/organizations/[id]
 * Atualiza uma organização
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const { name } = await request.json();

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
    }

    await query(
      `UPDATE organizations SET name = $1 WHERE id = $2`,
      [name.trim(), id]
    );

    const updated = await queryOne(
      `SELECT id, name, created_at FROM organizations WHERE id = $1`,
      [id]
    );

    if (!updated) {
      return NextResponse.json({ error: 'Organização não encontrada' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Erro ao atualizar organização:', error);
    return NextResponse.json({ error: 'Erro ao atualizar organização' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/organizations/[id]
 * Remove uma organização (cascata: grupos, membros, líderes vinculados)
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    // Remover líderes (desvincular grupo, depois deletar - users em cascata)
    await query(`UPDATE leaders SET group_id = NULL WHERE organization_id = $1`, [id]);
    await query(`DELETE FROM leaders WHERE organization_id = $1`, [id]);
    // Grupos e dependentes removidos em cascata ao deletar org
    await query(`DELETE FROM organizations WHERE id = $1`, [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao remover organização:', error);
    return NextResponse.json({ error: 'Erro ao remover organização' }, { status: 500 });
  }
}
