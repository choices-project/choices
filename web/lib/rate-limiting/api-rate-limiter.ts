/**
 * API Rate Limiter Wrapper
 * 
 * Provides a unified interface for rate limiting API routes
 * Uses Upstash Redis for production and in-memory fallback
 * 
 * Created: 2025-10-29
 * Status: In Progress
 */

import { logger } from '../utils/logger';

import { upstashRateLimiter } from './upstash-rate-limiter';

export type RateLimitOptions = {
  maxRequests?: number;
  windowMs?: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  userAgent?: string;
}

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  totalHits: number;
  retryAfter?: number;
}

class ApiRateLimiter {
  private defaultOptions: Required<Omit<RateLimitOptions, 'userAgent'>> & Partial<Pick<RateLimitOptions, 'userAgent'>> = {
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

      // Record violation in monitoring system if rate limited (Upstash-backed)
      if (!result.allowed) {
        const violationData: any = {
          ip,
          endpoint,
          timestamp: Date.now(),
          count: result.totalHits,
          maxRequests: config.maxRequests
        };
        if (options.userAgent) {
          violationData.userAgent = options.userAgent;
        }
        void upstashRateLimiter
          .recordViolationExternal(violationData)
          .catch(error => {
            logger.error('Failed to record rate limit violation:', error);
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
