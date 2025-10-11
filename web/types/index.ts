
// Common type definitions

// Re-export all type modules for easy importing
export * from './api';
export * from '@/features/auth/types/webauthn';
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
  created_at: string;
  email_confirmed_at?: string;
}

export type UserProfile = {
  user_id: string;
  email: string;
  username?: string;
  display_name?: string;
  trust_tier: 'T0' | 'T1' | 'T2' | 'T3';
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
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
