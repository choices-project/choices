/**
 * Hashtag-Polls Feed Component
 *
 * Advanced feed component that integrates hashtags and polls
 * Features:
 * - Intelligent hashtag-based poll recommendations
 * - Real-time hashtag trending display
 * - Interactive hashtag filtering
 * - Poll-hashtag engagement tracking
 * - Personalized feed generation
 * - Smooth animations and transitions
 *
 * Created: January 19, 2025
 * Status: ✅ ACTIVE
 */
'use client';

import { Hash, TrendingUp, Users, BarChart3, Clock } from 'lucide-react';
import React, { useState, useEffect, useCallback, useMemo } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useFeedsStore,
  useFeedsActions,
  useTrendingHashtags,
  useHashtagActions,
} from '@/lib/stores';
import type { FeedItem } from '@/lib/stores/feedsStore';
import { cn } from '@/lib/utils';
import logger from '@/lib/utils/logger';


type HashtagPollsFeedProps = {
  userId: string;
  className?: string;
  onPollSelect?: (pollId: string) => void;
  onHashtagSelect?: (hashtag: string) => void;
  enablePersonalization?: boolean;
  enableTrending?: boolean;
  enableAnalytics?: boolean;
  maxPolls?: number;
};

type DerivedHashtagAnalytics = {
  hashtag: string;
  poll_count: number;
  engagement_rate: number;
  user_interest_level: number;
  trending_position: number;
};

const getEngagementScore = (poll: FeedItem): number => {
  const likes = poll.engagement?.likes ?? 0;
  const shares = poll.engagement?.shares ?? 0;
  const comments = poll.engagement?.comments ?? 0;
  return likes + shares + comments;
};

const formatDate = (date?: string | null): string => {
  if (!date) return 'Unknown date';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return 'Unknown date';
  return parsed.toLocaleDateString();
};

const normalizeTrendingHashtags = (raw: unknown[]): string[] =>
  raw
    .map((item) => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object') {
        const candidate =
          (item as { hashtag?: string }).hashtag ??
          (item as { hashtag_name?: string }).hashtag_name ??
          (item as { name?: string }).name;
        return typeof candidate === 'string' ? candidate : '';
      }
      return '';
    })
    .filter((value): value is string => value.trim().length > 0);

export default function HashtagPollsFeed({
  userId,
  className = '',
  onPollSelect,
  onHashtagSelect,
  enablePersonalization: _enablePersonalization = true,
  enableTrending = true,
  enableAnalytics = false,
  maxPolls = 20,
}: HashtagPollsFeedProps) {
  const [activeTab, setActiveTab] = useState('recommended');
  const [selectedHashtags, setSelectedHashtags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'relevance' | 'trending' | 'engagement'>('relevance');

  const filteredFeeds = useFeedsStore((state) => state.filteredFeeds);
  const isLoading = useFeedsStore((state) => state.isLoading || state.isRefreshing);
  const storeError = useFeedsStore((state) => state.error);

  const { loadFeeds } = useFeedsActions();
  const { getTrendingHashtags } = useHashtagActions();
  const trendingHashtagsRaw = useTrendingHashtags();

  const trendingHashtags = useMemo(
    () => normalizeTrendingHashtags(trendingHashtagsRaw).slice(0, 20),
    [trendingHashtagsRaw]
  );

  useEffect(() => {
    if (!userId) return;

    void loadFeeds().catch((err) => {
      logger.error('Failed to load feeds for hashtag polls:', err);
    });
  }, [userId, loadFeeds]);

  useEffect(() => {
    void getTrendingHashtags().catch((err) => {
      logger.error('Failed to load trending hashtags:', err);
    });
  }, [getTrendingHashtags]);

  const pollItems = useMemo(
    () =>
      filteredFeeds.filter((feed) => feed.type === 'poll').slice(0, maxPolls * 2),
    [filteredFeeds, maxPolls]
  );

  const filteredPolls = useMemo(() => {
    let next = pollItems;

    if (selectedHashtags.length > 0) {
      next = next.filter((poll) =>
        poll.tags.some((tag) => selectedHashtags.includes(tag))
      );
    }

    const sorted = [...next].sort((a, b) => {
      switch (sortBy) {
        case 'trending': {
          const aScore = (a.engagement?.shares ?? 0) + (a.engagement?.likes ?? 0);
          const bScore = (b.engagement?.shares ?? 0) + (b.engagement?.likes ?? 0);
          return bScore - aScore;
        }
        case 'engagement': {
          return getEngagementScore(b) - getEngagementScore(a);
        }
        case 'relevance':
        default: {
          const aVotes = a.pollData?.totalVotes ?? 0;
          const bVotes = b.pollData?.totalVotes ?? 0;
          return bVotes - aVotes;
        }
      }
    });

    return sorted.slice(0, maxPolls);
  }, [pollItems, selectedHashtags, sortBy, maxPolls]);

  const totalEngagement = useMemo(
    () => pollItems.reduce((acc, poll) => acc + getEngagementScore(poll), 0),
    [pollItems]
  );

  const feedScore = useMemo(() => {
    if (pollItems.length === 0) return 0;
    const totalVotes = pollItems.reduce((acc, poll) => acc + (poll.pollData?.totalVotes ?? 0), 0);
    const baseline = pollItems.length * 100;
    return Math.min(1, (totalVotes + totalEngagement) / Math.max(1, baseline * 2));
  }, [pollItems, totalEngagement]);

  const hashtagAnalytics: DerivedHashtagAnalytics[] = useMemo(() => {
    if (trendingHashtags.length === 0) return [];

    return trendingHashtags.map((tag, index) => {
      const pollsForTag = pollItems.filter((poll) => poll.tags.includes(tag));
      const engagement = pollsForTag.reduce(
        (acc, poll) => acc + getEngagementScore(poll),
        0
      );
      const votes = pollsForTag.reduce(
        (acc, poll) => acc + (poll.pollData?.totalVotes ?? 0),
        0
      );
      const baseline = Math.max(1, pollsForTag.length * 100);

      return {
        hashtag: tag,
        poll_count: pollsForTag.length,
        engagement_rate: Math.min(1, (engagement + votes) / (baseline * 2)),
        user_interest_level: pollItems.length > 0 ? pollsForTag.length / pollItems.length : 0,
        trending_position: index + 1,
      };
    });
  }, [trendingHashtags, pollItems]);

  const handleHashtagSelect = useCallback(
    (hashtag: string) => {
      setSelectedHashtags((prev) => {
        if (prev.includes(hashtag)) {
          return prev.filter((item) => item !== hashtag);
        }
        return [...prev, hashtag];
      });
      onHashtagSelect?.(hashtag);
    },
    [onHashtagSelect]
  );

  const handlePollSelect = useCallback(
    (poll: FeedItem) => {
      const id = poll.pollData?.id ?? poll.id;
      onPollSelect?.(id);
    },
    [onPollSelect]
  );

  const getMatchScore = useCallback(
    (poll: FeedItem): number => {
      if (selectedHashtags.length === 0) {
        return Math.round(feedScore * 100);
      }
      const overlap = poll.tags.filter((tag) => selectedHashtags.includes(tag)).length;
      return Math.min(100, Math.round((overlap / selectedHashtags.length) * 100));
    },
    [selectedHashtags, feedScore]
  );

  if (isLoading && pollItems.length === 0) {
    return (
      <div className={cn('space-y-6', className)}>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </div>
    );
  }

  if (storeError && pollItems.length === 0) {
    return (
      <div className={cn('space-y-6', className)}>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-600 mb-4">{storeError}</p>
            <Button onClick={() => void loadFeeds()} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (pollItems.length === 0) {
    return (
      <div className={cn('space-y-6', className)}>
        <Card>
          <CardContent className="p-6 text-center">
            <Hash className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No hashtag-polls feed available</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Hashtag-Polls Feed</h2>
          <p className="text-sm text-gray-600">
            Personalized polls based on your hashtag interests
          </p>
        </div>
        {enableAnalytics && (
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-gray-600">Feed Score</p>
              <p className="text-lg font-semibold text-blue-600">
                {Math.round(feedScore * 100)}%
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Polls</p>
              <p className="text-lg font-semibold text-green-600">
                {filteredPolls.length}
              </p>
            </div>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5" />
            Hashtag Filters
            {selectedHashtags.length > 0 && (
              <Badge variant="secondary">{selectedHashtags.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {selectedHashtags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedHashtags.map((hashtag) => (
                  <Badge
                    key={hashtag}
                    variant="default"
                    className="cursor-pointer hover:bg-red-100"
                    onClick={() => handleHashtagSelect(hashtag)}
                  >
                    #{hashtag} ×
                  </Badge>
                ))}
              </div>
            )}

            {enableTrending && trendingHashtags.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Trending Hashtags:
                </p>
                <div className="flex flex-wrap gap-2">
                  {trendingHashtags.slice(0, 10).map((hashtag) => (
                    <Badge
                      key={hashtag}
                      variant={selectedHashtags.includes(hashtag) ? 'default' : 'outline'}
                      className="cursor-pointer hover:bg-blue-100"
                      onClick={() => handleHashtagSelect(hashtag)}
                    >
                      <TrendingUp className="h-3 w-3 mr-1" />
                      #{hashtag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center space-x-4">
              <p className="text-sm font-medium text-gray-700">Sort by:</p>
              <div className="flex space-x-2">
                {[
                  { value: 'relevance', label: 'Relevance' },
                  { value: 'trending', label: 'Trending' },
                  { value: 'engagement', label: 'Engagement' },
                ].map((option) => (
                  <Button
                    key={option.value}
                    variant={sortBy === option.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSortBy(option.value as typeof sortBy)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="recommended">Recommended</TabsTrigger>
          <TabsTrigger value="trending">Trending</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="recommended" className="space-y-4">
          {filteredPolls.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <Hash className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No polls match your current filters</p>
                <Button
                  variant="outline"
                  onClick={() => setSelectedHashtags([])}
                  className="mt-4"
                >
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredPolls.map((poll) => (
                <Card key={poll.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {poll.title}
                        </h3>
                        <p className="text-gray-600 mb-4">
                          {poll.summary ?? poll.content ?? 'No description available.'}
                        </p>

                        {poll.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {poll.tags.map((hashtag) => (
                              <Badge
                                key={hashtag}
                                variant="outline"
                                className="cursor-pointer hover:bg-blue-100"
                                onClick={() => handleHashtagSelect(hashtag)}
                              >
                                #{hashtag}
                              </Badge>
                            ))}
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {poll.pollData?.totalVotes ?? 0} votes
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {formatDate(poll.publishedAt)}
                          </div>
                          <div className="flex items-center">
                            <BarChart3 className="h-4 w-4 mr-1" />
                            {getMatchScore(poll)}% match
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        {selectedHashtags.length > 0
                          ? `Matches: ${poll.tags
                              .filter((tag) => selectedHashtags.includes(tag))
                              .join(', ') || 'No direct matches'}`
                          : 'Recommended poll'}
                      </div>
                      <Button onClick={() => handlePollSelect(poll)} className="ml-4">
                        View Poll
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="trending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Trending Hashtags
              </CardTitle>
            </CardHeader>
            <CardContent>
              {trendingHashtags.length === 0 ? (
                <p className="text-gray-600 text-center py-8">
                  No trending hashtags available
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {trendingHashtags.map((hashtag, index) => (
                    <div
                      key={hashtag}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleHashtagSelect(hashtag)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl font-bold text-blue-600">
                          #{index + 1}
                        </div>
                        <div>
                          <p className="font-medium">#{hashtag}</p>
                          <p className="text-sm text-gray-600">Trending</p>
                        </div>
                      </div>
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {enableAnalytics && hashtagAnalytics.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {hashtagAnalytics.map((analytic) => (
                <Card key={analytic.hashtag}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Hash className="h-4 w-4" />
                      #{analytic.hashtag}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Polls:</span>
                        <span className="font-medium">{analytic.poll_count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Engagement:</span>
                        <span className="font-medium">
                          {Math.round(analytic.engagement_rate * 100)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Interest:</span>
                        <span className="font-medium">
                          {Math.round(analytic.user_interest_level * 100)}%
                        </span>
                      </div>
                      {analytic.trending_position > 0 && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Trending:</span>
                          <span className="font-medium text-green-600">
                            #{analytic.trending_position}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Analytics not available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
