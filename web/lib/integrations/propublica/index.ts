/**
 * ProPublica Congress API Integration
 * 
 * Complete integration module for ProPublica Congress API with client,
 * transformers, and error handling.
 */

export { ProPublicaClient, createProPublicaClient, ProPublicaApiError } from './client';
export { 
  transformMember,
  transformToCandidateCard,
  transformBill,
  transformRecentVotes,
  validateTransformedMember,
  validateTransformedBill,
  cleanMemberData,
  cleanBillData,
  type TransformedProPublicaMember,
  type TransformedProPublicaBill
} from './transformers';
export { 
  ProPublicaErrorHandler,
  proPublicaErrorHandler,
  handleProPublicaError,
  executeWithRetry,
  type ProPublicaErrorDetails,
  type RetryConfig
} from './error-handling';

// Re-export types from client for convenience
export type {
  ProPublicaConfig,
  ProPublicaMember,
  ProPublicaVote,
  ProPublicaBill,
  ProPublicaResponse
} from './client';
