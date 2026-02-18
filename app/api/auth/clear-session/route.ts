import { NextRequest, NextResponse } from 'next/server';
import { destroySession } from '@/lib/auth/session';

/**
 * GET /api/auth/clear-session?to=/login
 * Limpa o cookie de sessão e redireciona. Usado quando a sessão é inválida
 * (ex.: layout do dashboard) e cookies não podem ser modificados em Server Component.
 */
export async function GET(request: NextRequest) {
  await destroySession();
  const to = request.nextUrl.searchParams.get('to') || '/login';
  const reason = request.nextUrl.searchParams.get('reason');
  const path = reason ? `${to}${to.includes('?') ? '&' : '?'}reason=${encodeURIComponent(reason)}` : to;
  return NextResponse.redirect(new URL(path, request.url));
}
