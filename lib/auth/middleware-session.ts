/**
 * Versão simplificada de getSession para uso no Edge Runtime (middleware)
 * Não faz queries ao banco - apenas decodifica o JWT do cookie
 * A validação completa é feita nas páginas/API routes que rodam no Node.js runtime
 */

import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';

export interface SessionUser {
  id: string;
  email: string;
  emailVerified: boolean;
}

export interface AdminSessionUser {
  id: string;
  email: string;
  isAdmin: true;
}

const SESSION_COOKIE_NAME = 'pequenos-grupos-session';
const ADMIN_SESSION_COOKIE = 'pequenos-grupos-admin-session';

/**
 * Decodifica base64 URL-safe (usado em JWTs)
 */
function base64UrlDecode(str: string): string {
  // Adicionar padding se necessário
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) {
    str += '=';
  }
  
  // Decodificar usando atob (disponível no Edge Runtime)
  try {
    return atob(str);
  } catch {
    return '';
  }
}

/**
 * Obtém a sessão apenas do cookie (sem validar no banco)
 * Usado no middleware que roda no Edge Runtime
 */
export async function getSessionFromCookie(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  // No Edge Runtime, apenas decodificamos o JWT sem verificar assinatura
  // A validação completa (incluindo verificação no banco) será feita nas páginas/API routes
  
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Decodificar payload (base64 URL-safe)
    const payloadJson = base64UrlDecode(parts[1]);
    if (!payloadJson) {
      return null;
    }

    const payload = JSON.parse(payloadJson);

    // Verificar se não expirou (validação básica)
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return null;
    }

    // Verificar se tem os campos necessários
    if (!payload.userId || !payload.email) {
      return null;
    }

    return {
      id: payload.userId,
      email: payload.email,
      emailVerified: true,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Decodifica o JWT do cookie de admin sem validar no banco
 * Usado no middleware (Edge Runtime)
 */
export async function getAdminSessionFromCookie(
  request?: NextRequest
): Promise<AdminSessionUser | null> {
  let token: string | undefined;

  if (request) {
    // Ler diretamente do request (mais confiável no middleware)
    token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  } else {
    const cookieStore = await cookies();
    token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  }

  if (!token) return null;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payloadJson = base64UrlDecode(parts[1]);
    if (!payloadJson) return null;

    const payload = JSON.parse(payloadJson);

    if (payload.exp && payload.exp * 1000 < Date.now()) return null;
    if (!payload.userId || !payload.email || !payload.isAdmin) return null;

    return {
      id: payload.userId,
      email: payload.email,
      isAdmin: true,
    };
  } catch {
    return null;
  }
}
