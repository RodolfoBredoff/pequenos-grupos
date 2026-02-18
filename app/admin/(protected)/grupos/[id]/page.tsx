import { getAdminSession } from '@/lib/auth/admin-session';
import { redirect, notFound } from 'next/navigation';
import { queryOne, queryMany } from '@/lib/db/postgres';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getDayOfWeekName, formatDate } from '@/lib/utils';
import { Users, Calendar, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { AdminEditGroupForm } from '@/components/admin/admin-edit-group-form';

interface GroupDetails {
  id: string;
  name: string;
  organization_id: string;
  organization_name: string;
  default_meeting_day: number;
  default_meeting_time: string;
  leader_id: string | null;
  leader_name: string | null;
  leader_email: string | null;
  created_at: string;
}

interface MemberRow {
  id: string;
  full_name: string;
  phone: string;
  birth_date: string;
  member_type: 'participant' | 'visitor';
  is_active: boolean;
}

interface MeetingRow {
  id: string;
  meeting_date: string;
  is_cancelled: boolean;
  attendance_count: number;
}

interface LeaderOption {
  id: string;
  full_name: string;
  email: string;
  group_id: string | null;
}

export default async function AdminGroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await getAdminSession();
  if (!admin) redirect('/admin/login');

  const { id } = await params;

  const [group, members, meetings, allLeaders] = await Promise.all([
    queryOne<GroupDetails>(
      `SELECT g.id, g.name, g.organization_id, o.name as organization_name,
              g.default_meeting_day, g.default_meeting_time,
              l.id as leader_id, l.full_name as leader_name, l.email as leader_email,
              g.created_at
       FROM groups g
       LEFT JOIN organizations o ON o.id = g.organization_id
       LEFT JOIN leaders l ON l.group_id = g.id
       WHERE g.id = $1`,
      [id]
    ),
    queryMany<MemberRow>(
      `SELECT id, full_name, phone, birth_date, member_type, is_active
       FROM members WHERE group_id = $1 ORDER BY full_name ASC`,
      [id]
    ),
    queryMany<MeetingRow>(
      `SELECT m.id, m.meeting_date, m.is_cancelled,
              COUNT(a.id) FILTER (WHERE a.is_present = TRUE)::int as attendance_count
       FROM meetings m
       LEFT JOIN attendance a ON a.meeting_id = m.id
       WHERE m.group_id = $1
       GROUP BY m.id, m.meeting_date, m.is_cancelled
       ORDER BY m.meeting_date DESC
       LIMIT 20`,
      [id]
    ),
    queryMany<LeaderOption>(
      `SELECT id, full_name, email, group_id FROM leaders ORDER BY full_name ASC`
    ),
  ]);

  if (!group) notFound();

  const activeMembers = members.filter((m) => m.is_active);
  const inactiveMembers = members.filter((m) => !m.is_active);
  const participants = activeMembers.filter((m) => m.member_type === 'participant');
  const visitors = activeMembers.filter((m) => m.member_type === 'visitor');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link
          href="/admin/grupos"
          className="mt-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{group.name}</h1>
          <p className="text-muted-foreground">{group.organization_name}</p>
        </div>
      </div>

      {/* Editar configurações */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações do Grupo</CardTitle>
        </CardHeader>
        <CardContent>
          <AdminEditGroupForm
            group={group}
            allLeaders={allLeaders}
          />
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold">{activeMembers.length}</p>
            <p className="text-sm text-muted-foreground">Membros ativos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold">{participants.length}</p>
            <p className="text-sm text-muted-foreground">Participantes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold">{visitors.length}</p>
            <p className="text-sm text-muted-foreground">Visitantes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold">{meetings.length}</p>
            <p className="text-sm text-muted-foreground">Reuniões (últ. 20)</p>
          </CardContent>
        </Card>
      </div>

      {/* Membros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Membros ({activeMembers.length} ativos
            {inactiveMembers.length > 0 && `, ${inactiveMembers.length} inativos`})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeMembers.length > 0 ? (
            <div className="space-y-2">
              {activeMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div>
                    <p className="font-medium text-sm">{member.full_name}</p>
                    <p className="text-xs text-muted-foreground">{member.phone}</p>
                  </div>
                  <Badge
                    variant={member.member_type === 'participant' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {member.member_type === 'participant' ? 'Participante' : 'Visitante'}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum membro ativo.</p>
          )}
        </CardContent>
      </Card>

      {/* Reuniões recentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Reuniões Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {meetings.length > 0 ? (
            <div className="space-y-2">
              {meetings.map((meeting) => (
                <div
                  key={meeting.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <p className="text-sm font-medium">{formatDate(meeting.meeting_date)}</p>
                  <div className="flex items-center gap-2">
                    {!meeting.is_cancelled && (
                      <span className="text-xs text-muted-foreground">
                        {meeting.attendance_count} presente{meeting.attendance_count !== 1 ? 's' : ''}
                      </span>
                    )}
                    {meeting.is_cancelled ? (
                      <Badge variant="outline" className="text-xs">Cancelada</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">Realizada</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhuma reunião registrada.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
