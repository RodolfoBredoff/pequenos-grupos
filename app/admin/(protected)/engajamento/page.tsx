import { getAdminSession } from '@/lib/auth/admin-session';
import { redirect } from 'next/navigation';
import { queryMany } from '@/lib/db/postgres';
import { AdminEngagementClient } from '@/components/admin/admin-engagement-client';

export default async function AdminEngajamentoPage() {
  const admin = await getAdminSession();
  if (!admin) redirect('/admin/login');

  const groups = await queryMany<{ id: string; name: string }>(
    `SELECT id, name FROM groups ORDER BY name ASC`
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Engajamento por Grupo</h1>
        <p className="text-muted-foreground mt-1">
          Gráficos de presença/ausência por grupo. Selecione um grupo para ver as estatísticas.
        </p>
      </div>

      <AdminEngagementClient groups={groups} />
    </div>
  );
}
