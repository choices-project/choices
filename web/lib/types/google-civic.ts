// Google Civic API Types for Agent A5
// Created: 2025-01-16
// Purpose: Type definitions for Google Civic API integration

export interface GoogleCivicElectionInfo {
  kind: string;
  elections: Array<{
    id: string;
    name: string;
    electionDay: string;
    ocdDivisionId: string;
  }>;
}

export interface GoogleCivicVoterInfo {
  kind: string;
  election: {
    id: string;
    name: string;
    electionDay: string;
    ocdDivisionId: string;
  };
  normalizedInput: {
    line1: string;
    city: string;
    state: string;
    zip: string;
  };
  pollingLocations?: Array<{
    address: {
      locationName?: string;
      line1: string;
      line2?: string;
      city: string;
      state: string;
      zip: string;
    };
    notes?: string;
    pollingHours?: string;
    sources?: Array<{
      name: string;
      official: boolean;
    }>;
  }>;
  contests?: Array<{
    type: string;
    office?: string;
    district?: {
      name: string;
      scope: string;
      id: string;
    };
    candidates?: Array<{
      name: string;
      party?: string;
      candidateUrl?: string;
      channels?: Array<{
        type: string;
        id: string;
      }>;
    }>;
    referendumTitle?: string;
    referendumSubtitle?: string;
    referendumUrl?: string;
    sources?: Array<{
      name: string;
      official: boolean;
    }>;
  }>;
  state?: Array<{
    name: string;
    electionAdministrationBody: {
      name?: string;
      electionInfoUrl?: string;
      votingLocationFinderUrl?: string;
      ballotInfoUrl?: string;
      correspondenceAddress?: {
        locationName?: string;
        line1: string;
        line2?: string;
        city: string;
        state: string;
        zip: string;
      };
    };
    localJurisdiction?: {
      name: string;
      electionAdministrationBody: {
        name?: string;
        electionInfoUrl?: string;
        votingLocationFinderUrl?: string;
        ballotInfoUrl?: string;
        correspondenceAddress?: {
          locationName?: string;
          line1: string;
          line2?: string;
          city: string;
          state: string;
          zip: string;
        };
      };
    };
    sources?: Array<{
      name: string;
      official: boolean;
    }>;
  }>;
}

export interface GoogleCivicErrorDetails {
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

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableStatusCodes: number[];
}

export interface ErrorContext {
  operation?: string;
  address?: string;
  electionId?: string;
  attempt?: number;
  timestamp?: string;
}
