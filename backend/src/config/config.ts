import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Configuration Management for ModernVista
 * 
 * Centralized, type-safe configuration following clean architecture principles.
 * All environment variables are validated and have sensible defaults.
 */
interface Config {
  server: {
    port: number;
    nodeEnv: string;
    apiPrefix: string;
    allowedOrigins: string[];
  };
  admin?: {
    metricsEnable: boolean;
  };
  vista: {
    host: string;
    port: number;
    accessCode: string;
    verifyCode: string;
    context?: string; // Option context (e.g. OR CPRS GUI CHART)
  };
  auth: {
    jwtSecret: string;
    jwtExpiresIn: string;
    bcryptRounds: number;
  };
  nlp: {
    ollamaUrl: string;
    ollamaModel: string;
    enableCloudNLP: boolean;
    openaiApiKey?: string;
    anthropicApiKey?: string;
  };
  logging: {
    level: string;
    filePath: string;
  };
  cache: {
    ttl: number;
    redisUrl?: string;
  };
  security: {
    rateLimitWindowMs: number;
    rateLimitMaxRequests: number;
  };
}

/**
 * Validates and returns configuration object
 */
function createConfig(): Config {
  // Required environment variables validation
  const requiredEnvVars = ['JWT_SECRET'];
  const missing = requiredEnvVars.filter(key => !process.env[key]);

  // In non-production, allow fallback secret so local dev isn't blocked
  if (missing.length > 0) {
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    } else {
      // Generate ephemeral dev secret (process-lifetime)
      const fallback = `dev-${Math.random().toString(36).slice(2)}${Date.now()}`;
      process.env.JWT_SECRET = fallback;
      // eslint-disable-next-line no-console
      console.warn(`[Config] Using ephemeral development JWT_SECRET (DO NOT USE IN PROD). Generate a real secret in .env`);
    }
  }

  const config: Config = {
    server: {
      port: parseInt(process.env.PORT || '3001', 10),
      nodeEnv: process.env.NODE_ENV || 'development',
      apiPrefix: process.env.API_PREFIX || '/api/v1',
      allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:5173').split(','),
    },
    admin: {
      metricsEnable: process.env.ADMIN_METRICS_ENABLE === 'true'
    },
    vista: {
      host: process.env.VISTA_HOST || 'localhost',
      port: parseInt(process.env.VISTA_PORT || '9430', 10),
      accessCode: process.env.VISTA_ACCESS_CODE || '',
      verifyCode: process.env.VISTA_VERIFY_CODE || '',
      context: process.env.VISTA_CONTEXT || 'OR CPRS GUI CHART',
    },
    auth: {
      jwtSecret: process.env.JWT_SECRET!,
      jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
      bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
    },
    nlp: {
      ollamaUrl: process.env.OLLAMA_URL || 'http://localhost:11434',
      ollamaModel: process.env.OLLAMA_MODEL || 'llama3.1:8b',
      enableCloudNLP: process.env.ENABLE_CLOUD_NLP === 'true',
    },
    logging: {
      level: process.env.LOG_LEVEL || 'debug',
      filePath: process.env.LOG_FILE_PATH || './logs/modernvista.log',
    },
    cache: {
      ttl: parseInt(process.env.CACHE_TTL || '3600', 10),
    },
    security: {
      rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
      rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    },
  };

  // Add optional properties conditionally
  if (process.env.OPENAI_API_KEY) {
    config.nlp.openaiApiKey = process.env.OPENAI_API_KEY;
  }
  
  if (process.env.ANTHROPIC_API_KEY) {
    config.nlp.anthropicApiKey = process.env.ANTHROPIC_API_KEY;
  }
  
  if (process.env.REDIS_URL) {
    config.cache.redisUrl = process.env.REDIS_URL;
  }

  return config;
}

export const config = createConfig();

// Export type for use in other modules
export type { Config };