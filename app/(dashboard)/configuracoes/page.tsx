import { getCurrentLeader } from '@/lib/db/queries';
import { queryOne } from '@/lib/db/postgres';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LeaderGroupSettingsForm } from '@/components/dashboard/leader-group-settings-form';

export default async function ConfiguracoesPage() {
  const leader = await getCurrentLeader();

  if (!leader?.group_id) {
    return (
      <div className="space-y-6 max-w-2xl">
        <h1 className="text-3xl font-bold">Configurações do Grupo</h1>
        <p className="text-muted-foreground">
          Você não está vinculado a um grupo. Entre em contato com o administrador.
        </p>
      </div>
    );
  }

  const group = await queryOne<{
    id: string;
    name: string;
    default_meeting_day: number;
    default_meeting_time: string;
  }>(
    `SELECT id, name, default_meeting_day, default_meeting_time 
     FROM groups WHERE id = $1`,
    [leader.group_id]
  );

  if (!group) {
    return (
      <div className="space-y-6 max-w-2xl">
        <h1 className="text-3xl font-bold">Configurações do Grupo</h1>
        <p className="text-muted-foreground">Grupo não encontrado.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold mb-2">Configurações do Grupo</h1>
        <p className="text-muted-foreground">
          Edite o dia e horário padrão das reuniões do grupo <strong>{group.name}</strong>
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dia e Horário das Reuniões</CardTitle>
        </CardHeader>
        <CardContent>
          <LeaderGroupSettingsForm
            defaultMeetingDay={group.default_meeting_day}
            defaultMeetingTime={group.default_meeting_time}
          />
        </CardContent>
      </Card>
    </div>
  );
}
