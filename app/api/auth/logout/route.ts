import { NextResponse } from 'next/server';
import { destroySession } from '@/lib/auth/session';

/**
 * POST /api/auth/logout
 * Remove a sessão atual
 */
export async function POST() {
  try {
    await destroySession();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
    return NextResponse.json(
      { error: 'Erro ao fazer logout' },
      { status: 500 }
    );
  }
}
