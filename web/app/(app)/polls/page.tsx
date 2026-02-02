'use client';

import { Plus, Users, BarChart3, Flame, Eye } from 'lucide-react';
import Link from 'next/link';
import React, { useEffect, useCallback, useMemo, useRef } from 'react';

import { PollFiltersPanel } from '@/features/polls/components/PollFiltersPanel';
import { getPollCategoryColor, getPollCategoryIcon } from '@/features/polls/constants/categories';

import { EnhancedEmptyState } from '@/components/shared/EnhancedEmptyState';
import { EnhancedErrorDisplay } from '@/components/shared/EnhancedErrorDisplay';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { Skeleton } from '@/components/ui/skeleton';

import { useAppActions } from '@/lib/stores/appStore';
import {
  useFilteredPollCards,
  usePollFilters,
  usePollPagination,
  usePollSearch,
  usePollsActions,
  usePollsError,
  usePollsLoading,
} from '@/lib/stores/pollsStore';
import logger from '@/lib/utils/logger';

import { useI18n } from '@/hooks/useI18n';

// Prevent static generation since this requires client-side state
export const dynamic = 'force-dynamic';

function PollsPageContent() {
  const initializedRef = useRef(false);
  // Set isMounted to false initially, then set to true in useEffect
  // This ensures React has fully mounted before we try to use hooks
  const [isMounted, setIsMounted] = React.useState(false);

  const { t, currentLanguage } = useI18n();
  const { setCurrentRoute, setSidebarActiveSection, setBreadcrumbs } = useAppActions();
  const polls = useFilteredPollCards();
  const isLoading = usePollsLoading();
  const error = usePollsError();
  const filters = usePollFilters();
  const search = usePollSearch();
  const pagination = usePollPagination();
  const {
    loadPolls,
    setFilters,
    setTrendingOnly,
    setCurrentPage,
    clearSearch,
  } = usePollsActions();
  const clearSearchRef = useRef(clearSearch);
  React.useEffect(() => { clearSearchRef.current = clearSearch; }, [clearSearch]);

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
    setTimeout(() => {
      if (process.env.DEBUG_DASHBOARD === '1') {
        logger.debug('Polls page executing initialization in setTimeout');
      }
      setCurrentPageRef.current(1);
      setTrendingOnlyRef.current(false);
      setFiltersRef.current({ status: [] });
      if (process.env.DEBUG_DASHBOARD === '1') {
        logger.debug('Polls page calling loadPolls');
      }
      loadPollsRef.current().catch((error) => {
        logger.warn('Failed to load polls (non-critical):', error);
      });
    }, 0);
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

  const handlePageChange = useCallback(
    (page: number) => {
      const nextPage = Math.max(1, Math.min(page, pagination.totalPages));
      setCurrentPageRef.current(nextPage);
      void loadPollsRef.current({ page: nextPage });
    },
    [pagination.totalPages],
  );

  // Show loading state until component is mounted
  // Use data attribute to help with debugging and ensure consistent SSR/client rendering
  if (!isMounted) {
    return (
      <div className="container mx-auto px-4 py-8" data-testid="polls-loading-mount" role="status" aria-busy="true" aria-live="polite" aria-label="Loading polls">
        <div className="mb-8">
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <Skeleton className="h-6 w-3/4 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-5/6 mb-4" />
              <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-4 w-20 mb-4" />
              <Skeleton className="h-10 w-full mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Show loading state if actually loading data
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8" data-testid="polls-loading-data" role="status" aria-busy="true" aria-live="polite" aria-label="Loading polls">
        <div className="mb-8">
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <PollFiltersPanel />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <Skeleton className="h-6 w-3/4 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-5/6 mb-4" />
              <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-4 w-20 mb-4" />
              <Skeleton className="h-10 w-full mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-2">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                {tRef.current('polls.page.title')}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {tRef.current('polls.page.subtitle')}
              </p>
            </div>
            <Link
              href="/polls/create"
              className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap self-start sm:self-auto focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
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

        <PollFiltersPanel />

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
            polls.map((poll) => (
              <div
                key={poll.id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow [content-visibility:auto] [contain-intrinsic-size:auto_200px]"
              >
                <div className="flex items-start justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 line-clamp-2">
                    {poll.title}
                  </h2>
                  {typeof poll.trendingPosition === 'number' && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                      <Flame className="h-3 w-3 mr-1" />
                      {tRef.current('polls.page.trendingBadge', { position: String(poll.trendingPosition) })}
                    </span>
                  )}
                </div>

                <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                  {poll.description || tRef.current('polls.page.descriptionFallback')}
                </p>

                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span className="inline-flex items-center">
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
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                <div className="space-y-2">
                  <Link
                    href={`/polls/${poll.id}`}
                    className="inline-flex items-center justify-center w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    aria-label={`View poll: ${poll.title}`}
                  >
                    <Eye className="h-4 w-4 mr-2" aria-hidden="true" />
                    {tRef.current('polls.page.cta.view')}
                  </Link>
                  <Link
                    href={`/polls/${poll.id}/results`}
                    className="inline-flex items-center justify-center w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                    aria-label={`View results for poll: ${poll.title}`}
                  >
                    <BarChart3 className="h-4 w-4 mr-2" aria-hidden="true" />
                    {tRef.current('polls.page.cta.results')}
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>

        {pagination.totalPages > 1 && (
          <div className="mt-6 flex flex-col gap-2 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600 md:flex-row md:items-center md:justify-between">
            <span>{paginationLabel}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1 || isLoading}
                className="rounded-md border border-gray-200 dark:border-gray-600 px-3 py-1 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                aria-label={`Go to previous page, page ${pagination.currentPage - 1}`}
                aria-disabled={pagination.currentPage === 1 || isLoading}
              >
                {tRef.current('polls.page.pagination.previous')}
              </button>
              <span className="text-xs text-gray-500">
                {paginationPageLabel}
              </span>
              <button
                type="button"
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages || isLoading}
                className="rounded-md border border-gray-200 dark:border-gray-600 px-3 py-1 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                aria-label={`Go to next page, page ${pagination.currentPage + 1}`}
                aria-disabled={pagination.currentPage === pagination.totalPages || isLoading}
              >
                {tRef.current('polls.page.pagination.next')}
              </button>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}

export default function PollsPage() {
  return <PollsPageContent />;
}
