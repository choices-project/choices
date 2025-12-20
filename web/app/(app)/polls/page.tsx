'use client';

import { Plus, Users, BarChart3, Flame, Eye } from 'lucide-react';
import Link from 'next/link';
import React, { useEffect, useCallback, useMemo, useRef } from 'react';

import { PollFiltersPanel } from '@/features/polls/components/PollFiltersPanel';
import { getPollCategoryColor, getPollCategoryIcon } from '@/features/polls/constants/categories';

import { ErrorBoundary } from '@/components/shared/ErrorBoundary';

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
  } = usePollsActions();

  // Use refs for store actions to prevent infinite re-renders
  const loadPollsRef = useRef(loadPolls);
  const setFiltersRef = useRef(setFilters);
  const setTrendingOnlyRef = useRef(setTrendingOnly);
  const setCurrentPageRef = useRef(setCurrentPage);
  const setCurrentRouteRef = useRef(setCurrentRoute);
  const setSidebarActiveSectionRef = useRef(setSidebarActiveSection);
  const setBreadcrumbsRef = useRef(setBreadcrumbs);
  const tRef = useRef(t);

  React.useEffect(() => {
    loadPollsRef.current = loadPolls;
    setFiltersRef.current = setFilters;
    setTrendingOnlyRef.current = setTrendingOnly;
    setCurrentPageRef.current = setCurrentPage;
    setCurrentRouteRef.current = setCurrentRoute;
    setSidebarActiveSectionRef.current = setSidebarActiveSection;
    setBreadcrumbsRef.current = setBreadcrumbs;
    tRef.current = t;
  }, [loadPolls, setFilters, setTrendingOnly, setCurrentPage, setCurrentRoute, setSidebarActiveSection, setBreadcrumbs, t]);

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
    console.log('[POLLS PAGE] Initialization useEffect', { isMounted, initialized: initializedRef.current });
    if (!isMounted) {
      console.log('[POLLS PAGE] Not mounted yet, skipping initialization');
      return;
    }
    if (initializedRef.current) {
      console.log('[POLLS PAGE] Already initialized, skipping');
      return;
    }
    initializedRef.current = true;
    console.log('[POLLS PAGE] Starting initialization', { 
      hasLoadPolls: !!loadPollsRef.current,
      hasSetFilters: !!setFiltersRef.current 
    });
    
    // Use setTimeout to defer store updates until after React has completed the render cycle
    // This prevents store updates from blocking the initial render
    setTimeout(() => {
      console.log('[POLLS PAGE] Executing initialization in setTimeout');
      setCurrentPageRef.current(1);
      setTrendingOnlyRef.current(false);
      setFiltersRef.current({ status: [] });
      console.log('[POLLS PAGE] Calling loadPolls');
      loadPollsRef.current().catch((error) => {
        console.error('[POLLS PAGE] Failed to load polls:', error);
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
      <div className="container mx-auto px-4 py-8" data-testid="polls-loading-mount">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </div>
    );
  }

  // Show loading state if actually loading data
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8" data-testid="polls-loading-data">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {tRef.current('polls.page.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {tRef.current('polls.page.subtitle')}
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        <PollFiltersPanel />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {polls.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <div className="text-gray-400 mb-4">
                <BarChart3 className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                {tRef.current('polls.page.empty.title')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {((search.query ?? '') || selectedCategory !== 'all' || activeFilter !== 'all')
                  ? tRef.current('polls.page.empty.filters')
                  : tRef.current('polls.page.empty.ctaMessage')}
              </p>
              <Link
                href="/polls/create"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                {tRef.current('polls.page.cta.create')}
              </Link>
            </div>
          ) : (
            polls.map((poll) => (
              <div
                key={poll.id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 line-clamp-2">
                    {poll.title}
                  </h3>
                  {typeof poll.trendingPosition === 'number' && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                      <Flame className="h-3 w-3 mr-1" />
                      {tRef.current('polls.page.trendingBadge', { position: String(poll.trendingPosition) })}
                    </span>
                  )}
                </div>

                <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                  {poll.description || t('polls.page.descriptionFallback')}
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
                    className="inline-flex items-center justify-center w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {tRef.current('polls.page.cta.view')}
                  </Link>
                  <Link
                    href={`/polls/${poll.id}/results`}
                    className="inline-flex items-center justify-center w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
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
                className="rounded-md border border-gray-200 px-3 py-1 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
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
                className="rounded-md border border-gray-200 px-3 py-1 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
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
