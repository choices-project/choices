/**
 * API Rate Limiting Utilities
 *
 * Comprehensive rate limiting system that respects external API quotas
 * and implements proper backoff strategies for good API citizenship.
 */

import { logger } from '@/lib/utils/logger';


export type RateLimitConfig = {
  requestsPerSecond: number;
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
  burstLimit?: number;
  backoffMultiplier: number;
  maxBackoffDelay: number;
}

export type RateLimitStatus = {
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

export type ApiUsageMetrics = {
  apiName: string;
  requestsToday: number;
  requestsThisHour: number;
  requestsThisMinute: number;
  lastRequestTime: Date;
  quotaExceeded: boolean;
  nextResetTime: Date;
}

/**
 * Google Civic Information API Rate Limits
 * Based on official documentation:
 * - 25,000 requests per day
 * - 2,500 requests per 100 seconds
 * - 100 requests per 100 seconds per user
 */
export const GOOGLE_CIVIC_RATE_LIMITS: RateLimitConfig = {
  requestsPerSecond: 1, // Conservative: 1 req/sec = 3,600/hour, well under limits
  requestsPerMinute: 50, // Conservative: 50/min = 3,000/hour
  requestsPerHour: 1000, // Conservative: 1,000/hour = 24,000/day
  requestsPerDay: 20000, // Conservative: 20,000/day (leaving 5,000 buffer)
  burstLimit: 5, // Allow small bursts
  backoffMultiplier: 2,
  maxBackoffDelay: 30000 // 30 seconds max backoff
};

// ProPublica rate limits removed - service discontinued

/**
 * Congress.gov API Rate Limits
 * Based on official documentation:
 * - 5,000 requests per day
 * - No specific per-minute limits mentioned
 */
export const CONGRESS_GOV_RATE_LIMITS: RateLimitConfig = {
  requestsPerSecond: 0.5, // Conservative: 0.5 req/sec = 1,800/hour
  requestsPerMinute: 30, // Conservative: 30/min = 1,800/hour
  requestsPerHour: 1800, // Conservative: 1,800/hour = 43,200/day (well under 5,000)
  requestsPerDay: 4500, // Conservative: 4,500/day (leaving 500 buffer)
  burstLimit: 5, // Allow small bursts
  backoffMultiplier: 2,
  maxBackoffDelay: 30000 // 30 seconds max backoff
};

/**
 * Open States API Rate Limits
 * Based on official documentation:
 * - 10,000 requests per day
 * - No specific per-minute limits mentioned
 */
export const OPEN_STATES_RATE_LIMITS: RateLimitConfig = {
  requestsPerSecond: 1, // Conservative: 1 req/sec = 3,600/hour
  requestsPerMinute: 50, // Conservative: 50/min = 3,000/hour
  requestsPerHour: 3000, // Conservative: 3,000/hour = 72,000/day (well under 10,000)
  requestsPerDay: 9000, // Conservative: 9,000/day (leaving 1,000 buffer)
  burstLimit: 10, // Allow larger bursts
  backoffMultiplier: 2,
  maxBackoffDelay: 30000 // 30 seconds max backoff
};

export class RateLimiter {
  private config: RateLimitConfig;
  private requestHistory: Map<string, number[]> = new Map();
  private lastCleanup = Date.now();
  private usageMetrics: ApiUsageMetrics;

  constructor(config: RateLimitConfig, apiName: string) {
    this.config = config;
    this.usageMetrics = {
      apiName,
      requestsToday: 0,
      requestsThisHour: 0,
      requestsThisMinute: 0,
      lastRequestTime: new Date(),
      quotaExceeded: false,
      nextResetTime: this.calculateNextReset()
    };
  }

  /**
   * Check if a request can be made and wait if necessary
   */
  async waitForRateLimit(): Promise<void> {
    const now = Date.now();

    // Clean up old entries periodically
    if (now - this.lastCleanup > 300000) { // 5 minutes
      this.cleanupOldEntries();
      this.lastCleanup = now;
    }

    // Check daily limit
    if (this.usageMetrics.requestsToday >= this.config.requestsPerDay) {
      const waitTime = this.usageMetrics.nextResetTime.getTime() - now;
      if (waitTime > 0) {
        logger.warn('Daily rate limit exceeded, waiting for reset', {
          apiName: this.usageMetrics.apiName,
          waitTimeMs: waitTime,
          requestsToday: this.usageMetrics.requestsToday
        });
        await this.sleep(waitTime);
        this.resetDailyCounters();
      }
    }

    // Check hourly limit
    if (this.usageMetrics.requestsThisHour >= this.config.requestsPerHour) {
      const waitTime = 3600000 - (now % 3600000); // Wait until next hour
      logger.warn('Hourly rate limit exceeded, waiting for reset', {
        apiName: this.usageMetrics.apiName,
        waitTimeMs: waitTime,
        requestsThisHour: this.usageMetrics.requestsThisHour
      });
      await this.sleep(waitTime);
      this.resetHourlyCounters();
    }

    // Check minute limit
    if (this.usageMetrics.requestsThisMinute >= this.config.requestsPerMinute) {
      const waitTime = 60000 - (now % 60000); // Wait until next minute
      logger.warn('Minute rate limit exceeded, waiting for reset', {
        apiName: this.usageMetrics.apiName,
        waitTimeMs: waitTime,
        requestsThisMinute: this.usageMetrics.requestsThisMinute
      });
      await this.sleep(waitTime);
      this.resetMinuteCounters();
    }

    // Check second limit
    const secondKey = Math.floor(now / 1000).toString();
    const requestsThisSecond = this.requestHistory.get(secondKey)?.length ?? 0;

    if (requestsThisSecond >= this.config.requestsPerSecond) {
      const waitTime = 1000 - (now % 1000); // Wait until next second
      logger.debug('Second rate limit exceeded, waiting', {
        apiName: this.usageMetrics.apiName,
        waitTimeMs: waitTime,
        requestsThisSecond
      });
      await this.sleep(waitTime);
    }
  }

  /**
   * Record a successful request
   */
  recordRequest(): void {
    const now = Date.now();
    const secondKey = Math.floor(now / 1000).toString();

    // Add to request history
    if (!this.requestHistory.has(secondKey)) {
      this.requestHistory.set(secondKey, []);
    }
    const secondRequests = this.requestHistory.get(secondKey);
    if (secondRequests) {
      secondRequests.push(now);
    }

    // Update metrics
    this.usageMetrics.requestsToday++;
    this.usageMetrics.requestsThisHour++;
    this.usageMetrics.requestsThisMinute++;
    this.usageMetrics.lastRequestTime = new Date();

    logger.debug('Request recorded', {
      apiName: this.usageMetrics.apiName,
      requestsToday: this.usageMetrics.requestsToday,
      requestsThisHour: this.usageMetrics.requestsThisHour,
      requestsThisMinute: this.usageMetrics.requestsThisMinute
    });
  }

  /**
   * Handle rate limit error with exponential backoff
   */
  async handleRateLimitError(attempt: number = 1): Promise<void> {
    const backoffDelay = Math.min(
      this.config.backoffMultiplier ** attempt * 1000,
      this.config.maxBackoffDelay
    );

    logger.warn('Rate limit error encountered, backing off', {
      apiName: this.usageMetrics.apiName,
      attempt,
      backoffDelayMs: backoffDelay
    });

    this.usageMetrics.quotaExceeded = true;
    await this.sleep(backoffDelay);
  }

  /**
   * Get current usage metrics
   */
  getUsageMetrics(): ApiUsageMetrics {
    return { ...this.usageMetrics };
  }

  /**
   * Get rate limit status
   */
  getRateLimitStatus(): RateLimitStatus {
    const now = Date.now();
    const nextHourReset = 3600000 - (now % 3600000);
    const nextDayReset = this.usageMetrics.nextResetTime.getTime() - now;

    return {
      remaining: Math.max(0, this.config.requestsPerHour - this.usageMetrics.requestsThisHour),
      resetTime: Math.min(nextHourReset, nextDayReset),
      ...(this.usageMetrics.quotaExceeded ? { retryAfter: nextHourReset } : {}),
    };
  }

  /**
   * Reset daily counters
   */
  private resetDailyCounters(): void {
    this.usageMetrics.requestsToday = 0;
    this.usageMetrics.nextResetTime = this.calculateNextReset();
    this.usageMetrics.quotaExceeded = false;
    logger.info('Daily rate limit counters reset', {
      apiName: this.usageMetrics.apiName
    });
  }

  /**
   * Reset hourly counters
   */
  private resetHourlyCounters(): void {
    this.usageMetrics.requestsThisHour = 0;
    logger.debug('Hourly rate limit counters reset', {
      apiName: this.usageMetrics.apiName
    });
  }

  /**
   * Reset minute counters
   */
  private resetMinuteCounters(): void {
    this.usageMetrics.requestsThisMinute = 0;
    logger.debug('Minute rate limit counters reset', {
      apiName: this.usageMetrics.apiName
    });
  }

  /**
   * Calculate next daily reset time
   */
  private calculateNextReset(): Date {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
  }

  /**
   * Clean up old request history entries
   */
  private cleanupOldEntries(): void {
    const cutoff = Date.now() - 3600000; // Keep only last hour
    const cutoffSecond = Math.floor(cutoff / 1000);

    for (const [secondKey, requests] of this.requestHistory) {
      if (parseInt(secondKey) < cutoffSecond) {
        this.requestHistory.delete(secondKey);
      } else {
        // Filter out old requests within the second
        const filteredRequests = requests.filter(timestamp => timestamp > cutoff);
        if (filteredRequests.length === 0) {
          this.requestHistory.delete(secondKey);
        } else {
          this.requestHistory.set(secondKey, filteredRequests);
        }
      }
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Create rate limiter for Google Civic API
 */
export function createGoogleCivicRateLimiter(): RateLimiter {
  return new RateLimiter(GOOGLE_CIVIC_RATE_LIMITS, 'google-civic');
}

// ProPublica rate limiter removed - service discontinued

/**
 * Create rate limiter for Congress.gov API
 */
export function createCongressGovRateLimiter(): RateLimiter {
  return new RateLimiter(CONGRESS_GOV_RATE_LIMITS, 'congress-gov');
}

/**
 * Create rate limiter for Open States API
 */
export function createOpenStatesRateLimiter(): RateLimiter {
  return new RateLimiter(OPEN_STATES_RATE_LIMITS, 'open-states');
}

/**
 * Rate limit decorator for API calls
 */
export function withRateLimit<T extends unknown[], R>(
  rateLimiter: RateLimiter,
  fn: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    await rateLimiter.waitForRateLimit();

    try {
      const result = await fn(...args);
      rateLimiter.recordRequest();
      return result;
    } catch (error) {
      // Check if it's a rate limit error
      if (error instanceof Error && (
        error.message.includes('429') ||
        error.message.includes('rate limit') ||
        error.message.includes('quota exceeded')
      )) {
        await rateLimiter.handleRateLimitError();
        // Retry once
        await rateLimiter.waitForRateLimit();
        const result = await fn(...args);
        rateLimiter.recordRequest();
        return result;
      }
      throw error;
    }
  };
}

/**
 * Monitor API usage across all integrations
 */
export class ApiUsageMonitor {
  private rateLimiters: Map<string, RateLimiter> = new Map();
  private alerts: Array<{
    apiName: string;
    threshold: number;
    current: number;
    timestamp: Date;
  }> = [];

  constructor() {
    this.rateLimiters.set('google-civic', createGoogleCivicRateLimiter());
    // ProPublica rate limiter removed - service discontinued
    this.rateLimiters.set('congress-gov', createCongressGovRateLimiter());
    this.rateLimiters.set('open-states', createOpenStatesRateLimiter());
  }

  /**
   * Get rate limiter for an API
   */
  getRateLimiter(apiName: string): RateLimiter | undefined {
    return this.rateLimiters.get(apiName);
  }

  /**
   * Get usage metrics for all APIs
   */
  getAllUsageMetrics(): Record<string, ApiUsageMetrics> {
    const metrics: Record<string, ApiUsageMetrics> = {};
    for (const [apiName, rateLimiter] of this.rateLimiters) {
      metrics[apiName] = rateLimiter.getUsageMetrics();
    }
    return metrics;
  }

  /**
   * Check for quota warnings
   */
  checkQuotaWarnings(): void {
    for (const [apiName, rateLimiter] of this.rateLimiters) {
      const metrics = rateLimiter.getUsageMetrics();
      const status = rateLimiter.getRateLimitStatus();

      // Warn at 80% of hourly limit
      const hourlyThreshold = 0.8;
      const hourlyLimits = {
        'google-civic': GOOGLE_CIVIC_RATE_LIMITS.requestsPerHour,
        // ProPublica removed - service discontinued
        'congress-gov': CONGRESS_GOV_RATE_LIMITS.requestsPerHour,
        'open-states': OPEN_STATES_RATE_LIMITS.requestsPerHour
      };

      if (metrics.requestsThisHour >= hourlyThreshold * (hourlyLimits[apiName as keyof typeof hourlyLimits] ?? 1000)) {
        logger.warn('API quota warning', {
          apiName,
          requestsThisHour: metrics.requestsThisHour,
          threshold: hourlyThreshold,
          remaining: status.remaining
        });
      }

      // Alert at 90% of daily limit
      const dailyThreshold = 0.9;
      const dailyLimits = {
        'google-civic': GOOGLE_CIVIC_RATE_LIMITS.requestsPerDay,
        'congress-gov': CONGRESS_GOV_RATE_LIMITS.requestsPerDay,
        'open-states': OPEN_STATES_RATE_LIMITS.requestsPerDay
      };

      if (metrics.requestsToday >= dailyThreshold * (dailyLimits[apiName as keyof typeof dailyLimits] ?? 10000)) {
        // Store alert for monitoring and notification systems
        this.alerts.push({
          apiName,
          threshold: dailyThreshold * (dailyLimits[apiName as keyof typeof dailyLimits] ?? 10000),
          current: metrics.requestsToday,
          timestamp: new Date()
        });

        logger.error('API quota alert', {
          apiName,
          requestsToday: metrics.requestsToday,
          threshold: dailyThreshold,
          nextReset: metrics.nextResetTime
        });
      }
    }

    // Clean up old alerts (keep only last 100)
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }
  }

  /**
   * Get recent alerts
   */
  getRecentAlerts(limit: number = 10): Array<{
    apiName: string;
    threshold: number;
    current: number;
    timestamp: Date;
  }> {
    return this.alerts.slice(-limit);
  }
}

/**
 * Global API usage monitor
 */
export const apiUsageMonitor = new ApiUsageMonitor();
