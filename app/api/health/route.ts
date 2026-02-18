import { NextResponse } from 'next/server';

/**
 * Health check endpoint para Docker e CloudFront
 * Usado pelo healthcheck do docker-compose e monitoramento
 */
export async function GET() {
  try {
    // Verificar conexão com banco de dados (será implementado na Fase 2)
    // Por enquanto, apenas retornar OK
    
    return NextResponse.json(
      {
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'unknown',
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
