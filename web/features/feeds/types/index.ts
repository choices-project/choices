/**
 * Feeds Feature Types
 * 
 * Centralized type definitions for all feed-related functionality
 * Includes social feeds, hashtag tracking, and personalization
 */

// Core feed item types
export interface FeedItemData {
  id: string;
  representativeId: string;
  representativeName: string;
  representativeParty: string;
  representativeOffice: string;
  representativePhoto: string;
  contentType: 'vote' | 'bill' | 'statement' | 'social_media' | 'photo';
  title: string;
  description?: string;
  imageUrl?: string;
  url?: string;
  date: Date;
  engagementMetrics: {
    likes: number;
    shares: number;
    comments: number;
    bookmarks: number;
  };
  isPublic: boolean;
  metadata: Record<string, any>;
  
  // Enhanced hashtag support
  hashtags?: string[];
  primary_hashtag?: string;
  hashtag_engagement?: {
    total_views: number;
    hashtag_clicks: number;
    hashtag_shares: number;
  };
}

// User preferences for feed personalization
export interface UserPreferences {
  state?: string;
  district?: string;
  interests?: string[];
  followedRepresentatives?: string[];
  feedPreferences?: {
    showVotes: boolean;
    showBills: boolean;
    showStatements: boolean;
    showSocialMedia: boolean;
    showPhotos: boolean;
  };
}

// Engagement data types
export interface EngagementData {
  likes: number;
  shares: number;
  comments: number;
  bookmarks: number;
  views?: number;
  engagementRate?: number;
  trendingScore?: number;
  lastUpdated: Date;
}

// Touch interaction types
export interface TouchPoint {
  x: number;
  y: number;
  time: number;
}

export interface TouchState {
  start: TouchPoint | null;
  end: TouchPoint | null;
  last: TouchPoint | null;
  longPressTimer: NodeJS.Timeout | null;
  isLongPress: boolean;
  initialDistance: number | null;
  lastDistance: number | null;
}

// Hashtag tracking types
export interface HashtagUsage {
  hashtag: string;
  userId: string;
  timestamp: string;
  source: 'onboarding' | 'poll_creation' | 'poll_vote' | 'profile_update' | 'custom';
  metadata?: {
    pollId?: string;
    category?: string;
    engagement?: number;
  };
}

export interface TrendingHashtag {
  hashtag: string;
  usageCount: number;
  growthRate: number; // percentage change from previous period
  recentUsers: string[];
  categories: string[];
  lastUsed: string;
  trendingScore: number; // calculated score for ranking
}

export interface HashtagAnalytics {
  totalHashtags: number;
  trendingHashtags: TrendingHashtag[];
  categoryBreakdown: Record<string, number>;
  userEngagement: Record<string, number>;
  viralPotential: TrendingHashtag[];
}

// Poll feed types
export interface UserInterests {
  selectedInterests: string[];
  customInterests: string[]; // User-created hashtags
  trendingHashtags: string[]; // Real-time trending
  userHashtags: string[]; // User's custom hashtags
}

export interface PersonalizedPollFeed {
  userId: string;
  generatedAt: string;
  polls: PollRecommendation[];
  interestMatches: InterestMatch[];
  trendingHashtags: string[];
  suggestedInterests: string[];
}

export interface PollRecommendation {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  relevanceScore: number;
  interestMatches: string[];
  totalVotes: number;
  created_at: string;
}

export interface InterestMatch {
  interest: string;
  matchCount: number;
  relevanceScore: number;
}

// Feed component props
export interface SocialFeedProps {
  userId?: string;
  preferences?: UserPreferences;
  onLike?: (itemId: string) => void;
  onShare?: (itemId: string) => void;
  onBookmark?: (itemId: string) => void;
  onComment?: (itemId: string) => void;
  className?: string;
}

export interface EnhancedSocialFeedProps {
  userId?: string;
  preferences?: UserPreferences;
  onLike?: (itemId: string) => void;
  onShare?: (itemId: string) => void;
  onBookmark?: (itemId: string) => void;
  onComment?: (itemId: string) => void;
  onViewDetails?: (itemId: string) => void;
  className?: string;
  enablePersonalization?: boolean;
  enableRealTimeUpdates?: boolean;
  enableAnalytics?: boolean;
  enableHaptics?: boolean;
  showTrending?: boolean;
}

export interface FeedItemProps {
  item: FeedItemData;
  onLike?: (itemId: string) => void;
  onShare?: (itemId: string) => void;
  onBookmark?: (itemId: string) => void;
  onComment?: (itemId: string) => void;
  onViewDetails?: (itemId: string) => void;
  isLiked?: boolean;
  isBookmarked?: boolean;
  showEngagement?: boolean;
  enableHaptics?: boolean;
  className?: string;
}

export interface InfiniteScrollProps {
  children: React.ReactNode;
  onLoadMore: () => Promise<void>;
  hasMore: boolean;
  isLoading: boolean;
  threshold?: number;
  rootMargin?: string;
  className?: string;
  enableScrollToTop?: boolean;
  enablePullToRefresh?: boolean;
  onRefresh?: () => Promise<void>;
  loadingComponent?: React.ReactNode;
  endComponent?: React.ReactNode;
  scrollToTopThreshold?: number;
}

// API response types
export interface FeedApiResponse {
  ok: boolean;
  items: FeedItemData[];
  pagination: {
    page: number;
    limit: number;
    hasMore: boolean;
  };
  metadata: {
    totalItems: number;
    generatedAt: string;
    sources: string[];
    personalizationScore: number;
    algorithm: string;
  };
}

export interface HashtagApiResponse {
  success: boolean;
  data: TrendingHashtag[] | HashtagAnalytics;
  type: 'trending' | 'analytics';
}

// Feed service types
export interface GenerateFeedOptions {
  page: number;
  limit: number;
  userId?: string | null;
  state?: string | null;
  interests?: string[];
  followedRepresentatives?: string[];
  personalization?: boolean;
  preferences?: any;
}

export interface FeedServiceConfig {
  enablePersonalization: boolean;
  enableRealTimeUpdates: boolean;
  enableAnalytics: boolean;
  enableHaptics: boolean;
  showTrending: boolean;
  cacheTimeout: number;
  maxItems: number;
}

// ============================================================================
// HASHTAG INTEGRATION TYPES
// ============================================================================

export interface FeedHashtagIntegration {
  feed_id: string;
  hashtag_filters: string[];
  trending_hashtags: string[];
  hashtag_content: HashtagContent[];
  hashtag_analytics: HashtagDetailedAnalytics;
  personalized_hashtags: string[];
}

export interface HashtagContent {
  id: string;
  hashtag_id: string;
  content_type: 'poll' | 'comment' | 'profile' | 'feed' | 'post';
  content_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  is_featured: boolean;
  engagement_score: number;
  metadata?: Record<string, any>;
}

export interface HashtagDetailedAnalytics {
  hashtag_id: string;
  period: '24h' | '7d' | '30d' | '90d' | '1y';
  metrics: {
    usage_count: number;
    unique_users: number;
    engagement_rate: number;
    growth_rate: number;
    peak_usage: number;
    average_usage: number;
    top_content: string[];
    top_users: string[];
    related_hashtags: string[];
    sentiment_distribution: Record<string, number>;
    geographic_distribution: Record<string, number>;
    demographic_distribution: Record<string, number>;
  };
  generated_at: string;
}

export interface HashtagFeed {
  hashtag_id: string;
  content: HashtagContent[];
  total_count: number;
  has_more: boolean;
  last_updated: string;
  filters?: {
    content_type?: string[];
    date_range?: {
      start: string;
      end: string;
    };
    engagement_threshold?: number;
  };
}

export interface HashtagFilter {
  type: 'category' | 'trending' | 'verified' | 'usage_count' | 'date_range';
  value: any;
  label: string;
  active: boolean;
}

export interface HashtagSort {
  option: 'relevance' | 'usage' | 'trending' | 'alphabetical' | 'created';
  direction: 'asc' | 'desc';
  label: string;
}
