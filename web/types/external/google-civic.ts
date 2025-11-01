// Google Civic API Types for Choices Platform
// Created: 2025-01-16
// Purpose: Type definitions for Google Civic Information API integration

/**
 * Google Civic API office information
 */
export type GcOffice = {
  name: string;
  divisionId: string;
  officialIndices: number[];
}

/**
 * Google Civic API official information
 */
export type GcOfficial = {
  name: string;
  party?: string;
  phones?: string[];
  urls?: string[];
  emails?: string[];
}

/**
 * Google Civic API representatives response
 */
export type GcRepresentatives = {
  divisions?: Record<string, { name?: string }>;
  offices?: GcOffice[];
  officials?: GcOfficial[];
}

/**
 * Google Civic API election information
 */
export type GcElectionInfo = {
  kind: string;
  elections: Array<{
    id: string;
    name: string;
    electionDay: string;
    ocdDivisionId: string;
    primaryParty?: string;
    district?: {
      id: string;
      name: string;
      scope: string;
    };
  }>;
}

/**
 * Google Civic API voter information
 */
export type GcVoterInfo = {
  kind: string;
  election: {
    id: string;
    name: string;
    electionDay: string;
    ocdDivisionId: string;
  };
}

/**
 * Google Civic API error details
 */
export type GcErrorDetails = {
  code?: string;
  message?: string;
  status?: string;
  userMessage?: string;
  details?: Array<{
    '@type': string;
    reason: string;
    domain: string;
    metadata?: Record<string, unknown>;
  }>;
}

/**
 * Retry configuration for API calls
 */
export type RetryConfig = {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableStatusCodes: number[];
}

/**
 * Error context for logging and debugging
 * Note: Using the centralized ErrorContext from error-types.ts
 */
// Error context type definition
type ErrorContext = {
  code: string;
  message: string;
  details?: any;
}

// Legacy aliases for backward compatibility
export type GoogleCivicElectionInfo = GcElectionInfo;
export type GoogleCivicVoterInfo = GcVoterInfo;
export type GoogleCivicErrorDetails = GcErrorDetails;
