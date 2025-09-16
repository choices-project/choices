/**
 * Voting System Types
 * 
 * Comprehensive type definitions for the voting engine and strategies
 * 
 * Created: September 15, 2025
 * Updated: September 15, 2025
 */

export interface VoteRequest {
  pollId: string;
  userId?: string;
  voteData: {
    choice?: number;           // For single choice
    approvals?: number[];      // For approval voting
    rankings?: number[];       // For ranked choice
    allocations?: Record<string, number>; // For quadratic
    ratings?: Record<string, number>;     // For range
  };
  privacyLevel?: 'public' | 'private' | 'anonymous';
  timestamp?: Date;
  metadata?: Record<string, any>;
}

export interface VoteResponse {
  success: boolean;
  message?: string;
  pollId: string;
  voteId?: string;
  auditReceipt?: string;
  privacyLevel?: string;
  responseTime?: number;
  metadata?: Record<string, any>;
}

export interface VoteValidation {
  isValid: boolean;
  error?: string;
  requiresAuthentication: boolean;
  requiresTokens: boolean;
}

export interface PollData {
  id: string;
  title: string;
  description?: string;
  votingMethod: VotingMethod;
  options: PollOption[];
  status: 'draft' | 'active' | 'closed' | 'locked';
  startTime?: Date;
  endTime?: Date;
  baselineAt?: Date;
  allowPostClose?: boolean;
  lockedAt?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  votingConfig: {
    allowMultipleVotes?: boolean;
    maxChoices?: number;
    quadraticCredits?: number;
    rangeMin?: number;
    rangeMax?: number;
    requireVerification?: boolean;
    minTrustTier?: string;
  };
  metadata?: Record<string, any>;
}

export interface PollOption {
  id: string;
  text: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface VoteData {
  id: string;
  pollId: string;
  userId?: string;
  // Vote data for different voting methods
  choice?: number;           // For single choice
  approvals?: number[];      // For approval voting
  rankings?: number[];       // For ranked choice
  allocations?: Record<string, number>; // For quadratic
  ratings?: Record<string, number>;     // For range
  privacyLevel: string;
  timestamp: Date;
  auditReceipt: string;
  // Additional fields for database storage
  verificationToken?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export interface ResultsData {
  pollId: string;
  votingMethod: VotingMethod;
  totalVotes: number;
  participationRate: number;
  results: PollResults;
  calculatedAt: string;
  metadata?: Record<string, any>;
}

export interface VoteResult {
  optionId: string;
  votes: number;
  percentage: number;
  metadata?: Record<string, any>;
}

export type VotingMethod = 'single' | 'approval' | 'ranked' | 'quadratic' | 'range';

export interface PollResults {
  winner?: string;
  winnerVotes: number;
  winnerPercentage: number;
  optionVotes: Record<string, number>;
  optionPercentages: Record<string, number>;
  abstentions: number;
  abstentionPercentage: number;
  // Additional fields for specific voting methods
  approvalScores?: Record<string, number>;
  approvalPercentages?: Record<string, number>;
  bordaScores?: Record<string, number>;
  instantRunoffRounds?: InstantRunoffRound[];
  quadraticScores?: Record<string, number>;
  quadraticSpending?: Record<string, number>;
  rangeScores?: Record<string, number>;
  rangeAverages?: Record<string, number>;
}

export interface InstantRunoffRound {
  round: number;
  eliminated?: string;
  votes: Record<string, number>;
  percentages: Record<string, number>;
}

export interface VotingStrategy {
  getVotingMethod(): VotingMethod;
  validateVote(request: VoteRequest, poll: PollData): Promise<VoteValidation>;
  processVote(request: VoteRequest, poll: PollData): Promise<VoteResponse>;
  calculateResults(poll: PollData, votes: VoteData[]): Promise<ResultsData>;
  getConfiguration(): Record<string, any>;
}

export interface VoteProcessor {
  processVote(vote: VoteData): Promise<VoteSubmissionResult>;
}

export interface VoteSubmissionResult {
  success: boolean;
  voteId?: string;
  error?: string;
}