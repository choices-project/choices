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
  useFilteredFeeds,
  useFeedsLoading,
  useFeedsRefreshing,
  useFeedsError,
  useFeedsActions,
  useTrendingHashtags,
  useHashtagActions,
} from '@/lib/stores';
import type { FeedItem } from '@/lib/stores/feedsStore';
import { cn } from '@/lib/utils';
import logger from '@/lib/utils/logger';

import { useI18n } from '@/hooks/useI18n';
 
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
  const { t, currentLanguage } = useI18n();
  const [activeTab, setActiveTab] = useState('recommended');
  const [selectedHashtags, setSelectedHashtags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'relevance' | 'trending' | 'engagement'>('relevance');

  const filteredFeeds = useFilteredFeeds();
  const isLoading = useFeedsLoading();
  const isRefreshing = useFeedsRefreshing();
  const loadingState = isLoading || isRefreshing;
  const storeError = useFeedsError();

  const { loadFeeds } = useFeedsActions();
  const { getTrendingHashtags } = useHashtagActions();
  const trendingHashtagsRaw = useTrendingHashtags();

  const numberFormatter = useMemo(
    () => new Intl.NumberFormat(currentLanguage ?? undefined),
    [currentLanguage],
  );

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(currentLanguage ?? undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
    [currentLanguage],
  );

  const formatDate = useCallback(
    (date: Date | string | null | undefined) => {
      if (!date) return t('feeds.hashtagPolls.date.unknown');

      const parsed = typeof date === 'string' ? new Date(date) : date;
      if (!parsed || Number.isNaN(parsed.getTime())) {
        return t('feeds.hashtagPolls.date.invalid');
      }

      const now = new Date();
      const diffInHours = Math.floor((now.getTime() - parsed.getTime()) / (1000 * 60 * 60));

      if (diffInHours < 1) {
        return t('feeds.hashtagPolls.date.relative.justNow');
      }
      if (diffInHours < 24) {
        return t('feeds.hashtagPolls.date.relative.hours', {
          count: diffInHours,
          formattedCount: numberFormatter.format(diffInHours),
        });
      }
      if (diffInHours < 48) {
        return t('feeds.hashtagPolls.date.relative.yesterday');
      }

      return dateFormatter.format(parsed);
    },
    [dateFormatter, numberFormatter, t],
  );

  const formatVotes = useCallback(
    (value: number) =>
      t('feeds.hashtagPolls.recommended.votes', {
        count: value,
        formattedCount: numberFormatter.format(value),
      }),
    [numberFormatter, t],
  );

  const formatMatchPercent = useCallback(
    (value: number) =>
      t('feeds.hashtagPolls.recommended.matchPercent', {
        value: numberFormatter.format(value),
      }),
    [numberFormatter, t],
  );

  const formatPercent = useCallback(
    (fraction: number) =>
      t('feeds.hashtagPolls.analytics.percent', {
        value: numberFormatter.format(Math.round(fraction * 100)),
      }),
    [numberFormatter, t],
  );

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

  if (loadingState && pollItems.length === 0) {
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
              {t('feeds.hashtagPolls.error.retry')}
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
            <Hash className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">{t('feeds.hashtagPolls.empty.title')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {t('feeds.hashtagPolls.header.title')}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">{t('feeds.hashtagPolls.header.subtitle')}</p>
        </div>
        {enableAnalytics && (
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('feeds.hashtagPolls.metrics.feedScore')}
              </p>
              <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                {formatPercent(feedScore)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('feeds.hashtagPolls.metrics.polls')}</p>
              <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                {numberFormatter.format(filteredPolls.length)}
              </p>
            </div>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5" />
            {t('feeds.hashtagPolls.filters.title')}
            {selectedHashtags.length > 0 && (
              <Badge variant="secondary">{numberFormatter.format(selectedHashtags.length)}</Badge>
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
                    {t('feeds.hashtagPolls.filters.selectedBadge', { hashtag })}
                  </Badge>
                ))}
              </div>
            )}

            {enableTrending && trendingHashtags.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('feeds.hashtagPolls.filters.trendingLabel')}
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
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('feeds.hashtagPolls.filters.sortBy')}
              </p>
              <div className="flex space-x-2">
                {[
                  { value: 'relevance', label: t('feeds.hashtagPolls.filters.sort.relevance') },
                  { value: 'trending', label: t('feeds.hashtagPolls.filters.sort.trending') },
                  { value: 'engagement', label: t('feeds.hashtagPolls.filters.sort.engagement') },
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
          <TabsTrigger value="recommended">
            {t('feeds.hashtagPolls.tabs.recommended')}
          </TabsTrigger>
          <TabsTrigger value="trending">{t('feeds.hashtagPolls.tabs.trending')}</TabsTrigger>
          <TabsTrigger value="analytics">{t('feeds.hashtagPolls.tabs.analytics')}</TabsTrigger>
        </TabsList>

        <TabsContent value="recommended" className="space-y-4">
          {filteredPolls.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <Hash className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  {t('feeds.hashtagPolls.recommended.empty')}
                </p>
                <Button
                  variant="outline"
                  onClick={() => setSelectedHashtags([])}
                  className="mt-4"
                >
                  {t('feeds.hashtagPolls.recommended.clearFilters')}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredPolls.map((poll) => {
                const matchedTags = poll.tags.filter((tag) => selectedHashtags.includes(tag));
                const matchSummary =
                  selectedHashtags.length > 0
                    ? matchedTags.length > 0
                      ? t('feeds.hashtagPolls.recommended.matches', {
                          matches: matchedTags.join(', '),
                        })
                      : t('feeds.hashtagPolls.recommended.noMatches')
                    : t('feeds.hashtagPolls.recommended.recommendedTag');

                return (
                  <Card key={poll.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            {poll.title}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400 mb-4">
                            {poll.summary ?? poll.content ?? t('feeds.hashtagPolls.recommended.noDescription')}
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

                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center">
                              <Users className="h-4 w-4 mr-1" />
                              {formatVotes(poll.pollData?.totalVotes ?? 0)}
                            </div>
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {formatDate(poll.publishedAt)}
                            </div>
                            <div className="flex items-center">
                              <BarChart3 className="h-4 w-4 mr-1" />
                              {formatMatchPercent(getMatchScore(poll))}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600 dark:text-gray-400">{matchSummary}</div>
                        <Button onClick={() => handlePollSelect(poll)} className="ml-4">
                          {t('feeds.hashtagPolls.recommended.viewPoll')}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="trending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                {t('feeds.hashtagPolls.trending.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {trendingHashtags.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                  {t('feeds.hashtagPolls.trending.empty')}
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {trendingHashtags.map((hashtag, index) => (
                    <button
                      type="button"
                      key={hashtag}
                      className="flex w-full items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-left transition hover:bg-gray-50 dark:hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                      onClick={() => handleHashtagSelect(hashtag)}
                      aria-label={t('feeds.hashtagPolls.trending.select', { hashtag })}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl font-bold text-blue-600">
                          {t('feeds.hashtagPolls.trending.rank', {
                            rank: numberFormatter.format(index + 1),
                          })}
                        </div>
                        <div>
                          <p className="font-medium">#{hashtag}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {t('feeds.hashtagPolls.trending.badge')}
                          </p>
                        </div>
                      </div>
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    </button>
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
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {t('feeds.hashtagPolls.analytics.pollsLabel')}
                        </span>
                        <span className="font-medium">
                          {numberFormatter.format(analytic.poll_count)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {t('feeds.hashtagPolls.analytics.engagementLabel')}
                        </span>
                        <span className="font-medium">
                          {formatPercent(analytic.engagement_rate)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {t('feeds.hashtagPolls.analytics.interestLabel')}
                        </span>
                        <span className="font-medium">
                          {formatPercent(analytic.user_interest_level)}
                        </span>
                      </div>
                      {analytic.trending_position > 0 && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {t('feeds.hashtagPolls.analytics.trendingLabel')}
                          </span>
                          <span className="font-medium text-green-600">
                            {t('feeds.hashtagPolls.analytics.trendingRank', {
                              rank: numberFormatter.format(analytic.trending_position),
                            })}
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
                <BarChart3 className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  {t('feeds.hashtagPolls.analytics.empty')}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
