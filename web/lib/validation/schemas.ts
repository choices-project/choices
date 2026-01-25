/**
 * Runtime Validation Schemas
 *
 * Comprehensive Zod schemas for runtime type validation of database responses
 * and API data. This provides better type safety than type assertions alone.
 */

import { z } from 'zod';

import { LEGACY_TRUST_TIER_ALIASES, TRUST_TIERS, normalizeTrustTier } from '@/lib/trust/trust-tiers';

import type { Json } from '@/types/database';

const JsonValueSchema: z.ZodType<Json> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(JsonValueSchema),
    z.record(z.string(), JsonValueSchema)
  ])
);

// Base schemas for common types
/** ISO 8601 datetime string validation */
const TimestampSchema = z.string().datetime();
/** UUID v4 string validation */
const UUIDSchema = z.string().uuid();
/** Valid email address validation */
const EmailSchema = z.string().email();
/** Trust tier enumeration validation */
const TrustTierInputSchema = z.union([
  z.enum(TRUST_TIERS),
  z.enum(LEGACY_TRUST_TIER_ALIASES),
  z.string().regex(/^tier[_-]?[0-3]$/i),
  z.number().int().min(0).max(3),
]);

const TrustTierSchema = TrustTierInputSchema.transform((value) => normalizeTrustTier(value));

/**
 * User Profile Schema
 *
 * Validates user profile data from the database, ensuring all required fields
 * are present and properly formatted.
 *
 * @example
 * ```typescript
 * const result = UserProfileSchema.safeParse(userData);
 * if (result.success) {
 *   const profile = result.data; // Fully typed UserProfile
 * }
 * ```
 */
export const UserProfileSchema = z.object({
  /** Unique user identifier (UUID) */
  user_id: UUIDSchema,
  /** Row identifier (UUID) */
  id: UUIDSchema,
  /** Username (1-50 characters) */
  username: z.string().min(1).max(50),
  /** Optional public display name */
  display_name: z.string().nullable(),
  /** User's email address */
  email: EmailSchema,
  /** Short biography supplied by the user */
  bio: z.string().nullable(),
  /** Profile avatar URL (stored as string; may be null) */
  avatar_url: z.string().nullable(),
  /** User's trust tier level */
  trust_tier: TrustTierSchema.nullable(),
  /** Trust tier score (numeric) */
  trust_tier_score: z.number().nullable(),
  /** Trust tier version (numeric) */
  trust_tier_version: z.number().nullable(),
  /** Integrity consent timestamp */
  integrity_consent_at: TimestampSchema.nullable(),
  /** Integrity consent scope */
  integrity_consent_scope: z.string().nullable(),
  /** Preferred analytics dashboard mode */
  analytics_dashboard_mode: z.string().nullable(),
  /** Saved dashboard layout JSON */
  dashboard_layout: JsonValueSchema.nullable(),
  /** User privacy settings JSON */
  privacy_settings: JsonValueSchema.nullable(),
  /** Participation style selection */
  participation_style: z.string().nullable(),
  /** Primary concerns array */
  primary_concerns: z.array(z.string()).nullable(),
  /** Community focus interests */
  community_focus: z.array(z.string()).nullable(),
  /** Demographic metadata */
  demographics: JsonValueSchema.nullable(),
  /** Administrative flag */
  is_admin: z.boolean().nullable(),
  /** Active status flag */
  is_active: z.boolean().nullable(),
  /** Profile creation timestamp */
  created_at: TimestampSchema.nullable(),
  /** Last profile update timestamp */
  updated_at: TimestampSchema.nullable(),
});

/**
 * Poll Schema
 *
 * Validates poll data from the database, ensuring all required fields
 * are present and properly formatted for voting operations.
 *
 * @example
 * ```typescript
 * const result = PollSchema.safeParse(pollData);
 * if (result.success) {
 *   const poll = result.data; // Fully typed Poll
 * }
 * ```
 */
export const PollSchema = z.object({
  /** Unique poll identifier (UUID) */
  id: UUIDSchema,
  /** Poll title (1-200 characters) */
  title: z.string().min(1).max(200),
  /** Poll description (max 1000 characters) */
  description: z.string().max(1000),
  /** Array of poll options (1-100 characters each) */
  options: z.array(z.string().min(1).max(100)),
  /** Poll category (1-50 characters) */
  category: z.string().min(1).max(50),
  /** Type of poll voting system */
  poll_type: z.enum(['single_choice', 'multiple_choice', 'ranked_choice']),
  /** Privacy level for the poll */
  privacy_level: z.enum(['public', 'private', 'high_privacy']),
  /** ID of the user who created the poll */
  user_id: UUIDSchema,
  /** Poll creation timestamp */
  created_at: TimestampSchema,
  /** Last poll update timestamp */
  updated_at: TimestampSchema,
  /** Poll expiration timestamp (optional) */
  expires_at: TimestampSchema.optional(),
  /** Current poll status */
  status: z.enum(['active', 'closed', 'draft']),
});

// Vote Schema
export const VoteSchema = z.object({
  id: UUIDSchema,
  poll_id: UUIDSchema,
  user_id: UUIDSchema,
  choice: z.string().min(1),
  rank: z.number().int().min(1).optional(),
  created_at: TimestampSchema,
  updated_at: TimestampSchema,
});

// Vote with User Info Schema
export const VoteWithUserInfoSchema = VoteSchema.extend({
  username: z.string(),
  trust_tier: TrustTierSchema,
});

// Vote Grouped by Choice Schema
export const VoteGroupedByChoiceSchema = z.object({
  choice: z.string(),
  count: z.number().int().min(0),
  percentage: z.number().min(0).max(100),
});

// Polls Response Schema
export const PollsResponseSchema = z.object({
  polls: z.array(PollSchema.extend({
    votes: z.array(z.object({
      count: z.number().int().min(0),
    })),
  })),
  pagination: z.object({
    page: z.number().int().min(1),
    limit: z.number().int().min(1).max(100),
    total: z.number().int().min(0),
    pages: z.number().int().min(0),
  }),
});

// Analytics Data Schema
export const AnalyticsDataSchema = z.object({
  period: z.string(),
  summary: z.object({
    totalUsers: z.number().int().min(0),
    totalPolls: z.number().int().min(0),
    totalVotes: z.number().int().min(0),
    activeUsers: z.number().int().min(0),
    newPolls: z.number().int().min(0),
    newVotes: z.number().int().min(0),
  }),
  trends: z.object({
    userGrowth: z.array(z.object({
      date: z.string(),
      count: z.number().int().min(0),
    })),
    pollActivity: z.array(z.object({
      date: z.string(),
      count: z.number().int().min(0),
    })),
    voteActivity: z.array(z.object({
      date: z.string(),
      count: z.number().int().min(0),
    })),
  }),
});

// Database Health Status Schema
export const DatabaseHealthStatusSchema = z.object({
  status: z.enum(['healthy', 'degraded', 'unhealthy']),
  timestamp: TimestampSchema,
  responseTime: z.number().min(0),
  errorRate: z.number().min(0).max(1),
  lastError: z.string().optional(),
  details: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
});

// Cache Database Entry Schema
export const CacheDatabaseEntrySchema = z.object({
  key: z.string(),
  value: z.string(),
  expires_at: TimestampSchema,
  created_at: TimestampSchema,
});

// Feature Flag Schema
export const FeatureFlagSchema = z.object({
  id: z.string(),
  name: z.string(),
  enabled: z.boolean(),
  description: z.string(),
  key: z.string().optional(),
  category: z.string().optional(),
});

// News Article Schema
export const NewsArticleSchema = z.object({
  id: UUIDSchema,
  headline: z.string().min(1).max(200),
  summary: z.string().max(500),
  fullStory: z.string().max(5000),
  sourceUrl: z.string().url(),
  sourceName: z.string().min(1).max(100),
  sourceReliability: z.number().min(0).max(10),
  category: z.array(z.string()),
  urgency: z.enum(['low', 'medium', 'high', 'critical']),
  sentiment: z.enum(['positive', 'negative', 'neutral']),
  entities: z.array(z.object({
    name: z.string(),
    type: z.string(),
    confidence: z.number().min(0).max(1),
    metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
  })),
  metadata: z.object({
    keywords: z.array(z.string()),
    controversy: z.number().min(0).max(10),
    timeSensitivity: z.enum(['low', 'medium', 'high']),
    geographicScope: z.enum(['local', 'national', 'international', 'global']),
    politicalImpact: z.number().min(0).max(10),
    publicInterest: z.number().min(0).max(10),
    complexity: z.enum(['low', 'medium', 'high']).optional(),
  }),
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
});

// News Source Schema
export const NewsSourceSchema = z.object({
  id: UUIDSchema,
  name: z.string().min(1).max(100),
  domain: z.string().min(1).max(100),
  reliability: z.number().min(0).max(10),
  bias: z.enum(['left', 'center', 'right', 'unknown']),
  type: z.enum(['news', 'blog', 'social', 'government', 'academic']),
  apiEndpoint: z.string().url().optional(),
  apiKey: z.string().optional(),
  rateLimit: z.number().int().min(1),
  isActive: z.boolean(),
  lastUpdated: TimestampSchema,
  errorCount: z.number().int().min(0),
  successRate: z.number().min(0).max(1),
});

// Connection Wrapper Schema
export const ConnectionWrapperSchema = z.object({
  id: z.string(),
  connection: z.any(), // SupabaseClient - can't validate this at runtime
  createdAt: z.number(),
  lastUsed: z.number(),
  isActive: z.boolean(),
  isIdle: z.boolean(),
  validationCount: z.number().int().min(0),
  lastValidation: z.number(),
});

// Health Check Schema
export const HealthCheckSchema = z.object({
  apiName: z.string(),
  status: z.enum(['healthy', 'degraded', 'unhealthy']),
  timestamp: TimestampSchema,
  responseTime: z.number().min(0),
  errorRate: z.number().min(0).max(1),
  lastError: z.string().optional(),
  details: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
});

// Query Performance Metrics Schema
export const QueryPerformanceMetricsSchema = z.object({
  query: z.string(),
  executionTime: z.number().min(0),
  rowsReturned: z.number().int().min(0),
  cacheHit: z.boolean(),
  timestamp: z.number(),
});

// Integration Metrics Schema
export const IntegrationMetricsSchema = z.object({
  apiName: z.string(),
  timestamp: TimestampSchema,
  requests: z.object({
    total: z.number().int().min(0),
    successful: z.number().int().min(0),
    failed: z.number().int().min(0),
    rateLimited: z.number().int().min(0),
  }),
  performance: z.object({
    averageResponseTime: z.number().min(0),
    p95ResponseTime: z.number().min(0),
    p99ResponseTime: z.number().min(0),
    minResponseTime: z.number().min(0),
    maxResponseTime: z.number().min(0),
  }),
  errors: z.object({
    total: z.number().int().min(0),
    byType: z.record(z.string(), z.number().int().min(0)),
    byStatusCode: z.record(z.string(), z.number().int().min(0)),
  }),
  cache: z.object({
    hitRate: z.number().min(0).max(1),
    missRate: z.number().min(0).max(1),
    totalHits: z.number().int().min(0),
    totalMisses: z.number().int().min(0),
  }),
  quota: z.object({
    remaining: z.number().int().min(0),
    used: z.number().int().min(0),
    resetTime: TimestampSchema,
    quotaExceeded: z.boolean(),
  }),
});

// Alert Rule Schema
export const AlertRuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  apiName: z.string(),
  metric: z.string(),
  operator: z.enum(['gt', 'lt', 'eq', 'gte', 'lte']),
  threshold: z.number(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  enabled: z.boolean(),
  cooldown: z.number().int().min(0),
  lastTriggered: TimestampSchema.optional(),
});

// Alert Schema
export const AlertSchema = z.object({
  id: z.string(),
  ruleId: z.string(),
  apiName: z.string(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  message: z.string(),
  value: z.number(),
  threshold: z.number(),
  timestamp: TimestampSchema,
  acknowledged: z.boolean(),
  resolved: z.boolean(),
});

// Export all schemas for easy access
export const DatabaseSchemas = {
  UserProfile: UserProfileSchema,
  Poll: PollSchema,
  Vote: VoteSchema,
  VoteWithUserInfo: VoteWithUserInfoSchema,
  VoteGroupedByChoice: VoteGroupedByChoiceSchema,
  PollsResponse: PollsResponseSchema,
  AnalyticsData: AnalyticsDataSchema,
  DatabaseHealthStatus: DatabaseHealthStatusSchema,
  CacheDatabaseEntry: CacheDatabaseEntrySchema,
  FeatureFlag: FeatureFlagSchema,
  NewsArticle: NewsArticleSchema,
  NewsSource: NewsSourceSchema,
  ConnectionWrapper: ConnectionWrapperSchema,
  HealthCheck: HealthCheckSchema,
  QueryPerformanceMetrics: QueryPerformanceMetricsSchema,
  IntegrationMetrics: IntegrationMetricsSchema,
  AlertRule: AlertRuleSchema,
  Alert: AlertSchema,
} as const;

// Type exports for use in other files
export type UserProfile = z.infer<typeof UserProfileSchema>;
export type Poll = z.infer<typeof PollSchema>;
export type Vote = z.infer<typeof VoteSchema>;
export type VoteWithUserInfo = z.infer<typeof VoteWithUserInfoSchema>;
export type VoteGroupedByChoice = z.infer<typeof VoteGroupedByChoiceSchema>;
export type PollsResponse = z.infer<typeof PollsResponseSchema>;
export type AnalyticsData = z.infer<typeof AnalyticsDataSchema>;
export type DatabaseHealthStatus = z.infer<typeof DatabaseHealthStatusSchema>;
export type CacheDatabaseEntry = z.infer<typeof CacheDatabaseEntrySchema>;
export type FeatureFlag = z.infer<typeof FeatureFlagSchema>;
export type NewsArticle = z.infer<typeof NewsArticleSchema>;
export type NewsSource = z.infer<typeof NewsSourceSchema>;
export type ConnectionWrapper = z.infer<typeof ConnectionWrapperSchema>;
export type HealthCheck = z.infer<typeof HealthCheckSchema>;
export type QueryPerformanceMetrics = z.infer<typeof QueryPerformanceMetricsSchema>;
export type IntegrationMetrics = z.infer<typeof IntegrationMetricsSchema>;
export type AlertRule = z.infer<typeof AlertRuleSchema>;
export type Alert = z.infer<typeof AlertSchema>;
