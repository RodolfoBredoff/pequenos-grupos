import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { queryOne } from '@/lib/db/postgres';
import { createAdminSession } from '@/lib/auth/admin-session';

/**
 * POST /api/admin/auth/login
 * Login do administrador com e-mail e senha
 */
export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'E-mail e senha são obrigatórios' },
        { status: 400 }
      );
    }

    // Buscar usuário admin
    const user = await queryOne<{
      id: string;
      email: string;
      password_hash: string | null;
      is_admin: boolean;
    }>(
      `SELECT id, email, password_hash, is_admin FROM users WHERE email = $1`,
      [email.toLowerCase().trim()]
    );

    if (!user || !user.is_admin) {
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      );
    }

    if (!user.password_hash) {
      return NextResponse.json(
        { error: 'Este usuário não possui senha configurada. Configure uma senha para acessar o painel de administração.' },
        { status: 401 }
      );
    }

    const passwordValid = await bcrypt.compare(password, user.password_hash);

    if (!passwordValid) {
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      );
    }

    await createAdminSession(user.id, user.email);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro no login admin:', error);
    return NextResponse.json(
      { error: 'Erro interno ao processar login' },
      { status: 500 }
    );
  }
}
