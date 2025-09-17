/**
 * Voting System Types
 * 
 * Comprehensive type definitions for the voting engine and strategies
 * 
 * Created: September 15, 2025
 * Updated: September 15, 2025
 */

export type VoteRequest = {
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
  metadata?: Record<string, unknown>;
}

export type VoteResponse = {
  success: boolean;
  message?: string;
  pollId: string;
  voteId?: string;
  auditReceipt?: string;
  privacyLevel?: string;
  responseTime?: number;
  metadata?: Record<string, unknown>;
}

export type VoteValidation = {
  isValid: boolean;
  error?: string;
  requiresAuthentication: boolean;
  requiresTokens: boolean;
}

export type PollData = {
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
  metadata?: Record<string, unknown>;
}

export type PollOption = {
  id: string;
  text: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

export type VoteData = {
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
  metadata?: Record<string, unknown>;
}

export type ResultsData = {
  pollId: string;
  votingMethod: VotingMethod;
  totalVotes: number;
  participationRate: number;
  results: PollResults;
  calculatedAt: string;
  metadata?: Record<string, unknown>;
}

export type VoteResult = {
  optionId: string;
  votes: number;
  percentage: number;
  metadata?: Record<string, unknown>;
}

export type VotingMethod = 'single' | 'approval' | 'ranked' | 'quadratic' | 'range';

export type PollResults = {
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

export type InstantRunoffRound = {
  round: number;
  eliminated?: string;
  votes: Record<string, number>;
  percentages: Record<string, number>;
}

export type VotingStrategy = {
  getVotingMethod(): VotingMethod;
  validateVote(request: VoteRequest, poll: PollData): Promise<VoteValidation>;
  processVote(request: VoteRequest, poll: PollData): Promise<VoteResponse>;
  calculateResults(poll: PollData, votes: VoteData[]): Promise<ResultsData>;
  getConfiguration(): Record<string, unknown>;
}

export type VoteProcessor = {
  processVote(vote: VoteData): Promise<VoteSubmissionResult>;
}

export type VoteSubmissionResult = {
  success: boolean;
  voteId?: string;
  error?: string;
}

// ============================================================================
// IRV CALCULATION TYPES
// ============================================================================

export type IRVResult = {
  winner: string;
  rounds: IRVRound[];
  totalVotes: number;
  participationRate: number;
  breakdown: Record<string, number>;
  metadata: {
    algorithm: string;
    tieBreakingMethod: string;
    calculationTime: number;
  };
}

export type IRVRound = {
  round: number;
  eliminated?: string;
  votes: Record<string, number>;
  percentages: Record<string, number>;
}

export type UserRanking = {
  pollId: string;
  userId: string;
  ranking: string[];
  createdAt: Date;
}

export type Candidate = {
  id: string;
  name: string;
  description?: string;
}

// ============================================================================
// FINALIZATION TYPES
// ============================================================================

export type PollSnapshot = {
  id: string;
  pollId: string;
  takenAt: Date;
  results: IRVResult;
  totalBallots: number;
  checksum: string;
  merkleRoot?: string;
  createdAt: Date;
}

export type FinalizeResult = {
  success: boolean;
  snapshotId?: string;
  error?: string;
  metadata: {
    officialBallots: number;
    postCloseBallots: number;
    calculationTime: number;
    checksum: string;
    merkleRoot: string;
  };
}

export type FinalizeOptions = {
  force: boolean;
  skipValidation: boolean;
  generateReplayData: boolean;
  broadcastUpdate: boolean;
}

export type Ballot = {
  id: string;
  pollId: string;
  userId: string;
  ranking: string[];
  createdAt: Date;
  isPostClose: boolean;
}

export type Poll = {
  id: string;
  title: string;
  description?: string;
  candidates: Candidate[];
  closeAt?: Date;
  allowPostclose: boolean;
  status: 'draft' | 'active' | 'closed' | 'archived';
  lockedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// MERKLE TREE TYPES
// ============================================================================

export type MerkleTree = {
  addBallots(ballots: BallotCommitment[]): string[];
  getRoot(): string;
  generateReplayData(algorithm: string): ReplayData;
}

export type BallotCommitment = {
  id: string;
  data: Ballot;
}

export type BallotVerificationManager = {
  createTree(pollId: string): MerkleTree;
}

export type ReplayData = {
  algorithm: string;
  steps: unknown[];
  metadata: Record<string, unknown>;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type SnapshotData = {
  pollId: string;
  takenAt: Date;
  results: IRVResult;
  totalBallots: number;
  checksum: string;
  merkleRoot: string;
}