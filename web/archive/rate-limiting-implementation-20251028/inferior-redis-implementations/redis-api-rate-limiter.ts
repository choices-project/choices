/**
 * Redis API Rate Limiter
 * 
 * Production-ready rate limiting for API routes using Redis
 * Designed for Node.js runtime (not Edge Runtime)
 * 
 * Created: 2025-10-29
 * Status: In Progress
 */

import { getRedisClient } from '../cache/redis-client';
import { logger } from '../utils/logger';
import { trackSophisticatedEvent } from '../utils/sophisticated-analytics';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  totalHits: number;
  retryAfter?: number;
}

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  keyGenerator: (ip: string, endpoint: string) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export interface ViolationData {
  ip: string;
  endpoint: string;
  timestamp: number;
  count: number;
  maxRequests: number;
  userAgent?: string;
  headers?: Record<string, string>;
}

class RedisApiRateLimiter {
  private violations: ViolationData[] = [];
  private readonly maxViolationsInMemory = 1000;
  private redisClient: any = null;

  constructor() {
    // Clean up old violations periodically
    setInterval(() => {
      this.cleanupOldViolations();
    }, 60 * 60 * 1000); // Every hour
  }

  private async getRedisClient() {
    if (!this.redisClient) {
      this.redisClient = await getRedisClient();
    }
    return this.redisClient;
  }

  async checkLimit(
    ip: string,
    endpoint: string,
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    
    const redis = await this.getRedisClient();
    
    if (!redis.isClientConnected()) {
      logger.warn('Redis not available, allowing request (fallback mode)');
      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetTime: Date.now() + config.windowMs,
        totalHits: 1
      };
    }

    const key = config.keyGenerator(ip, endpoint);
    const now = Date.now();
    const windowStart = now - config.windowMs;

    try {
      // Use Upstash Redis operations
      // Remove expired entries
      await redis.client.zremrangebyscore(key, '-inf', windowStart);
      
      // Count current requests in window
      const currentCount = await redis.client.zcard(key);
      const totalHits = currentCount + 1;
      
      // Add current request
      await redis.client.zadd(key, now, `${now}-${Math.random()}`);
      
      // Set expiration
      await redis.client.expire(key, Math.ceil(config.windowMs / 1000));

      if (totalHits > config.maxRequests) {
        // Rate limit exceeded
        await this.recordViolation({
          ip,
          endpoint,
          timestamp: now,
          count: totalHits,
          maxRequests: config.maxRequests
        });

        const resetTime = await this.getResetTime(key);
        
        return {
          allowed: false,
          remaining: 0,
          resetTime,
          totalHits,
          retryAfter: Math.ceil((resetTime - now) / 1000)
        };
      }

      // Request allowed
      const resetTime = await this.getResetTime(key);
      
      return {
        allowed: true,
        remaining: config.maxRequests - totalHits,
        resetTime,
        totalHits
      };

    } catch (error) {
      logger.error('Redis rate limit check failed:', error);
      return this.createFallbackResult(config);
    }
  }

  private async getResetTime(key: string): Promise<number> {
    try {
      const ttl = await redisClient.ttl(key);
      return Date.now() + (ttl * 1000);
    } catch (error) {
      logger.error('Failed to get reset time:', error);
      return Date.now() + 900000; // 15 minutes fallback
    }
  }

  private createFallbackResult(config: RateLimitConfig): RateLimitResult {
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: Date.now() + config.windowMs,
      totalHits: 1
    };
  }

  private async recordViolation(violation: ViolationData): Promise<void> {
    // Add to in-memory store for immediate access
    this.violations.unshift(violation);
    
    // Keep only recent violations in memory
    if (this.violations.length > this.maxViolationsInMemory) {
      this.violations = this.violations.slice(0, this.maxViolationsInMemory);
    }

    // Store in Redis for persistence
    if (redisClient.isAvailable()) {
      try {
        const violationKey = `violations:${violation.ip}:${violation.endpoint}`;
        await redisClient.lpush(violationKey, JSON.stringify(violation));
        await redisClient.expire(violationKey, 24 * 60 * 60); // 24 hours
      } catch (error) {
        logger.error('Failed to store violation in Redis:', error);
      }
    }

    // Track in analytics
    trackSophisticatedEvent('error_occurred', {
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
    
    if (!redisClient.isAvailable()) {
      return memoryViolations;
    }

    try {
      // Get from Redis
      const keys = await redisClient.keys(`violations:${ip}:*`);
      const redisViolations: ViolationData[] = [];
      
      for (const key of keys) {
        const violationStrs = await redisClient.lrange(key, 0, -1);
        for (const violationStr of violationStrs) {
          try {
            redisViolations.push(JSON.parse(violationStr));
          } catch (error) {
            logger.error('Failed to parse violation data:', error);
          }
        }
      }
      
      // Combine and deduplicate
      const allViolations = [...memoryViolations, ...redisViolations];
      const uniqueViolations = allViolations.filter((violation, index, self) => 
        index === self.findIndex(v => v.timestamp === violation.timestamp)
      );
      
      return uniqueViolations.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      logger.error('Failed to get violations from Redis:', error);
      return memoryViolations;
    }
  }

  public async getAllViolations(): Promise<ViolationData[]> {
    if (!redisClient.isAvailable()) {
      return this.violations;
    }

    try {
      const keys = await redisClient.keys('violations:*');
      const allViolations: ViolationData[] = [...this.violations];
      
      for (const key of keys) {
        const violationStrs = await redisClient.lrange(key, 0, -1);
        for (const violationStr of violationStrs) {
          try {
            allViolations.push(JSON.parse(violationStr));
          } catch (error) {
            logger.error('Failed to parse violation data:', error);
          }
        }
      }
      
      // Deduplicate and sort
      const uniqueViolations = allViolations.filter((violation, index, self) => 
        index === self.findIndex(v => v.timestamp === violation.timestamp)
      );
      
      return uniqueViolations.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      logger.error('Failed to get all violations:', error);
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
    
    let totalViolations = violations.length;
    const violationsByIP = new Map<string, number>();
    const violationsByEndpoint = new Map<string, number>();
    let violationsLastHour = 0;
    
    for (const violation of violations) {
      // Count by IP
      const ipCount = violationsByIP.get(violation.ip) || 0;
      violationsByIP.set(violation.ip, ipCount + 1);
      
      // Count by endpoint
      const endpointCount = violationsByEndpoint.get(violation.endpoint) || 0;
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
    if (!redisClient.isAvailable()) {
      return false;
    }

    try {
      const key = `rate_limit:${ip}:${endpoint}`;
      await redisClient.del(key);
      logger.info(`Cleared rate limit for ${ip} on ${endpoint}`);
      return true;
    } catch (error) {
      logger.error('Failed to clear rate limit:', error);
      return false;
    }
  }

  public async getRateLimitStatus(ip: string, endpoint: string): Promise<{
    current: number;
    limit: number;
    resetTime: number;
  } | null> {
    if (!redisClient.isAvailable()) {
      return null;
    }

    try {
      const key = `rate_limit:${ip}:${endpoint}`;
      const count = await redisClient.zcard(key);
      const ttl = await redisClient.ttl(key);
      
      return {
        current: count,
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
export const redisApiRateLimiter = new RedisApiRateLimiter();
