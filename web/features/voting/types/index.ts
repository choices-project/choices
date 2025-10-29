/**
 * Voting Feature Types
 * Uses actual database schema types for consistency
 * Created: 2025-10-27
 */

import type { Database } from '@/types/database';

// Database type aliases for voting components
export type PollOption = Database['public']['Tables']['poll_options']['Row'];
export type Poll = Database['public']['Tables']['polls']['Row'];
export type Vote = Database['public']['Tables']['votes']['Row'];

// Component-specific types
export interface VoteResponse {
  ok: boolean;
  id?: string;
  error?: string;
}

export interface SingleChoiceVotingProps {
  pollId: string;
  title: string;
  description?: string;
  options: PollOption[];
  onVote: (choice: number) => Promise<void>;
  isVoting: boolean;
  hasVoted?: boolean;
  userVote?: number;
}

export interface MultipleChoiceVotingProps {
  pollId: string;
  title: string;
  description?: string;
  options: PollOption[];
  onVote: (choices: number[]) => Promise<void>;
  isVoting: boolean;
  hasVoted?: boolean;
  userVote?: number[];
}

export interface RangeVotingProps {
  pollId: string;
  title: string;
  description?: string;
  options: PollOption[];
  onVote: (ratings: Record<string, number>) => Promise<void>;
  isVoting: boolean;
  hasVoted?: boolean;
  userVote?: Record<string, number>;
}

export interface ApprovalVotingProps {
  pollId: string;
  title: string;
  description?: string;
  options: PollOption[];
  onVote: (approvedOptions: string[]) => Promise<void>;
  isVoting: boolean;
  hasVoted?: boolean;
  userVote?: string[];
}

export interface RankedChoiceVotingProps {
  pollId: string;
  title: string;
  description?: string;
  options: PollOption[];
  onVote: (rankings: Record<string, number>) => Promise<void>;
  isVoting: boolean;
  hasVoted?: boolean;
  userVote?: Record<string, number>;
}

export interface QuadraticVotingProps {
  pollId: string;
  title: string;
  description?: string;
  options: PollOption[];
  onVote: (allocations: Record<string, number>) => Promise<void>;
  isVoting: boolean;
  hasVoted?: boolean;
  userVote?: Record<string, number>;
  totalCredits?: number;
}
