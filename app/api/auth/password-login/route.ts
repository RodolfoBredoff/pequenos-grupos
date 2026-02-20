import { NextResponse } from 'next/server';
import { queryOne } from '@/lib/db/postgres';
import { createSessionTokenOnly, SESSION_COOKIE_NAME, SESSION_MAX_AGE, getCookieSecure } from '@/lib/auth/session';
import bcrypt from 'bcryptjs';

/**
 * POST /api/auth/password-login
 * Login com senha para líderes/secretários/coordenadores
 * Cria uma sessão temporária que permite gerar magic link
 */
export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    // Buscar usuário e líder
    const user = await queryOne<{ id: string; password_hash: string | null }>(
      `SELECT u.id, u.password_hash
       FROM users u
       INNER JOIN leaders l ON l.id = u.id
       WHERE LOWER(u.email) = LOWER($1)`,
      [email]
    );

    if (!user) {
      return NextResponse.json(
        { error: 'E-mail ou senha incorretos' },
        { status: 401 }
      );
    }

    if (!user.password_hash) {
      return NextResponse.json(
        { error: 'Este usuário não possui senha cadastrada. Entre em contato com o administrador.' },
        { status: 403 }
      );
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'E-mail ou senha incorretos' },
        { status: 401 }
      );
    }

    // Criar sessão temporária (válida por 1 hora para gerar magic link)
    const sessionToken = await createSessionTokenOnly(user.id, email);

    const res = NextResponse.json({ success: true, message: 'Login realizado com sucesso' });
    res.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: getCookieSecure(),
      sameSite: 'lax',
      maxAge: SESSION_MAX_AGE,
      path: '/',
    });

    return res;
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    return NextResponse.json(
      { error: 'Erro ao processar login' },
      { status: 500 }
    );
  }
}
