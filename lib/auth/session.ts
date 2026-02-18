import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { getSSMParameter } from '@/lib/aws/ssm-client';
import { queryOne, query } from '@/lib/db/postgres';

export interface SessionUser {
  id: string;
  email: string;
  emailVerified: boolean;
}

export const SESSION_COOKIE_NAME = 'pequenos-grupos-session';
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 dias

/** secure: true só quando HTTPS (cookies Secure não funcionam em HTTP) */
export function getCookieSecure(): boolean {
  return process.env.NEXT_PUBLIC_APP_URL?.startsWith('https://') ?? false;
}

/**
 * Gera um token JWT para a sessão
 */
async function generateToken(userId: string, email: string): Promise<string> {
  const secret = await getSSMParameter('/pequenos-grupos/app/secret', true) 
    || process.env.APP_SECRET 
    || 'dev-secret-change-in-production';

  return jwt.sign(
    { userId, email },
    secret,
    { expiresIn: '7d' }
  );
}

/**
 * Hash do token para armazenar no banco
 */
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Verifica e decodifica um token JWT
 */
async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const secret = await getSSMParameter('/pequenos-grupos/app/secret', true) 
      || process.env.APP_SECRET 
      || 'dev-secret-change-in-production';

    const decoded = jwt.verify(token, secret) as { userId: string; email: string };
    const tokenHash = hashToken(token);
    
    // Verificar se a sessão ainda existe no banco
    const session = await queryOne<{ user_id: string; expires_at: Date }>(
      `SELECT user_id, expires_at FROM sessions 
       WHERE token_hash = $1 
       AND expires_at > NOW()`,
      [tokenHash]
    );

    if (!session) {
      return null;
    }

    return {
      id: decoded.userId,
      email: decoded.email,
      emailVerified: true, // Simplificado por enquanto
    };
  } catch (error) {
    return null;
  }
}

/**
 * Cria a sessão no banco e retorna o token, sem setar cookie.
 * Use em Route Handlers que precisam setar o cookie na resposta de redirect.
 */
export async function createSessionTokenOnly(userId: string, email: string): Promise<string> {
  const token = await generateToken(userId, email);
  const tokenHash = hashToken(token);
  await query(
    `INSERT INTO sessions (user_id, token_hash, expires_at)
     VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
    [userId, tokenHash]
  );
  return token;
}

/**
 * Cria uma nova sessão para o usuário (Server Components / Server Actions)
 */
export async function createSession(userId: string, email: string): Promise<string> {
  const token = await createSessionTokenOnly(userId, email);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: getCookieSecure(),
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });
  return token;
}

/**
 * Obtém a sessão atual do usuário
 */
export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return verifyToken(token);
}

/**
 * Remove a sessão atual (logout)
 */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    const tokenHash = hashToken(token);
    // Remover do banco
    await query(
      `DELETE FROM sessions WHERE token_hash = $1`,
      [tokenHash]
    );
  }

  // Remover cookie
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Verifica se o usuário está autenticado
 */
export async function requireAuth(): Promise<SessionUser> {
  const user = await getSession();
  
  if (!user) {
    throw new Error('Não autenticado');
  }

  return user;
}
