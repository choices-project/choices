/**
 * Hashtag Types
 * 
 * Type definitions for the hashtag system
 */

export interface Hashtag {
  id: string
  name: string
  display_name?: string
  description?: string
  category: HashtagCategory
  usage_count: number
  is_trending: boolean
  is_verified: boolean
  is_featured?: boolean
  follower_count?: number
  trend_score?: number
  created_at: string
  updated_at: string
  created_by?: string
  metadata?: Record<string, any>
}

export type HashtagCategory = 
  | 'politics'
  | 'social'
  | 'environment'
  | 'economy'
  | 'health'
  | 'education'
  | 'technology'
  | 'local'
  | 'national'
  | 'international'
  | 'custom'
  | 'global'
  | 'activism'
  | 'community'
  | 'business'

export interface HashtagSearchResult {
  hashtag: Hashtag
  relevance_score: number
  match_type: 'exact' | 'partial' | 'fuzzy'
}

export interface TrendingHashtag {
  hashtag: Hashtag
  trend_score: number
  growth_rate: number
  peak_usage: number
  time_period: string
}

export interface UserHashtag {
  user_id: string
  hashtag_id: string
  hashtag: Hashtag
  followed_at: string
  notification_enabled: boolean
}

export interface HashtagSuggestion {
  hashtag: Hashtag
  reason: string
  confidence: number
  confidence_score?: number
  source: 'trending' | 'similar' | 'popular' | 'recent'
}

export interface HashtagSearchQuery {
  query: string
  category?: HashtagCategory
  limit?: number
  offset?: number
  sort_by?: 'relevance' | 'popularity' | 'trending' | 'recent'
  include_trending?: boolean
  include_verified?: boolean
}

export interface HashtagEngagement {
  hashtag_id: string
  user_id: string
  action: 'view' | 'click' | 'follow' | 'unfollow' | 'share'
  timestamp: string
  metadata?: Record<string, any>
}

export interface HashtagAnalytics {
  hashtag_id: string
  period: string
  total_usage: number
  unique_users: number
  engagement_rate: number
  trend_score: number
  demographics: {
    age_groups: Record<string, number>
    locations: Record<string, number>
    interests: Record<string, number>
  }
  generated_at: string
}

export interface HashtagSearchQuery {
  query: string
  category?: HashtagCategory
  limit?: number
  offset?: number
  sort_by?: 'relevance' | 'popularity' | 'trending' | 'recent'
  include_trending?: boolean
  include_verified?: boolean
}
