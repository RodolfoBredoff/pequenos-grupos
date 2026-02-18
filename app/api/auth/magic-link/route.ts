import { NextResponse } from 'next/server';
import { createMagicLinkToken } from '@/lib/auth/magic-link';
import { queryOne } from '@/lib/db/postgres';

/**
 * POST /api/auth/magic-link
 * Cria um token de magic link e envia por email
 */
export async function POST(request: Request) {
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/68b58dbd-8e78-48cd-8fa2-18d1de18a7f6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/auth/magic-link/route.ts:POST',message:'API called',data:{hasBody:!!request.body},timestamp:Date.now(),hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  
  try {
    const { email } = await request.json();

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/68b58dbd-8e78-48cd-8fa2-18d1de18a7f6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/auth/magic-link/route.ts:POST',message:'Email received',data:{email,hasEmail:!!email},timestamp:Date.now(),hypothesisId:'B'})}).catch(()=>{});
    // #endregion

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

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/68b58dbd-8e78-48cd-8fa2-18d1de18a7f6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/auth/magic-link/route.ts:POST',message:'Before createMagicLinkToken',data:{email,hasDatabaseUrl:!!process.env.DATABASE_URL},timestamp:Date.now(),hypothesisId:'C'})}).catch(()=>{});
    // #endregion

    // Criar token de magic link
    const token = await createMagicLinkToken(email);

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/68b58dbd-8e78-48cd-8fa2-18d1de18a7f6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/auth/magic-link/route.ts:POST',message:'Token created successfully',data:{tokenLength:token?.length},timestamp:Date.now(),hypothesisId:'D'})}).catch(()=>{});
    // #endregion

    // TODO: Enviar email com o link
    // Por enquanto, em desenvolvimento, retornamos o token
    // Em produção, isso deve ser enviado por email
    const magicLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/verify?token=${token}`;

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
      // Remover em produção
      ...(process.env.NODE_ENV === 'development' && { token, magicLink }),
    });
  } catch (error) {
    // #region agent log
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    fetch('http://127.0.0.1:7243/ingest/68b58dbd-8e78-48cd-8fa2-18d1de18a7f6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/auth/magic-link/route.ts:POST',message:'Error caught',data:{errorMessage,errorStack,errorType:error?.constructor?.name},timestamp:Date.now(),hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    
    console.error('Erro ao criar magic link:', error);
    return NextResponse.json(
      { error: 'Erro ao processar solicitação', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
