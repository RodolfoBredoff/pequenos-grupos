import { SSMClient, GetParameterCommand, GetParametersByPathCommand } from '@aws-sdk/client-ssm';

// Cache simples em memória para evitar muitas chamadas ao SSM
const parameterCache = new Map<string, { value: string; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

let ssmClient: SSMClient | null = null;

function getSSMClient(): SSMClient | null {
  // Em desenvolvimento local, retorna null para usar variáveis de ambiente
  if (process.env.NODE_ENV === 'development' || !process.env.AWS_REGION) {
    return null;
  }

  if (!ssmClient) {
    ssmClient = new SSMClient({
      region: process.env.AWS_REGION || 'us-east-1',
    });
  }

  return ssmClient;
}

/**
 * Busca um parâmetro do SSM Parameter Store
 * Em desenvolvimento, usa variáveis de ambiente como fallback
 */
export async function getSSMParameter(
  parameterName: string,
  withDecryption: boolean = false
): Promise<string | null> {
  // Verificar cache
  const cached = parameterCache.get(parameterName);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.value;
  }

  const client = getSSMClient();

  // Fallback para variáveis de ambiente em desenvolvimento
  if (!client) {
    const envKey = parameterName
      .replace('/pequenos-grupos/', '')
      .replace(/\//g, '_')
      .toUpperCase();
    
    const envValue = process.env[envKey] || process.env[parameterName.split('/').pop()?.toUpperCase() || ''];
    
    if (envValue) {
      return envValue;
    }

    console.warn(`⚠️ SSM não disponível e variável ${envKey} não encontrada. Usando null.`);
    return null;
  }

  try {
    const command = new GetParameterCommand({
      Name: parameterName,
      WithDecryption: withDecryption,
    });

    const response = await client.send(command);
    const value = response.Parameter?.Value || null;

    if (value) {
      // Atualizar cache
      parameterCache.set(parameterName, {
        value,
        timestamp: Date.now(),
      });
    }

    return value;
  } catch (error) {
    console.error(`❌ Erro ao buscar parâmetro ${parameterName}:`, error);
    
    // Fallback para variáveis de ambiente
    const envKey = parameterName
      .replace('/pequenos-grupos/', '')
      .replace(/\//g, '_')
      .toUpperCase();
    const envValue = process.env[envKey];
    
    return envValue || null;
  }
}

/**
 * Busca múltiplos parâmetros por caminho
 */
export async function getSSMParametersByPath(
  path: string,
  withDecryption: boolean = false
): Promise<Record<string, string>> {
  const client = getSSMClient();

  if (!client) {
    // Em desenvolvimento, retornar objeto vazio
    return {};
  }

  try {
    const command = new GetParametersByPathCommand({
      Path: path,
      WithDecryption: withDecryption,
      Recursive: true,
    });

    const response = await client.send(command);
    const parameters: Record<string, string> = {};

    response.Parameters?.forEach((param) => {
      if (param.Name && param.Value) {
        // Remover o prefixo do caminho para simplificar as chaves
        const key = param.Name.replace(path, '').replace(/^\//, '');
        parameters[key] = param.Value;
        
        // Atualizar cache
        parameterCache.set(param.Name, {
          value: param.Value,
          timestamp: Date.now(),
        });
      }
    });

    return parameters;
  } catch (error) {
    console.error(`❌ Erro ao buscar parâmetros do caminho ${path}:`, error);
    return {};
  }
}

/**
 * Limpa o cache de parâmetros
 */
export function clearSSMCache(): void {
  parameterCache.clear();
}

/**
 * Carrega todas as variáveis de ambiente do SSM Parameter Store
 * Deve ser chamado no início da aplicação
 */
export async function loadEnvironmentFromSSM(): Promise<void> {
  const parameters = await getSSMParametersByPath('/pequenos-grupos/', true);

  Object.entries(parameters).forEach(([key, value]) => {
    // Converter chaves para formato de variável de ambiente
    const envKey = key.replace(/\//g, '_').toUpperCase();
    if (!process.env[envKey]) {
      process.env[envKey] = value;
    }
  });
}
