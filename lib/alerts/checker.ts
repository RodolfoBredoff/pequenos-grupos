/**
 * Verifica e cria alertas automáticos (faltas consecutivas e aniversários)
 * Executado pelo cron sem sessão de usuário - processa TODOS os grupos
 */

import { query, queryMany } from '@/lib/db/postgres';

const CONSECUTIVE_ABSENCES_THRESHOLD = 2; // Alerta após 2 faltas consecutivas

/**
 * Verifica faltas consecutivas e cria alertas para todos os grupos
 */
export async function checkConsecutiveAbsences(): Promise<number> {
  const groups = await queryMany<{ id: string }>(
    `SELECT id FROM groups`
  );

  let alertsCreated = 0;

  for (const group of groups) {
    const members = await queryMany<{ id: string; full_name: string }>(
      `SELECT id, full_name FROM members 
       WHERE group_id = $1 AND is_active = TRUE`,
      [group.id]
    );

    for (const member of members) {
      const absences = await queryMany<{ meeting_date: string; is_present: boolean }>(
        `SELECT * FROM get_consecutive_absences($1, $2)`,
        [member.id, CONSECUTIVE_ABSENCES_THRESHOLD + 1]
      );

      let consecutiveAbsences = 0;
      for (const absence of absences) {
        if (!absence.is_present) {
          consecutiveAbsences++;
        } else {
          break;
        }
      }

      if (consecutiveAbsences >= CONSECUTIVE_ABSENCES_THRESHOLD) {
        const existingAlert = await query(
          `SELECT id FROM notifications 
           WHERE group_id = $1 
           AND member_id = $2 
           AND notification_type = 'absence_alert'
           AND created_at > NOW() - INTERVAL '7 days'`,
          [group.id, member.id]
        );

        if (existingAlert.rows.length === 0) {
          await query(
            `INSERT INTO notifications (group_id, notification_type, member_id, message)
             VALUES ($1, 'absence_alert', $2, $3)`,
            [
              group.id,
              member.id,
              `${member.full_name} tem ${consecutiveAbsences} faltas consecutivas. Considere entrar em contato.`,
            ]
          );
          alertsCreated++;
        }
      }
    }
  }

  return alertsCreated;
}

/**
 * Verifica aniversariantes do dia e cria notificações para todos os grupos
 * O líder vê as notificações no painel de alertas do dashboard
 */
export async function checkBirthdaysToday(): Promise<number> {
  const groups = await queryMany<{ id: string }>(
    `SELECT id FROM groups`
  );

  let notificationsCreated = 0;
  const today = new Date().toISOString().split('T')[0];

  for (const group of groups) {
    const birthdays = await queryMany<{ id: string; full_name: string; phone: string }>(
      `SELECT * FROM get_birthdays_today($1)`,
      [group.id]
    );

    for (const person of birthdays) {
      const existingNotification = await query(
        `SELECT id FROM notifications 
         WHERE group_id = $1 
         AND member_id = $2 
         AND notification_type = 'birthday'
         AND DATE(created_at) = $3`,
        [group.id, person.id, today]
      );

      if (existingNotification.rows.length === 0) {
        await query(
          `INSERT INTO notifications (group_id, notification_type, member_id, message)
           VALUES ($1, 'birthday', $2, $3)`,
          [
            group.id,
            person.id,
            `🎉 Hoje é aniversário de ${person.full_name}!`,
          ]
        );
        notificationsCreated++;
      }
    }
  }

  return notificationsCreated;
}

/**
 * Executa todas as verificações de alertas (para todos os grupos)
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
