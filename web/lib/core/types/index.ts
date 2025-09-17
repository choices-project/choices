/**
 * Core Types Barrel Export
 * 
 * Centralized re-export point for all shared types.
 * This resolves TS2307 "cannot find module" errors for type imports.
 */

// Privacy types
export * from '../privacy/hybrid-privacy';

// Analytics types
export type AnalyticsEvent = {
  name: string;
  properties?: Record<string, string | number | boolean>;
  timestamp?: Date;
}

export type AnalyticsConfig = {
  enabled: boolean;
  provider?: string;
  apiKey?: string;
}

export type PollDemographicInsights = {
  ageGroups: Record<string, number>;
  genderDistribution: Record<string, number>;
  geographicDistribution: Record<string, number>;
  educationLevels: Record<string, number>;
}

export type TrustTier = {
  id: string;
  name: string;
  level: number;
  description: string;
  requirements: string[];
}

export type TrustTierScore = {
  userId: string;
  tierId: string;
  score: number;
  factors: Record<string, number>;
  lastUpdated: Date;
}

export type AnalyticsSummary = {
  totalPolls: number;
  totalVotes: number;
  activeUsers: number;
  engagementRate: number;
  topCategories: Array<{ category: string; count: number }>;
}

export type PollAnalytics = {
  pollId: string;
  totalVotes: number;
  uniqueVoters: number;
  completionRate: number;
  averageTimeToVote: number;
  demographicBreakdown: PollDemographicInsights;
}

export type UserAnalytics = {
  userId: string;
  totalPollsCreated: number;
  totalVotesCast: number;
  averageEngagement: number;
  preferredCategories: string[];
  trustScore: number;
  lastActive: Date;
}

// Poll types
export type Poll = {
  id: string;
  title: string;
  description: string;
  options: string[];
  category: string;
  privacyLevel: string;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
}

export type PollChoice = {
  id: string;
  pollId: string;
  option: string;
  votes: number;
}

export type PollVote = {
  id: string;
  pollId: string;
  choiceId: string;
  userId: string;
  createdAt: Date;
}

// User types
export type User = {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  role: 'user' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

export type SocialLoginOption = {
  provider: string;
  label: string;
  description: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  hoverBgColor: string;
  hoverTextColor: string;
}

export type UserProfile = {
  id: string;
  userId: string;
  bio?: string;
  preferences: Record<string, string | number | boolean>;
  privacySettings: Record<string, string | number | boolean>;
}

// Performance types
export type PerformanceMetrics = {
  metricName: string;
  avgValue: number;
  minValue: number;
  maxValue: number;
  countMeasurements: number;
  responseTime?: number;
  memoryUsage?: number;
  cacheHitRate?: number;
  errorRate?: number;
}

// Feature flag types
export type FeatureFlag = {
  id: string;
  name: string;
  enabled: boolean;
  description: string;
  key?: string;
  category?: string;
}

// Error types
export type AppError = {
  code: string;
  message: string;
  statusCode: number;
  details?: Record<string, string | number | boolean>;
}

// API response types
export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Common utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;