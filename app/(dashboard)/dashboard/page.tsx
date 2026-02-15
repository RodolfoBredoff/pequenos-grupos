import { createClient } from '@/lib/supabase/server';
import { AlertsPanel } from '@/components/dashboard/alerts-panel';
import { StatsCards } from '@/components/dashboard/stats-cards';

export default async function DashboardPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  // Buscar dados do líder (sem join para evitar problema de nome da relação no Supabase)
  const { data: leader, error: leaderError } = await supabase
    .from('leaders')
    .select('id, group_id')
    .eq('id', user!.id)
    .single();

  if (leaderError || !leader?.group_id) {
    return (
      <div className="space-y-6 max-w-2xl">
        <h1 className="text-3xl font-bold">Bem-vindo!</h1>
        <p className="text-muted-foreground">
          O dashboard só aparece quando seu usuário está vinculado a um grupo. Siga os passos abaixo no Supabase.
        </p>

        <div className="rounded-lg border bg-muted/30 p-4 space-y-3 text-sm">
          <p className="font-medium">1. Conferir o UUID do seu usuário</p>
          <p className="text-muted-foreground">
            No Supabase: <strong>Authentication → Users</strong>. Copie o <code className="bg-muted px-1 rounded">id</code> (UUID) do usuário com qual você fez login.
          </p>

          <p className="font-medium">2. Inserir organização, grupo e líder (se ainda não fez)</p>
          <p className="text-muted-foreground">
            No <strong>SQL Editor</strong>, execute em sequência (trocando os UUIDs pelos que você anotou):
          </p>
          <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`-- Organização (anote o id retornado)
INSERT INTO organizations (name) VALUES ('Minha Igreja') RETURNING id;

-- Grupo (substitua UUID_ORGANIZACAO)
INSERT INTO groups (organization_id, name, default_meeting_day, default_meeting_time)
VALUES ('UUID_ORGANIZACAO', 'Meu Grupo', 3, '19:00:00') RETURNING id;

-- Líder (substitua UUID_USUARIO, UUID_ORGANIZACAO, UUID_GRUPO)
INSERT INTO leaders (id, organization_id, group_id, full_name, email)
VALUES ('UUID_USUARIO', 'UUID_ORGANIZACAO', 'UUID_GRUPO', 'Seu Nome', 'seu@email.com');`}
          </pre>

          <p className="font-medium">3. Liberar leitura da sua linha em leaders (RLS)</p>
          <p className="text-muted-foreground">
            Sem esta policy, o app não consegue ler seu registro mesmo que ele exista. No <strong>SQL Editor</strong>, execute:
          </p>
          <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`CREATE POLICY "leaders_select_own_row" ON leaders
  FOR SELECT USING (id = auth.uid());`}
          </pre>
          <p className="text-muted-foreground">
            Se der erro &quot;already exists&quot;, a policy já está criada — faça logout e login de novo e recarregue esta página.
          </p>
        </div>

        <p className="text-sm text-muted-foreground">
          Depois de executar o passo 3, faça <strong>logout e login novamente</strong> e recarregue o dashboard.
        </p>
      </div>
    );
  }

  // Nome do grupo (para exibição)
  const { data: group } = await supabase
    .from('groups')
    .select('name')
    .eq('id', leader.group_id)
    .single();

  // Buscar notificações não lidas
  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('group_id', leader.group_id)
    .eq('is_read', false)
    .order('created_at', { ascending: false })
    .limit(10);

  // Buscar estatísticas
  const { count: totalMembers } = await supabase
    .from('members')
    .select('*', { count: 'exact', head: true })
    .eq('group_id', leader.group_id)
    .eq('is_active', true);

  const { count: totalParticipants } = await supabase
    .from('members')
    .select('*', { count: 'exact', head: true })
    .eq('group_id', leader.group_id)
    .eq('member_type', 'participant')
    .eq('is_active', true);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">{group?.name ?? 'Meu Grupo'}</p>
      </div>
      
      <StatsCards
        totalMembers={totalMembers || 0}
        totalParticipants={totalParticipants || 0}
      />
      
      <AlertsPanel notifications={notifications || []} />
    </div>
  );
}
