/**
 * Redis Configuration
 * 
 * Production-ready Redis configuration with environment-specific settings
 * 
 * Created: 2025-10-29
 * Status: In Progress
 */

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  retryDelayOnFailover: number;
  maxRetriesPerRequest: number;
  lazyConnect: boolean;
  connectTimeout: number;
  commandTimeout: number;
  keepAlive: number;
  family: number;
  keyPrefix: string;
}

export interface RedisEnvironmentConfig {
  development: RedisConfig;
  production: RedisConfig;
  test: RedisConfig;
}

const redisConfig: RedisEnvironmentConfig = {
  development: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0'),
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    connectTimeout: 10000,
    commandTimeout: 5000,
    keepAlive: 30000,
    family: 4,
    keyPrefix: 'choices:dev:'
  },
  production: {
    host: process.env.REDIS_HOST || process.env.REDIS_URL || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0'),
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 5,
    lazyConnect: false,
    connectTimeout: 15000,
    commandTimeout: 10000,
    keepAlive: 60000,
    family: 4,
    keyPrefix: 'choices:prod:'
  },
  test: {
    host: 'localhost',
    port: 6379,
    db: 15, // Use different DB for tests
    retryDelayOnFailover: 50,
    maxRetriesPerRequest: 1,
    lazyConnect: true,
    connectTimeout: 5000,
    commandTimeout: 2000,
    keepAlive: 10000,
    family: 4,
    keyPrefix: 'choices:test:'
  }
};

export function getRedisConfig(): RedisConfig {
  const env = process.env.NODE_ENV as keyof RedisEnvironmentConfig || 'development';
  return redisConfig[env];
}

export function isRedisEnabled(): boolean {
  return !!(process.env.REDIS_HOST || process.env.REDIS_URL);
}

export function getRedisUrl(): string | null {
  if (process.env.REDIS_URL) {
    return process.env.REDIS_URL;
  }
  
  const config = getRedisConfig();
  if (config.password) {
    return `redis://:${config.password}@${config.host}:${config.port}/${config.db || 0}`;
  }
  
  return `redis://${config.host}:${config.port}/${config.db || 0}`;
}
