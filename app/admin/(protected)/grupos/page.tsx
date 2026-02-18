import { queryMany } from '@/lib/db/postgres';
import { getAdminSession } from '@/lib/auth/admin-session';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Calendar } from 'lucide-react';
import { getDayOfWeekName } from '@/lib/utils';
import Link from 'next/link';
import { AdminGroupActions } from '@/components/admin/admin-group-actions';
import { AdminAddGroupDialog } from '@/components/admin/admin-add-group-dialog';

interface GroupRow {
  id: string;
  name: string;
  organization_name: string;
  default_meeting_day: number;
  default_meeting_time: string;
  leader_name: string | null;
  leader_email: string | null;
  member_count: number;
  created_at: string;
}

export default async function AdminGroupsPage() {
  const admin = await getAdminSession();
  if (!admin) redirect('/admin/login');

  const [groups, organizations] = await Promise.all([
    queryMany<GroupRow>(
    `SELECT 
      g.id, g.name,
      o.name as organization_name,
      g.default_meeting_day, g.default_meeting_time,
      l.full_name as leader_name, l.email as leader_email,
      COUNT(DISTINCT m.id) FILTER (WHERE m.is_active = TRUE) as member_count,
      g.created_at
     FROM groups g
     LEFT JOIN organizations o ON o.id = g.organization_id
     LEFT JOIN leaders l ON l.group_id = g.id
     LEFT JOIN members m ON m.group_id = g.id
     GROUP BY g.id, g.name, o.name, g.default_meeting_day, g.default_meeting_time,
              l.full_name, l.email, g.created_at
     ORDER BY g.name ASC`
    ),
    queryMany<{ id: string; name: string }>(
      `SELECT id, name FROM organizations ORDER BY name ASC`
    ),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Grupos</h1>
          <p className="text-muted-foreground mt-1">
            {groups.length} grupo{groups.length !== 1 ? 's' : ''} cadastrado{groups.length !== 1 ? 's' : ''}
          </p>
        </div>
        <AdminAddGroupDialog organizations={organizations} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {groups.map((group) => (
          <Card key={group.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <CardTitle className="text-base truncate">{group.name}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">{group.organization_name}</p>
                </div>
                <AdminGroupActions groupId={group.id} groupName={group.name} />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  {getDayOfWeekName(group.default_meeting_day)}s, {group.default_meeting_time.substring(0, 5)}
                </span>
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  {group.member_count} membros
                </span>
              </div>

              <div className="flex items-center gap-2">
                {group.leader_name ? (
                  <Badge variant="secondary" className="text-xs font-normal truncate max-w-full">
                    Líder: {group.leader_name}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs text-amber-600 border-amber-300 bg-amber-50">
                    Sem líder vinculado
                  </Badge>
                )}
              </div>

              <Link
                href={`/admin/grupos/${group.id}`}
                className="block text-sm text-primary hover:underline"
              >
                Ver detalhes →
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {groups.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>Nenhum grupo cadastrado ainda.</p>
        </div>
      )}
    </div>
  );
}
