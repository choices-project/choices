/**
 * Feed Domain Types
 *
 * Canonical type definitions for feeds-related state, API payloads,
 * and derived selectors.
 *
 * Created: November 8, 2025
 * Status: ✅ ACTIVE - Shared across store + UI
 */

import type { PrivacySettings } from '@/types/profile';
import type {
  CivicAction,
  Poll,
  PollOption,
} from '@/types/database';

// -----------------------------------------------------------------------------
// Feed Item Core Types
// -----------------------------------------------------------------------------

export type FeedContentType =
  | 'article'
  | 'video'
  | 'podcast'
  | 'poll'
  | 'event'
  | 'news'
  | 'civic_action';

export type FeedAuthor = {
  id: string;
  name: string;
  avatar?: string;
  verified: boolean;
};

export type FeedSource = {
  name: string;
  url: string;
  logo?: string;
  verified: boolean;
};

export type FeedEngagement = {
  likes: number;
  shares: number;
  comments: number;
  views: number;
};

export type FeedUserInteraction = {
  liked: boolean;
  shared: boolean;
  bookmarked: boolean;
  read: boolean;
  readAt?: string | null;
};

export type FeedPollOption = Pick<PollOption, 'id'> & {
  text?: string | null;
  voteCount?: number | null;
};

export type FeedPollMetadata = {
  id: Poll['id'];
  title: Poll['title'];
  options: FeedPollOption[];
  totalVotes: number;
  status: Poll['status'];
  primaryHashtag?: Poll['primary_hashtag'];
};

export type FeedCivicActionMetadata = {
  id: CivicAction['id'];
  actionType: CivicAction['action_type'];
  targetDistrict?: CivicAction['target_district'];
  targetState?: CivicAction['target_state'];
  currentSignatures: CivicAction['current_signatures'];
  requiredSignatures: CivicAction['required_signatures'];
  status: CivicAction['status'];
};

export type FeedItemBase = {
  id: string;
  title: string;
  content: string;
  summary: string;
  author: FeedAuthor;
  category: string;
  tags: string[];
  type: FeedContentType;
  source: FeedSource;
  publishedAt: string;
  updatedAt: string;
  readTime: number;
  engagement: FeedEngagement;
  userInteraction: FeedUserInteraction;
  metadata: {
    image?: string;
    videoUrl?: string;
    audioUrl?: string;
    externalUrl?: string;
    location?: string;
    language: string;
  };
  district?: string | null;
};

export type PollFeedItem = FeedItemBase & {
  type: 'poll';
  pollData: FeedPollMetadata;
  civicActionData?: never;
};

export type CivicActionFeedItem = FeedItemBase & {
  type: 'civic_action';
  civicActionData: FeedCivicActionMetadata;
  pollData?: never;
};

export type GenericFeedItem = FeedItemBase & {
  type: Exclude<FeedContentType, 'poll' | 'civic_action'>;
  pollData?: never;
  civicActionData?: never;
};

export type FeedItem = PollFeedItem | CivicActionFeedItem | GenericFeedItem;

// -----------------------------------------------------------------------------
// Feed Categories, Filters, Preferences
// -----------------------------------------------------------------------------

export type FeedCategory = {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  count: number;
  enabled: boolean;
};

export type FeedFilters = {
  categories: string[];
  types: FeedContentType[];
  sources: string[];
  dateRange: {
    start: string;
    end: string;
  };
  readStatus: 'all' | 'read' | 'unread';
  engagement: 'all' | 'popular' | 'trending';
  language: string;
  tags: string[];
  district?: string | null;
};

export type FeedPreferences = {
  defaultView: 'list' | 'grid' | 'magazine';
  sortBy: 'newest' | 'oldest' | 'popular' | 'trending' | 'relevance';
  itemsPerPage: number;
  autoRefresh: boolean;
  refreshInterval: number;
  notifications: {
    newContent: boolean;
    trendingContent: boolean;
    categoryUpdates: boolean;
    authorUpdates: boolean;
  };
  privacy: {
    showReadHistory: boolean;
    showBookmarks: boolean;
    showLikes: boolean;
    shareActivity: boolean;
  };
  content: {
    showImages: boolean;
    showVideos: boolean;
    showAudio: boolean;
    autoPlay: boolean;
    quality: 'low' | 'medium' | 'high';
  };
};

export type FeedSearch = {
  query: string;
  results: FeedItem[];
  totalResults: number;
  currentPage: number;
  totalPages: number;
  filters: FeedFilters;
  suggestions: string[];
  recentSearches: string[];
};

export type FeedsState = {
  feeds: FeedItem[];
  filteredFeeds: FeedItem[];
  categories: FeedCategory[];
  search: FeedSearch;
  currentView: FeedPreferences['defaultView'];
  selectedFeed: FeedItem | null;
  selectedCategory: string | null;
  filters: FeedFilters;
  preferences: FeedPreferences;
  privacySettings: PrivacySettings | null;
  totalAvailableFeeds: number;
  hasMoreFeeds: boolean;
  isLoading: boolean;
  isSearching: boolean;
  isRefreshing: boolean;
  isUpdating: boolean;
  error: string | null;
};

export type FeedsActions = {
  // Feed management
  setFeeds: (feeds: FeedItem[]) => void;
  addFeed: (feed: FeedItem) => void;
  updateFeed: (id: string, updates: Partial<FeedItem>) => void;
  removeFeed: (id: string) => void;
  refreshFeeds: () => Promise<void>;
  loadMoreFeeds: () => Promise<void>;

  // Filters / search
  setFilters: (filters: Partial<FeedFilters>) => void;
  clearFilters: () => void;
  searchFeeds: (query: string) => Promise<void>;
  setSearchQuery: (query: string) => void;
  clearSearch: () => void;

  // Interactions
  likeFeed: (id: string) => Promise<void>;
  unlikeFeed: (id: string) => Promise<void>;
  shareFeed: (id: string) => void;
  bookmarkFeed: (id: string) => Promise<void>;
  unbookmarkFeed: (id: string) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAsUnread: (id: string) => Promise<void>;

  // Privacy
  setPrivacySettings: (settings: PrivacySettings | null) => void;

  // Categories
  setCategories: (categories: FeedCategory[]) => void;
  toggleCategory: (categoryId: string) => void;
  setSelectedCategory: (categoryId: string | null) => void;

  // Preferences
  updatePreferences: (preferences: Partial<FeedPreferences>) => void;
  resetPreferences: () => void;

  // View & selection
  setCurrentView: (view: FeedPreferences['defaultView']) => void;
  setSelectedFeed: (feed: FeedItem | null) => void;

  // Data operations
  loadFeeds: (category?: string | null) => Promise<void>;
  loadCategories: () => Promise<void>;
  saveUserInteraction: (
    feedId: string,
    interaction: Partial<FeedUserInteraction>
  ) => Promise<void>;

  // Loading states
  setLoading: (loading: boolean) => void;
  setSearching: (searching: boolean) => void;
  setRefreshing: (refreshing: boolean) => void;
  setUpdating: (updating: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;

  // Pagination state
  setTotalAvailableFeeds: (count: number) => void;
  setHasMoreFeeds: (hasMore: boolean) => void;
};

export type FeedsStore = FeedsState & FeedsActions;

// -----------------------------------------------------------------------------
// API Payloads
// -----------------------------------------------------------------------------

export type FeedsApiPayload = {
  feeds: FeedItem[];
  count: number;
  filters: {
    category: string;
    district: string | null;
    sort: string;
  };
};


