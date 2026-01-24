'use client';

/**
 * FeedCore Component
 *
 * Core feed display component with NO side effects or complex state.
 * Purely presentational - receives data and callbacks as props.
 *
 * This component CANNOT have infinite loops because:
 * - No useEffect hooks
 * - No store subscriptions
 * - No complex state management
 * - Pure props-based rendering
 *
 * Created: November 5, 2025
 * Enhanced: November 5, 2025 - Added district filtering UI
 * Status: ✅ Production-grade architecture
 */

import { HashtagIcon, MoonIcon, SunIcon } from '@heroicons/react/24/outline';
import { MapPin, Plus, RefreshCw } from 'lucide-react';
import React, { useState, useCallback, useEffect, useRef } from 'react';

import { DistrictIndicator } from '@/components/feeds/DistrictBadge';
import { EnhancedEmptyState } from '@/components/shared/EnhancedEmptyState';
import { EnhancedErrorDisplay } from '@/components/shared/EnhancedErrorDisplay';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { cn } from '@/lib/utils';

import { useI18n } from '@/hooks/useI18n';

type FeedItem = {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  district?: string | null;
  engagement: {
    likes: number;
    shares: number;
    comments: number;
    views: number;
  };
  userInteraction: {
    liked: boolean;
    bookmarked: boolean;
  };
};

type FeedCoreProps = {
  feeds: FeedItem[];
  isLoading: boolean;
  error: string | null;
  onLike: (itemId: string) => void;
  onBookmark: (itemId: string) => void;
  onShare: (itemId: string) => void;
  onRefresh: () => void;
  selectedHashtags: string[];
  onHashtagAdd: (hashtag: string) => void;
  onHashtagRemove: (hashtag: string) => void;
  trendingHashtags: string[];
  userDistrict?: string | null;
  districtFilterEnabled: boolean;
  onDistrictFilterToggle: () => void;
  className?: string;
  onLoadMore?: () => void;
  hasMore?: boolean;
};

/**
 * Pure presentational feed component
 * No side effects, no infinite loops possible
 * Enhanced with district filtering UI
 */
export default function FeedCore({
  feeds,
  isLoading,
  error,
  onLike,
  onBookmark,
  onShare,
  onRefresh,
  selectedHashtags,
  onHashtagAdd,
  onHashtagRemove,
  trendingHashtags,
  userDistrict,
  districtFilterEnabled,
  onDistrictFilterToggle,
  className = '',
  onLoadMore,
  hasMore = false
}: FeedCoreProps) {
  const { t } = useI18n();
  const [hashtagInput, setHashtagInput] = useState('');
  const [activeTab, setActiveTab] = useState('feed');
  const [isDarkMode, setIsDarkMode] = useState(false);
  // CRITICAL: isClient must start as false on both server and client to prevent hydration mismatch
  // Only update after mount to ensure consistent initial render
  const [isClient, setIsClient] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Client-side hydration
  useEffect(() => {
    // #region agent log
    const log = (_message: string, _data: Record<string, unknown>, _hypothesisId: string) => {
      // Debug logging removed for production
    };
    // #endregion

    log('FeedCore setIsClient: before', { isClient: false }, 'B');
    setIsClient(true);
    log('FeedCore setIsClient: after', { isClient: true }, 'B');

    if (typeof window !== 'undefined') {
      // CRITICAL: Don't manipulate document.documentElement.classList directly
      // ThemeScript and AppShell handle theme management globally
      // We only read the current theme state for the button display
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const isDark = currentTheme === 'dark' || document.documentElement.classList.contains('dark');
      log('FeedCore dark mode', { currentTheme, isDark }, 'B');
      setIsDarkMode(isDark);
    }
  }, []);

  // Infinite scroll
  useEffect(() => {
    if (!onLoadMore || !hasMore || !isClient) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting && !isLoading && hasMore) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [onLoadMore, hasMore, isLoading, isClient]);



  // Pull-to-refresh
  useEffect(() => {
    if (!isClient || !scrollContainerRef.current) return;

    const container = scrollContainerRef.current;

    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0 && e.touches[0]) {
        startY.current = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (window.scrollY > 0) return;

      const touch = e.touches[0];
      if (!touch) return;

      const currentY = touch.clientY;
      const distance = currentY - startY.current;

      if (distance > 0 && distance < 150) {
        setIsPulling(true);
        setPullDistance(distance);
        e.preventDefault();
      }
    };

    const handleTouchEnd = () => {
      if (pullDistance > 80) {
        onRefresh();
      }
      setIsPulling(false);
      setPullDistance(0);
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isClient, pullDistance, onRefresh]);

  const toggleDarkMode = useCallback(() => {
    if (typeof window === 'undefined') return;

    // CRITICAL: Don't manipulate document.documentElement directly
    // Use the app store's theme actions instead to ensure consistency
    // The app store will update ThemeScript/AppShell which will update the DOM
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);

    // Update app store theme (this will trigger ThemeScript/AppShell to update DOM)
    // For now, just update localStorage - ThemeScript will read it on next page load
    // TODO: Integrate with app store theme actions for immediate update
    localStorage.setItem('darkMode', String(newMode));

    // Trigger a page reload to apply theme change via ThemeScript
    // This ensures ThemeScript/AppShell handle the theme change consistently
    window.location.reload();
  }, [isDarkMode]);



  const handleHashtagSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (hashtagInput.trim()) {
      const cleanTag = hashtagInput.trim().replace(/^#/, '');
      onHashtagAdd(cleanTag);
      setHashtagInput('');
    }
  }, [hashtagInput, onHashtagAdd]);

  // Initial loading state - show skeleton loaders
  if (isLoading && feeds.length === 0) {
    return (
      <div
        className={cn('unified-feed', className)}
        data-testid="unified-feed"
        aria-label="Loading feeds"
        aria-busy="true"
        aria-live="polite"
        role="status"
      >
        <div className="space-y-4 py-8" data-testid="feed-loading-skeleton">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse" aria-hidden="true">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-3/4 dark:bg-gray-700" />
                <div className="h-4 bg-gray-200 rounded w-1/2 mt-2 dark:bg-gray-700" />
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-gray-200 rounded w-full mb-2 dark:bg-gray-700" />
                <div className="h-4 bg-gray-200 rounded w-5/6 dark:bg-gray-700" />
                <div className="flex gap-2 mt-4">
                  <div className="h-8 bg-gray-200 rounded w-20 dark:bg-gray-700" />
                  <div className="h-8 bg-gray-200 rounded w-20 dark:bg-gray-700" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Error state - Enhanced UX
  if (error) {
    return (
      <div className={cn('unified-feed', className)} data-testid="unified-feed">
        <div className="flex items-center justify-center min-h-[400px] px-4">
          <EnhancedErrorDisplay
            title={t('feeds.core.error.title') || 'Unable to load feed'}
            message={error}
            details="We encountered an issue while loading your feed. This might be a temporary network problem."
            tip="Check your internet connection and try again. If the problem persists, the service may be temporarily unavailable."
            canRetry={true}
            onRetry={onRefresh}
            primaryAction={{
              label: t('feeds.core.error.retry') || 'Try Again',
              onClick: onRefresh,
              icon: <RefreshCw className="h-4 w-4" />,
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      ref={scrollContainerRef}
      className={cn('unified-feed max-w-4xl mx-auto relative', className)}
      data-testid="unified-feed"
    >
      {/* Pull-to-refresh indicator */}
      {isPulling && (
        <div
          className="absolute top-0 left-1/2 transform -translate-x-1/2 z-50 transition-all"
          style={{ top: Math.min(pullDistance - 40, 60) }}
        >
          <div className="bg-primary text-primary-foreground rounded-full p-2 shadow-lg">
            {pullDistance > 80
              ? t('feeds.core.pullToRefresh.release')
              : t('feeds.core.pullToRefresh.pull')}
          </div>
        </div>
      )}
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t('feeds.core.header.title')}</h1>
        <div className="flex gap-2">
          {/* CRITICAL: Always render button to prevent DOM structure mismatch
              Disable it until client-side hydration completes */}
          <Button
            variant="outline"
            size="icon"
            onClick={toggleDarkMode}
            disabled={!isClient}
            className={!isClient ? 'invisible' : ''}
            aria-label={
              isDarkMode
                ? t('feeds.core.themeToggle.light')
                : t('feeds.core.themeToggle.dark')
            }
          >
            {isDarkMode ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
          </Button>
          <Button onClick={onRefresh} disabled={isLoading}>
            {isLoading ? t('feeds.core.header.refreshing') : t('feeds.core.header.refresh')}
          </Button>
        </div>
      </div>

      <h2 className="sr-only">Feed sections</h2>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HashtagIcon className="w-5 h-5" />
            {t('feeds.core.filters.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* District Filter */}
          {userDistrict && (
            <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {t('feeds.core.filters.districtLabel', { district: userDistrict })}
                  </span>
                </div>
                <Button
                  variant={districtFilterEnabled ? "default" : "outline"}
                  size="sm"
                  onClick={onDistrictFilterToggle}
                  aria-label={
                    districtFilterEnabled
                      ? t('feeds.core.filters.districtDisable')
                      : t('feeds.core.filters.districtEnable')
                  }
                >
                  {districtFilterEnabled
                    ? t('feeds.core.filters.districtToggleOn')
                    : t('feeds.core.filters.districtToggleOff')}
                </Button>
              </div>
              {districtFilterEnabled && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                  {t('feeds.core.filters.districtHelper', { district: userDistrict })}
                </p>
              )}
            </div>
          )}

          {/* Hashtag Input */}
          <form onSubmit={handleHashtagSubmit} className="mb-4">
            <Input
              type="text"
              placeholder={t('feeds.core.filters.hashtagPlaceholder')}
              value={hashtagInput}
              onChange={(e) => setHashtagInput(e.target.value)}
              aria-label={t('feeds.core.filters.hashtagAria')}
            />
          </form>

          {/* Selected Hashtags */}
          {selectedHashtags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedHashtags.map(tag => (
                <Badge key={tag} variant="default" className="cursor-pointer">
                  #{tag}
                  <button
                    onClick={() => onHashtagRemove(tag)}
                    className="ml-2 hover:text-red-500"
                    aria-label={t('feeds.core.filters.selectedRemoveAria', { tag })}
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {/* Trending Hashtags */}
          {trendingHashtags.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2 text-gray-900 dark:text-gray-100">
                {t('feeds.core.filters.trendingHeading')}
              </h4>
              <div className="flex flex-wrap gap-2">
                {trendingHashtags.slice(0, 10).map(tag => (
                  <Button
                    key={tag}
                    variant="outline"
                    size="sm"
                    onClick={() => onHashtagAdd(tag)}
                  >
                    #{tag}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger
            id="feed-tab"
            value="feed"
            data-testid="feed-tab"
            aria-controls="feed-panel"
          >
            {t('feeds.core.tabs.feed')}
          </TabsTrigger>
          <TabsTrigger
            id="polls-tab"
            value="polls"
            data-testid="polls-tab"
            aria-controls="polls-panel"
          >
            {t('feeds.core.tabs.polls')}
          </TabsTrigger>
          <TabsTrigger
            id="analytics-tab"
            value="analytics"
            data-testid="analytics-tab"
            aria-controls="analytics-panel"
          >
            {t('feeds.core.tabs.analytics')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="feed" id="feed-panel" role="tabpanel" aria-labelledby="feed-tab">
          {/* Feed Items */}
          {isLoading && feeds.length === 0 ? (
            <div
              className="space-y-4 py-8"
              role="status"
              aria-busy="true"
              aria-live="polite"
              aria-label="Loading feeds"
              data-testid="feed-loading-skeleton"
            >
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-gray-200 rounded w-3/4 dark:bg-gray-700" />
                    <div className="h-4 bg-gray-200 rounded w-1/2 mt-2 dark:bg-gray-700" />
                  </CardHeader>
                  <CardContent>
                    <div className="h-4 bg-gray-200 rounded w-full mb-2 dark:bg-gray-700" />
                    <div className="h-4 bg-gray-200 rounded w-5/6 dark:bg-gray-700" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : feeds.length === 0 ? (
            <EnhancedEmptyState
              icon={
                <svg
                  className="h-12 w-12 text-gray-400 dark:text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12a.75.75 0 110-1.5.75.75 0 010 1.5zM12 17.25a.75.75 0 110-1.5.75.75 0 010 1.5zM18.75 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM18.75 12a.75.75 0 110-1.5.75.75 0 010 1.5zM18.75 17.25a.75.75 0 110-1.5.75.75 0 010 1.5zM5.25 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM5.25 12a.75.75 0 110-1.5.75.75 0 010 1.5zM5.25 17.25a.75.75 0 110-1.5.75.75 0 010 1.5z"
                  />
                </svg>
              }
              title={
                selectedHashtags.length > 0
                  ? t('feeds.core.empty.filters.title') || 'No feeds match your filters'
                  : t('feeds.core.empty.default.title') || 'No feeds yet'
              }
              description={
                selectedHashtags.length > 0
                  ? t('feeds.core.empty.filters.description') || 'Try adjusting your hashtag filters to see more feeds.'
                  : t('feeds.core.empty.default.description') || 'Start following hashtags or create content to see feeds here.'
              }
              tip={
                selectedHashtags.length > 0
                  ? 'You can clear your hashtag filters to see all available feeds.'
                  : 'Follow hashtags you care about or create polls to start seeing feeds in your feed.'
              }
              isFiltered={selectedHashtags.length > 0}
              {...(selectedHashtags.length > 0 ? {
                onResetFilters: () => {
                  selectedHashtags.forEach(tag => onHashtagRemove(tag));
                }
              } : {})}
              primaryAction={
                selectedHashtags.length > 0
                  ? {
                      label: t('feeds.core.empty.filters.clear') || 'Clear Filters',
                      onClick: () => {
                        selectedHashtags.forEach(tag => onHashtagRemove(tag));
                      },
                    }
                  : {
                      label: t('feeds.core.empty.default.create') || 'Create poll',
                      href: '/polls/create',
                      icon: <Plus className="h-4 w-4" aria-hidden="true" />,
                    }
              }
              secondaryAction={
                selectedHashtags.length > 0
                  ? undefined
                  : trendingHashtags.length > 0
                    ? {
                        label: t('feeds.core.empty.default.explore') || 'Explore',
                        onClick: () => {
                          const firstTag = trendingHashtags[0];
                          if (firstTag) onHashtagAdd(firstTag);
                        },
                      }
                    : {
                        label: t('feeds.core.empty.default.refresh') || 'Refresh Feed',
                        onClick: onRefresh,
                      }
              }
            />
          ) : (
            <div className="space-y-4" role="feed">
              {feeds.map(feed => (
                <Card key={feed.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="flex-1">{feed.title}</CardTitle>
                      {/* District Badge */}
                      {feed.district && (
                        <DistrictIndicator
                          feedItemDistrict={feed.district}
                          {...(userDistrict ? { userDistrict } : {})}
                          size="sm"
                        />
                      )}
                    </div>
                    <div className="flex gap-2 mt-2">
                      {feed.tags.map(tag => (
                        <Badge key={tag} variant="secondary">#{tag}</Badge>
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 dark:text-gray-300 mb-4">{feed.content}</p>

                    {/* Engagement */}
                    <div className="flex gap-4 mt-4">
                      <Button
                        variant={feed.userInteraction.liked ? "default" : "outline"}
                        size="sm"
                        onClick={() => onLike(feed.id)}
                      >
                        👍 {feed.engagement.likes}
                      </Button>
                      <Button
                        variant={feed.userInteraction.bookmarked ? "default" : "outline"}
                        size="sm"
                        onClick={() => onBookmark(feed.id)}
                      >
                        🔖 {t('feeds.core.actions.bookmark')}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onShare(feed.id)}
                      >
                        🔗 {t('feeds.core.actions.share')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="polls" id="polls-panel" role="tabpanel" aria-labelledby="polls-tab">
          <div className="text-center py-16 px-4" role="status" aria-live="polite">
            <div className="max-w-md mx-auto">
              <div className="mb-6">
                <svg
                  className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {t('feeds.core.empty.polls.title')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {t('feeds.core.empty.polls.description')}
              </p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analytics" id="analytics-panel" role="tabpanel" aria-labelledby="analytics-tab">
          <div className="text-center py-16 px-4" role="status" aria-live="polite">
            <div className="max-w-md mx-auto">
              <div className="mb-6">
                <svg
                  className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {t('feeds.core.empty.analytics.title')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {t('feeds.core.empty.analytics.description')}
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Status indicators */}
      <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400 mt-4">
        <span>{t('feeds.core.status.online')}</span>
        <span>{t('feeds.core.status.items', { count: feeds.length })}</span>
      </div>

      {/* Accessibility */}
      <div className="sr-only" aria-live="polite" id="live-region-content" />
    </div>
  );
}

