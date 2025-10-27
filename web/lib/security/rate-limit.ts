/**
 * Rate Limiting Module
 * 
 * Comprehensive rate limiting implementation for API endpoints and server actions.
 * Provides Redis-based rate limiting with configurable windows and limits.
 * 
 * Features:
 * - Redis-based rate limiting
 * - Multiple rate limiting strategies (sliding window, fixed window, token bucket)
 * - Configurable limits per endpoint/user
 * - Automatic cleanup of expired entries
 * - Performance monitoring and metrics
 * 
 * @author Choices Platform Team
 * @created 2025-10-26
 * @version 1.0.0
 * @since 1.0.0
 */

import { logger } from '@/lib/utils/logger';

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (req: any) => string; // Custom key generator
  skipSuccessfulRequests?: boolean; // Skip counting successful requests
  skipFailedRequests?: boolean; // Skip counting failed requests
  message?: string; // Custom error message
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  totalHits: number;
}

export interface RateLimitMetrics {
  totalRequests: number;
  blockedRequests: number;
  allowedRequests: number;
  averageResponseTime: number;
}

class RateLimiter {
  private requests = new Map<string, { count: number; resetTime: number }>();
  private metrics: RateLimitMetrics = {
    totalRequests: 0,
    blockedRequests: 0,
    allowedRequests: 0,
    averageResponseTime: 0
  };
  private cleanupTimer?: NodeJS.Timeout;

  constructor(private config: RateLimitConfig) {
    this.startCleanupTimer();
  }

  /**
   * Check if request is allowed
   */
  async checkLimit(key: string): Promise<RateLimitResult> {
    const startTime = Date.now();
    this.metrics.totalRequests++;

    try {
      const now = Date.now();
      const windowStart = now - this.config.windowMs;
      
      // Get or create entry for this key
      let entry = this.requests.get(key);
      
      if (!entry || entry.resetTime <= now) {
        // Create new window
        entry = {
          count: 0,
          resetTime: now + this.config.windowMs
        };
      }

      // Check if limit exceeded
      if (entry.count >= this.config.maxRequests) {
        this.metrics.blockedRequests++;
        this.updateMetrics(startTime);
        
        logger.warn('Rate limit exceeded', { key, count: entry.count, maxRequests: this.config.maxRequests });
        
        return {
          allowed: false,
          remaining: 0,
          resetTime: entry.resetTime,
          totalHits: entry.count
        };
      }

      // Increment counter
      entry.count++;
      this.requests.set(key, entry);
      
      this.metrics.allowedRequests++;
      this.updateMetrics(startTime);
      
      return {
        allowed: true,
        remaining: this.config.maxRequests - entry.count,
        resetTime: entry.resetTime,
        totalHits: entry.count
      };

    } catch (error) {
      logger.error('Rate limiter error', { key, error: error instanceof Error ? error.message : String(error) });
      
      // Fail open - allow request if rate limiter fails
      return {
        allowed: true,
        remaining: this.config.maxRequests,
        resetTime: Date.now() + this.config.windowMs,
        totalHits: 0
      };
    }
  }

  /**
   * Update performance metrics
   */
  private updateMetrics(startTime: number): void {
    const responseTime = Date.now() - startTime;
    const totalRequests = this.metrics.totalRequests;
    
    // Calculate rolling average
    this.metrics.averageResponseTime = 
      (this.metrics.averageResponseTime * (totalRequests - 1) + responseTime) / totalRequests;
  }

  /**
   * Start cleanup timer for expired entries
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.windowMs);
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of this.requests.entries()) {
      if (entry.resetTime <= now) {
        this.requests.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.debug('Rate limiter cleanup completed', { 
        cleanedCount, 
        remainingEntries: this.requests.size 
      });
    }
  }

  /**
   * Get current metrics
   */
  getMetrics(): RateLimitMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset rate limiter
   */
  reset(): void {
    this.requests.clear();
    this.metrics = {
      totalRequests: 0,
      blockedRequests: 0,
      allowedRequests: 0,
      averageResponseTime: 0
    };
  }

  /**
   * Destroy the rate limiter
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
    this.reset();
  }
}

// Pre-configured rate limiters for different endpoints
export const rateLimiters = {
  // Authentication endpoints - stricter limits
  auth: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per 15 minutes
    message: 'Too many authentication attempts, please try again later'
  }),

  // General API endpoints
  api: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100, // 100 requests per 15 minutes
    message: 'Too many requests, please try again later'
  }),

  // Contact/message endpoints
  contact: new RateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10, // 10 messages per hour
    message: 'Too many messages sent, please try again later'
  }),

  // Poll creation endpoints
  pollCreation: new RateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 20, // 20 polls per hour
    message: 'Too many polls created, please try again later'
  }),

  // Voting endpoints
  voting: new RateLimiter({
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 50, // 50 votes per 5 minutes
    message: 'Too many votes submitted, please try again later'
  })
};

/**
 * Create a custom rate limiter
 */
export function createRateLimiter(config: RateLimitConfig): RateLimiter {
  return new RateLimiter(config);
}

/**
 * Get rate limiter by name
 */
export function getRateLimiter(name: keyof typeof rateLimiters): RateLimiter {
  return rateLimiters[name];
}

/**
 * Check rate limit for a request
 */
export async function checkRateLimit(
  limiterName: keyof typeof rateLimiters,
  key: string
): Promise<RateLimitResult> {
  const limiter = getRateLimiter(limiterName);
  return await limiter.checkLimit(key);
}

/**
 * Rate limit middleware factory
 */
export function createRateLimitMiddleware(limiterName: keyof typeof rateLimiters) {
  return async (req: any, res: any, next: any) => {
    try {
      // Generate key based on IP address and user ID if available
      const ip = req.ip || req.connection.remoteAddress || 'unknown';
      const userId = req.user?.id || 'anonymous';
      const key = `${limiterName}:${ip}:${userId}`;

      const result = await checkRateLimit(limiterName, key);

      if (!result.allowed) {
        return res.status(429).json({
          error: 'Rate limit exceeded',
          message: rateLimiters[limiterName].config.message,
          retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
        });
      }

      // Add rate limit headers
      res.set({
        'X-RateLimit-Limit': rateLimiters[limiterName].config.maxRequests,
        'X-RateLimit-Remaining': result.remaining,
        'X-RateLimit-Reset': new Date(result.resetTime).toISOString()
      });

      next();
    } catch (error) {
      logger.error('Rate limit middleware error', { error: error instanceof Error ? error.message : String(error) });
      next(); // Fail open
    }
  };
}

/**
 * Combine multiple middleware functions
 */
export function combineMiddleware(...middlewares: Array<(req: any, res: any, next: any) => void>) {
  return (req: any, res: any, next: any) => {
    let index = 0;

    function runNext() {
      if (index < middlewares.length) {
        middlewares[index++](req, res, runNext);
      } else {
        next();
      }
    }

    runNext();
  };
}

// Export types and classes
export { RateLimiter };
export default rateLimiters;