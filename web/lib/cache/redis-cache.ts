/**
 * Redis Cache Implementation
 * 
 * High-performance caching for dashboard data to reduce load times
 * from 12+ seconds to <3 seconds target.
 * 
 * Created: October 19, 2025
 * Updated: October 19, 2025 - Fixed to use actual Redis client
 * Status: ✅ ACTIVE
 */

import { getRedisClient, RedisClient } from './redis-client';

interface CacheConfig {
  defaultTTL: number; // seconds
  maxSize: number;
  enableCompression: boolean;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
}

class RedisCache {
  private redisClient: RedisClient | null = null;
  private config: CacheConfig;

  constructor(config: CacheConfig = {
    defaultTTL: 300, // 5 minutes
    maxSize: 1000,
    enableCompression: true
  }) {
    this.config = config;
  }

  private async initializeRedis() {
    if (!this.redisClient) {
      this.redisClient = await getRedisClient();
    }
  }

  /**
   * Get cached data
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.redisClient) {
      await this.initializeRedis();
    }
    
    if (!this.redisClient) {
      console.error('Redis client not initialized');
      return null;
    }
    
    try {
      console.log(`🔍 Cache GET attempt: ${key}`);
      const result = await this.redisClient.get<T>(key);
      console.log(`🔍 Cache GET result:`, result);
      if (result) {
        console.log(`📦 Cache HIT: ${key}`);
      } else {
        console.log(`📦 Cache MISS: ${key}`);
      }
      return result;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  /**
   * Set cached data
   */
  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    if (!this.redisClient) {
      await this.initializeRedis();
    }
    
    if (!this.redisClient) {
      console.error('Redis client not initialized');
      return;
    }
    
    try {
      const ttlSeconds = ttl || this.config.defaultTTL;
      await this.redisClient.set(key, data, ttlSeconds);
      console.log(`📦 Cache SET: ${key} (TTL: ${ttlSeconds}s)`);
    } catch (error) {
      console.error('Redis set error:', error);
    }
  }

  /**
   * Delete cached data
   */
  async delete(key: string): Promise<void> {
    if (!this.redisClient) {
      await this.initializeRedis();
    }
    
    if (!this.redisClient) {
      console.error('Redis client not initialized');
      return;
    }
    
    try {
      await this.redisClient.del(key);
      console.log(`📦 Cache DELETE: ${key}`);
    } catch (error) {
      console.error('Redis delete error:', error);
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    if (!this.redisClient) {
      await this.initializeRedis();
    }
    
    if (!this.redisClient) {
      console.error('Redis client not initialized');
      return;
    }
    
    try {
      await this.redisClient.flushAll();
      console.log(`📦 Cache CLEAR: All entries removed`);
    } catch (error) {
      console.error('Redis clear error:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats() {
    if (!this.redisClient) {
      await this.initializeRedis();
    }
    
    if (!this.redisClient) {
      console.error('Redis client not initialized');
      return {
        hits: 0,
        misses: 0,
        hitRate: 0,
        totalKeys: 0,
        memoryUsage: '0B',
        connectedClients: 0,
        uptime: 0
      };
    }
    
    try {
      return await this.redisClient.getStats();
    } catch (error) {
      console.error('Redis stats error:', error);
      return {
        hits: 0,
        misses: 0,
        hitRate: 0,
        totalKeys: 0,
        memoryUsage: '0B',
        connectedClients: 0,
        uptime: 0
      };
    }
  }


  /**
   * Generate cache key
   */
  static generateKey(prefix: string, params: Record<string, any> = {}): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join('|');
    
    return `${prefix}:${sortedParams}`;
  }
}

// Singleton instance
const cache = new RedisCache({
  defaultTTL: 300, // 5 minutes
  maxSize: 1000,
  enableCompression: true
});

export default cache;

// Cache key generators
export const CacheKeys = {
  USER_ANALYTICS: (userId: string) => `user:analytics:${userId}`,
  USER_PREFERENCES: (userId: string) => `user:preferences:${userId}`,
  ELECTED_OFFICIALS: (userId: string) => `user:officials:${userId}`,
  DASHBOARD_DATA: (userId: string) => `dashboard:${userId}`,
  PLATFORM_STATS: () => `platform:stats`,
  RECENT_ACTIVITY: (userId: string) => `activity:${userId}`,
  POLLS_DATA: () => `polls:active`,
  ADMIN_DASHBOARD: (adminId: string) => `admin:dashboard:${adminId}`
};

// Cache TTL constants
export const CacheTTL = {
  USER_DATA: 600, // 10 minutes (increased for better performance)
  PLATFORM_STATS: 1200, // 20 minutes (increased for better performance)
  ELECTED_OFFICIALS: 7200, // 2 hours (rarely change)
  POLLS_DATA: 300, // 5 minutes (increased for better performance)
  ADMIN_DATA: 600 // 10 minutes (increased for better performance)
};
