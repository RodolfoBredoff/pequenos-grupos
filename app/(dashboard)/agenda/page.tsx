import { getCurrentLeader } from '@/lib/db/queries';
import { queryOne, queryMany } from '@/lib/db/postgres';
import { AgendaClient } from '@/components/agenda/agenda-client';

export default async function AgendaPage() {
  const leader = await getCurrentLeader();

  if (!leader?.group_id) {
    return <div>Grupo não encontrado.</div>;
  }

  // Buscar configuração do grupo, reuniões e membros em paralelo
  const [group, meetings, pastMeetings, members] = await Promise.all([

    queryOne<{ default_meeting_day: number; default_meeting_time: string }>(
      `SELECT default_meeting_day, default_meeting_time FROM groups WHERE id = $1`,
      [leader.group_id]
    ),
    // Próximas reuniões com todos os campos
    queryMany<{
      id: string;
      group_id: string;
      meeting_date: string;
      meeting_time: string | null;
      is_cancelled: boolean;
      title: string | null;
      notes: string | null;
      meeting_type: 'regular' | 'special_event';
      created_at: string;
    }>(
      `SELECT id, group_id, meeting_date, meeting_time, is_cancelled, title, notes, meeting_type, created_at
       FROM meetings 
       WHERE group_id = $1 
       AND meeting_date >= CURRENT_DATE
       AND is_cancelled = FALSE
       ORDER BY meeting_date ASC
       LIMIT 30`,
      [leader.group_id]
    ),
    // Reuniões passadas com título e contagem de presenças
    queryMany<{
      id: string;
      group_id: string;
      meeting_date: string;
      meeting_time: string | null;
      is_cancelled: boolean;
      title: string | null;
      notes: string | null;
      meeting_type: 'regular' | 'special_event';
      created_at: string;
      attendance_count: number;
    }>(
      `SELECT 
         m.id, m.group_id, m.meeting_date, m.meeting_time, m.is_cancelled, 
         m.title, m.notes, m.meeting_type, m.created_at,
         COUNT(a.id)::int as attendance_count
       FROM meetings m
       LEFT JOIN attendance a ON a.meeting_id = m.id
       WHERE m.group_id = $1 AND m.meeting_date < CURRENT_DATE
       GROUP BY m.id, m.group_id, m.meeting_date, m.meeting_time, m.is_cancelled,
                m.title, m.notes, m.meeting_type, m.created_at
       ORDER BY m.meeting_date DESC
       LIMIT 10`,
      [leader.group_id]
    ),
    // Membros do grupo para edição de presença
    queryMany<{ id: string; full_name: string }>(
      `SELECT id, full_name FROM members WHERE group_id = $1 AND is_active = TRUE ORDER BY full_name ASC`,
      [leader.group_id]
    ),
  ]);

  if (!group) {
    return <div>Configuração do grupo não encontrada.</div>;
  }

  const pastMeetingsWithAttendance = pastMeetings.map((m) => ({
    ...m,
    attendanceCount: m.attendance_count,
  }));

  // Both leaders and secretaries can edit meetings; only leader manages group settings
  const canSettings = leader.role !== 'secretary';

  return (
    <AgendaClient
      meetings={meetings}
      pastMeetings={pastMeetingsWithAttendance}
      group={group}
      members={members}
      readOnly={false}
      canEdit={true}
      canSettings={canSettings}
    />
  );
}
