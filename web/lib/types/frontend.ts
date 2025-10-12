// Frontend Type Definitions for Agent A5
// Created: 2025-01-16
// Purpose: Comprehensive type definitions to replace 'any' types in frontend components

// API Response Types
export interface ApiResponse<T = unknown> {
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

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// Poll Types
export interface Poll {
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
  sponsors?: string[];
  totalvotes?: number;
  participation?: number;
  createdat?: string;
  endtime?: string;
  start_time?: string;
  end_time?: string;
}

export interface PollOption {
  id: string;
  text: string;
  description?: string;
  imageUrl?: string;
  order: number;
}

export interface PollSettings {
  allowMultipleVotes: boolean;
  requireAuthentication: boolean;
  showResults: boolean;
  allowWriteIns: boolean;
  maxSelections: number;
}

// Results Types
export interface PollResult {
  pollId: string;
  totalVotes: number;
  results: OptionResult[];
  metadata: ResultMetadata;
}

export interface OptionResult {
  optionId: string;
  optionText: string;
  votes: number;
  percentage: number;
  rank: number;
}

export interface ResultMetadata {
  strategy: string;
  processedAt: Date;
  totalRounds: number;
  quota: number;
  threshold: number;
}

// Vote Types
export interface Vote {
  poll_id: string;
  token: string;
  tag: string;
  choice: number;
  voted_at: string;
  merkle_leaf: string;
  merkle_proof: string[];
}

export interface Tally {
  [key: number]: number;
}

export interface CommitmentLog {
  leaf_count: number;
  root: string;
  timestamp: string;
}

// WebAuthn Types
export interface WebAuthnRegistrationOptions {
  challenge: string;
  rp: {
    name: string;
    id: string;
  };
  user: {
    id: string;
    name: string;
    displayName: string;
  };
  pubKeyCredParams: Array<{
    type: string;
    alg: number;
  }>;
  authenticatorSelection: {
    authenticatorAttachment?: string;
    userVerification?: string;
  };
  timeout: number;
  attestation: string;
}

export interface WebAuthnAssertionOptions {
  challenge: string;
  timeout: number;
  rpId: string;
  allowCredentials: Array<{
    type: string;
    id: string;
    transports?: string[];
  }>;
  userVerification: string;
}

export interface WebAuthnCredentialResponse {
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

// Component Props Types
export interface WebAuthnAuthProps {
  onAuthenticated: (userStableId: string, sessionToken: string) => void;
  onSuccess?: (credential: PublicKeyCredential) => void;
  onError?: (error: Error) => void;
  mode?: 'register' | 'authenticate';
  disabled?: boolean;
  className?: string;
}

export interface PollListProps {
  polls: Poll[];
  loading: boolean;
  error?: string;
  onPollClick: (pollId: string) => void;
  onLoadMore: () => void;
  hasMore: boolean;
}

export interface ResultsChartProps {
  results: PollResult;
  chartType: 'bar' | 'pie' | 'line';
  showPercentages: boolean;
  showVoteCounts: boolean;
}

// Event Handler Types
export interface PollEventHandler {
  onVote: (pollId: string, selections: string[]) => Promise<void>;
  onShare: (pollId: string) => void;
  onBookmark: (pollId: string) => void;
  onReport: (pollId: string, reason: string) => void;
}

// Dashboard Data Types
export interface DashboardData {
  totalPolls: number;
  totalVotes: number;
  activeUsers: number;
  recentActivity: ActivityItem[];
  topPolls: Poll[];
  userStats: UserStats;
}

export interface ActivityItem {
  id: string;
  type: 'vote' | 'poll_created' | 'user_joined';
  description: string;
  timestamp: Date;
  userId?: string;
  pollId?: string;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  userGrowthRate: number;
}

// Geographic Data Types
export interface GeographicData {
  regions: RegionData[];
  totalVotes: number;
  participationRate: number;
}

export interface RegionData {
  region: string;
  votes: number;
  percentage: number;
  population: number;
}

// Demographics Data Types
export interface DemographicsData {
  ageGroups: AgeGroupData[];
  educationLevels: EducationData[];
  incomeBrackets: IncomeData[];
  totalResponses: number;
}

export interface AgeGroupData {
  ageRange: string;
  count: number;
  percentage: number;
}

export interface EducationData {
  level: string;
  count: number;
  percentage: number;
}

export interface IncomeData {
  bracket: string;
  count: number;
  percentage: number;
}

// Engagement Data Types
export interface EngagementData {
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
  averageSessionDuration: number;
  bounceRate: number;
  retentionRate: number;
}

// Trending Poll Types
export interface TrendingPoll {
  id: string;
  title: string;
  description: string;
  options: Array<{
    id: string;
    text: string;
    votes: number;
    percentage: number;
  }>;
  totalVotes: number;
  timeRemaining: string;
  category: string;
  isActive: boolean;
}

// Stats Types
export interface PlatformStats {
  totalPolls: number;
  totalVotes: number;
  activeUsers: number;
}
