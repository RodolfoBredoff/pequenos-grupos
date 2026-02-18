/**
 * Stub - migrado para PostgreSQL. Este arquivo não é mais utilizado.
 * Mantido para compatibilidade; o auth real está em lib/auth/middleware.ts
 */
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(_request: NextRequest) {
  return NextResponse.next({ request: _request });
}
