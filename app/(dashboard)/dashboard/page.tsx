import { redirect } from 'next/navigation';
import { getCurrentLeader, getUnreadNotifications, getGroupStats } from '@/lib/db/queries';
import { queryOne, queryMany } from '@/lib/db/postgres';
import { AlertsPanel } from '@/components/dashboard/alerts-panel';
import { StatsCards } from '@/components/dashboard/stats-cards';

export default async function DashboardPage() {
  const leader = await getCurrentLeader();

  // Coordinators have their own panel
  if (leader?.role === 'coordinator') {
    redirect('/org/dashboard');
  }

  if (!leader?.group_id) {
    return (
      <div className="space-y-6 max-w-2xl">
        <h1 className="text-3xl font-bold">Bem-vindo!</h1>
        <p className="text-muted-foreground">
          O dashboard só aparece quando seu usuário está vinculado a um grupo.
        </p>
        <p className="text-sm text-muted-foreground">
          Entre em contato com o administrador para vincular seu usuário a um grupo.
        </p>
      </div>
    );
  }

  // Buscar nome do grupo e dados base
  const [group, notifications, stats] = await Promise.all([
    queryOne<{ name: string }>(
      `SELECT name FROM groups WHERE id = $1`,
      [leader.group_id]
    ),
    getUnreadNotifications(),
    getGroupStats(),
  ]);

  // Buscar próximos encontros (separado para não derrubar o dashboard se falhar)
  let upcomingMeetings: Array<{ id: string; meeting_date: string; title: string | null; meeting_time: string | null }> = [];
  try {
    upcomingMeetings = await queryMany<{ id: string; meeting_date: string; title: string | null; meeting_time: string | null }>(
      `SELECT id, meeting_date, title, meeting_time
       FROM meetings
       WHERE group_id = $1
         AND meeting_date >= CURRENT_DATE
         AND is_cancelled = FALSE
       ORDER BY meeting_date ASC
       LIMIT 5`,
      [leader.group_id]
    );
  } catch (e) {
    console.error('[Dashboard] Erro ao buscar próximos encontros:', e);
  }

  // Buscar próximos aniversariantes ordenados por proximidade do aniversário
  let upcomingBirthdays: Array<{ id: string; full_name: string; birth_date: string; member_type: string; phone: string | null }> = [];
  try {
    upcomingBirthdays = await queryMany<{ id: string; full_name: string; birth_date: string; member_type: string; phone: string | null }>(
      `SELECT id, full_name, birth_date, member_type, phone
       FROM members
       WHERE group_id = $1
         AND is_active = TRUE
         AND birth_date IS NOT NULL
       ORDER BY
         CASE
           WHEN TO_DATE(
             TO_CHAR(CURRENT_DATE, 'YYYY') || TO_CHAR(birth_date, '-MM-DD'),
             'YYYY-MM-DD'
           ) >= CURRENT_DATE
           THEN TO_DATE(
             TO_CHAR(CURRENT_DATE, 'YYYY') || TO_CHAR(birth_date, '-MM-DD'),
             'YYYY-MM-DD'
           ) - CURRENT_DATE
           ELSE TO_DATE(
             TO_CHAR(CURRENT_DATE + INTERVAL '1 year', 'YYYY') || TO_CHAR(birth_date, '-MM-DD'),
             'YYYY-MM-DD'
           ) - CURRENT_DATE
         END
       LIMIT 5`,
      [leader.group_id]
    );
  } catch (e) {
    console.error('[Dashboard] Erro ao buscar aniversariantes:', e);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">{group?.name ?? 'Meu Grupo'}</p>
      </div>

      <StatsCards
        totalMembers={stats.totalMembers}
        totalParticipants={stats.participants}
      />

      <AlertsPanel
        notifications={notifications}
        upcomingMeetings={upcomingMeetings}
        upcomingBirthdays={upcomingBirthdays}
      />
    </div>
  );
}
