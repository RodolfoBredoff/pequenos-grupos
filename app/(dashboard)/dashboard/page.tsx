import { getCurrentLeader, getUnreadNotifications, getGroupStats } from '@/lib/db/queries';
import { queryOne } from '@/lib/db/postgres';
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

  // Buscar nome do grupo
  const group = await queryOne<{ name: string }>(
    `SELECT name FROM groups WHERE id = $1`,
    [leader.group_id]
  );

  // Buscar notificações e estatísticas em paralelo
  const [notifications, stats] = await Promise.all([
    getUnreadNotifications(),
    getGroupStats(),
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
      
      <AlertsPanel notifications={notifications} />
    </div>
  );
}
