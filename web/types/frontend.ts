// Frontend Types for Choices Platform
// Created: 2025-01-16
// Purpose: Type definitions for frontend API and components

// API Types
export type ApiResponse<T = unknown> = {
  data: T;
  success: boolean;
  message?: string;
  errors?: string[];
}

export type PaginatedResponse<T> = {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
} & ApiResponse<T[]>

export type ApiError = {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// Poll Types
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

export type PollOption = {
  id: string;
  text: string;
  description?: string;
  imageUrl?: string;
  order: number;
}

export type PollSettings = {
  allowMultipleVotes: boolean;
  requireAuthentication: boolean;
  showResults: boolean;
  allowWriteIns: boolean;
  maxSelections: number;
}

// Results Types
export type PollResult = {
  pollId: string;
  totalVotes: number;
  results: OptionResult[];
  metadata: ResultMetadata;
}

export type OptionResult = {
  optionId: string;
  optionText: string;
  votes: number;
  percentage: number;
  rank: number;
}

export type ResultMetadata = {
  strategy: string;
  processedAt: Date;
  totalRounds: number;
  quota: number;
  threshold: number;
}

// Component Props Types
export type WebAuthnAuthProps = {
  onSuccess: (credential: PublicKeyCredential) => void;
  onError: (error: Error) => void;
  mode: 'register' | 'authenticate';
  disabled?: boolean;
  className?: string;
}

export type PollListProps = {
  polls: Poll[];
  loading: boolean;
  error?: string;
  onPollClick: (pollId: string) => void;
  onLoadMore: () => void;
  hasMore: boolean;
}

export type ResultsChartProps = {
  results: PollResult;
  chartType: 'bar' | 'pie' | 'line';
  showPercentages: boolean;
  showVoteCounts: boolean;
}

// Event Handler Types
export type PollEventHandler = {
  onVote: (pollId: string, selections: string[]) => Promise<void>;
  onShare: (pollId: string) => void;
  onBookmark: (pollId: string) => void;
  onReport: (pollId: string, reason: string) => void;
}

// WebAuthn Types
export type WebAuthnCredentialResponse = {
  id: string;
  type: string;
  rawId: number[];
  response: {
    clientDataJSON: number[];
    attestationObject?: number[];
    authenticatorData?: number[];
    signature?: number[];
    userHandle?: number[];
  };
}

// Dashboard Data Types
export type DashboardData = {
  totalPolls: number;
  activePolls: number;
  closedPolls: number;
  totalVotes: number;
  activeUsers: number;
  // Add more specific fields as needed
}

export type GeographicData = {
  country: string;
  city: string;
  count: number;
  // Add more specific fields as needed
}

export type DemographicsData = {
  ageGroup: string;
  gender: string;
  count: number;
  // Add more specific fields as needed
}

export type EngagementData = {
  date: string;
  interactions: number;
  // Add more specific fields as needed
}


