/**
 * Redis Singleton Export
 * 
 * Simplified Redis interface for caching operations.
 * Uses Upstash Redis REST API for serverless deployments.
 * 
 * Created: November 5, 2025
 * Status: ✅ Production-ready
 */

import { logger } from '@/lib/utils/logger';

// Upstash Redis client type
type UpstashRedis = {
  get: <T>(key: string) => Promise<T | null>;
  set: (key: string, value: any, options?: { ex?: number; exat?: number }) => Promise<string>;
  setex: (key: string, seconds: number, value: any) => Promise<string>;
  del: (...keys: string[]) => Promise<number>;
  keys: (pattern: string) => Promise<string[]>;
  hget: (key: string, field: string) => Promise<string | null>;
  hset: (key: string, field: string, value: any) => Promise<number>;
  hgetall: (key: string) => Promise<Record<string, any>>;
  hincrby: (key: string, field: string, increment: number) => Promise<number>;
  expire: (key: string, seconds: number) => Promise<number>;
};

let redisInstance: UpstashRedis | null = null;

/**
 * Get Redis instance
 */
async function getRedisInstance(): Promise<UpstashRedis | null> {
  if (redisInstance) {
    return redisInstance;
  }

  // Check if Upstash Redis is configured
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    logger.warn('Upstash Redis not configured - caching disabled');
    return null;
  }

  try {
    const { Redis } = await import('@upstash/redis');
    
    redisInstance = Redis.fromEnv() as unknown as UpstashRedis;
    
    logger.info('Redis client initialized', {
      url: process.env.UPSTASH_REDIS_REST_URL?.substring(0, 20) + '...'
    });
    
    return redisInstance;
  } catch (error) {
    logger.error('Failed to initialize Redis client', { error });
    return null;
  }
}

/**
 * Simple Redis interface for caching
 * Automatically falls back to no-op if Redis is not available
 */
export const redis = {
  /**
   * Get value from Redis
   */
  async get<T = any>(key: string): Promise<T | null> {
    try {
      const client = await getRedisInstance();
      if (!client) return null;
      
      return await client.get<T>(key);
    } catch (error) {
      logger.error('Redis get error', { key, error });
      return null;
    }
  },

  /**
   * Set value in Redis
   */
  async set(key: string, value: any, options?: { ex?: number }): Promise<boolean> {
    try {
      const client = await getRedisInstance();
      if (!client) return false;
      
      await client.set(key, value, options);
      return true;
    } catch (error) {
      logger.error('Redis set error', { key, error });
      return false;
    }
  },

  /**
   * Set value in Redis with expiration (seconds)
   */
  async setex(key: string, seconds: number, value: any): Promise<boolean> {
    try {
      const client = await getRedisInstance();
      if (!client) return false;
      
      await client.setex(key, seconds, value);
      return true;
    } catch (error) {
      logger.error('Redis setex error', { key, seconds, error });
      return false;
    }
  },

  /**
   * Delete keys from Redis
   */
  async del(...keys: string[]): Promise<number> {
    try {
      const client = await getRedisInstance();
      if (!client) return 0;
      
      return await client.del(...keys);
    } catch (error) {
      logger.error('Redis del error', { keys, error });
      return 0;
    }
  },

  /**
   * Get keys matching pattern
   */
  async keys(pattern: string): Promise<string[]> {
    try {
      const client = await getRedisInstance();
      if (!client) return [];
      
      return await client.keys(pattern);
    } catch (error) {
      logger.error('Redis keys error', { pattern, error });
      return [];
    }
  },

  /**
   * Get hash field value
   */
  async hget(key: string, field: string): Promise<string | null> {
    try {
      const client = await getRedisInstance();
      if (!client) return null;
      
      return await client.hget(key, field);
    } catch (error) {
      logger.error('Redis hget error', { key, field, error });
      return null;
    }
  },

  /**
   * Set hash field value
   */
  async hset(key: string, field: string, value: any): Promise<number> {
    try {
      const client = await getRedisInstance();
      if (!client) return 0;
      
      return await client.hset(key, field, value);
    } catch (error) {
      logger.error('Redis hset error', { key, field, error });
      return 0;
    }
  },

  /**
   * Get all hash fields
   */
  async hgetall(key: string): Promise<Record<string, any>> {
    try {
      const client = await getRedisInstance();
      if (!client) return {};
      
      return await client.hgetall(key);
    } catch (error) {
      logger.error('Redis hgetall error', { key, error });
      return {};
    }
  },

  /**
   * Increment hash field by value
   */
  async hincrby(key: string, field: string, increment: number): Promise<number> {
    try {
      const client = await getRedisInstance();
      if (!client) return 0;
      
      return await client.hincrby(key, field, increment);
    } catch (error) {
      logger.error('Redis hincrby error', { key, field, increment, error });
      return 0;
    }
  },

  /**
   * Set expiration on key
   */
  async expire(key: string, seconds: number): Promise<number> {
    try {
      const client = await getRedisInstance();
      if (!client) return 0;
      
      return await client.expire(key, seconds);
    } catch (error) {
      logger.error('Redis expire error', { key, seconds, error });
      return 0;
    }
  }
};

export default redis;

