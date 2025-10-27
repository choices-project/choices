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
} from './error-handling';

// Import types from the types file
export type { GoogleCivicErrorDetails } from '@/types/external/google-civic';

// Re-export types from client for convenience
export type {
  GoogleCivicConfig,
  GoogleCivicAddress,
  GoogleCivicRepresentative,
  GoogleCivicOffice,
  GoogleCivicDivision,
  GoogleCivicResponse
} from './client';
