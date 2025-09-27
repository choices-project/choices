
// Common type definitions

// Re-export all type modules for easy importing
export * from './api';
export * from './webauthn';
export * from './google-civic';
export * from './pwa';

// Export poll types (avoiding conflicts with frontend.ts)
export type {
  Poll,
  PollOption,
  PollSettings,
  PollResult,
  OptionResult,
  ResultMetadata,
  PollEventHandler,
  PollListProps,
  ResultsChartProps
} from './poll';

// Export frontend types (excluding duplicates)
export type {
  ApiResponse,
  PaginatedResponse,
  ApiError,
  WebAuthnAuthProps,
  WebAuthnCredentialResponse,
  DashboardData,
  GeographicData,
  DemographicsData,
  EngagementData
} from './frontend';
export type LoginCredentials = {
  email: string;
  password: string;
  twoFactorCode?: string;
}

export type RegisterData = {
  email: string;
  password: string;
  confirmPassword: string;
  twoFactorCode?: string;
}

export type TrendingTopic = {
  id: string;
  title: string;
  description: string;
  category: string;
  trend_score: number;
  trending_score: number;
  status: string;
  source: string;
  created_at: string;
}

export type ActivityItem = {
  id: string;
  title: string;
  type: string;
  description: string;
  timestamp: string;
  severity?: string;
  user_id?: string;
}

export type PollNarrative = {
  id: string;
  title: string;
  description: string;
  story: string;
  summary: string;
  fullStory: string;
  context: any;
  verifiedFacts: any[];
  sources: any[];
  timeline: any[];
  stakeholders: any[];
  communityFacts: any[];
  controversy: {
    level: string;
  };
  moderation: {
    status: string;
  };
}

export type User = {
  id: string;
  email: string;
  stable_id: string;
  verification_tier: string;
  is_active: boolean;
}

export type UserProfile = {
  id: string;
  stable_id: string;
  email: string;
  verification_tier: string;
  is_active: boolean;
}

export type GeneratedPoll = {
  id: string;
  title: string;
  options: string[];
  source_topic_id: string;
  status: string;
  created_at: string;
  metrics: {
    total_votes: number;
    engagement_rate: number;
  };
}
