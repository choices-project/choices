'use client';

import { Plus, Users, BarChart3, Flame, Eye } from 'lucide-react';
import Link from 'next/link';
import React, { useEffect, useCallback, useMemo, useRef } from 'react';

import { PollFiltersPanel } from '@/features/polls/components/PollFiltersPanel';
import { getPollCategoryColor, getPollCategoryIcon } from '@/features/polls/constants/categories';
import {
  useFilteredPollCards,
  usePollFilters,
  usePollPagination,
  usePollSearch,
  usePollsActions,
  usePollsError,
  usePollsLoading,
} from '@/lib/stores/pollsStore';
import { useI18n } from '@/hooks/useI18n';
import { useAppActions } from '@/lib/stores/appStore';

export default function PollsPage() {
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
    setSearchQuery,
    searchPolls,
    clearSearch,
  } = usePollsActions();

  const initializedRef = useRef(false);

  const selectedCategory = filters.category[0] ?? 'all';

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

  const formatVoteCount = useCallback(
    (value: number) =>
      t('polls.page.metadata.votes', {
        count: String(value),
        formattedCount: numberFormatter.format(value),
      }),
    [numberFormatter, t],
  );

  const formatCreatedDate = useCallback(
    (value: string) => dateFormatter.format(new Date(value)),
    [dateFormatter],
  );

  const paginationStart = useMemo(
    () => (pagination.currentPage - 1) * pagination.itemsPerPage + 1,
    [pagination.currentPage, pagination.itemsPerPage],
  );

  const paginationEnd = useMemo(
    () => Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalResults),
    [pagination.currentPage, pagination.itemsPerPage, pagination.totalResults],
  );

  const paginationLabel = useMemo(
    () =>
      t('polls.page.pagination.showing', {
        start: numberFormatter.format(paginationStart),
        end: numberFormatter.format(paginationEnd),
        total: numberFormatter.format(pagination.totalResults),
      }),
    [numberFormatter, paginationEnd, paginationStart, pagination.totalResults, t],
  );

  const paginationPageLabel = useMemo(
    () =>
      t('polls.page.pagination.pageLabel', {
        current: numberFormatter.format(pagination.currentPage),
        total: numberFormatter.format(pagination.totalPages),
      }),
    [numberFormatter, pagination.currentPage, pagination.totalPages, t],
  );

  useEffect(() => {
    setCurrentRoute('/polls');
    setSidebarActiveSection('polls');
    setBreadcrumbs([
      { label: 'Home', href: '/' },
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Polls', href: '/polls' },
    ]);

    return () => {
      setSidebarActiveSection(null);
      setBreadcrumbs([]);
    };
  }, [setBreadcrumbs, setCurrentRoute, setSidebarActiveSection]);

  useEffect(() => {
    if (initializedRef.current) {
      return;
    }
    initializedRef.current = true;
    setCurrentPage(1);
    setTrendingOnly(false);
    setFilters({ status: [] });
    void loadPolls();
  }, [loadPolls, setCurrentPage, setFilters, setTrendingOnly]);

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

  const handleFilterChange = useCallback((nextFilter: 'all' | 'active' | 'closed' | 'trending') => {
    let status: string[] = [];
    let nextTrending = false;

    switch (nextFilter) {
      case 'active':
        status = ['active'];
        break;
      case 'closed':
        status = ['closed'];
        break;
      case 'trending':
        nextTrending = true;
        break;
      case 'all':
      default:
        status = [];
        break;
    }

    setCurrentPage(1);
    setTrendingOnly(nextTrending);
    setFilters({ status });
    void loadPolls();
  }, [loadPolls, setCurrentPage, setFilters, setTrendingOnly]);

  const handleCategoryChange = useCallback((categoryId: string) => {
    const category = categoryId === 'all' ? [] : [categoryId];
    setCurrentPage(1);
    setFilters({ category });
    void loadPolls();
  }, [loadPolls, setCurrentPage, setFilters]);

  const handleHashtagSelect = useCallback((hashtag: string) => {
    const normalized = hashtag.replace(/^#/, '');
    if (filters.tags.includes(normalized)) {
      return;
    }
    const tags = [...filters.tags, normalized];
    setCurrentPage(1);
    setFilters({ tags });
    void loadPolls();
  }, [loadPolls, filters.tags, setCurrentPage, setFilters]);

  const handleHashtagRemove = useCallback((hashtag: string) => {
    const tags = filters.tags.filter((tag) => tag !== hashtag);
    setCurrentPage(1);
    setFilters({ tags });
    void loadPolls();
  }, [loadPolls, filters.tags, setCurrentPage, setFilters]);

  const handleSearchSubmit = useCallback((value: string) => {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      void clearSearch();
      return;
    }
    setSearchQuery(trimmed);
    setCurrentPage(1);
    void searchPolls(trimmed);
  }, [clearSearch, searchPolls, setCurrentPage, setSearchQuery]);

  const handleSearchInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSearchSubmit((event.target as HTMLInputElement).value);
    }
  };

  const handlePageChange = useCallback(
    (page: number) => {
      const nextPage = Math.max(1, Math.min(page, pagination.totalPages));
      setCurrentPage(nextPage);
      void loadPolls({ page: nextPage });
    },
    [loadPolls, pagination.totalPages, setCurrentPage],
  );

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('polls.page.title')}</h1>
        <p className="text-gray-600">{t('polls.page.subtitle')}</p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('polls.page.empty.title')}</h3>
            <p className="text-gray-600 mb-4">
              {((search.query ?? '') || selectedCategory !== 'all' || activeFilter !== 'all')
                ? t('polls.page.empty.filters')
                : t('polls.page.empty.ctaMessage')}
            </p>
            <Link
              href="/polls/create"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('polls.page.cta.create')}
            </Link>
          </div>
        ) : (
          polls.map((poll) => (
            <div key={poll.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                  {poll.title}
                </h3>
                {typeof poll.trendingPosition === 'number' && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                    <Flame className="h-3 w-3 mr-1" />
                    {t('polls.page.trendingBadge', { position: String(poll.trendingPosition) })}
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
                  {t('polls.page.metadata.created', {
                    date: formatCreatedDate(poll.createdAt),
                  })}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${getPollCategoryColor(poll.category)}`}>
                  {getPollCategoryIcon(poll.category)} {t(`polls.categories.${poll.category}`, { defaultValue: poll.category })}
                </span>
                {poll.tags?.slice(0, 3).map((tag, index) => (
                  <span key={`${poll.id}-tag-${index}`} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
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
                  {t('polls.page.cta.view')}
                </Link>
                <Link
                  href={`/polls/${poll.id}/results`}
                  className="inline-flex items-center justify-center w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  {t('polls.page.cta.results')}
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
              {t('polls.page.pagination.previous')}
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
              {t('polls.page.pagination.next')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
