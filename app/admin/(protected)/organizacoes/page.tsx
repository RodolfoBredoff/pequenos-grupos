import { getAdminSession } from '@/lib/auth/admin-session';
import { redirect } from 'next/navigation';
import { queryMany } from '@/lib/db/postgres';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2 } from 'lucide-react';
import { AdminAddOrgDialog } from '@/components/admin/admin-add-org-dialog';

interface OrgRow {
  id: string;
  name: string;
  group_count: number;
  leader_count: number;
  created_at: string;
}

export default async function AdminOrganizationsPage() {
  const admin = await getAdminSession();
  if (!admin) redirect('/admin/login');

  const orgs = await queryMany<OrgRow>(
    `SELECT 
      o.id, o.name, o.created_at,
      COUNT(DISTINCT g.id)::int as group_count,
      COUNT(DISTINCT l.id)::int as leader_count
     FROM organizations o
     LEFT JOIN groups g ON g.organization_id = o.id
     LEFT JOIN leaders l ON l.organization_id = o.id
     GROUP BY o.id, o.name, o.created_at
     ORDER BY o.name ASC`
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Organizações</h1>
          <p className="text-muted-foreground mt-1">
            {orgs.length} organização{orgs.length !== 1 ? 'ões' : ''} cadastrada{orgs.length !== 1 ? 's' : ''}
          </p>
        </div>
        <AdminAddOrgDialog />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Todas as Organizações
          </CardTitle>
        </CardHeader>
        <CardContent>
          {orgs.length > 0 ? (
            <div className="space-y-0">
              {orgs.map((org) => (
                <div
                  key={org.id}
                  className="flex items-center justify-between py-3 border-b last:border-0 gap-4"
                >
                  <div>
                    <p className="font-medium text-sm">{org.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {org.group_count} grupo{org.group_count !== 1 ? 's' : ''} ·{' '}
                      {org.leader_count} líder{org.leader_count !== 1 ? 'es' : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhuma organização cadastrada.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
