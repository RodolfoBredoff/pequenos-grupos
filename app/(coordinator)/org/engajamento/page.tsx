import { redirect } from 'next/navigation';
import { getCoordinatorSession } from '@/lib/auth/coordinator-session';
import { queryMany } from '@/lib/db/postgres';
import { EngagementClient } from '@/components/dashboard/engagement-client';
import { CoordinatorGroupSelector } from '@/components/coordinator/coordinator-group-selector';

export default async function CoordinatorEngagementPage() {
  const coordinator = await getCoordinatorSession();
  if (!coordinator) redirect('/login');

  const groups = await queryMany<{ id: string; name: string }>(
    `SELECT id, name FROM groups WHERE organization_id = $1 ORDER BY name ASC`,
    [coordinator.organization_id]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Engajamento</h1>
        <p className="text-muted-foreground mt-1 text-sm">Análise de presença por período ou encontro</p>
      </div>
      
      <CoordinatorGroupSelector groups={groups} />
    </div>
  );
}
