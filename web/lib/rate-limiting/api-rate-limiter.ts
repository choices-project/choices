/**
 * API Rate Limiter Wrapper
 * 
 * Provides a unified interface for rate limiting API routes
 * Uses Upstash Redis for production and in-memory fallback
 * 
 * Created: 2025-10-29
 * Status: In Progress
 */

import { upstashRateLimiter } from './upstash-rate-limiter';
import { rateLimitMonitor } from '../monitoring/rate-limit-monitor';
import { logger } from '../utils/logger';

export interface RateLimitOptions {
  maxRequests?: number;
  windowMs?: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  totalHits: number;
  retryAfter?: number;
}

class ApiRateLimiter {
  private defaultOptions: Required<RateLimitOptions> = {
    maxRequests: 50,
    windowMs: 15 * 60 * 1000, // 15 minutes
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  };

  async checkLimit(
    ip: string,
    endpoint: string,
    options: RateLimitOptions = {}
  ): Promise<RateLimitResult> {
    
    const config = {
      maxRequests: options.maxRequests ?? this.defaultOptions.maxRequests,
      windowMs: options.windowMs ?? this.defaultOptions.windowMs
    };
    
    try {
      // Use Upstash rate limiter
      const result = await upstashRateLimiter.checkLimit(
        ip,
        endpoint,
        config.maxRequests,
        config.windowMs
      );

      // Record violation in monitoring system if rate limited
      if (!result.allowed) {
        rateLimitMonitor.recordViolation({
          ip,
          endpoint,
          count: result.totalHits,
          maxRequests: config.maxRequests,
          userAgent: undefined // Will be set by the calling code
        }).catch(error => {
          logger.error('Failed to record rate limit violation in monitor:', error);
        });
      }

      return result;
    } catch (error) {
      logger.error('Rate limiting check failed:', error);
      
      // Fallback to allowing the request
      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetTime: Date.now() + config.windowMs,
        totalHits: 1
      };
    }
  }

  async getViolationsForIP(ip: string) {
    return await upstashRateLimiter.getViolationsForIP(ip);
  }

  async getAllViolations() {
    return await upstashRateLimiter.getAllViolations();
  }

  async getMetrics() {
    return await upstashRateLimiter.getMetrics();
  }

  async clearRateLimit(ip: string, endpoint: string) {
    return await upstashRateLimiter.clearRateLimit(ip, endpoint);
  }

  async getRateLimitStatus(ip: string, endpoint: string) {
    return await upstashRateLimiter.getRateLimitStatus(ip, endpoint);
  }
}

// Export singleton instance
export const apiRateLimiter = new ApiRateLimiter();
