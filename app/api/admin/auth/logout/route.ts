import { NextResponse } from 'next/server';
import { destroyAdminSession } from '@/lib/auth/admin-session';

/**
 * POST /api/admin/auth/logout
 * Logout do administrador
 */
export async function POST() {
  try {
    await destroyAdminSession();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro no logout admin:', error);
    return NextResponse.json({ error: 'Erro ao fazer logout' }, { status: 500 });
  }
}
