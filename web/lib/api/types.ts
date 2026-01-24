/**
 * API Response Types & Standards
 *
 * Standardized TypeScript types for all API responses.
 * Ensures consistency across the entire API surface.
 *
 * Created: November 6, 2025 (Phase 3)
 * Status: ✅ ACTIVE
 */

// ============================================================================
// BASE RESPONSE TYPES
// ============================================================================

/**
 * Standard success response wrapper
 * All successful API responses should follow this structure
 */
export type ApiSuccessResponse<T = any> = {
  success: true;
  data: T;
  metadata?: ApiMetadata;
}

/**
 * Standard error response wrapper
 * All error responses should follow this structure
 */
export type ApiErrorResponse = {
  success: false;
  error: string;
  details?: string | Record<string, any>;
  code?: string;
  metadata?: ApiMetadata;
}

/**
 * Combined response type for APIs that can return either success or error
 */
export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Response metadata (optional, but recommended)
 */
export type ApiMetadata = {
  timestamp: string;
  requestId?: string;
  version?: string;
  pagination?: PaginationMetadata;
  [key: string]: any;
}

/**
 * Pagination metadata for list endpoints
 */
export type PaginationMetadata = {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
  page?: number;
  totalPages?: number;
  /** Set when using cursor-based pagination (e.g. GET /api/polls?cursor=...) */
  nextCursor?: string;
}

// ============================================================================
// HEALTH API TYPES
// ============================================================================

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'warning' | 'error' | 'ok' | 'disabled' | 'unknown';

export type HealthCheckResult = {
  status: HealthStatus;
  timestamp: string;
  environment: string;
  version?: string;
  maintenance?: boolean;
  details?: Record<string, any>;
}

export type DatabaseHealthResult = {
  averageResponseTime: number;
  cacheHitRate: number;
  connectionPool: {
    status: string;
    utilizationRate: number;
    metrics: {
      totalConnections: number;
      activeConnections: number;
      idleConnections: number;
    };
  };
  performance: {
    queryStats: {
      totalQueries: number;
      averageQueryTime: number;
    };
    slowQueries: any[];
    optimizationEnabled: boolean;
    cacheEnabled: boolean;
  };
} & HealthCheckResult

export type ExtendedHealthResult = {
  status: HealthStatus;
  timestamp: string;
  environment: string;
  version: string;
  uptime: number;
  checks: {
    database: HealthCheckResult;
    rateLimiting: HealthCheckResult;
    supabase: HealthCheckResult;
  };
  system: {
    nodeVersion: string;
    platform: string;
    memory: {
      used: number;
      total: number;
      limit: number;
    };
    cpu: {
      usage: NodeJS.CpuUsage;
    };
  };
}

// ============================================================================
// PROFILE API TYPES
// ============================================================================

export type UserProfile = {
  user_id: string;
  email: string;
  display_name?: string;
  username?: string;
  avatar_url?: string;
  bio?: string;
  trust_tier: string;
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  demographics?: Record<string, any>;
  privacy_settings?: PrivacySettings;
  primary_concerns?: string[];
  community_focus?: string[];
  participation_style?: string;
}

export type PrivacySettings = {
  profile_visibility?: 'public' | 'friends' | 'private';
  show_email?: boolean;
  show_activity?: boolean;
  allow_messages?: boolean;
  share_demographics?: boolean;
  allow_analytics?: boolean;
}

export type ProfileUpdateRequest = {
  display_name?: string;
  username?: string;
  bio?: string;
  avatar_url?: string;
  demographics?: Record<string, any>;
  privacy_settings?: PrivacySettings;
  primary_concerns?: string[];
  community_focus?: string[];
}

// ============================================================================
// DASHBOARD API TYPES
// ============================================================================

export type DashboardData = {
  user: {
    id: string;
    email: string;
    name: string;
  };
  analytics: {
    total_votes: number;
    total_polls_created: number;
    active_polls: number;
    total_votes_on_user_polls: number;
    participation_score: number;
    recent_activity: {
      votes_last_30_days: number;
      polls_created_last_30_days: number;
    };
  };
  preferences: {
    showElectedOfficials: boolean;
    showQuickActions: boolean;
    showRecentActivity: boolean;
    showEngagementScore: boolean;
  };
  platformStats: {
    total_polls: number;
    total_votes: number;
    active_polls: number;
    total_users: number;
  };
  generatedAt: string;
  fromCache?: boolean;
  loadTime?: number;
}

export type AdminDashboardData = {
  admin_user: {
    id: string;
    email: string;
    name: string;
  };
  overview: {
    total_users: number;
    total_polls: number;
    total_votes: number;
    active_polls: number;
    new_users_last_7_days: number;
    engagement_rate: number;
  };
  analytics: {
    user_growth: Array<{
      date: string;
      new_users: number;
      total_users: number;
    }>;
    poll_activity: Array<{
      date: string;
      polls_created: number;
      votes_cast: number;
    }>;
    top_categories: Array<{
      category: string;
      poll_count: number;
      vote_count: number;
    }>;
  };
  system_health: {
    status: string;
    database_latency_ms: number;
    uptime_percentage: number;
    last_health_check: string;
  };
  recent_activity: {
    new_users: Array<{
      id: string;
      email: string;
      created_at: string;
    }>;
    recent_polls: Array<{
      id: string;
      title: string;
      created_by: string;
      created_at: string;
      total_votes: number;
    }>;
    recent_votes: Array<{
      id: string;
      poll_id: string;
      user_id: string;
      created_at: string;
    }>;
  };
  generatedAt: string;
}

// ============================================================================
// FEEDBACK API TYPES
// ============================================================================

export type FeedbackType = 'bug' | 'feature' | 'general' | 'performance' | 'accessibility' | 'security' | 'csp-violation';
export type FeedbackSentiment = 'positive' | 'negative' | 'neutral' | 'mixed';
export type FeedbackStatus = 'open' | 'pending' | 'in_progress' | 'resolved' | 'closed' | 'rejected';
export type FeedbackPriority = 'low' | 'medium' | 'high' | 'urgent';

export type Feedback = {
  id: string;
  user_id: string | null;
  feedback_type: FeedbackType;
  title: string;
  description: string;
  sentiment: FeedbackSentiment;
  status: FeedbackStatus;
  priority: FeedbackPriority;
  tags: string[];
  screenshot?: string;
  user_journey?: Record<string, any>;
  ai_analysis?: Record<string, any>;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export type FeedbackSubmitRequest = {
  type: FeedbackType;
  title: string;
  description: string;
  sentiment: FeedbackSentiment;
  screenshot?: string;
  userJourney?: Record<string, any>;
  feedbackContext?: Record<string, any>;
}

export type FeedbackListResponse = {
  success: true;
  feedback: Feedback[];
  count: number;
  analytics?: {
    total: number;
    byType: Record<string, number>;
    bySentiment: Record<string, number>;
    byStatus: Record<string, number>;
  };
}

// ============================================================================
// TRENDING API TYPES
// ============================================================================

export type TrendingType = 'polls' | 'hashtags' | 'topics';

export type TrendingHashtag = {
  hashtag: string;
  count: number;
  trend: 'rising' | 'falling' | 'stable';
  velocity: number;
  sentiment?: number;
}

export type TrendingPoll = {
  id: string;
  title: string;
  description: string;
  category: string;
  totalVotes: number;
  timeRemaining: string;
  isActive: boolean;
  options: Array<{
    id: string;
    text: string;
    votes: number;
    percentage: number;
  }>;
}

export type TrendingTopic = {
  id: string;
  topic: string;
  title: string;
  description: string;
  source: string;
  category: string;
  trending_score: number;
  velocity: number;
  momentum: number;
  sentiment_score: number;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// ANALYTICS API TYPES
// ============================================================================

export type AnalyticsSummary = {
  totalPolls: number;
  totalVotes: number;
  activeUsers: number;
  averageParticipation: number;
  topCategories: Array<{
    category: string;
    count: number;
  }>;
  recentActivity: Array<{
    date: string;
    polls: number;
    votes: number;
  }>;
}

export type PollAnalytics = {
  poll_id: string;
  total_votes: number;
  unique_voters: number;
  vote_distribution: Record<string, number>;
  demographics: Record<string, any>;
  timeline: Array<{
    timestamp: string;
    votes: number;
  }>;
}

export type UserAnalytics = {
  user_id: string;
  total_votes: number;
  total_polls_created: number;
  participation_rate: number;
  trust_tier: string;
  activity_timeline: Array<{
    date: string;
    votes: number;
    polls: number;
  }>;
}

// ============================================================================
// POLL API TYPES
// ============================================================================

export type PollStatus = 'draft' | 'active' | 'closed' | 'archived';
export type PollVisibility = 'public' | 'private' | 'unlisted';

export type Poll = {
  id: string;
  title: string;
  description: string;
  category: string;
  status: PollStatus;
  visibility: PollVisibility;
  created_by: string;
  created_at: string;
  start_at?: string;
  end_at?: string;
  closed_at?: string;
  total_votes: number;
  options: PollOption[];
  tags?: string[];
  metadata?: Record<string, any>;
}

export type PollOption = {
  id: string;
  text: string;
  description?: string;
  votes: number;
  percentage: number;
}

export type VoteRequest = {
  poll_id: string;
  option_id: string;
  metadata?: Record<string, any>;
}

export type VoteResponse = {
  success: true;
  vote_id: string;
  poll_id: string;
  option_id: string;
  timestamp: string;
}

// ============================================================================
// AUTH API TYPES
// ============================================================================

export type LoginRequest = {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export type RegisterRequest = {
  email: string;
  password: string;
  username?: string;
  display_name?: string;
}

export type AuthResponse = {
  success: true;
  user: {
    id: string;
    email: string;
    username?: string;
  };
  session: {
    access_token: string;
    refresh_token: string;
    expires_at: string;
  };
}

export type MeResponse = {
  success: true;
  user: UserProfile;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Type guard to check if response is successful
 */
export function isSuccessResponse<T>(
  response: ApiResponse<T>
): response is ApiSuccessResponse<T> {
  return response.success === true;
}

/**
 * Type guard to check if response is an error
 */
export function isErrorResponse(
  response: ApiResponse<any>
): response is ApiErrorResponse {
  return response.success === false;
}

/**
 * Extract data from response or throw error
 */
export function unwrapResponse<T>(response: ApiResponse<T>): T {
  if (isSuccessResponse(response)) {
    return response.data;
  }
  throw new Error(response.error);
}

