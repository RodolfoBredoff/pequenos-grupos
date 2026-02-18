import { getCurrentLeader } from '@/lib/db/queries';
import { getMembersByLeaderGroup, getMeetingByDate, upsertMeeting, getAttendanceByMeeting } from '@/lib/db/queries';
import { PresenceChecklist } from '@/components/chamada/presence-checklist';
import { formatDate } from '@/lib/utils';

export default async function ChamadaPage() {
  const leader = await getCurrentLeader();

  if (!leader?.group_id) {
    return <div>Grupo não encontrado.</div>;
  }

  // Buscar ou criar reunião de hoje
  const today = new Date().toISOString().split('T')[0];
  
  let meeting = await getMeetingByDate(today);

  if (!meeting) {
    try {
      meeting = await upsertMeeting({
        meeting_date: today,
        is_cancelled: false,
      });
    } catch (error) {
      console.error('Error creating meeting:', error);
      return <div>Erro ao criar reunião de hoje.</div>;
    }
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

  // Buscar membros ativos e presenças em paralelo
  const [members, attendance] = await Promise.all([
    getMembersByLeaderGroup(),
    getAttendanceByMeeting(meeting.id),
  ]);

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
