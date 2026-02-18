import { Pool, QueryResult, QueryResultRow } from 'pg';
import { getSSMParameter } from '@/lib/aws/ssm-client';

let pool: Pool | null = null;

/**
 * Obtém ou cria o pool de conexões PostgreSQL
 */
export async function getPool(): Promise<Pool> {
  if (pool) {
    return pool;
  }

  // Buscar connection string do SSM ou variável de ambiente
  const databaseUrl = await getSSMParameter('/pequenos-grupos/database/url', true) 
    || process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL não configurada. Configure no SSM Parameter Store ou variável de ambiente.');
  }

  // Parse da URL de conexão
  const url = new URL(databaseUrl.replace('postgresql://', 'http://'));
  
  pool = new Pool({
    host: url.hostname,
    port: parseInt(url.port || '5432'),
    database: url.pathname.slice(1), // Remove a barra inicial
    user: url.username || await getSSMParameter('/pequenos-grupos/database/user') || process.env.DATABASE_USER || 'postgres',
    password: url.password || await getSSMParameter('/pequenos-grupos/database/password', true) || process.env.DATABASE_PASSWORD,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20, // Máximo de conexões no pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  // Log de conexão (apenas em desenvolvimento)
  if (process.env.NODE_ENV === 'development') {
    pool.on('connect', () => {
      console.log('✅ Nova conexão PostgreSQL estabelecida');
    });

    pool.on('error', (err) => {
      console.error('❌ Erro inesperado no pool PostgreSQL:', err);
    });
  }

  return pool;
}

/**
 * Executa uma query SQL
 */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  const db = await getPool();
  return db.query<T>(text, params);
}

/**
 * Executa uma query e retorna apenas o primeiro resultado
 */
export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const result = await query<T>(text, params);
  return result.rows[0] || null;
}

/**
 * Executa uma query e retorna todos os resultados
 */
export async function queryMany<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const result = await query<T>(text, params);
  return result.rows;
}

/**
 * Inicia uma transação
 */
export async function transaction<T>(
  callback: (client: import('pg').PoolClient) => Promise<T>
): Promise<T> {
  const db = await getPool();
  const client = await db.connect();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Fecha o pool de conexões (útil para testes ou shutdown graceful)
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
