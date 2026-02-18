import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { getCurrentLeader } from '@/lib/db/queries';
import { saveAttendance, getAttendanceByMeeting } from '@/lib/db/queries';
import { queryOne } from '@/lib/db/postgres';

/**
 * GET /api/attendance?meeting_id=uuid
 * Retorna presenças de uma reunião do grupo do líder
 */
export async function GET(request: Request) {
  try {
    await requireAuth();
    const leader = await getCurrentLeader();
    if (!leader?.group_id) {
      return NextResponse.json({ error: 'Líder não vinculado a um grupo' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const meetingId = searchParams.get('meeting_id');
    if (!meetingId) {
      return NextResponse.json({ error: 'meeting_id é obrigatório' }, { status: 400 });
    }

    const meeting = await queryOne<{ id: string; group_id: string }>(
      `SELECT id, group_id FROM meetings WHERE id = $1`,
      [meetingId]
    );
    if (!meeting || meeting.group_id !== leader.group_id) {
      return NextResponse.json({ error: 'Reunião não encontrada' }, { status: 404 });
    }

    const attendance = await getAttendanceByMeeting(meetingId);
    return NextResponse.json(attendance);
  } catch (error) {
    console.error('Erro ao buscar presenças:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

/**
 * POST /api/attendance
 * Salva presenças de uma reunião
 */
export async function POST(request: Request) {
  try {
    await requireAuth();
    const leader = await getCurrentLeader();
    if (!leader?.group_id) {
      return NextResponse.json({ error: 'Líder não vinculado a um grupo' }, { status: 400 });
    }

    const data = await request.json();
    const { meeting_id, attendance } = data;

    if (!meeting_id || !Array.isArray(attendance)) {
      return NextResponse.json(
        { error: 'meeting_id e attendance são obrigatórios' },
        { status: 400 }
      );
    }

    const meeting = await queryOne<{ id: string; group_id: string }>(
      `SELECT id, group_id FROM meetings WHERE id = $1`,
      [meeting_id]
    );
    if (!meeting || meeting.group_id !== leader.group_id) {
      return NextResponse.json({ error: 'Reunião não encontrada' }, { status: 404 });
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
