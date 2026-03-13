'use client';

import { createContext, useContext } from 'react';


import type { ElectoralFeedUI } from '@/features/feeds/components/providers/FeedDataProvider';

import type { FeedItem } from '@/lib/stores/types/feeds';

import type { ReactNode } from 'react';

export type FeedContextValue = {
  // Feed data
  feeds: FeedItem[];
  isLoading: boolean;
  error: string | null;
  hasMore?: boolean;

  // Actions
  onLike: (itemId: string) => void;
  onBookmark: (itemId: string) => void;
  onShare: (itemId: string) => void;
  onRefresh: () => void;
  onLoadMore?: () => void;

  // Hashtags
  selectedHashtags: string[];
  onHashtagAdd: (hashtag: string) => void;
  onHashtagRemove: (hashtag: string) => void;
  trendingHashtags: string[];

  // District
  userDistrict?: string | null;
  districtFilterEnabled: boolean;
  onDistrictFilterToggle: () => void;

  // Electoral
  electoralFeed?: ElectoralFeedUI | null;
  electoralLoading?: boolean;
  electoralError?: string | null;
  onElectoralRefresh?: () => Promise<void>;
};

const FeedContext = createContext<FeedContextValue | null>(null);

export function FeedProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: FeedContextValue;
}) {
  return <FeedContext.Provider value={value}>{children}</FeedContext.Provider>;
}

export function useFeedContext(): FeedContextValue {
  const context = useContext(FeedContext);
  if (!context) {
    throw new Error('useFeedContext must be used within a FeedProvider');
  }
  return context;
}

/** Returns context value or null when not within FeedProvider. Use in FeedCore for optional context consumption. */
export function useFeedContextOptional(): FeedContextValue | null {
  return useContext(FeedContext);
}
