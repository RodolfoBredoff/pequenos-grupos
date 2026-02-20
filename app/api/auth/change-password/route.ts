import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { queryOne, query } from '@/lib/db/postgres';
import bcrypt from 'bcryptjs';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{8,}$/;

/**
 * POST /api/auth/change-password
 * Altera a senha do usuário autenticado (líder, secretário ou coordenador).
 * Se o usuário já tem senha, exige a senha atual.
 * Nova senha deve ter maiúscula, minúscula e número (mínimo 8 caracteres).
 */
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { current_password, new_password } = await request.json();

    if (!new_password || typeof new_password !== 'string') {
      return NextResponse.json({ error: 'Nova senha é obrigatória' }, { status: 400 });
    }

    if (!PASSWORD_REGEX.test(new_password)) {
      return NextResponse.json(
        { error: 'A nova senha deve ter no mínimo 8 caracteres, incluindo letra maiúscula, letra minúscula e número.' },
        { status: 400 }
      );
    }

    const user = await queryOne<{ id: string; password_hash: string | null }>(
      `SELECT id, password_hash FROM users WHERE id = $1`,
      [session.id]
    );

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Se já tem senha, exige verificação da senha atual
    if (user.password_hash) {
      if (!current_password || typeof current_password !== 'string') {
        return NextResponse.json({ error: 'Senha atual é obrigatória' }, { status: 400 });
      }
      const matches = await bcrypt.compare(current_password, user.password_hash);
      if (!matches) {
        return NextResponse.json({ error: 'Senha atual incorreta' }, { status: 400 });
      }
    }

    const newHash = await bcrypt.hash(new_password, 10);
    await query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [newHash, user.id]);

    return NextResponse.json({ success: true, message: 'Senha alterada com sucesso' });
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    return NextResponse.json({ error: 'Erro ao alterar senha' }, { status: 500 });
  }
}
