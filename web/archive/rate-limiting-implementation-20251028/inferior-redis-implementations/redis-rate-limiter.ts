/**
 * Redis Rate Limiter
 * 
 * Persistent, distributed rate limiting using Redis
 * 
 * Created: 2025-10-29
 * Status: In Progress
 */

import { redisClient } from '../redis/client';
import { logger } from '../utils/logger';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  totalHits: number;
}

interface RateLimitData {
  count: number;
  resetTime: number;
  firstRequest: number;
  lastRequest: number;
}

interface ViolationData {
  ip: string;
  endpoint: string;
  timestamp: number;
  count: number;
  maxRequests: number;
  userAgent?: string;
}

export class RedisRateLimiter {
  private fallbackToMemory = true;
  private memoryStore = new Map<string, { count: number; resetTime: number }>();

  constructor() {
    // Check Redis availability
    if (!redisClient.isAvailable()) {
      logger.warn('Redis not available, using in-memory fallback for rate limiting');
      this.fallbackToMemory = true;
    } else {
      this.fallbackToMemory = false;
    }
  }

  async checkLimit(
    ip: string, 
    endpoint: string, 
    maxRequests: number, 
    windowMs: number
  ): Promise<RateLimitResult> {
    
    if (this.fallbackToMemory) {
      return this.checkLimitMemory(ip, endpoint, maxRequests, windowMs);
    }

    return this.checkLimitRedis(ip, endpoint, maxRequests, windowMs);
  }

  private async checkLimitRedis(
    ip: string, 
    endpoint: string, 
    maxRequests: number, 
    windowMs: number
  ): Promise<RateLimitResult> {
    
    const key = `rate_limit:${ip}:${endpoint}`;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    try {
      // Get current data
      const currentDataStr = await redisClient.get(key);
      
      if (!currentDataStr) {
        // First request in window
        const newData: RateLimitData = {
          count: 1,
          resetTime: now + windowMs,
          firstRequest: now,
          lastRequest: now
        };
        
        const ttlSeconds = Math.ceil(windowMs / 1000);
        await redisClient.set(key, JSON.stringify(newData), ttlSeconds);
        
        return {
          allowed: true,
          remaining: maxRequests - 1,
          resetTime: newData.resetTime,
          totalHits: 1
        };
      }
      
      const data: RateLimitData = JSON.parse(currentDataStr);
      
      if (data.resetTime <= now) {
        // Window expired, reset
        const newData: RateLimitData = {
          count: 1,
          resetTime: now + windowMs,
          firstRequest: now,
          lastRequest: now
        };
        
        const ttlSeconds = Math.ceil(windowMs / 1000);
        await redisClient.set(key, JSON.stringify(newData), ttlSeconds);
        
        return {
          allowed: true,
          remaining: maxRequests - 1,
          resetTime: newData.resetTime,
          totalHits: 1
        };
      }
      
      if (data.count >= maxRequests) {
        // Rate limit exceeded
        await this.recordViolation(ip, endpoint, data.count, maxRequests);
        
        return {
          allowed: false,
          remaining: 0,
          resetTime: data.resetTime,
          totalHits: data.count
        };
      }
      
      // Increment count
      data.count++;
      data.lastRequest = now;
      
      const ttlSeconds = Math.ceil((data.resetTime - now) / 1000);
      await redisClient.set(key, JSON.stringify(data), ttlSeconds);
      
      return {
        allowed: true,
        remaining: maxRequests - data.count,
        resetTime: data.resetTime,
        totalHits: data.count
      };
      
    } catch (error) {
      logger.error('Redis rate limit check failed, falling back to memory:', error);
      return this.checkLimitMemory(ip, endpoint, maxRequests, windowMs);
    }
  }

  private checkLimitMemory(
    ip: string, 
    endpoint: string, 
    maxRequests: number, 
    windowMs: number
  ): RateLimitResult {
    
    const key = `${ip}:${endpoint}`;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Get or create entry
    let entry = this.memoryStore.get(key);
    
    if (!entry || entry.resetTime <= now) {
      // Create new window
      entry = {
        count: 0,
        resetTime: now + windowMs
      };
    }
    
    // Check if limit exceeded
    if (entry.count >= maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
        totalHits: entry.count
      };
    }
    
    // Increment counter
    entry.count++;
    this.memoryStore.set(key, entry);
    
    return {
      allowed: true,
      remaining: maxRequests - entry.count,
      resetTime: entry.resetTime,
      totalHits: entry.count
    };
  }

  private async recordViolation(
    ip: string, 
    endpoint: string, 
    count: number, 
    maxRequests: number
  ): Promise<void> {
    
    const violation: ViolationData = {
      ip,
      endpoint,
      timestamp: Date.now(),
      count,
      maxRequests
    };
    
    const key = `violations:${ip}:${endpoint}`;
    
    try {
      await redisClient.lpush(key, JSON.stringify(violation));
      await redisClient.expire(key, 24 * 60 * 60); // 24 hours
    } catch (error) {
      logger.error('Failed to record violation in Redis:', error);
    }
  }

  public async getViolationsForIP(ip: string): Promise<ViolationData[]> {
    if (this.fallbackToMemory) {
      return []; // Memory fallback doesn't store violations
    }

    try {
      const keys = await redisClient.keys(`violations:${ip}:*`);
      const violations: ViolationData[] = [];
      
      for (const key of keys) {
        const violationStrs = await redisClient.lrange(key, 0, -1);
        
        for (const violationStr of violationStrs) {
          try {
            violations.push(JSON.parse(violationStr));
          } catch (error) {
            logger.error('Failed to parse violation data:', error);
          }
        }
      }
      
      return violations.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      logger.error('Failed to get violations for IP:', error);
      return [];
    }
  }

  public async getAllViolations(): Promise<ViolationData[]> {
    if (this.fallbackToMemory) {
      return [];
    }

    try {
      const keys = await redisClient.keys('violations:*');
      const violations: ViolationData[] = [];
      
      for (const key of keys) {
        const violationStrs = await redisClient.lrange(key, 0, -1);
        
        for (const violationStr of violationStrs) {
          try {
            violations.push(JSON.parse(violationStr));
          } catch (error) {
            logger.error('Failed to parse violation data:', error);
          }
        }
      }
      
      return violations.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      logger.error('Failed to get all violations:', error);
      return [];
    }
  }

  public async getMetrics(): Promise<{
    totalViolations: number;
    violationsByIP: Map<string, number>;
    violationsByEndpoint: Map<string, number>;
    violationsLastHour: number;
    topViolatingIPs: Array<{ ip: string; count: number }>;
  }> {
    if (this.fallbackToMemory) {
      return {
        totalViolations: 0,
        violationsByIP: new Map(),
        violationsByEndpoint: new Map(),
        violationsLastHour: 0,
        topViolatingIPs: []
      };
    }

    try {
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
    } catch (error) {
      logger.error('Failed to get metrics:', error);
      return {
        totalViolations: 0,
        violationsByIP: new Map(),
        violationsByEndpoint: new Map(),
        violationsLastHour: 0,
        topViolatingIPs: []
      };
    }
  }
}

// Export singleton instance
export const redisRateLimiter = new RedisRateLimiter();
