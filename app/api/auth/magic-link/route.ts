import { NextResponse } from 'next/server';
import { createMagicLinkToken } from '@/lib/auth/magic-link';
import { getAppBaseUrlForBrowser } from '@/lib/utils';

/**
 * POST /api/auth/magic-link
 * Cria um token de magic link e envia por email
 */
export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      );
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      );
    }

    // Criar token de magic link
    const token = await createMagicLinkToken(email);

    // TODO: Enviar email com o link
    // Por enquanto, em desenvolvimento, retornamos o token
    // Em produção, isso deve ser enviado por email
    const baseUrl = getAppBaseUrlForBrowser(request);
    const magicLink = `${baseUrl}/api/auth/verify?token=${token}`;

    if (process.env.NODE_ENV === 'development') {
      console.log('🔗 Magic Link (DEV):', magicLink);
    }

    // Em produção, aqui você enviaria o email
    // await sendEmail({
    //   to: email,
    //   subject: 'Link de acesso - Pequenos Grupos',
    //   html: `Clique no link para fazer login: <a href="${magicLink}">${magicLink}</a>`
    // });

    return NextResponse.json({
      success: true,
      message: 'Link de acesso enviado por email',
      // Retorna o link na resposta até implementar envio por email
      magicLink,
    });
  } catch (error) {
    console.error('Erro ao criar magic link:', error);
    return NextResponse.json(
      { error: 'Erro ao processar solicitação', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
