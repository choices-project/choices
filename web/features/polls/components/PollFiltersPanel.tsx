'use client';

import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { BarChart3, Clock, Flame, Hash, Search, TrendingUp } from 'lucide-react';

import {
  useHashtagActions,
  useHashtagStats,
  useTrendingHashtags,
} from '@/lib/stores';
import {
  usePollFilters,
  usePollSearch,
  usePollsActions,
  type PollsActions,
} from '@/lib/stores';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/utils/logger';

import {
  POLL_CATEGORIES,
  getPollCategoryColor,
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
  const filters = usePollFilters();
  const search = usePollSearch();
  const {
    loadPolls,
    setFilters,
    setTrendingOnly,
    setCurrentPage,
    setSearchQuery,
    searchPolls,
    clearSearch,
  } = useMemo(
    () =>
      actions ??
      (() => {
        const defaultActions = usePollsActions();
        return {
          loadPolls: defaultActions.loadPolls,
          setFilters: defaultActions.setFilters,
          setTrendingOnly: defaultActions.setTrendingOnly,
          setCurrentPage: defaultActions.setCurrentPage,
          setSearchQuery: defaultActions.setSearchQuery,
          searchPolls: defaultActions.searchPolls,
          clearSearch: defaultActions.clearSearch,
        };
      })(),
    [actions],
  );

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

  return (
    <div className="mb-8 space-y-6">
      <div className="space-y-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
          <input
            type="text"
            placeholder="Search polls, hashtags, or topics..."
            value={search.query ?? ''}
            onChange={handleSearchInputChange}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                handleSearchSubmit((event.target as HTMLInputElement).value);
              }
            }}
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-transparent focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Filter by Hashtags:</label>
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
                  aria-label={`Remove ${hashtag} filter`}
                >
                  ×
                </button>
              </span>
            ))}
            <input
              type="text"
              placeholder="Add hashtags to filter polls..."
              onKeyDown={(event) => {
                if (event.key === 'Enter' && event.currentTarget.value.trim()) {
                  const newHashtag = event.currentTarget.value.trim().replace(/^#/, '');
                  handleHashtagSelect(newHashtag);
                  event.currentTarget.value = '';
                }
              }}
              className="rounded border border-gray-300 px-2 py-1 text-sm"
              aria-label="Add hashtag filter"
            />
          </div>
        </div>
      </div>

      <div className="flex space-x-1 rounded-lg bg-gray-100 p-1">
        {[
          { id: 'all', label: 'All', icon: BarChart3 },
          { id: 'active', label: 'Active', icon: TrendingUp },
          { id: 'trending', label: 'Trending', icon: Flame },
          { id: 'closed', label: 'Closed', icon: Clock },
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
          All Categories
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
            {category.icon} {category.name}
          </button>
        ))}
      </div>

      {trendingHashtags.length > 0 && (
        <div className="mt-4 rounded-lg border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            <h3 className="text-sm font-semibold text-gray-900">
              Trending Hashtags {trendingCount ? `(${trendingCount})` : ''}
            </h3>
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

