/**
 * Verifica e cria alertas automáticos (faltas consecutivas e aniversários)
 */

import { query, queryMany } from '@/lib/db/postgres';
import { getCurrentLeader } from '@/lib/db/queries';

const CONSECUTIVE_ABSENCES_THRESHOLD = 2; // Alerta após 2 faltas consecutivas

/**
 * Verifica faltas consecutivas e cria alertas
 */
export async function checkConsecutiveAbsences(): Promise<number> {
  const leader = await getCurrentLeader();
  
  if (!leader?.group_id) {
    return 0;
  }

  // Buscar todos os membros ativos do grupo
  const members = await queryMany<{ id: string; full_name: string }>(
    `SELECT id, full_name FROM members 
     WHERE group_id = $1 AND is_active = TRUE`,
    [leader.group_id]
  );

  let alertsCreated = 0;

  for (const member of members) {
    // Buscar últimas presenças usando a função do banco
    const absences = await queryMany<{ meeting_date: string; is_present: boolean }>(
      `SELECT * FROM get_consecutive_absences($1, $2)`,
      [member.id, CONSECUTIVE_ABSENCES_THRESHOLD + 1]
    );

    // Verificar se há faltas consecutivas
    let consecutiveAbsences = 0;
    for (const absence of absences) {
      if (!absence.is_present) {
        consecutiveAbsences++;
      } else {
        break; // Parar na primeira presença
      }
    }

    // Se atingiu o threshold, criar alerta
    if (consecutiveAbsences >= CONSECUTIVE_ABSENCES_THRESHOLD) {
      // Verificar se já existe alerta recente (últimos 7 dias)
      const existingAlert = await query(
        `SELECT id FROM notifications 
         WHERE group_id = $1 
         AND member_id = $2 
         AND notification_type = 'absence_alert'
         AND created_at > NOW() - INTERVAL '7 days'`,
        [leader.group_id, member.id]
      );

      if (existingAlert.rows.length === 0) {
        await query(
          `INSERT INTO notifications (group_id, notification_type, member_id, message)
           VALUES ($1, 'absence_alert', $2, $3)`,
          [
            leader.group_id,
            member.id,
            `${member.full_name} tem ${consecutiveAbsences} faltas consecutivas. Considere entrar em contato.`,
          ]
        );
        alertsCreated++;
      }
    }
  }

  return alertsCreated;
}

/**
 * Verifica aniversariantes do dia e cria notificações
 */
export async function checkBirthdaysToday(): Promise<number> {
  const leader = await getCurrentLeader();
  
  if (!leader?.group_id) {
    return 0;
  }

  // Usar função do banco para buscar aniversariantes
  const birthdays = await queryMany<{ id: string; full_name: string; phone: string }>(
    `SELECT * FROM get_birthdays_today($1)`,
    [leader.group_id]
  );

  let notificationsCreated = 0;

  for (const person of birthdays) {
    // Verificar se já existe notificação hoje
    const today = new Date().toISOString().split('T')[0];
    const existingNotification = await query(
      `SELECT id FROM notifications 
       WHERE group_id = $1 
       AND member_id = $2 
       AND notification_type = 'birthday'
       AND DATE(created_at) = $3`,
      [leader.group_id, person.id, today]
    );

    if (existingNotification.rows.length === 0) {
      await query(
        `INSERT INTO notifications (group_id, notification_type, member_id, message)
         VALUES ($1, 'birthday', $2, $3)`,
        [
          leader.group_id,
          person.id,
          `🎉 Hoje é aniversário de ${person.full_name}!`,
        ]
      );
      notificationsCreated++;
    }
  }

  return notificationsCreated;
}

/**
 * Executa todas as verificações de alertas
 */
export async function runAllChecks(): Promise<{
  absenceAlerts: number;
  birthdayNotifications: number;
}> {
  const [absenceAlerts, birthdayNotifications] = await Promise.all([
    checkConsecutiveAbsences(),
    checkBirthdaysToday(),
  ]);

  return {
    absenceAlerts,
    birthdayNotifications,
  };
}
