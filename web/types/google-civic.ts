// Google Civic API Types for Choices Platform
// Created: 2025-01-16
// Purpose: Type definitions for Google Civic Information API integration

/**
 * Google Civic API office information
 */
export interface GcOffice {
  name: string;
  divisionId: string;
  officialIndices: number[];
}

/**
 * Google Civic API official information
 */
export interface GcOfficial {
  name: string;
  party?: string;
  phones?: string[];
  urls?: string[];
  emails?: string[];
}

/**
 * Google Civic API representatives response
 */
export interface GcRepresentatives {
  divisions?: Record<string, { name?: string }>;
  offices?: GcOffice[];
  officials?: GcOfficial[];
}

/**
 * Google Civic API election information
 */
export interface GcElectionInfo {
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
export interface GcVoterInfo {
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
export interface GcErrorDetails {
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
export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableStatusCodes: number[];
}

/**
 * Error context for logging and debugging
 */
export type ErrorContext = {} & Record<string, unknown>

// Legacy aliases for backward compatibility
export type GoogleCivicElectionInfo = GcElectionInfo;
export type GoogleCivicVoterInfo = GcVoterInfo;
export type GoogleCivicErrorDetails = GcErrorDetails;
