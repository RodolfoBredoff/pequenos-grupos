import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { getSSMParameter } from '@/lib/aws/ssm-client';
import { queryOne, query } from '@/lib/db/postgres';
import { getCookieSecure } from '@/lib/auth/session';

export interface AdminUser {
  id: string;
  email: string;
  isAdmin: true;
}

export const ADMIN_SESSION_COOKIE = 'pequenos-grupos-admin-session';
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 8; // 8 horas

async function getJwtSecret(): Promise<string> {
  return (
    (await getSSMParameter('/pequenos-grupos/app/secret', true)) ||
    process.env.APP_SECRET ||
    'dev-secret-change-in-production'
  );
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Cria uma sessão de administrador e seta o cookie
 */
export async function createAdminSession(userId: string, email: string): Promise<string> {
  const secret = await getJwtSecret();

  const token = jwt.sign(
    { userId, email, isAdmin: true },
    secret,
    { expiresIn: '8h' }
  );

  const tokenHash = hashToken(token);

  // Armazenar no mesmo schema de sessions (reutilizando a tabela)
  await query(
    `INSERT INTO sessions (user_id, token_hash, expires_at)
     VALUES ($1, $2, NOW() + INTERVAL '8 hours')`,
    [userId, tokenHash]
  );

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: getCookieSecure(),
    sameSite: 'lax',
    maxAge: ADMIN_SESSION_MAX_AGE,
    path: '/',
  });

  return token;
}

/**
 * Verifica e retorna o usuário admin da sessão atual
 */
export async function getAdminSession(): Promise<AdminUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  if (!token) return null;

  try {
    const secret = await getJwtSecret();
    const decoded = jwt.verify(token, secret) as {
      userId: string;
      email: string;
      isAdmin?: boolean;
    };

    if (!decoded.isAdmin) return null;

    const tokenHash = hashToken(token);

    // Verificar se sessão ainda existe no banco
    const session = await queryOne<{ user_id: string }>(
      `SELECT user_id FROM sessions WHERE token_hash = $1 AND expires_at > NOW()`,
      [tokenHash]
    );

    if (!session) return null;

    // Verificar se o usuário ainda é admin no banco
    const user = await queryOne<{ id: string; email: string; is_admin: boolean }>(
      `SELECT id, email, is_admin FROM users WHERE id = $1`,
      [decoded.userId]
    );

    if (!user?.is_admin) return null;

    return { id: user.id, email: user.email, isAdmin: true };
  } catch {
    return null;
  }
}

/**
 * Exige que o usuário seja admin — lança erro caso não seja
 */
export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getAdminSession();
  if (!admin) {
    throw new Error('Acesso negado: requer administrador');
  }
  return admin;
}

/**
 * Faz logout do admin
 */
export async function destroyAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  if (token) {
    const tokenHash = hashToken(token);
    await query(`DELETE FROM sessions WHERE token_hash = $1`, [tokenHash]);
  }

  cookieStore.delete(ADMIN_SESSION_COOKIE);
}
