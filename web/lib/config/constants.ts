/**
 * Application Constants
 * 
 * Centralized configuration constants for the application.
 * Eliminates magic numbers and improves maintainability.
 * 
 * All constants are immutable (as const) and type-safe.
 * Use these instead of hardcoded values throughout the codebase.
 * 
 * Created: November 5, 2025
 * Status: ✅ PRODUCTION
 * 
 * @module config/constants
 */

/**
 * Cache Duration Constants
 * All durations in milliseconds
 */
export const CACHE_DURATIONS = {
  /** 1 minute - for frequently changing data */
  SHORT: 1 * 60 * 1000,
  
  /** 5 minutes - for moderately dynamic data */
  MEDIUM: 5 * 60 * 1000,
  
  /** 15 minutes - for semi-static data */
  LONG: 15 * 60 * 1000,
  
  /** 1 hour - for relatively static data */
  VERY_LONG: 60 * 60 * 1000,
  
  /** 24 hours - for rarely changing data */
  DAY: 24 * 60 * 60 * 1000,
} as const;

/**
 * Scoring Weight Constants
 * Used for relevance and recommendation algorithms
 */
export const SCORING_WEIGHTS = {
  /** Weight for exact hashtag matches */
  HASHTAG_MATCH: 0.6,
  
  /** Weight for primary hashtag importance */
  PRIMARY_HASHTAG: 0.2,
  
  /** Weight for engagement metrics */
  ENGAGEMENT: 0.15,
  
  /** Weight for recency/time decay */
  RECENCY: 0.05,
  
  /** Weight for user relevance in feeds */
  USER_RELEVANCE: 0.7,
  
  /** Weight for interest level in feeds */
  INTEREST_LEVEL: 0.3,
  
  /** Weight for trending score in priority calculation */
  TRENDING: 0.6,
  
  /** Weight for engagement in priority calculation */
  PRIORITY_ENGAGEMENT: 0.4,
} as const;

/**
 * Retry Configuration Constants
 * For handling transient failures
 */
export const RETRY_CONFIG = {
  /** Maximum number of retry attempts */
  MAX_ATTEMPTS: 3,
  
  /** Base delay between retries (ms) */
  BASE_DELAY: 1000,
  
  /** Maximum delay between retries (ms) */
  MAX_DELAY: 10000,
  
  /** Exponential backoff multiplier */
  BACKOFF_MULTIPLIER: 2,
} as const;

/**
 * Pagination Constants
 * Default values for paginated queries
 */
export const PAGINATION = {
  /** Default items per page */
  DEFAULT_LIMIT: 20,
  
  /** Maximum items per page */
  MAX_LIMIT: 100,
  
  /** Default offset for first page */
  DEFAULT_OFFSET: 0,
  
  /** Small page size for mobile/preview */
  SMALL_PAGE: 10,
  
  /** Medium page size for desktop */
  MEDIUM_PAGE: 20,
  
  /** Large page size for bulk operations */
  LARGE_PAGE: 50,
} as const;

/**
 * API Rate Limiting Constants
 */
export const RATE_LIMITS = {
  /** Requests per minute for authenticated users */
  AUTHENTICATED_PER_MINUTE: 60,
  
  /** Requests per minute for anonymous users */
  ANONYMOUS_PER_MINUTE: 10,
  
  /** Requests per hour for heavy operations */
  HEAVY_OPERATIONS_PER_HOUR: 100,
  
  /** Burst allowance (temporary spike) */
  BURST_ALLOWANCE: 10,
} as const;

/**
 * Time Window Constants
 * For analytics and trending calculations
 */
export const TIME_WINDOWS = {
  /** 1 hour in milliseconds */
  ONE_HOUR: 60 * 60 * 1000,
  
  /** 24 hours in milliseconds */
  ONE_DAY: 24 * 60 * 60 * 1000,
  
  /** 7 days in milliseconds */
  ONE_WEEK: 7 * 24 * 60 * 60 * 1000,
  
  /** 30 days in milliseconds */
  ONE_MONTH: 30 * 24 * 60 * 60 * 1000,
  
  /** 90 days in milliseconds */
  THREE_MONTHS: 90 * 24 * 60 * 60 * 1000,
} as const;

/**
 * Threshold Constants
 * Minimum values for various features
 */
export const THRESHOLDS = {
  /** Minimum relevance score to show recommendation */
  MIN_RELEVANCE_SCORE: 0.3,
  
  /** Minimum votes to calculate engagement */
  MIN_VOTES_FOR_ENGAGEMENT: 5,
  
  /** Minimum engagement to show as trending */
  MIN_TRENDING_ENGAGEMENT: 10,
  
  /** Maximum age (days) for trending content */
  MAX_TRENDING_AGE_DAYS: 7,
  
  /** Minimum hashtag frequency to show as trending */
  MIN_HASHTAG_FREQUENCY: 3,
} as const;

/**
 * Normalization Constants
 * For scaling values to 0-1 range
 */
export const NORMALIZATION = {
  /** Maximum poll count for normalization */
  MAX_POLL_COUNT: 100,
  
  /** Maximum engagement score for normalization */
  MAX_ENGAGEMENT: 100,
  
  /** Maximum vote count for normalization */
  MAX_VOTES: 1000,
} as const;

/**
 * Feature Flags
 * Enable/disable features at runtime
 */
export const FEATURES = {
  /** Enable hashtag-based recommendations */
  HASHTAG_RECOMMENDATIONS: true,
  
  /** Enable trending hashtags */
  TRENDING_HASHTAGS: true,
  
  /** Enable personalized feeds */
  PERSONALIZED_FEEDS: true,
  
  /** Enable caching */
  CACHING: true,
  
  /** Enable analytics tracking */
  ANALYTICS: true,
} as const;

/**
 * Helper Functions
 */

/**
 * Calculate exponential backoff delay
 */
export function calculateBackoffDelay(attempt: number): number {
  const delay = RETRY_CONFIG.BASE_DELAY * Math.pow(RETRY_CONFIG.BACKOFF_MULTIPLIER, attempt);
  return Math.min(delay, RETRY_CONFIG.MAX_DELAY);
}

/**
 * Check if value is within time window
 */
export function isWithinTimeWindow(timestamp: Date, windowMs: number): boolean {
  return Date.now() - timestamp.getTime() < windowMs;
}

/**
 * Normalize value to 0-1 range
 */
export function normalize(value: number, max: number): number {
  return Math.min(value / max, 1);
}

/**
 * Clamp value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

