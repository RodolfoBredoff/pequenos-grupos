import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { markNotificationAsRead } from '@/lib/db/queries';

/**
 * PUT /api/notifications/[id]
 * Marca uma notificação como lida
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth();

    await markNotificationAsRead(params.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao marcar notificação como lida:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar notificação' },
      { status: 500 }
    );
  }
}
