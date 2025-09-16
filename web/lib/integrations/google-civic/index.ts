/**
 * Google Civic Information API Integration
 * 
 * Complete integration module for Google Civic Information API with client,
 * transformers, and error handling.
 */

export { GoogleCivicClient, createGoogleCivicClient, GoogleCivicApiError } from './client';
export { 
  transformAddressLookup,
  transformRepresentatives,
  transformToCandidateCard,
  validateTransformedData,
  cleanRepresentativeData,
  type TransformedRepresentative,
  type TransformedCandidateCard
} from './transformers';
export { 
  GoogleCivicErrorHandler,
  googleCivicErrorHandler,
  handleGoogleCivicError,
  executeWithRetry,
  type GoogleCivicErrorDetails,
  type RetryConfig
} from './error-handling';

// Re-export types from client for convenience
export type {
  GoogleCivicConfig,
  GoogleCivicAddress,
  GoogleCivicRepresentative,
  GoogleCivicOffice,
  GoogleCivicDivision,
  GoogleCivicResponse
} from './client';
