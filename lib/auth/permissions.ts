export type LeaderRole = 'leader' | 'secretary';

export function isSecretary(role: LeaderRole | string): boolean {
  return role === 'secretary';
}

export function canManageMeetings(role: LeaderRole | string): boolean {
  return role === 'leader';
}

export function canManageSettings(role: LeaderRole | string): boolean {
  return role === 'leader';
}

export function canManageSecretaries(role: LeaderRole | string): boolean {
  return role === 'leader';
}

export function canDeleteMembers(role: LeaderRole | string): boolean {
  return role === 'leader';
}

export const SECRETARY_FORBIDDEN_MESSAGE =
  'Secretários não têm permissão para executar esta ação.';
