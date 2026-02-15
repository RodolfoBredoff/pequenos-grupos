import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate, getDayOfWeekName } from '@/lib/utils';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';

export default async function AgendaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data: leader } = await supabase
    .from('leaders')
    .select('group_id')
    .eq('id', user!.id)
    .single();

  if (!leader?.group_id) {
    return <div>Grupo não encontrado.</div>;
  }

  const { data: group } = await supabase
    .from('groups')
    .select('default_meeting_day, default_meeting_time')
    .eq('id', leader.group_id)
    .single();

  // Buscar próximas reuniões (próximos 30 dias)
  const today = new Date().toISOString().split('T')[0];
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 30);
  const future = futureDate.toISOString().split('T')[0];

  const { data: meetings } = await supabase
    .from('meetings')
    .select('*')
    .eq('group_id', leader.group_id)
    .gte('meeting_date', today)
    .lte('meeting_date', future)
    .order('meeting_date', { ascending: true });

  // Buscar reuniões passadas (últimas 10)
  const { data: pastMeetings } = await supabase
    .from('meetings')
    .select('*, attendance(count)')
    .eq('group_id', leader.group_id)
    .lt('meeting_date', today)
    .order('meeting_date', { ascending: false })
    .limit(10);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Agenda</h1>
        <p className="text-muted-foreground">
          Reuniões às {group ? `${getDayOfWeekName(group.default_meeting_day)}s, ${group.default_meeting_time}` : '—'}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Próximas Reuniões */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Próximas Reuniões
            </CardTitle>
          </CardHeader>
          <CardContent>
            {meetings && meetings.length > 0 ? (
              <div className="space-y-3">
                {meetings.map((meeting) => (
                  <div
                    key={meeting.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{formatDate(meeting.meeting_date)}</p>
                      {meeting.notes && (
                        <p className="text-sm text-muted-foreground">{meeting.notes}</p>
                      )}
                    </div>
                    {meeting.is_cancelled ? (
                      <Badge variant="destructive">Cancelada</Badge>
                    ) : (
                      <Badge>Confirmada</Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhuma reunião agendada para os próximos 30 dias.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Reuniões Passadas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Histórico Recente
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pastMeetings && pastMeetings.length > 0 ? (
              <div className="space-y-3">
                {pastMeetings.map((meeting) => {
                  const attendanceCount = Array.isArray(meeting.attendance) 
                    ? meeting.attendance[0]?.count || 0
                    : 0;
                  
                  return (
                    <div
                      key={meeting.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{formatDate(meeting.meeting_date)}</p>
                        {meeting.is_cancelled ? (
                          <p className="text-sm text-muted-foreground">Cancelada</p>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            {attendanceCount} {attendanceCount === 1 ? 'registro' : 'registros'} de presença
                          </p>
                        )}
                      </div>
                      {meeting.is_cancelled && <Badge variant="outline">Folga</Badge>}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhuma reunião no histórico.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuração do Grupo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Dia da Semana:</span>
            <span className="font-medium">{getDayOfWeekName(group.default_meeting_day)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Horário:</span>
            <span className="font-medium">{group.default_meeting_time}</span>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Para alterar o dia ou horário padrão das reuniões, entre em contato com o administrador.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
