/**
 * Congress.gov Integration
 * 
 * Official government data source for congressional information
 */

export * from './client';
export * from './transformers';
// Re-export error classes with explicit names to avoid conflicts
export {
  CongressGovApiError as CongressGovClientError,
  CongressGovRateLimitError,
  CongressGovNotFoundError,
  CongressGovAuthenticationError,
  CongressGovQuotaExceededError
} from './error-handling';
