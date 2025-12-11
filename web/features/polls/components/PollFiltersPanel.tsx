'use client';

import { BarChart3, Clock, Flame, Hash, Search, TrendingUp } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';

import {
  useHashtagActions,
  useHashtagStats,
  useTrendingHashtags,

  usePollFilters,
  usePollSearch,
  usePollsActions} from '@/lib/stores';
import type { PollsActions } from '@/lib/stores/pollsStore';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/utils/logger';

import { useI18n } from '@/hooks/useI18n';

import {
  POLL_CATEGORIES,
} from '../constants/categories';

type PollFiltersPanelProps = {
  actions?: Pick<
    PollsActions,
    | 'loadPolls'
    | 'setFilters'
    | 'setTrendingOnly'
    | 'setCurrentPage'
    | 'setSearchQuery'
    | 'searchPolls'
    | 'clearSearch'
  >;
};

/**
 * Shared poll filters/search panel that binds directly to `pollsStore`.
 * Consumers can optionally provide specific action overrides (useful for tests).
 */
export function PollFiltersPanel({ actions }: PollFiltersPanelProps) {
  const { t, currentLanguage } = useI18n();
  const filters = usePollFilters();
  const search = usePollSearch();
  const defaultActions = usePollsActions();
  const computedActions = useMemo(
    () =>
      actions ?? {
        loadPolls: defaultActions.loadPolls,
        setFilters: defaultActions.setFilters,
        setTrendingOnly: defaultActions.setTrendingOnly,
        setCurrentPage: defaultActions.setCurrentPage,
        setSearchQuery: defaultActions.setSearchQuery,
        searchPolls: defaultActions.searchPolls,
        clearSearch: defaultActions.clearSearch,
      },
    [actions, defaultActions],
  );
  const {
    loadPolls,
    setFilters,
    setTrendingOnly,
    setCurrentPage,
    setSearchQuery,
    searchPolls,
    clearSearch,
  } = computedActions;

  const trendingHashtags = useTrendingHashtags();
  const hashtagStats = useHashtagStats();
  const hashtagActions = useHashtagActions();

  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) {
      return;
    }
    initializedRef.current = true;
    void loadPolls();
  }, [loadPolls]);

  useEffect(() => {
    const fetchTrendingHashtags = async () => {
      try {
        if (hashtagActions?.getTrendingHashtags) {
          await hashtagActions.getTrendingHashtags();
        }
      } catch (error) {
        logger.warn('Failed to load trending hashtags:', error);
      }
    };

    void fetchTrendingHashtags();
  }, [hashtagActions]);

  const selectedCategory = filters.category[0] ?? 'all';
  const selectedHashtags = filters.tags;

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

  const handleFilterChange = useCallback(
    (nextFilter: 'all' | 'active' | 'closed' | 'trending') => {
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
    },
    [loadPolls, setCurrentPage, setFilters, setTrendingOnly],
  );

  const handleCategoryChange = useCallback(
    (categoryId: string) => {
      const category = categoryId === 'all' ? [] : [categoryId];
      setCurrentPage(1);
      setFilters({ category });
      void loadPolls();
    },
    [loadPolls, setCurrentPage, setFilters],
  );

  const handleHashtagSelect = useCallback(
    (hashtag: string) => {
      const normalized = hashtag.replace(/^#/, '');
      if (selectedHashtags.includes(normalized)) {
        return;
      }
      const tags = [...selectedHashtags, normalized];
      setCurrentPage(1);
      setFilters({ tags });
      void loadPolls();
    },
    [loadPolls, selectedHashtags, setCurrentPage, setFilters],
  );

  const handleHashtagRemove = useCallback(
    (hashtag: string) => {
      const tags = selectedHashtags.filter((tag) => tag !== hashtag);
      setCurrentPage(1);
      setFilters({ tags });
      void loadPolls();
    },
    [loadPolls, selectedHashtags, setCurrentPage, setFilters],
  );

  const handleSearchSubmit = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      if (trimmed.length === 0) {
        void clearSearch();
        return;
      }
      setSearchQuery(trimmed);
      setCurrentPage(1);
      void searchPolls(trimmed);
    },
    [clearSearch, searchPolls, setCurrentPage, setSearchQuery],
  );

  const handleSearchInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(event.target.value);
    },
    [setSearchQuery],
  );

  const trendingCount = hashtagStats?.trendingCount ?? 0;
  const numberFormatter = useMemo(
    () => new Intl.NumberFormat(currentLanguage ?? undefined),
    [currentLanguage],
  );
  const formattedTrendingCount = numberFormatter.format(trendingCount);
  const trendingHeading =
    trendingCount > 0
      ? t('polls.filters.trending.headingWithCount', { count: formattedTrendingCount })
      : t('polls.filters.trending.heading');
  const trendingCountLabel = t('polls.filters.trending.count', {
    count: trendingCount,
    formattedCount: formattedTrendingCount,
  });

  return (
    <div className="mb-8 space-y-6">
      <div className="space-y-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
          <input
            type="text"
            placeholder={t('polls.filters.search.placeholder')}
            value={search.query ?? ''}
            onChange={handleSearchInputChange}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                handleSearchSubmit((event.target as HTMLInputElement).value);
              }
            }}
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-transparent focus:ring-2 focus:ring-blue-500"
            aria-label={t('polls.filters.search.ariaLabel')}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            {t('polls.filters.hashtags.label')}
          </label>
          <div className="flex flex-wrap gap-2">
            {selectedHashtags.map((hashtag) => (
              <span
                key={`hashtag-${hashtag}`}
                className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-700"
              >
                #{hashtag}
                <button
                  onClick={() => handleHashtagRemove(hashtag)}
                  className="ml-1 text-blue-500 hover:text-blue-700"
                  aria-label={t('polls.filters.hashtags.remove', { hashtag })}
                >
                  ×
                </button>
              </span>
            ))}
            <input
              type="text"
              placeholder={t('polls.filters.hashtags.addPlaceholder')}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && event.currentTarget.value.trim()) {
                  const newHashtag = event.currentTarget.value.trim().replace(/^#/, '');
                  handleHashtagSelect(newHashtag);
                  event.currentTarget.value = '';
                }
              }}
              className="rounded border border-gray-300 px-2 py-1 text-sm"
              aria-label={t('polls.filters.hashtags.addAria')}
            />
          </div>
        </div>
      </div>

      <div className="flex space-x-1 rounded-lg bg-gray-100 p-1">
        {[
          { id: 'all', label: t('polls.filters.status.all'), icon: BarChart3 },
          { id: 'active', label: t('polls.filters.status.active'), icon: TrendingUp },
          { id: 'trending', label: t('polls.filters.status.trending'), icon: Flame },
          { id: 'closed', label: t('polls.filters.status.closed'), icon: Clock },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => handleFilterChange(id as 'all' | 'active' | 'closed' | 'trending')}
            className={cn(
              'flex items-center rounded-md px-4 py-2 text-sm font-medium transition-colors',
              activeFilter === id ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900',
            )}
          >
            <Icon className="mr-2 h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      <div>
        <span className="mb-2 block text-sm font-medium text-gray-700">
          {t('polls.filters.categories.label')}
        </span>
        <div className="flex flex-wrap gap-2">
          <button
          onClick={() => handleCategoryChange('all')}
          className={cn(
            'rounded-full px-3 py-1 text-sm font-medium transition-colors',
            selectedCategory === 'all'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
          )}
        >
          {t('polls.filters.categories.all')}
        </button>
        {POLL_CATEGORIES.map((category) => (
          <button
            key={category.id}
            onClick={() => handleCategoryChange(category.id)}
            className={cn(
              'rounded-full px-3 py-1 text-sm font-medium transition-colors',
              selectedCategory === category.id
                ? category.color
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
            )}
          >
            {category.icon} {t(category.nameKey)}
          </button>
        ))}
        </div>
      </div>

      {trendingHashtags.length > 0 && (
        <div className="mt-4 rounded-lg border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            <h3 className="text-sm font-semibold text-gray-900">{trendingHeading}</h3>
          </div>
          <div className="mb-2 flex items-center text-sm text-gray-600">
            <BarChart3 className="mr-2 h-4 w-4" />
            <span>{trendingCountLabel}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {trendingHashtags.slice(0, 10).map((hashtag: any, index: number) => (
              <button
                key={`trending-${index}-${typeof hashtag === 'string' ? hashtag : hashtag.name}`}
                onClick={() =>
                  handleHashtagSelect(typeof hashtag === 'string' ? hashtag : hashtag.name)
                }
                className={cn(
                  'inline-flex items-center rounded-full border border-gray-200 px-3 py-1.5 text-sm font-medium transition-all',
                  selectedHashtags.includes(typeof hashtag === 'string' ? hashtag : hashtag.name)
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-blue-50',
                )}
              >
                <Hash className="mr-1 h-3 w-3" />
                {typeof hashtag === 'string' ? hashtag : hashtag.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default PollFiltersPanel;

