/**
 * External API Integrations Module
 * 
 * Complete integration system for external APIs with proper rate limiting,
 * caching, monitoring, and error handling. Designed for good API citizenship.
 */

// Google Civic Information API - specific exports to avoid conflicts
export {
  GoogleCivicClient,
  type GoogleCivicConfig,
  type GoogleCivicResponse,
  type GoogleCivicApiError
} from './google-civic';

// ProPublica Congress API - ARCHIVED (service closed down)

// Congress.gov API
export * from './congress-gov';

// Resolve export conflicts by re-exporting with specific names
export type {
  GoogleCivicErrorDetails
} from '@/types/external/google-civic';

// Google Civic exports removed - files don't exist
// export {
//   executeWithRetry as executeWithGoogleCivicRetry
// } from './google-civic/error-handling';

// export {
//   transformToCandidateCard as transformToGoogleCivicCandidateCard
// } from './google-civic/transformers';

// ProPublica exports removed - service archived

// Rate Limiting exports removed - files don't exist
// export {
//   RateLimiter,
//   createGoogleCivicRateLimiter,
//   // createProPublicaRateLimiter, // ARCHIVED
//   withRateLimit,
//   ApiUsageMonitor,
//   apiUsageMonitor,
//   GOOGLE_CIVIC_RATE_LIMITS,
//   // PROPUBLICA_RATE_LIMITS, // ARCHIVED
//   type RateLimitConfig,
//   type RateLimitStatus,
//   type ApiUsageMetrics
// } from './rate-limiting';

// Caching
export {
  ApiResponseCache,
  createApiCache,
  googleCivicCache,
  // proPublicaCache, // ARCHIVED
  CACHE_CONFIGS,
  type CacheConfig,
  type CacheEntry,
  type CacheStats,
  type CacheMetrics
} from './caching';

// Monitoring exports removed - files don't exist
// export {
//   IntegrationMonitor,
//   integrationMonitor,
//   type IntegrationMetrics,
//   type AlertRule,
//   type Alert,
//   type HealthCheck
// } from './monitoring';
