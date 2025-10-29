/**
 * Upstash Rate Limiter
 * 
 * Production-ready rate limiting using your existing Upstash Redis setup
 * 
 * Created: 2025-10-29
 * Status: In Progress
 */

import { getRedisClient } from '../cache/redis-client';
import { logger } from '../utils/logger';
import { trackSophisticatedEvent } from '../utils/sophisticated-analytics';

// Redis client interface for type safety
interface RedisClientInterface {
  get(key: string): Promise<string | null>
  set(key: string, value: string, options?: { ex?: number }): Promise<string>
  del(key: string): Promise<number>
  exists(key: string): Promise<number>
  mget(keys: string[]): Promise<(string | null)[]>
  keys(pattern: string): Promise<string[]>
  incr(key: string): Promise<number>
  ttl(key: string): Promise<number>
  lpush(key: string, value: string): Promise<number>
  lrange(key: string, start: number, stop: number): Promise<string[]>
  expire(key: string, seconds: number): Promise<number>
  flushAll(): Promise<string>
  quit(): Promise<string>
  connect(): Promise<void>
  on(event: string, callback: (...args: unknown[]) => void): void
  configSet(key: string, value: string): Promise<string>
  multi(): {
    set(key: string, value: string): unknown
    sAdd(key: string, member: string): unknown
    exec(): Promise<unknown[]>
  }
  sMembers(key: string): Promise<string[]>
  sRem(key: string, member: string): Promise<number>
  info(section?: string): Promise<string>
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  totalHits: number;
  retryAfter?: number;
}

export interface ViolationData {
  ip: string;
  endpoint: string;
  timestamp: number;
  count: number;
  maxRequests: number;
  userAgent?: string;
}

class UpstashRateLimiter {
  private violations: ViolationData[] = [];
  private readonly maxViolationsInMemory = 1000;
  private redisClient: Awaited<ReturnType<typeof getRedisClient>> | null = null;

  constructor() {
    // Clean up old violations periodically
    setInterval(() => {
      this.cleanupOldViolations();
    }, 60 * 60 * 1000); // Every hour
  }

  private async getRedisClient(): Promise<Awaited<ReturnType<typeof getRedisClient>>> {
    this.redisClient ??= await getRedisClient();
    if (!this.redisClient) {
      throw new Error('Failed to initialize Redis client');
    }
    return this.redisClient;
  }

  private async getRawRedisClient(): Promise<RedisClientInterface> {
    const redis = await this.getRedisClient();
    // Access the underlying client for raw operations
    return (redis as unknown as { client: RedisClientInterface }).client;
  }

  async checkLimit(
    ip: string,
    endpoint: string,
    maxRequests = 50,
    windowMs = 15 * 60 * 1000 // 15 minutes
  ): Promise<RateLimitResult> {
    
    const redis = await this.getRedisClient();
    
    if (!redis.isClientConnected()) {
      logger.warn('Redis not available, allowing request (fallback mode)');
      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetTime: Date.now() + windowMs,
        totalHits: 1
      };
    }

    const key = `rate_limit:${ip}:${endpoint}`;
    const now = Date.now();

    try {
      // Use raw Redis client for counter operations
      const rawRedis = await this.getRawRedisClient();
      
      // Use a simple counter approach with TTL
      const currentCount = await rawRedis.get(key);
      const count = currentCount ? parseInt(currentCount) : 0;
      const totalHits = count + 1;

      if (totalHits > maxRequests) {
        // Rate limit exceeded
        await this.recordViolation({
          ip,
          endpoint,
          timestamp: now,
          count: totalHits,
          maxRequests
        });

        const resetTime = now + windowMs;
        
        return {
          allowed: false,
          remaining: 0,
          resetTime,
          totalHits,
          retryAfter: Math.ceil(windowMs / 1000)
        };
      }

      // Increment counter and set TTL
      if (count === 0) {
        // First request in window - use raw Redis syntax
        await rawRedis.set(key, '1', { ex: Math.ceil(windowMs / 1000) });
      } else {
        // Increment existing counter
        await rawRedis.incr(key);
      }

      const resetTime = now + windowMs;
      
      return {
        allowed: true,
        remaining: maxRequests - totalHits,
        resetTime,
        totalHits
      };

    } catch (redisError) {
      logger.error('Redis rate limit check failed:', redisError);
      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetTime: Date.now() + windowMs,
        totalHits: 1
      };
    }
  }

  private async recordViolation(violation: ViolationData): Promise<void> {
    // Add to in-memory store for immediate access
    this.violations.unshift(violation);
    
    // Keep only recent violations in memory
    if (this.violations.length > this.maxViolationsInMemory) {
      this.violations = this.violations.slice(0, this.maxViolationsInMemory);
    }

      // Store in Redis for persistence
      try {
        const redis = await this.getRedisClient();
        if (redis.isClientConnected()) {
          const rawRedis = await this.getRawRedisClient();
          const violationKey = `violations:${violation.ip}:${violation.endpoint}`;
          await rawRedis.lpush(violationKey, JSON.stringify(violation));
          await rawRedis.expire(violationKey, 24 * 60 * 60); // 24 hours
        }
      } catch (redisError) {
        logger.error('Failed to store violation in Redis:', redisError);
      }

    // Track in analytics
    void trackSophisticatedEvent('error_occurred', {
      error_type: 'rate_limit_violation',
      ip_address: violation.ip,
      endpoint: violation.endpoint,
      violation_count: violation.count,
      max_requests: violation.maxRequests,
      user_agent: violation.userAgent
    }, {
      ipAddress: violation.ip,
      userAgent: violation.userAgent
    });

    logger.warn('Rate limit violation recorded', {
      ip: violation.ip,
      endpoint: violation.endpoint,
      count: violation.count,
      maxRequests: violation.maxRequests
    });
  }

  public async getViolationsForIP(ip: string): Promise<ViolationData[]> {
    // Get from in-memory store first
    const memoryViolations = this.violations.filter(v => v.ip === ip);
    
    try {
      const redis = await this.getRedisClient();
      if (!redis.isClientConnected()) {
        return memoryViolations;
      }

      // Get from Redis
      const rawRedis = await this.getRawRedisClient();
      const keys = await rawRedis.keys(`violations:${ip}:*`);
      const redisViolations: ViolationData[] = [];
      
      for (const key of keys) {
        const violationStrs = await rawRedis.lrange(key, 0, -1);
        for (const violationStr of violationStrs) {
          try {
            redisViolations.push(JSON.parse(violationStr) as ViolationData);
          } catch (parseError) {
            logger.error('Failed to parse violation data:', parseError);
          }
        }
      }
      
      // Combine and deduplicate
      const allViolations = [...memoryViolations, ...redisViolations];
      const uniqueViolations = allViolations.filter((violation, index, self) => 
        index === self.findIndex(v => v.timestamp === violation.timestamp)
      );
      
      return uniqueViolations.sort((a, b) => b.timestamp - a.timestamp);
    } catch (redisError) {
      logger.error('Failed to get violations from Redis:', redisError);
      return memoryViolations;
    }
  }

  public async getAllViolations(): Promise<ViolationData[]> {
    try {
      const redis = await this.getRedisClient();
      if (!redis.isClientConnected()) {
        return this.violations;
      }

      const rawRedis = await this.getRawRedisClient();
      const keys = await rawRedis.keys('violations:*');
      const allViolations: ViolationData[] = [...this.violations];
      
      for (const key of keys) {
        const violationStrs = await rawRedis.lrange(key, 0, -1);
        for (const violationStr of violationStrs) {
          try {
            allViolations.push(JSON.parse(violationStr) as ViolationData);
          } catch (parseError) {
            logger.error('Failed to parse violation data:', parseError);
          }
        }
      }
      
      // Deduplicate and sort
      const uniqueViolations = allViolations.filter((violation, index, self) => 
        index === self.findIndex(v => v.timestamp === violation.timestamp)
      );
      
      return uniqueViolations.sort((a, b) => b.timestamp - a.timestamp);
    } catch (redisError) {
      logger.error('Failed to get all violations:', redisError);
      return this.violations;
    }
  }

  public async getMetrics(): Promise<{
    totalViolations: number;
    violationsByIP: Map<string, number>;
    violationsByEndpoint: Map<string, number>;
    violationsLastHour: number;
    topViolatingIPs: Array<{ ip: string; count: number }>;
  }> {
    const violations = await this.getAllViolations();
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    
    const totalViolations = violations.length;
    const violationsByIP = new Map<string, number>();
    const violationsByEndpoint = new Map<string, number>();
    let violationsLastHour = 0;
    
    for (const violation of violations) {
      // Count by IP
      const ipCount = violationsByIP.get(violation.ip) ?? 0;
      violationsByIP.set(violation.ip, ipCount + 1);
      
      // Count by endpoint
      const endpointCount = violationsByEndpoint.get(violation.endpoint) ?? 0;
      violationsByEndpoint.set(violation.endpoint, endpointCount + 1);
      
      // Count last hour
      if (violation.timestamp > oneHourAgo) {
        violationsLastHour++;
      }
    }
    
    // Get top violating IPs
    const topViolatingIPs = Array.from(violationsByIP.entries())
      .map(([ip, count]) => ({ ip, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    return {
      totalViolations,
      violationsByIP,
      violationsByEndpoint,
      violationsLastHour,
      topViolatingIPs
    };
  }

  private cleanupOldViolations(): void {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    this.violations = this.violations.filter(v => v.timestamp > oneDayAgo);
  }

  public async clearRateLimit(ip: string, endpoint: string): Promise<boolean> {
    try {
      const redis = await this.getRedisClient();
      if (!redis.isClientConnected()) {
        return false;
      }

      const key = `rate_limit:${ip}:${endpoint}`;
      const rawRedis = await this.getRawRedisClient();
      await rawRedis.del(key);
      logger.info(`Cleared rate limit for ${ip} on ${endpoint}`);
      return true;
    } catch (redisError) {
      logger.error('Failed to clear rate limit:', redisError);
      return false;
    }
  }

  public async getRateLimitStatus(ip: string, endpoint: string): Promise<{
    current: number;
    limit: number;
    resetTime: number;
  } | null> {
    try {
      const redis = await this.getRedisClient();
      if (!redis.isClientConnected()) {
        return null;
      }

      const key = `rate_limit:${ip}:${endpoint}`;
      const rawRedis = await this.getRawRedisClient();
      const count = await rawRedis.get(key);
      const ttl = await rawRedis.ttl(key);
      
      return {
        current: count ? parseInt(count) : 0,
        limit: 50, // Default limit, should be passed as parameter
        resetTime: Date.now() + (ttl * 1000)
      };
    } catch (error) {
      logger.error('Failed to get rate limit status:', error);
      return null;
    }
  }
}

// Export singleton instance
export const upstashRateLimiter = new UpstashRateLimiter();
