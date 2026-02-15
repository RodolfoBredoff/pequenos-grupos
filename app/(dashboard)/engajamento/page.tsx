import { createClient } from '@/lib/supabase/server';
import { EngagementChart } from '@/components/dashboard/engagement-chart';

async function getEngagementData(groupId: string) {
  const supabase = await createClient();

  // Buscar últimos 6 meses de dados
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const { data: meetings } = await supabase
    .from('meetings')
    .select('id, meeting_date, attendance(member_id, is_present, members(full_name))')
    .eq('group_id', groupId)
    .eq('is_cancelled', false)
    .gte('meeting_date', sixMonthsAgo.toISOString().split('T')[0])
    .order('meeting_date', { ascending: true });

  // Processar dados mensais
  const monthlyData: Record<string, { presentes: number; ausentes: number }> = {};
  const memberStats: Record<string, { presences: number; absences: number; name: string }> = {};

  meetings?.forEach((meeting) => {
    const date = new Date(meeting.meeting_date);
    const monthKey = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { presentes: 0, ausentes: 0 };
    }

    const attendanceArray = Array.isArray(meeting.attendance) ? meeting.attendance : [];

    attendanceArray.forEach((att: any) => {
      if (att.is_present) {
        monthlyData[monthKey].presentes++;
      } else {
        monthlyData[monthKey].ausentes++;
      }

      // Estatísticas por membro
      const memberId = att.member_id;
      const memberName = att.members?.full_name || 'Desconhecido';
      
      if (!memberStats[memberId]) {
        memberStats[memberId] = { presences: 0, absences: 0, name: memberName };
      }

      if (att.is_present) {
        memberStats[memberId].presences++;
      } else {
        memberStats[memberId].absences++;
      }
    });
  });

  // Formatar dados mensais para o gráfico
  const chartData = Object.entries(monthlyData).map(([month, data]) => ({
    month,
    presentes: data.presentes,
    ausentes: data.ausentes,
    taxa: data.presentes + data.ausentes > 0
      ? Math.round((data.presentes / (data.presentes + data.ausentes)) * 100)
      : 0,
  }));

  // Calcular Top 5 Mais Presentes
  const topPresent = Object.values(memberStats)
    .filter(m => m.presences + m.absences > 0)
    .map(m => ({
      name: m.name,
      presencas: m.presences,
      faltas: m.absences,
      taxa: Math.round((m.presences / (m.presences + m.absences)) * 100),
    }))
    .sort((a, b) => b.presencas - a.presencas)
    .slice(0, 5);

  // Calcular Top 5 Mais Ausentes
  const topAbsent = Object.values(memberStats)
    .filter(m => m.presences + m.absences > 0 && m.absences > 0)
    .map(m => ({
      name: m.name,
      presencas: m.presences,
      faltas: m.absences,
      taxa: Math.round((m.presences / (m.presences + m.absences)) * 100),
    }))
    .sort((a, b) => b.faltas - a.faltas)
    .slice(0, 5);

  // Membros com 100% de presença
  const perfectAttendance = Object.values(memberStats)
    .filter(m => m.presences > 0 && m.absences === 0)
    .map(m => m.name);

  return {
    chartData,
    topPresent,
    topAbsent,
    perfectAttendance,
  };
}

export default async function EngajamentoPage() {
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

  const { chartData, topPresent, topAbsent, perfectAttendance } = await getEngagementData(leader.group_id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard de Engajamento</h1>
        <p className="text-muted-foreground">Análise de presença dos últimos 6 meses</p>
      </div>

      {chartData.length > 0 ? (
        <EngagementChart
          monthlyData={chartData}
          topPresent={topPresent}
          topAbsent={topAbsent}
          perfectAttendance={perfectAttendance}
        />
      ) : (
        <div className="text-center py-12 border rounded-lg">
          <p className="text-lg">Sem dados de presença ainda.</p>
          <p className="text-muted-foreground mt-2">
            Comece registrando presenças para ver as análises.
          </p>
        </div>
      )}
    </div>
  );
}
