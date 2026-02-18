/**
 * Gera agenda automática de reuniões baseada nas configurações do grupo
 */

import { query, queryMany } from '@/lib/db/postgres';
import { getCurrentLeader } from '@/lib/db/queries';

interface GroupConfig {
  id: string;
  default_meeting_day: number; // 0 = Domingo, 6 = Sábado
  default_meeting_time: string; // HH:MM:SS
}

/**
 * Gera reuniões para os próximos N dias
 */
export async function generateUpcomingMeetings(daysAhead: number = 90): Promise<void> {
  const leader = await getCurrentLeader();
  
  if (!leader?.group_id) {
    throw new Error('Líder não está vinculado a um grupo');
  }

  // Buscar configuração do grupo
  const group = await query<GroupConfig>(
    `SELECT id, default_meeting_day, default_meeting_time 
     FROM groups WHERE id = $1`,
    [leader.group_id]
  );

  if (group.rows.length === 0) {
    throw new Error('Grupo não encontrado');
  }

  const config = group.rows[0];
  const today = new Date();
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + daysAhead);

  // Buscar reuniões já existentes
  const existingMeetings = await queryMany<{ meeting_date: string }>(
    `SELECT meeting_date FROM meetings 
     WHERE group_id = $1 
     AND meeting_date >= $2 
     AND meeting_date <= $3`,
    [leader.group_id, today.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]
  );

  const existingDates = new Set(existingMeetings.map(m => m.meeting_date));

  // Gerar reuniões
  const meetingsToCreate: Array<{ meeting_date: string }> = [];
  const currentDate = new Date(today);

  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();
    const dateString = currentDate.toISOString().split('T')[0];

    // Verificar se é o dia padrão e se não existe ainda
    if (dayOfWeek === config.default_meeting_day && !existingDates.has(dateString)) {
      meetingsToCreate.push({ meeting_date: dateString });
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Inserir reuniões em lote
  if (meetingsToCreate.length > 0) {
    await query(
      `INSERT INTO meetings (group_id, meeting_date, is_cancelled)
       SELECT $1, meeting_date::date, FALSE
       FROM unnest($2::date[]) AS meeting_date
       ON CONFLICT (group_id, meeting_date) DO NOTHING`,
      [leader.group_id, meetingsToCreate.map(m => m.meeting_date)]
    );
  }
}

/**
 * Marca uma semana como folga (cancela reuniões daquela semana)
 */
export async function markWeekAsHoliday(startDate: string): Promise<void> {
  const leader = await getCurrentLeader();
  
  if (!leader?.group_id) {
    throw new Error('Líder não está vinculado a um grupo');
  }

  const start = new Date(startDate);
  const end = new Date(start);
  end.setDate(end.getDate() + 6); // Semana completa

  await query(
    `UPDATE meetings 
     SET is_cancelled = TRUE
     WHERE group_id = $1
     AND meeting_date >= $2
     AND meeting_date <= $3`,
    [leader.group_id, start.toISOString().split('T')[0], end.toISOString().split('T')[0]]
  );
}
