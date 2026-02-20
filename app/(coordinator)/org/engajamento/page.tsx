import { redirect } from 'next/navigation';
import { getCoordinatorSession } from '@/lib/auth/coordinator-session';
import { queryMany } from '@/lib/db/postgres';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Group } from 'lucide-react';
import Link from 'next/link';

export default async function CoordinatorEngagementPage() {
  const coordinator = await getCoordinatorSession();
  if (!coordinator) redirect('/login');

  const groupStats = await queryMany<{
    id: string;
    name: string;
    total_members: number;
    total_meetings: number;
    avg_rate: number;
  }>(
    `SELECT
       g.id,
       g.name,
       COUNT(DISTINCT m.id) FILTER (WHERE m.is_active = TRUE) AS total_members,
       COUNT(DISTINCT mt.id) FILTER (WHERE mt.meeting_date >= CURRENT_DATE - INTERVAL '90 days' AND mt.is_cancelled = FALSE) AS total_meetings,
       COALESCE(
         ROUND(
           100.0 * COUNT(a.id) FILTER (WHERE a.is_present = TRUE) /
           NULLIF(COUNT(a.id) FILTER (WHERE mt2.meeting_date >= CURRENT_DATE - INTERVAL '90 days'), 0)
         , 0), 0
       ) AS avg_rate
     FROM groups g
     LEFT JOIN members m ON m.group_id = g.id
     LEFT JOIN meetings mt ON mt.group_id = g.id
     LEFT JOIN meetings mt2 ON mt2.group_id = g.id AND mt2.meeting_date >= CURRENT_DATE - INTERVAL '90 days' AND mt2.is_cancelled = FALSE
     LEFT JOIN attendance a ON a.meeting_id = mt2.id
     WHERE g.organization_id = $1
     GROUP BY g.id, g.name
     ORDER BY g.name ASC`,
    [coordinator.organization_id]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Engajamento</h1>
        <p className="text-muted-foreground mt-1">Taxa de presença nos últimos 90 dias por grupo</p>
      </div>

      {groupStats.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Nenhum grupo cadastrado ainda.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {groupStats.map((group) => (
            <Link key={group.id} href={`/org/grupos/${group.id}`}>
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Group className="h-4 w-4" />
                    {group.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Taxa de presença</span>
                      <Badge
                        variant={group.avg_rate >= 70 ? 'default' : group.avg_rate >= 50 ? 'secondary' : 'destructive'}
                        className="text-sm font-bold"
                      >
                        {group.avg_rate}%
                      </Badge>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          group.avg_rate >= 70 ? 'bg-green-500' : group.avg_rate >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${group.avg_rate}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{group.total_members} membros</span>
                      <span>{group.total_meetings} encontros</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
