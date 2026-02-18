import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { saveAttendance } from '@/lib/db/queries';

/**
 * POST /api/attendance
 * Salva presenças de uma reunião
 */
export async function POST(request: Request) {
  try {
    await requireAuth();

    const data = await request.json();
    const { meeting_id, attendance } = data;

    if (!meeting_id || !Array.isArray(attendance)) {
      return NextResponse.json(
        { error: 'meeting_id e attendance são obrigatórios' },
        { status: 400 }
      );
    }

    await saveAttendance(meeting_id, attendance);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao salvar presenças:', error);
    return NextResponse.json(
      { error: 'Erro ao salvar presenças' },
      { status: 500 }
    );
  }
}
