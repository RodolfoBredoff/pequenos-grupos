export const MEMBER_TYPES = {
  PARTICIPANT: 'participant',
  VISITOR: 'visitor',
} as const;

export const MEMBER_TYPE_LABELS = {
  [MEMBER_TYPES.PARTICIPANT]: 'Participante',
  [MEMBER_TYPES.VISITOR]: 'Visitante',
};

export const NOTIFICATION_TYPES = {
  ABSENCE_ALERT: 'absence_alert',
  BIRTHDAY: 'birthday',
} as const;

export const NOTIFICATION_TYPE_LABELS = {
  [NOTIFICATION_TYPES.ABSENCE_ALERT]: 'Alerta de Faltas',
  [NOTIFICATION_TYPES.BIRTHDAY]: 'Aniversário',
};

export const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' },
];

export const MAX_CONSECUTIVE_ABSENCES = 3;
