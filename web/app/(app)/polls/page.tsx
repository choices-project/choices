'use client';

import { Plus, Users, BarChart3, Flame, Eye } from 'lucide-react';
import Link from 'next/link';
import React, { Suspense, useEffect, useCallback, useMemo, useRef } from 'react';

import { PollFiltersPanel } from '@/features/polls/components/PollFiltersPanel';
import { getPollCategoryColor, getPollCategoryIcon } from '@/features/polls/constants/categories';

import { AnimatedCard } from '@/components/shared/AnimatedCard';
import { BackToTop } from '@/components/shared/BackToTop';
import { EnhancedEmptyState } from '@/components/shared/EnhancedEmptyState';
import { EnhancedErrorDisplay } from '@/components/shared/EnhancedErrorDisplay';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { useLiveAnnouncer } from '@/components/shared/LiveAnnouncer';
import { PrefetchLink } from '@/components/shared/PrefetchLink';
import { PollListSkeleton } from '@/components/shared/Skeletons';
import { Button } from '@/components/ui/button';

import { useAppActions } from '@/lib/stores/appStore';
import {
  useFilteredPollCards,
  usePollFilters,
  usePollPagination,
  usePollSearch,
  usePollsActions,
  usePollsError,
  usePollsLoading,
  usePollsLoadingMore,
} from '@/lib/stores/pollsStore';
import logger from '@/lib/utils/logger';

import { useI18n } from '@/hooks/useI18n';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useUrlFilters } from '@/hooks/useUrlFilters';

// Stable defaults for URL filters to avoid useMemo dependency churn
const POLLS_URL_FILTER_DEFAULTS = {
  status: undefined as string | undefined,
  category: undefined as string | undefined,
  trending: undefined as string | undefined,
  q: undefined as string | undefined,
};

// Prevent static generation since this requires client-side state
export const dynamic = 'force-dynamic';

function PollsPageContent() {
  const initializedRef = useRef(false);
  // Set isMounted to false initially, then set to true in useEffect
  // This ensures React has fully mounted before we try to use hooks
  const [isMounted, setIsMounted] = React.useState(false);
  const prevIsLoadingRef = useRef(true);

  const { t, currentLanguage } = useI18n();
  const { announce } = useLiveAnnouncer();
  const { setCurrentRoute, setSidebarActiveSection, setBreadcrumbs } = useAppActions();
  const polls = useFilteredPollCards();
  const isLoading = usePollsLoading();
  const isLoadingMore = usePollsLoadingMore();
  const error = usePollsError();
  const filters = usePollFilters();
  const search = usePollSearch();
  const pagination = usePollPagination();
  const urlFilters = useUrlFilters(POLLS_URL_FILTER_DEFAULTS);
  const {
    loadPolls,
    setFilters,
    setTrendingOnly,
    setCurrentPage,
    clearSearch,
    setSearchQuery,
    searchPolls,
  } = usePollsActions();
  const clearSearchRef = useRef(clearSearch);
  const setSearchQueryRef = useRef(setSearchQuery);
  const searchPollsRef = useRef(searchPolls);
  React.useEffect(() => { clearSearchRef.current = clearSearch; }, [clearSearch]);
  React.useEffect(() => { setSearchQueryRef.current = setSearchQuery; }, [setSearchQuery]);
  React.useEffect(() => { searchPollsRef.current = searchPolls; }, [searchPolls]);

  const handleClearFilters = useCallback(async () => {
    setFiltersRef.current({ status: [] });
    setTrendingOnlyRef.current(false);
    if (search.query) {
      await clearSearchRef.current();
    }
    void loadPollsRef.current();
  }, [search.query]);

  // Use refs for store actions to prevent infinite re-renders
  const loadPollsRef = useRef(loadPolls);
  const setFiltersRef = useRef(setFilters);
  const setTrendingOnlyRef = useRef(setTrendingOnly);
  const setCurrentPageRef = useRef(setCurrentPage);
  const setCurrentRouteRef = useRef(setCurrentRoute);
  const setSidebarActiveSectionRef = useRef(setSidebarActiveSection);
  const setBreadcrumbsRef = useRef(setBreadcrumbs);
  const tRef = useRef(t);

  // Update refs individually to prevent unnecessary re-renders
  React.useEffect(() => { loadPollsRef.current = loadPolls; }, [loadPolls]);
  React.useEffect(() => { setFiltersRef.current = setFilters; }, [setFilters]);
  React.useEffect(() => { setTrendingOnlyRef.current = setTrendingOnly; }, [setTrendingOnly]);
  React.useEffect(() => { setCurrentPageRef.current = setCurrentPage; }, [setCurrentPage]);
  React.useEffect(() => { setCurrentRouteRef.current = setCurrentRoute; }, [setCurrentRoute]);
  React.useEffect(() => { setSidebarActiveSectionRef.current = setSidebarActiveSection; }, [setSidebarActiveSection]);
  React.useEffect(() => { setBreadcrumbsRef.current = setBreadcrumbs; }, [setBreadcrumbs]);
  React.useEffect(() => { tRef.current = t; }, [t]);

  // Set mounted state after component mounts
  // Simple useEffect like feed page - this ensures React has mounted
  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  // Sync URL params -> store (on mount and when URL changes via back/forward)
  useEffect(() => {
    if (!isMounted) return;
    const { filters: urlF } = urlFilters;
    const hasUrlParams = urlF.status || urlF.category || urlF.trending || urlF.q;
    if (hasUrlParams) {
      const updates: { status?: string[]; category?: string[] } = {};
      if (urlF.status) {
        updates.status =
          urlF.status === 'active' ? ['active'] : urlF.status === 'closed' ? ['closed'] : urlF.status === 'trending' ? [] : [];
        setTrendingOnlyRef.current(urlF.status === 'trending');
      }
      if (urlF.category) {
        updates.category = [urlF.category];
      }
      if (Object.keys(updates).length > 0) {
        setFiltersRef.current(updates);
      }
      if (urlF.q) {
        setSearchQueryRef.current(urlF.q);
        void searchPollsRef.current?.(urlF.q);
      } else {
        void loadPollsRef.current();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: only run when URL changes, not when urlFilters object ref changes
  }, [isMounted, urlFilters.filters]);

  // Sync store -> URL when filters change (from PollFiltersPanel)
  useEffect(() => {
    if (!isMounted) return;
    const status =
      filters.trendingOnly ? 'trending' : filters.status[0] ?? 'all';
    const category = filters.category[0] ?? undefined;
    const q = search.query?.trim() || undefined;
    urlFilters.setFilters({
      status: status === 'all' ? undefined : status,
      category,
      trending: undefined,
      q,
    });
  }, [isMounted, filters.status, filters.category, filters.trendingOnly, search.query, urlFilters]);

  const selectedCategory = filters.category[0] ?? 'all';

  // Use client-only formatters - only create after mount
  const numberFormatter = useMemo(() => {
    if (!isMounted) return null;
    return new Intl.NumberFormat(currentLanguage ?? undefined);
  }, [isMounted, currentLanguage]);

  const dateFormatter = useMemo(() => {
    if (!isMounted) return null;
    return new Intl.DateTimeFormat(currentLanguage ?? undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }, [isMounted, currentLanguage]);

  const formatVoteCount = useCallback(
    (value: number) => {
      if (!isMounted || !numberFormatter) {
        return `${value} votes`;
      }
      return tRef.current('polls.page.metadata.votes', {
        count: String(value),
        formattedCount: numberFormatter.format(value),
      });
    },
    [isMounted, numberFormatter],
  );

  const formatCreatedDate = useCallback(
    (value: string) => {
      if (!isMounted || !dateFormatter) {
        const date = new Date(value);
        return date.toISOString().split('T')[0];
      }
      return dateFormatter.format(new Date(value));
    },
    [isMounted, dateFormatter],
  );

  const paginationStart = useMemo(
    () => (pagination.currentPage - 1) * pagination.itemsPerPage + 1,
    [pagination.currentPage, pagination.itemsPerPage],
  );

  const paginationEnd = useMemo(
    () => Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalResults),
    [pagination.currentPage, pagination.itemsPerPage, pagination.totalResults],
  );

  const paginationLabel = useMemo(() => {
    if (!isMounted || !numberFormatter) {
      return `${paginationStart}-${paginationEnd} of ${pagination.totalResults}`;
    }
    return tRef.current('polls.page.pagination.showing', {
      start: numberFormatter.format(paginationStart),
      end: numberFormatter.format(paginationEnd),
      total: numberFormatter.format(pagination.totalResults),
    });
  }, [isMounted, numberFormatter, paginationEnd, paginationStart, pagination.totalResults]);

  const paginationPageLabel = useMemo(() => {
    if (!isMounted || !numberFormatter) {
      return `Page ${pagination.currentPage} of ${pagination.totalPages}`;
    }
    return tRef.current('polls.page.pagination.pageLabel', {
      current: numberFormatter.format(pagination.currentPage),
      total: numberFormatter.format(pagination.totalPages),
    });
  }, [isMounted, numberFormatter, pagination.currentPage, pagination.totalPages]);

  useEffect(() => {
    if (!isMounted) return;

    setCurrentRouteRef.current('/polls');
    setSidebarActiveSectionRef.current('polls');
    setBreadcrumbsRef.current([
      { label: tRef.current('polls.page.breadcrumbs.home'), href: '/' },
      { label: tRef.current('polls.page.breadcrumbs.dashboard'), href: '/dashboard' },
      { label: tRef.current('polls.page.breadcrumbs.polls'), href: '/polls' },
    ]);

    return () => {
      setSidebarActiveSectionRef.current(null);
      setBreadcrumbsRef.current([]);
    };
  }, [isMounted]);

  useEffect(() => {
    if (process.env.DEBUG_DASHBOARD === '1') {
      logger.debug('Polls page initialization useEffect', { isMounted, initialized: initializedRef.current });
    }
    if (!isMounted) {
      if (process.env.DEBUG_DASHBOARD === '1') {
        logger.debug('Polls page not mounted yet, skipping initialization');
      }
      return;
    }
    if (initializedRef.current) {
      if (process.env.DEBUG_DASHBOARD === '1') {
        logger.debug('Polls page already initialized, skipping');
      }
      return;
    }
    initializedRef.current = true;
    if (process.env.DEBUG_DASHBOARD === '1') {
      logger.debug('Polls page starting initialization', {
      hasLoadPolls: !!loadPollsRef.current,
      hasSetFilters: !!setFiltersRef.current
    });
    }

    // Use setTimeout to defer store updates until after React has completed the render cycle
    // This prevents store updates from blocking the initial render
    const hasUrlParams =
      urlFilters.filters.status || urlFilters.filters.category || urlFilters.filters.trending || urlFilters.filters.q;
    setTimeout(() => {
      if (process.env.DEBUG_DASHBOARD === '1') {
        logger.debug('Polls page executing initialization in setTimeout');
      }
      setCurrentPageRef.current(1);
      if (!hasUrlParams) {
        setTrendingOnlyRef.current(false);
        setFiltersRef.current({ status: [] });
      }
      // URL sync effect handles load when hasUrlParams; init only loads when no URL params
      if (!hasUrlParams) {
        if (process.env.DEBUG_DASHBOARD === '1') {
          logger.debug('Polls page calling loadPolls');
        }
        loadPollsRef.current().catch((error) => {
          logger.warn('Failed to load polls (non-critical):', error);
        });
      }
    }, 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- init effect must only run once on mount
  }, [isMounted]);

  const activeFilter: 'all' | 'active' | 'closed' | 'trending' = useMemo(() => {
    if (filters.trendingOnly) {
      return 'trending';
    }
    if (filters.status.includes('closed')) {
      return 'closed';
    }
    if (filters.status.includes('active')) {
      return 'active';
    }
    return 'all';
  }, [filters.status, filters.trendingOnly]);

  // Announce filter results when loading completes (user-initiated filter changes or initial load)
  useEffect(() => {
    if (!isMounted) return;
    const wasLoading = prevIsLoadingRef.current;
    prevIsLoadingRef.current = isLoading;
    if (wasLoading && !isLoading) {
      const count = polls.length;
      announce(
        count === 0
          ? 'No polls match your filters'
          : `Showing ${numberFormatter ? numberFormatter.format(count) : count} polls`
      );
    }
  }, [isMounted, isLoading, polls.length, announce, numberFormatter]);

  const handlePageChange = useCallback(
    (page: number) => {
      const nextPage = Math.max(1, Math.min(page, pagination.totalPages));
      setCurrentPageRef.current(nextPage);
      void loadPollsRef.current({ page: nextPage });
    },
    [pagination.totalPages],
  );

  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const handleLoadMore = useCallback(() => {
    const nextPage = pagination.currentPage + 1;
    if (nextPage <= pagination.totalPages && !isLoadingMore && !isLoading) {
      setCurrentPageRef.current(nextPage);
      void loadPollsRef.current({ page: nextPage, append: true });
    }
  }, [pagination.currentPage, pagination.totalPages, isLoadingMore, isLoading]);

  const handleLoadMoreRef = useRef(handleLoadMore);
  React.useEffect(() => { handleLoadMoreRef.current = handleLoadMore; }, [handleLoadMore]);

  const handleRefresh = useCallback(async () => {
    setCurrentPageRef.current(1);
    await loadPollsRef.current();
  }, []);

  const { containerRef: pullToRefreshRef, indicator: pullToRefreshIndicator } = usePullToRefresh({
    onRefresh: handleRefresh,
    disabled: isLoading,
  });

  useEffect(() => {
    if (!isMounted || polls.length === 0) return;
    const sentinel = loadMoreRef.current;
    if (!sentinel || pagination.currentPage >= pagination.totalPages || isLoadingMore || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting) {
          handleLoadMoreRef.current();
        }
      },
      { rootMargin: '200px', threshold: 0 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [isMounted, polls.length, pagination.currentPage, pagination.totalPages, isLoadingMore, isLoading]);

  // Show loading state until component is mounted
  // Use data attribute to help with debugging and ensure consistent SSR/client rendering
  if (!isMounted) {
    return (
      <div className="container mx-auto px-4 py-8" data-testid="polls-loading-mount" role="status" aria-busy="true" aria-live="polite" aria-label="Loading polls">
        <PollListSkeleton count={6} />
      </div>
    );
  }

  // Show loading state if actually loading data
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8" data-testid="polls-loading-data" role="status" aria-busy="true" aria-live="polite" aria-label="Loading polls">
        <div className="sticky top-0 z-10 -mx-4 px-4 py-3 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border/40 mb-4">
          <PollFiltersPanel />
        </div>
        <div className="mt-6">
          <PollListSkeleton count={6} />
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div ref={pullToRefreshRef} className="container mx-auto px-4 py-8">
        {pullToRefreshIndicator}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-2">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {tRef.current('polls.page.title')}
              </h1>
              <p className="text-muted-foreground">
                {tRef.current('polls.page.subtitle')}
              </p>
            </div>
            <Link
              href="/polls/create"
              className="inline-flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors whitespace-nowrap self-start sm:self-auto focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
              aria-label="Create a new poll"
            >
              <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
              {tRef.current('polls.page.cta.create')}
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-6">
            <EnhancedErrorDisplay
              title="Unable to load polls"
              message={error}
              details="We encountered an issue while loading polls. This might be a temporary network problem."
              tip="Check your internet connection and try again. If the problem persists, the service may be temporarily unavailable."
              canRetry={true}
              onRetry={() => {
                loadPollsRef.current().catch((err) => {
                  logger.error('Failed to retry loading polls:', err);
                });
              }}
              primaryAction={{
                label: 'Refresh Page',
                onClick: () => window.location.reload(),
              }}
            />
          </div>
        )}

        <div className="sticky top-0 z-10 -mx-4 px-4 py-3 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border/40 mb-4">
          <PollFiltersPanel />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {polls.length === 0 ? (
            <div className="col-span-full">
              <EnhancedEmptyState
                icon={<BarChart3 className="h-12 w-12 text-gray-400" />}
                title={((search.query ?? '') || selectedCategory !== 'all' || activeFilter !== 'all')
                  ? 'No polls match your filters'
                  : 'No polls yet'}
                description={((search.query ?? '') || selectedCategory !== 'all' || activeFilter !== 'all')
                  ? 'Try adjusting your search or filters to see more results.'
                  : 'Be the first to create a poll and start engaging with your community.'}
                tip={((search.query ?? '') || selectedCategory !== 'all' || activeFilter !== 'all')
                  ? 'You can clear your filters to see all available polls.'
                  : 'Polls help you gather opinions, make decisions, and engage with your community.'}
                primaryAction={(() => {
                  const isFiltered = ((search.query ?? '') || selectedCategory !== 'all' || activeFilter !== 'all');
                  const action: {
                    label: string;
                    href?: string;
                    onClick?: () => void;
                    icon: React.ReactNode;
                  } = {
                    label: isFiltered ? 'Clear Filters' : 'Create Your First Poll',
                    icon: <Plus className="h-4 w-4" />,
                  };
                  if (isFiltered) {
                    action.onClick = handleClearFilters;
                  } else {
                    action.href = '/polls/create';
                  }
                  return action;
                })()}
                isFiltered={!!((search.query ?? '') || selectedCategory !== 'all' || activeFilter !== 'all')}
                {...((search.query ?? '') || selectedCategory !== 'all' || activeFilter !== 'all' ? {
                  onResetFilters: handleClearFilters
                } : {})}
              />
            </div>
          ) : (
            polls.map((poll, index) => (
              <AnimatedCard key={poll.id} index={index}>
                <div
                  className="bg-card rounded-lg border border-border p-6 hover:shadow-md transition-shadow [content-visibility:auto] [contain-intrinsic-size:auto_200px]"
                >
                <div className="flex items-start justify-between mb-4">
                  <h2 className="text-lg font-semibold text-foreground line-clamp-2">
                    {poll.title}
                  </h2>
                  {typeof poll.trendingPosition === 'number' && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">
                      <Flame className="h-3 w-3 mr-1" />
                      {tRef.current('polls.page.trendingBadge', { position: String(poll.trendingPosition) })}
                    </span>
                  )}
                </div>

                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                  {poll.description || tRef.current('polls.page.descriptionFallback')}
                </p>

                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                  <span className="inline-flex items-center" aria-live="polite">
                    <Users className="h-4 w-4 mr-1" />
                    {formatVoteCount(typeof poll.totalVotes === 'number' ? poll.totalVotes : 0)}
                  </span>
                  <span>
                    {tRef.current('polls.page.metadata.created', {
                      date: formatCreatedDate(poll.createdAt),
                    })}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${getPollCategoryColor(poll.category)}`}>
                    {getPollCategoryIcon(poll.category)} {tRef.current(`polls.categories.${poll.category}`, { defaultValue: poll.category })}
                  </span>
                  {poll.tags?.slice(0, 3).map((tag, index) => (
                    <span
                      key={`${poll.id}-tag-${index}`}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-muted text-muted-foreground"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                <div className="space-y-2">
                  <PrefetchLink
                    href={`/polls/${poll.id}`}
                    className="inline-flex items-center justify-center w-full px-4 py-2 min-h-[44px] bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
                    aria-label={`View poll: ${poll.title}`}
                  >
                    <Eye className="h-4 w-4 mr-2" aria-hidden="true" />
                    {tRef.current('polls.page.cta.view')}
                  </PrefetchLink>
                  <PrefetchLink
                    href={`/polls/${poll.id}/results`}
                    className="inline-flex items-center justify-center w-full px-4 py-2 border border-border text-foreground rounded-lg hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
                    aria-label={`View results for poll: ${poll.title}`}
                  >
                    <BarChart3 className="h-4 w-4 mr-2" aria-hidden="true" />
                    {tRef.current('polls.page.cta.results')}
                  </PrefetchLink>
                </div>
                </div>
              </AnimatedCard>
            ))
          )}
        </div>

        {pagination.totalPages > 1 && pagination.currentPage < pagination.totalPages && (
          <div
            ref={loadMoreRef}
            className="mt-6 flex min-h-[120px] items-center justify-center"
            role="status"
            aria-live="polite"
            aria-label="Load more polls"
          >
            {isLoadingMore ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-hidden />
                Loading more…
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={handleLoadMore}
                className="min-h-[44px]"
                aria-label="Load more polls"
              >
                {tRef.current('polls.page.pagination.loadMore', { defaultValue: 'Load more' })}
              </Button>
            )}
          </div>
        )}

        <BackToTop />

        {pagination.totalPages > 1 && (
          <div className="mt-6 flex flex-col gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
            <span>{paginationLabel}</span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1 || isLoading}
                className="min-h-[44px]"
                aria-label={`Go to previous page, page ${pagination.currentPage - 1}`}
              >
                {tRef.current('polls.page.pagination.previous')}
              </Button>
              <span className="text-xs text-muted-foreground">
                {paginationPageLabel}
              </span>
              <Button
                variant="outline"
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages || isLoading}
                className="min-h-[44px]"
                aria-label={`Go to next page, page ${pagination.currentPage + 1}`}
              >
                {tRef.current('polls.page.pagination.next')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}

export default function PollsPage() {
  return (
    <Suspense fallback={<PollListSkeleton count={6} />}>
      <PollsPageContent />
    </Suspense>
  );
}
