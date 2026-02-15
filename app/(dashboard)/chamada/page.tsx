import { createClient } from '@/lib/supabase/server';
import { PresenceChecklist } from '@/components/chamada/presence-checklist';
import { formatDate } from '@/lib/utils';

export default async function ChamadaPage() {
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

  // Buscar ou criar reunião de hoje
  const today = new Date().toISOString().split('T')[0];
  
  let { data: meeting } = await supabase
    .from('meetings')
    .select('*')
    .eq('group_id', leader.group_id)
    .eq('meeting_date', today)
    .maybeSingle();

  if (!meeting) {
    const { data: newMeeting, error } = await supabase
      .from('meetings')
      .insert({ 
        group_id: leader.group_id, 
        meeting_date: today,
        is_cancelled: false
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating meeting:', error);
      return <div>Erro ao criar reunião de hoje.</div>;
    }
    meeting = newMeeting;
  }

  // Verificar se a reunião foi cancelada
  if (meeting.is_cancelled) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Chamada</h1>
        <div className="text-center py-12 border rounded-lg">
          <p className="text-lg">Esta reunião foi marcada como cancelada.</p>
          <p className="text-muted-foreground mt-2">
            Verifique a agenda para mais detalhes.
          </p>
        </div>
      </div>
    );
  }

  // Buscar membros ativos
  const { data: members } = await supabase
    .from('members')
    .select('*')
    .eq('group_id', leader.group_id)
    .eq('is_active', true)
    .order('full_name');

  // Buscar presenças já registradas
  const { data: attendance } = await supabase
    .from('attendance')
    .select('*')
    .eq('meeting_id', meeting.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Chamada</h1>
        <p className="text-muted-foreground">{formatDate(today)}</p>
      </div>

      {members && members.length > 0 ? (
        <PresenceChecklist
          meetingId={meeting.id}
          members={members}
          attendance={attendance || []}
        />
      ) : (
        <div className="text-center py-12 border rounded-lg">
          <p className="text-lg">Nenhum membro cadastrado no grupo.</p>
          <p className="text-muted-foreground mt-2">
            Cadastre pessoas primeiro para fazer a chamada.
          </p>
        </div>
      )}
    </div>
  );
}
