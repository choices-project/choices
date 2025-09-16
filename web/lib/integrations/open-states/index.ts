/**
 * Open States Integration
 * 
 * State legislature data source for comprehensive state government information
 */

// Export client types with specific names
export {
  OpenStatesClient,
  type OpenStatesClientConfig,
  type OpenStatesLegislator as OpenStatesClientLegislator,
  type OpenStatesBill as OpenStatesClientBill,
  type OpenStatesVote as OpenStatesClientVote
} from './client';

// Export transformer types with specific names
export {
  transformOpenStatesLegislator,
  transformOpenStatesBill,
  transformOpenStatesVote,
  transformToCandidateCard
} from './transformers';
// Re-export error classes with explicit names to avoid conflicts
export {
  OpenStatesApiError as OpenStatesClientError,
  OpenStatesRateLimitError,
  OpenStatesNotFoundError,
  OpenStatesAuthenticationError,
  OpenStatesQuotaExceededError,
  OpenStatesServerError
} from './error-handling';
