/**
 * API Response Type Definitions
 * 
 * Standardized response types for all API endpoints to ensure
 * consistent response formats across the application.
 */

export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export type ApiErrorResponse = {
  success: false;
  error: string;
  message: string;
  statusCode: number;
  errorCode: string;
  details?: {
    field?: string;
    value?: unknown;
    constraint?: string;
  };
  timestamp: string;
}

export type VoteResponse = {
  success: boolean;
  voteId: string;
  message: string;
  timestamp: string;
}

export type PollResponse = {
  id: string;
  title: string;
  description: string;
  votingMethod: 'single' | 'approval' | 'ranked' | 'quadratic' | 'range';
  options: PollOption[];
  status: 'draft' | 'active' | 'closed' | 'locked';
  startTime: string;
  endTime: string;
  baselineAt?: string;
  allowPostClose: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  votingConfig: VotingConfig;
}

export type PollOption = {
  id: string;
  text: string;
  description?: string;
}

export type VotingConfig = {
  allowMultipleVotes: boolean;
  requireAuthentication: boolean;
  allowAnonymous: boolean;
  maxSelections?: number;
  minSelections?: number;
  customSettings?: Record<string, unknown>;
}

export type ResultsResponse = {
  pollId: string;
  method: string;
  results: PollResults;
  totalVotes: number;
  calculatedAt: string;
  isBaseline: boolean;
}

export type PollResults = {
  [optionId: string]: {
    optionId: string;
    text: string;
    votes: number;
    percentage: number;
    rank?: number;
  };
}

export type UserResponse = {
  id: string;
  email: string;
  username?: string;
  trustTier: 'T1' | 'T2' | 'T3';
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

export type AuthResponse = {
  user: UserResponse;
  session: {
    accessToken: string;
    refreshToken: string;
    expiresAt: string;
  };
}

export type PaginatedResponse<T> = {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export type HealthCheckResponse = {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    database: 'up' | 'down';
    auth: 'up' | 'down';
    cache: 'up' | 'down';
  };
  version: string;
  uptime: number;
}
