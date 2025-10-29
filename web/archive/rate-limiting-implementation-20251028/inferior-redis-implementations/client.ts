/**
 * Redis Client
 * 
 * Centralized Redis client for rate limiting and monitoring
 * 
 * Created: 2025-10-29
 * Status: In Progress
 */

import Redis from 'ioredis';
import { logger } from '../utils/logger';
import { getRedisConfig, isRedisEnabled, getRedisUrl } from './config';

class RedisClient {
  private client: Redis | null = null;
  private isConnected = false;

  constructor() {
    this.initializeClient();
  }

  private initializeClient(): void {
    try {
      // Check if Redis is enabled
      if (!isRedisEnabled()) {
        logger.warn('Redis not configured, falling back to in-memory rate limiting');
        return;
      }

      const config = getRedisConfig();
      const redisUrl = getRedisUrl();

      this.client = new Redis(redisUrl || config);

      this.client.on('connect', () => {
        this.isConnected = true;
        logger.info('Redis connected successfully');
      });

      this.client.on('error', (error) => {
        this.isConnected = false;
        logger.error('Redis connection error:', error);
      });

      this.client.on('close', () => {
        this.isConnected = false;
        logger.warn('Redis connection closed');
      });

    } catch (error) {
      logger.error('Failed to initialize Redis client:', error);
      this.client = null;
    }
  }

  public isAvailable(): boolean {
    return this.client !== null && this.isConnected;
  }

  public async get(key: string): Promise<string | null> {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      return await this.client!.get(key);
    } catch (error) {
      logger.error('Redis GET error:', error);
      return null;
    }
  }

  public async set(key: string, value: string, ttlSeconds?: number): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      if (ttlSeconds) {
        await this.client!.setex(key, ttlSeconds, value);
      } else {
        await this.client!.set(key, value);
      }
      return true;
    } catch (error) {
      logger.error('Redis SET error:', error);
      return false;
    }
  }

  public async del(key: string): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      await this.client!.del(key);
      return true;
    } catch (error) {
      logger.error('Redis DEL error:', error);
      return false;
    }
  }

  public async exists(key: string): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      const result = await this.client!.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Redis EXISTS error:', error);
      return false;
    }
  }

  public async lpush(key: string, value: string): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      await this.client!.lpush(key, value);
      return true;
    } catch (error) {
      logger.error('Redis LPUSH error:', error);
      return false;
    }
  }

  public async lrange(key: string, start: number, stop: number): Promise<string[]> {
    if (!this.isAvailable()) {
      return [];
    }

    try {
      return await this.client!.lrange(key, start, stop);
    } catch (error) {
      logger.error('Redis LRANGE error:', error);
      return [];
    }
  }

  public async keys(pattern: string): Promise<string[]> {
    if (!this.isAvailable()) {
      return [];
    }

    try {
      return await this.client!.keys(pattern);
    } catch (error) {
      logger.error('Redis KEYS error:', error);
      return [];
    }
  }

  public async expire(key: string, seconds: number): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      const result = await this.client!.expire(key, seconds);
      return result === 1;
    } catch (error) {
      logger.error('Redis EXPIRE error:', error);
      return false;
    }
  }

  public async pipeline(): Promise<any> {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      return this.client!.pipeline();
    } catch (error) {
      logger.error('Redis PIPELINE error:', error);
      return null;
    }
  }

  public async disconnect(): Promise<void> {
    if (this.client) {
      try {
        await this.client.disconnect();
        this.isConnected = false;
        logger.info('Redis disconnected');
      } catch (error) {
        logger.error('Redis disconnect error:', error);
      }
    }
  }
}

// Export singleton instance
export const redisClient = new RedisClient();

// Graceful shutdown
process.on('SIGINT', async () => {
  await redisClient.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await redisClient.disconnect();
  process.exit(0);
});
