// Poll Types for Choices Platform
// Created: 2025-01-16
// Purpose: Type definitions for poll-related data structures

/**
 * Core poll data structure
 */
export type Poll = {
  id: string;
  title: string;
  description: string;
  options: PollOption[];
  status: 'draft' | 'active' | 'closed' | 'archived';
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  settings: PollSettings;
}

/**
 * Individual poll option
 */
export type PollOption = {
  id: string;
  text: string;
  description?: string;
  imageUrl?: string;
  order: number;
}

/**
 * Poll configuration settings
 */
export type PollSettings = {
  allowMultipleVotes: boolean;
  requireAuthentication: boolean;
  showResults: boolean;
  allowWriteIns: boolean;
  maxSelections: number;
}

/**
 * Poll voting result
 */
export type PollResult = {
  pollId: string;
  totalVotes: number;
  results: OptionResult[];
  metadata: ResultMetadata;
}

/**
 * Individual option result
 */
export type OptionResult = {
  optionId: string;
  optionText: string;
  votes: number;
  percentage: number;
  rank: number;
}

/**
 * Result calculation metadata
 */
export type ResultMetadata = {
  strategy: string;
  processedAt: Date;
  totalRounds: number;
  quota: number;
  threshold: number;
}

/**
 * Poll event handler interface
 */
export type PollEventHandler = {
  onVote: (pollId: string, selections: string[]) => Promise<void>;
  onShare: (pollId: string) => void;
  onBookmark: (pollId: string) => void;
  onReport: (pollId: string, reason: string) => void;
}

/**
 * Poll list component props
 */
export type PollListProps = {
  polls: Poll[];
  loading: boolean;
  error?: string;
  onPollClick: (pollId: string) => void;
  onLoadMore: () => void;
  hasMore: boolean;
}

/**
 * Results chart component props
 */
export type ResultsChartProps = {
  results: PollResult;
  chartType: 'bar' | 'pie' | 'line';
  showPercentages: boolean;
  showVoteCounts: boolean;
}


