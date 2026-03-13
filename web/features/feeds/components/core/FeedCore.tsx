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

import { Bookmark, Hash, MapPin, Moon, Plus, RefreshCw, Share2, Sun, ThumbsUp, Users, Vote } from 'lucide-react';
import React, { useState, useCallback, useEffect, useRef } from 'react';

import { DistrictActivityFeed } from '@/features/civics/components/representative/DistrictActivityFeed';
import { RepresentativeCard } from '@/features/civics/components/representative/RepresentativeCard';
import type { ElectoralFeedUI } from '@/features/feeds/components/providers/FeedDataProvider';
import { useFeedContextOptional } from '@/features/feeds/context/FeedContext';

import { DistrictIndicator } from '@/components/feeds/DistrictBadge';
import { AnimatedCard } from '@/components/shared/AnimatedCard';
import { EnhancedEmptyState } from '@/components/shared/EnhancedEmptyState';
import { EnhancedErrorDisplay } from '@/components/shared/EnhancedErrorDisplay';
import { useLiveAnnouncer } from '@/components/shared/LiveAnnouncer';
import { PrefetchLink } from '@/components/shared/PrefetchLink';
import { FeedSkeleton } from '@/components/shared/Skeletons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

import { haptic } from '@/lib/haptics';
import { useAppStore } from '@/lib/stores/appStore';
import { cn } from '@/lib/utils';

import { useI18n } from '@/hooks/useI18n';

type FeedFilter = 'all' | 'district' | 'electoral';


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

export type FeedCoreProps = {
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
  electoralFeed?: ElectoralFeedUI | null;
  electoralLoading?: boolean;
  electoralError?: string | null;
  onElectoralRefresh?: () => Promise<void>;
};

/**
 * Pure presentational feed component
 * No side effects, no infinite loops possible
 * Enhanced with district filtering UI
 *
 * Consumes FeedContext when within FeedProvider; direct props override context.
 * All props are optional when used with FeedProvider.
 */
export default function FeedCore(props: Partial<FeedCoreProps> & { className?: string }) {
  const contextValue = useFeedContextOptional();

  const feeds = props.feeds ?? contextValue?.feeds ?? [];
  const isLoading = props.isLoading ?? contextValue?.isLoading ?? false;
  const error = props.error ?? contextValue?.error ?? null;
  const onLike = props.onLike ?? contextValue?.onLike ?? (() => {});
  const onBookmark = props.onBookmark ?? contextValue?.onBookmark ?? (() => {});
  const onShare = props.onShare ?? contextValue?.onShare ?? (() => {});
  const onRefresh = props.onRefresh ?? contextValue?.onRefresh ?? (() => {});
  const selectedHashtags = props.selectedHashtags ?? contextValue?.selectedHashtags ?? [];
  const onHashtagAdd = props.onHashtagAdd ?? contextValue?.onHashtagAdd ?? (() => {});
  const onHashtagRemove = props.onHashtagRemove ?? contextValue?.onHashtagRemove ?? (() => {});
  const trendingHashtags = props.trendingHashtags ?? contextValue?.trendingHashtags ?? [];
  const userDistrict = props.userDistrict ?? contextValue?.userDistrict ?? null;
  const districtFilterEnabled = props.districtFilterEnabled ?? contextValue?.districtFilterEnabled ?? false;
  const onDistrictFilterToggle = props.onDistrictFilterToggle ?? contextValue?.onDistrictFilterToggle ?? (() => {});
  const className = props.className ?? '';
  const onLoadMore = props.onLoadMore ?? contextValue?.onLoadMore;
  const hasMore = props.hasMore ?? contextValue?.hasMore ?? false;
  const electoralFeed = props.electoralFeed ?? contextValue?.electoralFeed ?? null;
  const electoralLoading = props.electoralLoading ?? contextValue?.electoralLoading ?? false;
  const electoralError = props.electoralError ?? contextValue?.electoralError ?? null;
  const onElectoralRefresh = props.onElectoralRefresh ?? contextValue?.onElectoralRefresh;
  const { t } = useI18n();
  const { announce } = useLiveAnnouncer();
  const prevFeedsCountRef = useRef(0);

  const [hashtagInput, setHashtagInput] = useState('');
  const [activeFilter, setActiveFilter] = useState<FeedFilter>('all');
  const [isDarkMode, setIsDarkMode] = useState(false);
  // CRITICAL: isClient must start as false on both server and client to prevent hydration mismatch
  // Only update after mount to ensure consistent initial render
  const [isClient, setIsClient] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  // Electoral tab "load more" limits (officials and races)
  const [officialsLimit, setOfficialsLimit] = useState(5);
  const [racesLimit, setRacesLimit] = useState(5);

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

  // Auto-enable district filter when switching to district view
  useEffect(() => {
    if (activeFilter !== 'district' || !userDistrict || districtFilterEnabled) return;
    onDistrictFilterToggle();
  }, [activeFilter, userDistrict, districtFilterEnabled, onDistrictFilterToggle]);

  // Reset electoral "load more" limits when district changes (new feed)
  const prevDistrictRef = useRef(userDistrict);
  useEffect(() => {
    if (prevDistrictRef.current !== userDistrict) {
      prevDistrictRef.current = userDistrict ?? null;
      setOfficialsLimit(5);
      setRacesLimit(5);
    }
  }, [userDistrict]);

  // Announce when new feed items load (initial load or infinite scroll)
  useEffect(() => {
    if (!isClient) return;
    const prevCount = prevFeedsCountRef.current;
    const currentCount = feeds.length;
    if (currentCount > prevCount && !isLoading) {
      const newCount = currentCount - prevCount;
      prevFeedsCountRef.current = currentCount;
      announce(
        newCount === 1
          ? '1 new item loaded'
          : `${newCount} new items loaded`
      );
    } else if (currentCount !== prevCount) {
      prevFeedsCountRef.current = currentCount;
    }
  }, [isClient, feeds.length, isLoading, announce]);

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

  const setTheme = useAppStore((s) => s.setTheme);
  const toggleDarkMode = useCallback(() => {
    if (typeof window === 'undefined') return;

    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    setTheme(newMode ? 'dark' : 'light');
  }, [isDarkMode, setTheme]);



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
        <div className="py-8" data-testid="feed-loading-skeleton">
          <FeedSkeleton count={4} />
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
        <h1 className="text-3xl font-bold text-foreground">{t('feeds.core.header.title')}</h1>
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
            {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
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
            <Hash className="w-5 h-5" />
            {t('feeds.core.filters.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* District Filter */}
          {userDistrict && (
            <div className="mb-4 pb-4 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">
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
                <p className="text-xs text-muted-foreground mt-2">
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
              <h4 className="text-sm font-semibold mb-2 text-foreground">
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

      {/* Filter Chips */}
      <div
        className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-none snap-x snap-mandatory -mx-1 px-1"
        role="group"
        aria-label="Feed filters"
      >
        {([
          { id: 'all' as const, label: t('feeds.core.tabs.feed') || 'All' },
          { id: 'district' as const, label: t('feeds.core.tabs.community') || 'My District', icon: <MapPin className="h-3.5 w-3.5" /> },
          { id: 'electoral' as const, label: t('feeds.core.tabs.electoral') || 'Electoral', icon: <Vote className="h-3.5 w-3.5" /> },
        ]).map(chip => (
          <Button
            key={chip.id}
            variant={activeFilter === chip.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveFilter(chip.id)}
            className="rounded-full whitespace-nowrap snap-start min-h-[44px]"
            data-testid={`feed-filter-${chip.id}`}
          >
            {chip.icon && <span className="mr-1.5">{chip.icon}</span>}
            {chip.label}
          </Button>
        ))}
      </div>

      {/* Background refresh indicator */}
      {isLoading && feeds.length > 0 && (
        <div className="flex items-center justify-center gap-2 py-2 mb-4 text-sm text-muted-foreground">
          <RefreshCw className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          <span>Refreshing&hellip;</span>
        </div>
      )}

      {/* District prompt for location-dependent filters */}
      {activeFilter !== 'all' && !userDistrict && (
        <Card className="mb-6 border-primary/20 bg-primary/5">
          <CardContent className="py-6 text-center">
            <div className="mb-3 flex justify-center">
              <div className="rounded-full bg-primary/10 p-3">
                <MapPin className="h-8 w-8 text-primary" aria-hidden="true" />
              </div>
            </div>
            <h3 className="text-base font-semibold text-foreground mb-1">
              {activeFilter === 'district'
                ? (t('feeds.core.empty.community.noLocation.title') || 'See your community')
                : (t('feeds.core.empty.electoral.title') || 'See your electoral feed')}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Set your location to see local content from your district.
            </p>
            <Button asChild variant="default" size="sm">
              <PrefetchLink href="/civics" className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {t('feeds.core.empty.community.noLocation.cta') || 'Set location in Civics'}
              </PrefetchLink>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Electoral content (shown above feed items when electoral filter is active) */}
      {activeFilter === 'electoral' && userDistrict && (
        <div className="mb-6" data-testid="electoral-section">
          {electoralLoading && !electoralFeed ? (
            <div className="space-y-4 py-4" role="status" aria-busy="true" aria-label={t('feeds.core.electoral.loadingAria') || 'Loading electoral feed'}>
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-1/2 mt-2" />
                  </CardHeader>
                  <CardContent>
                    <div className="h-4 bg-muted rounded w-full mb-2" />
                    <div className="h-4 bg-muted rounded w-5/6" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : electoralError && !electoralFeed ? (
            <div className="py-8 px-4">
              <EnhancedErrorDisplay
                title={t('feeds.core.empty.electoral.title') || 'Electoral feed'}
                message={electoralError}
                {...(onElectoralRefresh ? { onRetry: () => void onElectoralRefresh() } : {})}
              />
            </div>
          ) : electoralFeed ? (
            <div className="space-y-6 py-6">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-lg font-semibold text-foreground">
                  {t('feeds.core.empty.electoral.title') || 'Electoral feed'}
                  {userDistrict && (
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                      {userDistrict}
                    </span>
                  )}
                </h3>
                {onElectoralRefresh && (
                  <Button variant="outline" size="sm" onClick={() => void onElectoralRefresh()} aria-label={t('feeds.core.electoral.refresh')}>
                    <RefreshCw className="h-4 w-4 mr-1" aria-hidden="true" />
                    {t('feeds.core.electoral.refresh')}
                  </Button>
                )}
              </div>
              {(() => {
                const off = electoralFeed.currentOfficials;
                const federal = (off?.federal ?? []) as Array<{ id?: string; name?: string; party?: string; office?: string }>;
                const state = (off?.state ?? []) as Array<{ id?: string; name?: string; party?: string; office?: string }>;
                const allOfficials = [...federal, ...state];
                const hasOfficials = allOfficials.length > 0;
                const races = [...(electoralFeed.activeRaces ?? []), ...(electoralFeed.upcomingElections ?? [])] as Array<{ raceId?: string; office?: string; jurisdiction?: string; electionDate?: string }>;
                const issues = (electoralFeed.keyIssues ?? []) as Array<{ issue: string; importance?: string; candidates?: string[] }>;
                const opportunities = (electoralFeed.engagementOpportunities ?? []) as Array<{ type: string; target: string; description: string; urgency?: string }>;
                const officialsVisible = allOfficials.slice(0, officialsLimit);
                const racesVisible = races.slice(0, racesLimit);
                const hasMoreOfficials = allOfficials.length > officialsLimit;
                const hasMoreRaces = races.length > racesLimit;
                return (
                  <>
                    {hasOfficials && (
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-base">{t('feeds.core.electoral.officials')}</CardTitle>
                          <Button variant="ghost" size="sm" asChild>
                            <PrefetchLink href="/civics" className="text-sm text-primary hover:underline">
                              {t('feeds.core.electoral.viewAllCivics')}
                            </PrefetchLink>
                          </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {officialsVisible.map((r, i) => {
                            // Transform electoral feed representative to RepresentativeCard format
                            const repId = r.id ? parseInt(String(r.id), 10) : null;
                            if (!repId || isNaN(repId)) {
                              // Fallback to simple display if ID is invalid
                              return (
                                <div key={`off-${i}`} className="flex justify-between items-start text-sm gap-2">
                                  <span className="font-medium text-foreground">{r.name ?? '—'}</span>
                                  <Badge variant="secondary" className="shrink-0">
                                    {r.office ?? r.party ?? '—'}
                                  </Badge>
                                </div>
                              );
                            }

                            // Transform to Representative type for RepresentativeCard
                            const representative = {
                              id: repId,
                              name: r.name ?? 'Unknown',
                              office: r.office ?? 'Unknown Office',
                              party: r.party ?? 'Unknown',
                              level: (r as any).level ?? 'federal' as const,
                              state: (r as any).state ?? (r as any).jurisdiction ?? '',
                              district: (r as any).district,
                              data_quality_score: 0,
                              verification_status: 'pending' as const,
                              data_sources: [],
                              created_at: new Date().toISOString(),
                              updated_at: new Date().toISOString(),
                            };

                            return (
                              <div key={r.id ?? `off-${i}`}>
                                <RepresentativeCard
                                  representative={representative}
                                  variant="compact"
                                  showActions={true}
                                  className="border-0 shadow-none"
                                />
                              </div>
                            );
                          })}
                          {hasMoreOfficials ? (
                            <Button variant="outline" size="sm" onClick={() => setOfficialsLimit((n) => n + 5)} className="w-full">
                              {t('feeds.core.electoral.loadMore')}
                            </Button>
                          ) : null}
                        </CardContent>
                      </Card>
                    )}

                    {/* Unified Activity Feed for District Representatives */}
                    {hasOfficials && (() => {
                      // Get all valid representative IDs
                      const validRepIds = allOfficials
                        .map(r => {
                          const repId = r.id ? parseInt(String(r.id), 10) : null;
                          return repId && !isNaN(repId) ? repId : null;
                        })
                        .filter((id): id is number => id !== null);

                      if (validRepIds.length === 0) return null;

                      return (
                        <Card className="mt-6">
                          <CardHeader>
                            <CardTitle className="text-base">
                              {t('feeds.core.electoral.activityFeed') || 'District Activity Feed'}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                              {t('feeds.core.electoral.activityFeedDescription') ||
                                'Polls, bills, and votes from your district representatives'}
                            </p>
                          </CardHeader>
                          <CardContent>
                            <DistrictActivityFeed
                              representativeIds={validRepIds}
                              className="mt-4"
                            />
                          </CardContent>
                        </Card>
                      );
                    })()}
                    {races.length > 0 && (
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-base">{t('feeds.core.electoral.races')}</CardTitle>
                          <Button variant="ghost" size="sm" asChild>
                            <PrefetchLink href="/civics" className="text-sm text-primary hover:underline">
                              {t('feeds.core.electoral.viewAllCivics')}
                            </PrefetchLink>
                          </Button>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {racesVisible.map((r, i) => (
                            <div key={r.raceId ?? `race-${i}`} className="text-sm text-foreground/80">
                              {r.office ?? 'Race'} — {r.jurisdiction ?? ''} {r.electionDate ?? ''}
                            </div>
                          ))}
                          {hasMoreRaces ? (
                            <Button variant="outline" size="sm" onClick={() => setRacesLimit((n) => n + 5)} className="w-full mt-2">
                              {t('feeds.core.electoral.loadMore')}
                            </Button>
                          ) : null}
                        </CardContent>
                      </Card>
                    )}
                    {issues.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">{t('feeds.core.electoral.issues')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {issues.slice(0, 5).map((issue, i) => (
                            <div key={`issue-${i}-${(issue.issue ?? '').slice(0, 20)}`} className="text-sm">
                              <span className="font-medium text-foreground">{issue.issue}</span>
                              {issue.candidates?.length ? (
                                <span className="text-muted-foreground"> — {issue.candidates.slice(0, 3).join(', ')}</span>
                              ) : null}
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}
                    {opportunities.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">{t('feeds.core.electoral.engagement')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {opportunities.slice(0, 5).map((o, i) => (
                            <div key={`opp-${i}-${o.target}`} className="text-sm text-foreground/80">
                              <span className="font-medium">{o.type}</span>: {o.description}
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}
                    {!hasOfficials && races.length === 0 && issues.length === 0 && opportunities.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4" role="status">
                        {t('feeds.core.electoral.noData')}
                      </p>
                    )}
                  </>
                );
              })()}
            </div>
          ) : null}
        </div>
      )}

      {/* Feed Items */}
      {isLoading && feeds.length === 0 ? (
        <div
          className="py-8"
          role="status"
          aria-busy="true"
          aria-live="polite"
          aria-label="Loading feeds"
          data-testid="feed-loading-skeleton"
        >
          <FeedSkeleton count={3} />
        </div>
      ) : feeds.length === 0 && activeFilter === 'all' ? (
        <EnhancedEmptyState
          icon={
            <svg className="h-12 w-12 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12a.75.75 0 110-1.5.75.75 0 010 1.5zM12 17.25a.75.75 0 110-1.5.75.75 0 010 1.5zM18.75 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM18.75 12a.75.75 0 110-1.5.75.75 0 010 1.5zM18.75 17.25a.75.75 0 110-1.5.75.75 0 010 1.5zM5.25 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM5.25 12a.75.75 0 110-1.5.75.75 0 010 1.5zM5.25 17.25a.75.75 0 110-1.5.75.75 0 010 1.5z" />
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
            onResetFilters: () => { selectedHashtags.forEach(tag => onHashtagRemove(tag)); }
          } : {})}
          primaryAction={
            selectedHashtags.length > 0
              ? { label: t('feeds.core.empty.filters.clear') || 'Clear Filters', onClick: () => { selectedHashtags.forEach(tag => onHashtagRemove(tag)); } }
              : { label: t('feeds.core.empty.default.create') || 'Create poll', href: '/polls/create', icon: <Plus className="h-4 w-4" aria-hidden="true" /> }
          }
          {...(selectedHashtags.length > 0
            ? {}
            : {
                secondaryAction: trendingHashtags.length > 0
                  ? { label: t('feeds.core.empty.default.explore') || 'Explore', onClick: () => { const firstTag = trendingHashtags[0]; if (firstTag) onHashtagAdd(firstTag); } }
                  : { label: t('feeds.core.empty.default.refresh') || 'Refresh Feed', onClick: onRefresh },
              })}
        />
      ) : feeds.length === 0 && activeFilter === 'district' ? (
        <EnhancedEmptyState
          icon={<Users className="h-12 w-12 text-muted-foreground" />}
          title={t('feeds.core.empty.community.noResults.title') || 'No community feeds yet'}
          description={t('feeds.core.empty.community.noResults.description') || 'No polls or civic actions in your area right now.'}
          tip={t('feeds.core.empty.community.noResults.tip') || "Try switching to 'All' to see content from everywhere."}
          isFiltered={true}
          primaryAction={{ label: t('feeds.core.empty.community.noResults.showAll') || 'Show All', onClick: () => setActiveFilter('all') }}
        />
      ) : feeds.length > 0 ? (
        <div className="space-y-4" role="feed">
          {feeds.map((feed, index) => (
            <AnimatedCard key={feed.id} index={index}>
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="flex-1">{feed.title}</CardTitle>
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
                  <p className="text-foreground/80 mb-4">{feed.content}</p>
                  <div className="flex gap-3 mt-4">
                    <Button variant={feed.userInteraction.liked ? "default" : "outline"} size="sm" className="min-h-[44px]" onClick={() => { onLike(feed.id); haptic('light'); }}>
                      <ThumbsUp className="h-4 w-4 mr-1.5" aria-hidden="true" />
                      <span aria-live="polite">{feed.engagement.likes}</span>
                    </Button>
                    <Button variant={feed.userInteraction.bookmarked ? "default" : "outline"} size="sm" className="min-h-[44px]" onClick={() => { onBookmark(feed.id); haptic('light'); }}>
                      <Bookmark className="h-4 w-4 mr-1.5" aria-hidden="true" />
                      {t('feeds.core.actions.bookmark')}
                    </Button>
                    <Button variant="outline" size="sm" className="min-h-[44px]" onClick={() => onShare(feed.id)}>
                      <Share2 className="h-4 w-4 mr-1.5" aria-hidden="true" />
                      {t('feeds.core.actions.share')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </AnimatedCard>
          ))}
        </div>
      ) : null}

      {/* Infinite scroll sentinel */}
      {hasMore && onLoadMore && (
        <div ref={loadMoreRef} className="h-10 flex items-center justify-center" aria-hidden="true">
          {isLoading && feeds.length > 0 && (
            <div className="h-5 w-5 border-2 border-border border-t-foreground rounded-full animate-spin" />
          )}
        </div>
      )}

      {/* Status indicators */}
      <div className="flex justify-between items-center text-sm text-muted-foreground mt-4">
        <span>{t('feeds.core.status.online')}</span>
        <span>{t('feeds.core.status.items', { count: feeds.length })}</span>
      </div>

      {/* Accessibility */}
      <div className="sr-only" aria-live="polite" id="live-region-content" />
    </div>
  );
}

