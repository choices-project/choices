
// Common type definitions
export interface LoginCredentials {
  email: string;
  password: string;
  twoFactorCode?: string;
}

export interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
  twoFactorCode?: string;
}

export interface TrendingTopic {
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

export interface ActivityItem {
  id: string;
  title: string;
  type: string;
  description: string;
  timestamp: string;
  severity?: string;
  user_id?: string;
}

export interface PollNarrative {
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

export interface User {
  id: string;
  email: string;
  stable_id: string;
  verification_tier: string;
  is_active: boolean;
}

export interface UserProfile {
  id: string;
  stable_id: string;
  email: string;
  verification_tier: string;
  is_active: boolean;
}

export interface GeneratedPoll {
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
