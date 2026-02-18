import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin-session';
import { queryMany, query } from '@/lib/db/postgres';

/**
 * GET /api/admin/organizations
 * Lista todas as organizações
 */
export async function GET() {
  try {
    await requireAdmin();

    const orgs = await queryMany<{
      id: string;
      name: string;
      created_at: string;
    }>(`SELECT id, name, created_at FROM organizations ORDER BY name ASC`);

    return NextResponse.json(orgs);
  } catch (error) {
    console.error('Erro ao listar organizações:', error);
    return NextResponse.json({ error: 'Erro ao listar organizações' }, { status: 500 });
  }
}

/**
 * POST /api/admin/organizations
 * Cria uma nova organização
 */
export async function POST(request: Request) {
  try {
    await requireAdmin();

    const { name } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
    }

    const result = await query(
      `INSERT INTO organizations (name) VALUES ($1) RETURNING *`,
      [name]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Erro ao criar organização:', error);
    return NextResponse.json({ error: 'Erro ao criar organização' }, { status: 500 });
  }
}
