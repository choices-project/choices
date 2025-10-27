/**
 * Hashtag Constants
 * 
 * Constants and configuration values for the hashtag system
 * 
 * Created: December 19, 2024
 * Status: ✅ ACTIVE
 */

import type { HashtagCategory } from '@/types/features/hashtags/hashtags';

// ============================================================================
// HASHTAG SYSTEM CONSTANTS
// ============================================================================

export const HASHTAG_CONSTANTS = {
  // Length limits
  MIN_HASHTAG_LENGTH: 2,
  MAX_HASHTAG_LENGTH: 50,
  MAX_HASHTAGS_PER_USER: 50,
  MAX_HASHTAGS_PER_CONTENT: 10,
  
  // Trending thresholds
  TRENDING_USAGE_THRESHOLD: 100,
  TRENDING_GROWTH_THRESHOLD: 20,
  TRENDING_SCORE_THRESHOLD: 50,
  
  // Engagement thresholds
  HIGH_ENGAGEMENT_THRESHOLD: 0.1,
  MEDIUM_ENGAGEMENT_THRESHOLD: 0.05,
  LOW_ENGAGEMENT_THRESHOLD: 0.01,
  
  // Cache timeouts (in milliseconds)
  HASHTAG_CACHE_TIMEOUT: 5 * 60 * 1000, // 5 minutes
  TRENDING_CACHE_TIMEOUT: 1 * 60 * 1000, // 1 minute
  SEARCH_CACHE_TIMEOUT: 2 * 60 * 1000, // 2 minutes
  ANALYTICS_CACHE_TIMEOUT: 15 * 60 * 1000, // 15 minutes
  
  // API limits
  MAX_SEARCH_RESULTS: 50,
  MAX_SUGGESTIONS: 10,
  MAX_TRENDING_HASHTAGS: 20,
  MAX_RELATED_HASHTAGS: 5,
  
  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  
  // Validation - Allow common special characters that are URL-safe
  ALLOWED_HASHTAG_CHARS: /^[a-z0-9_-]+$/,
  FORBIDDEN_HASHTAG_PATTERNS: [
    /^_+$/, // Only underscores
    /_{2,}/, // Multiple consecutive underscores
    /^_/, // Starting with underscore
    /_$/, // Ending with underscore
  ],
  
  // Performance
  DEBOUNCE_DELAY: 300, // milliseconds
  SEARCH_MIN_LENGTH: 2,
  SUGGESTION_MIN_LENGTH: 1,
} as const;

// ============================================================================
// HASHTAG CATEGORY CONFIGURATION
// ============================================================================

export const HASHTAG_CATEGORIES: Record<HashtagCategory, {
  name: string;
  displayName: string;
  description: string;
  color: string;
  icon: string;
  keywords: string[];
  isSystem: boolean;
}> = {
  politics: {
    name: 'politics',
    displayName: 'Politics',
    description: 'Political discussions, elections, and government affairs',
    color: 'red',
    icon: '🏛️',
    keywords: ['politics', 'government', 'election', 'vote', 'democracy', 'senate', 'congress', 'president'],
    isSystem: true
  },
  civics: {
    name: 'civics',
    displayName: 'Civics',
    description: 'Civic engagement, community involvement, and public service',
    color: 'blue',
    icon: '🗳️',
    keywords: ['civics', 'civic', 'community', 'public', 'citizen', 'rights', 'freedom', 'justice'],
    isSystem: true
  },
  social: {
    name: 'social',
    displayName: 'Social',
    description: 'Social issues, community, and human relationships',
    color: 'green',
    icon: '👥',
    keywords: ['social', 'community', 'society', 'people', 'human', 'family', 'relationship'],
    isSystem: true
  },
  environment: {
    name: 'environment',
    displayName: 'Environment',
    description: 'Environmental issues, climate change, and sustainability',
    color: 'emerald',
    icon: '🌱',
    keywords: ['environment', 'climate', 'green', 'sustainability', 'renewable', 'carbon', 'pollution'],
    isSystem: true
  },
  economy: {
    name: 'economy',
    displayName: 'Economy',
    description: 'Economic issues, finance, and business',
    color: 'yellow',
    icon: '💰',
    keywords: ['economy', 'economic', 'finance', 'business', 'money', 'market', 'trade', 'employment'],
    isSystem: true
  },
  health: {
    name: 'health',
    displayName: 'Health',
    description: 'Health and wellness topics',
    color: 'pink',
    icon: '🏥',
    keywords: ['health', 'medical', 'healthcare', 'medicine', 'doctor', 'hospital', 'wellness', 'fitness'],
    isSystem: true
  },
  education: {
    name: 'education',
    displayName: 'Education',
    description: 'Educational topics and learning',
    color: 'purple',
    icon: '📚',
    keywords: ['education', 'school', 'university', 'college', 'student', 'teacher', 'learning', 'academic'],
    isSystem: true
  },
  technology: {
    name: 'technology',
    displayName: 'Technology',
    description: 'Technology, digital innovation, and tech trends',
    color: 'indigo',
    icon: '💻',
    keywords: ['tech', 'technology', 'digital', 'ai', 'artificial', 'software', 'programming', 'internet'],
    isSystem: true
  },
  culture: {
    name: 'culture',
    displayName: 'Culture',
    description: 'Cultural topics, arts, and traditions',
    color: 'orange',
    icon: '🎭',
    keywords: ['culture', 'cultural', 'art', 'music', 'literature', 'tradition', 'heritage', 'diversity'],
    isSystem: true
  },
  sports: {
    name: 'sports',
    displayName: 'Sports',
    description: 'Sports and athletic activities',
    color: 'cyan',
    icon: '⚽',
    keywords: ['sports', 'sport', 'athletic', 'fitness', 'exercise', 'team', 'game', 'competition'],
    isSystem: true
  },
  entertainment: {
    name: 'entertainment',
    displayName: 'Entertainment',
    description: 'Entertainment, media, and leisure',
    color: 'violet',
    icon: '🎬',
    keywords: ['entertainment', 'entertain', 'movie', 'film', 'tv', 'television', 'show', 'music'],
    isSystem: true
  },
  news: {
    name: 'news',
    displayName: 'News',
    description: 'Current events and news',
    color: 'slate',
    icon: '📰',
    keywords: ['news', 'current', 'breaking', 'update', 'report', 'journalism', 'media', 'press'],
    isSystem: true
  },
  local: {
    name: 'local',
    displayName: 'Local',
    description: 'Local community and regional topics',
    color: 'amber',
    icon: '🏘️',
    keywords: ['local', 'neighborhood', 'city', 'town', 'community', 'regional', 'area', 'district'],
    isSystem: true
  },
  national: {
    name: 'national',
    displayName: 'National',
    description: 'National topics and country-wide issues',
    color: 'rose',
    icon: '🇺🇸',
    keywords: ['national', 'country', 'federal', 'state', 'nation', 'patriotic', 'american', 'usa'],
    isSystem: true
  },
  international: {
    name: 'international',
    displayName: 'International',
    description: 'Global and international topics',
    color: 'teal',
    icon: '🌍',
    keywords: ['international', 'global', 'world', 'foreign', 'worldwide', 'global', 'overseas'],
    isSystem: true
  },
  custom: {
    name: 'custom',
    displayName: 'Custom',
    description: 'User-defined custom hashtags',
    color: 'gray',
    icon: '🏷️',
    keywords: [],
    isSystem: false
  },
  global: {
    name: 'global',
    displayName: 'Global',
    description: 'Global topics and worldwide issues',
    color: 'blue',
    icon: '🌐',
    keywords: ['global', 'worldwide', 'international', 'universal', 'world'],
    isSystem: true
  },
  activism: {
    name: 'activism',
    displayName: 'Activism',
    description: 'Social activism and advocacy',
    color: 'red',
    icon: '✊',
    keywords: ['activism', 'advocacy', 'protest', 'movement', 'change', 'justice'],
    isSystem: true
  },
  community: {
    name: 'community',
    displayName: 'Community',
    description: 'Community building and local engagement',
    color: 'green',
    icon: '🤝',
    keywords: ['community', 'local', 'neighborhood', 'engagement', 'together'],
    isSystem: true
  },
  business: {
    name: 'business',
    displayName: 'Business',
    description: 'Business and entrepreneurship',
    color: 'purple',
    icon: '💼',
    keywords: ['business', 'entrepreneur', 'startup', 'commerce', 'trade'],
    isSystem: true
  },
  science: {
    name: 'science',
    displayName: 'Science',
    description: 'Scientific topics and research',
    color: 'indigo',
    icon: '🔬',
    keywords: ['science', 'research', 'study', 'discovery', 'innovation'],
    isSystem: true
  },
  art: {
    name: 'art',
    displayName: 'Art',
    description: 'Artistic expression and creativity',
    color: 'pink',
    icon: '🎨',
    keywords: ['art', 'artist', 'creative', 'painting', 'drawing', 'sculpture'],
    isSystem: true
  },
  music: {
    name: 'music',
    displayName: 'Music',
    description: 'Musical topics and entertainment',
    color: 'violet',
    icon: '🎵',
    keywords: ['music', 'song', 'artist', 'concert', 'album', 'band'],
    isSystem: true
  },
  food: {
    name: 'food',
    displayName: 'Food',
    description: 'Food and culinary topics',
    color: 'orange',
    icon: '🍽️',
    keywords: ['food', 'cooking', 'recipe', 'restaurant', 'chef', 'culinary'],
    isSystem: true
  },
  travel: {
    name: 'travel',
    displayName: 'Travel',
    description: 'Travel and tourism',
    color: 'cyan',
    icon: '✈️',
    keywords: ['travel', 'tourism', 'vacation', 'trip', 'destination', 'adventure'],
    isSystem: true
  },
  fashion: {
    name: 'fashion',
    displayName: 'Fashion',
    description: 'Fashion and style',
    color: 'rose',
    icon: '👗',
    keywords: ['fashion', 'style', 'clothing', 'design', 'trend', 'outfit'],
    isSystem: true
  },
  lifestyle: {
    name: 'lifestyle',
    displayName: 'Lifestyle',
    description: 'Lifestyle and personal topics',
    color: 'amber',
    icon: '🌟',
    keywords: ['lifestyle', 'life', 'personal', 'wellness', 'happiness', 'balance'],
    isSystem: true
  },
  other: {
    name: 'other',
    displayName: 'Other',
    description: 'Miscellaneous and uncategorized topics',
    color: 'gray',
    icon: '📝',
    keywords: ['other', 'misc', 'general', 'miscellaneous', 'uncategorized'],
    isSystem: true
  }
} as const;

// ============================================================================
// HASHTAG SORTING OPTIONS
// ============================================================================

export const HASHTAG_SORT_OPTIONS = [
  {
    value: 'relevance',
    label: 'Most Relevant',
    description: 'Sort by relevance to search query'
  },
  {
    value: 'usage',
    label: 'Most Used',
    description: 'Sort by usage count'
  },
  {
    value: 'trending',
    label: 'Trending',
    description: 'Sort by trending score'
  },
  {
    value: 'alphabetical',
    label: 'Alphabetical',
    description: 'Sort alphabetically'
  },
  {
    value: 'created',
    label: 'Newest',
    description: 'Sort by creation date'
  }
] as const;

// ============================================================================
// HASHTAG FILTER OPTIONS
// ============================================================================

export const HASHTAG_FILTER_OPTIONS = [
  {
    value: 'category',
    label: 'Category',
    description: 'Filter by hashtag category'
  },
  {
    value: 'trending',
    label: 'Trending',
    description: 'Show only trending hashtags'
  },
  {
    value: 'verified',
    label: 'Verified',
    description: 'Show only verified hashtags'
  },
  {
    value: 'usage_count',
    label: 'Usage Count',
    description: 'Filter by minimum usage count'
  },
  {
    value: 'date_range',
    label: 'Date Range',
    description: 'Filter by creation date range'
  }
] as const;

// ============================================================================
// HASHTAG NOTIFICATION TYPES
// ============================================================================

export const HASHTAG_NOTIFICATION_TYPES = [
  {
    value: 'new_trending',
    label: 'New Trending Hashtags',
    description: 'Get notified when hashtags you follow start trending'
  },
  {
    value: 'hashtag_update',
    label: 'Hashtag Updates',
    description: 'Get notified about updates to hashtags you follow'
  },
  {
    value: 'related_content',
    label: 'Related Content',
    description: 'Get notified about new content related to your hashtags'
  },
  {
    value: 'weekly_digest',
    label: 'Weekly Digest',
    description: 'Get a weekly summary of hashtag activity'
  }
] as const;

// ============================================================================
// HASHTAG ANALYTICS PERIODS
// ============================================================================

export const HASHTAG_ANALYTICS_PERIODS = [
  {
    value: '24h',
    label: 'Last 24 Hours',
    description: 'Analytics for the last 24 hours'
  },
  {
    value: '7d',
    label: 'Last 7 Days',
    description: 'Analytics for the last 7 days'
  },
  {
    value: '30d',
    label: 'Last 30 Days',
    description: 'Analytics for the last 30 days'
  },
  {
    value: '90d',
    label: 'Last 90 Days',
    description: 'Analytics for the last 90 days'
  },
  {
    value: '1y',
    label: 'Last Year',
    description: 'Analytics for the last year'
  }
] as const;

// ============================================================================
// HASHTAG PERFORMANCE LEVELS
// ============================================================================

export const HASHTAG_PERFORMANCE_LEVELS = {
  viral: {
    threshold: 80,
    label: 'Viral',
    description: 'Hashtag is going viral',
    color: 'red'
  },
  high: {
    threshold: 60,
    label: 'High',
    description: 'High performance hashtag',
    color: 'orange'
  },
  medium: {
    threshold: 30,
    label: 'Medium',
    description: 'Medium performance hashtag',
    color: 'yellow'
  },
  low: {
    threshold: 0,
    label: 'Low',
    description: 'Low performance hashtag',
    color: 'gray'
  }
} as const;

// ============================================================================
// HASHTAG VALIDATION RULES
// ============================================================================

export const HASHTAG_VALIDATION_RULES = {
  // Character rules
  minLength: 2,
  maxLength: 50,
  allowedChars: /^[a-z0-9_-]+$/,
  
  // Pattern rules
  forbiddenPatterns: [
    /^_+$/, // Only underscores
    /_{2,}/, // Multiple consecutive underscores
    /^_/, // Starting with underscore
    /_$/, // Ending with underscore
  ],
  
  // Content rules
  forbiddenWords: [
    'admin', 'administrator', 'moderator', 'mod',
    'spam', 'bot', 'fake', 'test',
    'nsfw', 'adult', 'explicit'
  ],
  
  // System rules
  reservedHashtags: [
    'system', 'admin', 'moderator', 'official',
    'support', 'help', 'feedback', 'contact'
  ]
} as const;

// ============================================================================
// HASHTAG API ENDPOINTS
// ============================================================================

export const HASHTAG_API_ENDPOINTS = {
  // Core CRUD
  HASHTAGS: '/api/hashtags',
  HASHTAG_BY_ID: (id: string) => `/api/hashtags/${id}`,
  HASHTAG_BY_NAME: (name: string) => `/api/hashtags/name/${name}`,
  
  // Search and discovery
  SEARCH: '/api/hashtags/search',
  TRENDING: '/api/hashtags/trending',
  SUGGESTIONS: '/api/hashtags/suggestions',
  
  // User interactions
  FOLLOW: (id: string) => `/api/hashtags/${id}/follow`,
  UNFOLLOW: (id: string) => `/api/hashtags/${id}/unfollow`,
  USER_HASHTAGS: '/api/hashtags/user',
  
  // Analytics
  ANALYTICS: (id: string) => `/api/hashtags/${id}/analytics`,
  STATS: '/api/hashtags/stats',
  
  // Validation
  VALIDATE: '/api/hashtags/validate',
  
  // Cross-feature integration
  PROFILE_INTEGRATION: (userId: string) => `/api/hashtags/profile/${userId}`,
  POLL_INTEGRATION: (pollId: string) => `/api/hashtags/poll/${pollId}`,
  FEED_INTEGRATION: (feedId: string) => `/api/hashtags/feed/${feedId}`
} as const;
