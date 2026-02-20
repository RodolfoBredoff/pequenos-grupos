import { requireAuth } from '@/lib/auth/session';
import { queryOne } from '@/lib/db/postgres';

export interface CoordinatorUser {
  id: string;
  organization_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: 'coordinator';
}

/**
 * Returns the current coordinator or null if the logged-in user is not a coordinator.
 */
export async function getCoordinatorSession(): Promise<CoordinatorUser | null> {
  try {
    const user = await requireAuth();
    const leader = await queryOne<{
      id: string;
      organization_id: string;
      full_name: string;
      email: string;
      phone: string | null;
      role: string;
    }>(
      `SELECT id, organization_id, full_name, email, phone, role
       FROM leaders WHERE id = $1 AND role = 'coordinator'`,
      [user.id]
    );
    if (!leader) return null;
    return { ...leader, role: 'coordinator' };
  } catch {
    return null;
  }
}

/**
 * Requires the logged-in user to be a coordinator.
 * Throws an error if not.
 */
export async function requireCoordinator(): Promise<CoordinatorUser> {
  const coordinator = await getCoordinatorSession();
  if (!coordinator) {
    throw new Error('Acesso negado: requer coordenador');
  }
  return coordinator;
}
