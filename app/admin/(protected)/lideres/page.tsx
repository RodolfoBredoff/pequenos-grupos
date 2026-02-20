import { getAdminSession } from '@/lib/auth/admin-session';
import { redirect } from 'next/navigation';
import { queryMany } from '@/lib/db/postgres';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Building2, Group, UserCheck } from 'lucide-react';
import { AdminLeaderActions } from '@/components/admin/admin-leader-actions';
import { AdminAddLeaderDialog } from '@/components/admin/admin-add-leader-dialog';

interface LeaderRow {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: 'leader' | 'secretary' | 'coordinator';
  group_id: string | null;
  group_name: string | null;
  organization_name: string | null;
  leader_name: string | null;
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

function LeaderRow({ leader, groups }: { leader: LeaderRow; groups: GroupOption[] }) {
  return (
    <div className="flex items-center justify-between py-3 border-b last:border-0 gap-4">
      <div className="min-w-0 flex-1">
        <p className="font-medium text-sm">{leader.full_name}</p>
        <p className="text-xs text-muted-foreground">{leader.email}</p>
        {leader.phone && (
          <p className="text-xs text-muted-foreground">{leader.phone}</p>
        )}
        <div className="flex flex-wrap gap-1 mt-1">
          {leader.organization_name && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              {leader.organization_name}
            </span>
          )}
          {leader.group_name && (
            <span className="text-xs text-muted-foreground flex items-center gap-1 ml-2">
              <Group className="h-3 w-3" />
              {leader.group_name}
            </span>
          )}
          {leader.leader_name && (
            <span className="text-xs text-muted-foreground flex items-center gap-1 ml-2">
              <UserCheck className="h-3 w-3" />
              Líder: {leader.leader_name}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {!leader.group_name && leader.role !== 'coordinator' && (
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
  );
}

export default async function AdminLeadersPage() {
  const admin = await getAdminSession();
  if (!admin) redirect('/admin/login');

  const [leaders, organizations, groups] = await Promise.all([
    queryMany<LeaderRow>(
      `SELECT l.id, l.full_name, l.email, l.phone, l.role,
              l.group_id, g.name as group_name,
              o.name as organization_name,
              (
                SELECT l2.full_name
                FROM leaders l2
                WHERE l2.group_id = l.group_id
                  AND l2.role = 'leader'
                  AND l2.id != l.id
                LIMIT 1
              ) as leader_name,
              l.created_at
       FROM leaders l
       LEFT JOIN groups g ON g.id = l.group_id
       LEFT JOIN organizations o ON o.id = l.organization_id
       ORDER BY l.role ASC, l.full_name ASC`
    ),
    queryMany<OrgOption>(`SELECT id, name FROM organizations ORDER BY name ASC`),
    queryMany<GroupOption>(`SELECT id, name, organization_id FROM groups ORDER BY name ASC`),
  ]);

  const coordinators = leaders.filter((l) => l.role === 'coordinator');
  const leadersList = leaders.filter((l) => l.role === 'leader');
  const secretaries = leaders.filter((l) => l.role === 'secretary');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Líderes</h1>
          <p className="text-muted-foreground mt-1">
            {leaders.length} usuário{leaders.length !== 1 ? 's' : ''} cadastrado{leaders.length !== 1 ? 's' : ''}
            {' '}({coordinators.length} coord., {leadersList.length} líder{leadersList.length !== 1 ? 'es' : ''}, {secretaries.length} secret.)
          </p>
        </div>
        <AdminAddLeaderDialog organizations={organizations} groups={groups} />
      </div>

      {/* Coordenadores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4 text-blue-600" />
            Coordenadores
            <Badge variant="secondary" className="ml-1">{coordinators.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {coordinators.length > 0 ? (
            <div className="space-y-0">
              {coordinators.map((leader) => (
                <LeaderRow key={leader.id} leader={leader} groups={groups} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum coordenador cadastrado.</p>
          )}
        </CardContent>
      </Card>

      {/* Líderes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-green-600" />
            Líderes
            <Badge variant="secondary" className="ml-1">{leadersList.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {leadersList.length > 0 ? (
            <div className="space-y-0">
              {leadersList.map((leader) => (
                <LeaderRow key={leader.id} leader={leader} groups={groups} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum líder cadastrado.</p>
          )}
        </CardContent>
      </Card>

      {/* Secretários */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserCheck className="h-4 w-4 text-purple-600" />
            Secretários
            <Badge variant="secondary" className="ml-1">{secretaries.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {secretaries.length > 0 ? (
            <div className="space-y-0">
              {secretaries.map((leader) => (
                <LeaderRow key={leader.id} leader={leader} groups={groups} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum secretário cadastrado.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
