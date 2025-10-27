/**
 * Component-specific types for the Civics feature
 * These types are used across multiple components and should be shared
 */

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
  hashtags?: string[];
  metadata: Record<string, any>;
}

export interface UserPreferences {
  state?: string;
  district?: string;
  region?: string;
  interests?: string[];
  followedRepresentatives?: string[];
  followed_hashtags?: string[];
  demographics?: Record<string, any>;
  feedPreferences?: {
    showVotes: boolean;
    showBills: boolean;
    showStatements: boolean;
    showSocialMedia: boolean;
    showPhotos: boolean;
  };
}

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
