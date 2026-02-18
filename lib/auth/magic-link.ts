import crypto from 'crypto';
import { query, queryOne } from '@/lib/db/postgres';

/**
 * Hash do token para armazenar no banco
 */
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

const MAGIC_LINK_EXPIRY_HOURS = 1; // Token expira em 1 hora

/**
 * Gera um token seguro para magic link
 */
function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Cria um token de magic link para o email
 */
export async function createMagicLinkToken(email: string): Promise<string> {
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/68b58dbd-8e78-48cd-8fa2-18d1de18a7f6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth/magic-link.ts:createMagicLinkToken',message:'Function called',data:{email},timestamp:Date.now(),hypothesisId:'M'})}).catch(()=>{});
  // #endregion
  
  const token = generateToken();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + MAGIC_LINK_EXPIRY_HOURS);

  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/68b58dbd-8e78-48cd-8fa2-18d1de18a7f6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth/magic-link.ts:createMagicLinkToken',message:'Before query user',data:{email},timestamp:Date.now(),hypothesisId:'N'})}).catch(()=>{});
  // #endregion

  // Verificar se o usuário existe, se não, criar
  let user = await queryOne<{ id: string }>(
    'SELECT id FROM users WHERE email = $1',
    [email]
  );

  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/68b58dbd-8e78-48cd-8fa2-18d1de18a7f6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth/magic-link.ts:createMagicLinkToken',message:'User query result',data:{userFound:!!user,userId:user?.id},timestamp:Date.now(),hypothesisId:'O'})}).catch(()=>{});
  // #endregion

  if (!user) {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/68b58dbd-8e78-48cd-8fa2-18d1de18a7f6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth/magic-link.ts:createMagicLinkToken',message:'Creating new user',data:{email},timestamp:Date.now(),hypothesisId:'P'})}).catch(()=>{});
    // #endregion
    
    // Criar novo usuário
    const result = await query<{ id: string }>(
      `INSERT INTO users (email, email_verified)
       VALUES ($1, FALSE)
       RETURNING id`,
      [email]
    );
    user = result.rows[0];
    
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/68b58dbd-8e78-48cd-8fa2-18d1de18a7f6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth/magic-link.ts:createMagicLinkToken',message:'User created',data:{userId:user?.id},timestamp:Date.now(),hypothesisId:'Q'})}).catch(()=>{});
    // #endregion
  }

  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/68b58dbd-8e78-48cd-8fa2-18d1de18a7f6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth/magic-link.ts:createMagicLinkToken',message:'Before insert token',data:{userId:user.id,email},timestamp:Date.now(),hypothesisId:'R'})}).catch(()=>{});
  // #endregion

  // Criar token de magic link
  const tokenHash = hashToken(token);
  await query(
    `INSERT INTO magic_link_tokens (user_id, email, token_hash, expires_at)
     VALUES ($1, $2, $3, $4)`,
    [user.id, email, tokenHash, expiresAt]
  );

  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/68b58dbd-8e78-48cd-8fa2-18d1de18a7f6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth/magic-link.ts:createMagicLinkToken',message:'Token inserted successfully',data:{},timestamp:Date.now(),hypothesisId:'S'})}).catch(()=>{});
  // #endregion

  return token;
}

/**
 * Valida e usa um token de magic link
 */
export async function validateMagicLinkToken(token: string): Promise<{ userId: string; email: string } | null> {
  const tokenHash = hashToken(token);
  
  // Buscar token válido
  const tokenData = await queryOne<{ user_id: string; email: string }>(
    `SELECT user_id, email 
     FROM magic_link_tokens 
     WHERE token_hash = $1
     AND expires_at > NOW()
     AND used = FALSE`,
    [tokenHash]
  );

  if (!tokenData) {
    return null;
  }

  // Marcar token como usado
  await query(
    `UPDATE magic_link_tokens 
     SET used = TRUE 
     WHERE token_hash = $1`,
    [tokenHash]
  );

  // Marcar email como verificado
  await query(
    `UPDATE users SET email_verified = TRUE WHERE id = $1`,
    [tokenData.user_id]
  );

  return {
    userId: tokenData.user_id,
    email: tokenData.email,
  };
}

/**
 * Limpa tokens expirados (deve ser executado periodicamente)
 */
export async function cleanupExpiredTokens(): Promise<void> {
  await query(
    `DELETE FROM magic_link_tokens 
     WHERE expires_at < NOW() OR used = TRUE`
  );
}
