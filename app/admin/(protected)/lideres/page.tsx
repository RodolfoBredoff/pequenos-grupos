import { getAdminSession } from '@/lib/auth/admin-session';
import { redirect } from 'next/navigation';
import { queryMany } from '@/lib/db/postgres';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';
import { AdminLeaderActions } from '@/components/admin/admin-leader-actions';
import { AdminAddLeaderDialog } from '@/components/admin/admin-add-leader-dialog';

interface LeaderRow {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  group_id: string | null;
  group_name: string | null;
  organization_name: string | null;
  created_at: string;
}

interface OrgOption {
  id: string;
  name: string;
}

interface GroupOption {
  id: string;
  name: string;
  organization_id: string;
}

export default async function AdminLeadersPage() {
  const admin = await getAdminSession();
  if (!admin) redirect('/admin/login');

  const [leaders, organizations, groups] = await Promise.all([
    queryMany<LeaderRow>(
      `SELECT l.id, l.full_name, l.email, l.phone,
              l.group_id, g.name as group_name,
              o.name as organization_name,
              l.created_at
       FROM leaders l
       LEFT JOIN groups g ON g.id = l.group_id
       LEFT JOIN organizations o ON o.id = l.organization_id
       ORDER BY l.full_name ASC`
    ),
    queryMany<OrgOption>(`SELECT id, name FROM organizations ORDER BY name ASC`),
    queryMany<GroupOption>(`SELECT id, name, organization_id FROM groups ORDER BY name ASC`),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Líderes</h1>
          <p className="text-muted-foreground mt-1">
            {leaders.length} líder{leaders.length !== 1 ? 'es' : ''} cadastrado{leaders.length !== 1 ? 's' : ''}
          </p>
        </div>
        <AdminAddLeaderDialog organizations={organizations} groups={groups} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Todos os Líderes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {leaders.length > 0 ? (
            <div className="space-y-0">
              {leaders.map((leader) => (
                <div
                  key={leader.id}
                  className="flex items-center justify-between py-3 border-b last:border-0 gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm">{leader.full_name}</p>
                    <p className="text-xs text-muted-foreground">{leader.email}</p>
                    {leader.phone && (
                      <p className="text-xs text-muted-foreground">{leader.phone}</p>
                    )}
                    {leader.organization_name && (
                      <p className="text-xs text-muted-foreground">{leader.organization_name}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {leader.group_name ? (
                      <Badge variant="secondary" className="text-xs">
                        {leader.group_name}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs text-amber-600 border-amber-300 bg-amber-50">
                        Sem grupo
                      </Badge>
                    )}
                    <AdminLeaderActions
                      leader={{ ...leader, group_id: leader.group_id ?? null }}
                      groups={groups}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum líder cadastrado.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
