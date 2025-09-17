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

// ProPublica Congress API - specific exports to avoid conflicts  
export {
  ProPublicaClient,
  type ProPublicaConfig,
  type ProPublicaResponse,
  type ProPublicaApiError
} from './propublica';

// Congress.gov API
export * from './congress-gov';

// Resolve export conflicts by re-exporting with specific names
export type {
  GoogleCivicErrorDetails
} from '@/lib/types/google-civic';

export {
  executeWithRetry as executeWithGoogleCivicRetry
} from './google-civic/error-handling';

export {
  transformToCandidateCard as transformToGoogleCivicCandidateCard
} from './google-civic/transformers';

export type {
  RetryConfig as ProPublicaRetryConfig
} from './propublica/error-handling';

export {
  executeWithRetry as executeWithProPublicaRetry
} from './propublica/error-handling';

export {
  transformToCandidateCard as transformToProPublicaCandidateCard
} from './propublica/transformers';

// Rate Limiting
export {
  RateLimiter,
  createGoogleCivicRateLimiter,
  createProPublicaRateLimiter,
  withRateLimit,
  ApiUsageMonitor,
  apiUsageMonitor,
  GOOGLE_CIVIC_RATE_LIMITS,
  PROPUBLICA_RATE_LIMITS,
  type RateLimitConfig,
  type RateLimitStatus,
  type ApiUsageMetrics
} from './rate-limiting';

// Caching
export {
  ApiResponseCache,
  createApiCache,
  googleCivicCache,
  proPublicaCache,
  CACHE_CONFIGS,
  type CacheConfig,
  type CacheEntry,
  type CacheStats,
  type CacheMetrics
} from './caching';

// Monitoring
export {
  IntegrationMonitor,
  integrationMonitor,
  type IntegrationMetrics,
  type AlertRule,
  type Alert,
  type HealthCheck
} from './monitoring';
