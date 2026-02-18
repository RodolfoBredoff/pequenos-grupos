import { getCurrentLeader, getUnreadNotifications, getGroupStats } from '@/lib/db/queries';
import { queryOne, queryMany } from '@/lib/db/postgres';
import { AlertsPanel } from '@/components/dashboard/alerts-panel';
import { StatsCards } from '@/components/dashboard/stats-cards';

export default async function DashboardPage() {
  const leader = await getCurrentLeader();

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

  // Buscar nome do grupo, notificações, estatísticas, próximos encontros e próximos aniversariantes em paralelo
  const [group, notifications, stats, upcomingMeetings, upcomingBirthdays] = await Promise.all([
    queryOne<{ name: string }>(
      `SELECT name FROM groups WHERE id = $1`,
      [leader.group_id]
    ),
    getUnreadNotifications(),
    getGroupStats(),
    queryMany<{ id: string; meeting_date: string; title: string | null; meeting_time: string | null }>(
      `SELECT id, meeting_date, title, meeting_time
       FROM meetings
       WHERE group_id = $1
         AND meeting_date >= CURRENT_DATE
         AND is_cancelled = FALSE
       ORDER BY meeting_date ASC
       LIMIT 5`,
      [leader.group_id]
    ),
    queryMany<{ id: string; full_name: string; birth_date: string; member_type: string }>(
      `SELECT id, full_name, birth_date, member_type
       FROM members
       WHERE group_id = $1
         AND is_active = TRUE
         AND birth_date IS NOT NULL
       ORDER BY
         -- Próximos aniversários no ano: calcula distância em dias até o próximo aniversário
         (DATE_PART('doy', (DATE_TRUNC('year', CURRENT_DATE) + (birth_date - DATE_TRUNC('year', birth_date)))) -
          DATE_PART('doy', CURRENT_DATE) + 366) % 366
       LIMIT 5`,
      [leader.group_id]
    ),
  ]);

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
