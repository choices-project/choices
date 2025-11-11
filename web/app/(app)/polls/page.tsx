'use client';

import { Plus, Users, BarChart3, Flame, Eye } from 'lucide-react';
import Link from 'next/link';
import React, { useEffect, useCallback, useMemo, useRef } from 'react';

import type { HashtagSearchQuery, PollHashtagIntegration } from '@/features/hashtags/types';
import {
  useFilteredPolls,
  usePollFilters,
  usePollPagination,
  usePollSearch,
  usePollsActions,
  usePollsError,
  usePollsLoading,
} from '@/lib/stores/pollsStore';

import {
  getPollCategoryColor,
  getPollCategoryIcon,
} from '@/features/polls/constants/categories';
import { PollFiltersPanel } from '@/features/polls/components/PollFiltersPanel';

// Enhanced poll interface with hashtag integration
type EnhancedPoll = {
  id: string;
  title: string;
  description: string;
  status: string;
  category: string;
  tags: string[];
  totalVotes: number;
  createdAt: string;
  hashtags?: string[];
  primary_hashtag?: string;
  hashtagIntegration?: PollHashtagIntegration;
  trending_position?: number;
  engagement_rate?: number;
  user_interest_level?: number;
  author: {
    name: string;
    verified: boolean;
  };
};

const mapApiPollToEnhanced = (rawPoll: any): EnhancedPoll => {
  const hashtags = Array.isArray(rawPoll.hashtags)
    ? rawPoll.hashtags.filter((tag: unknown): tag is string => typeof tag === 'string')
    : [];

  const hashtagIntegration: PollHashtagIntegration | undefined = rawPoll.hashtag_engagement
    ? {
        poll_id: rawPoll.id,
        hashtags,
        primary_hashtag:
          typeof rawPoll.primary_hashtag === 'string' ? rawPoll.primary_hashtag : undefined,
        hashtag_engagement: {
          total_views: rawPoll.hashtag_engagement?.total_views ?? 0,
          hashtag_clicks: rawPoll.hashtag_engagement?.hashtag_clicks ?? 0,
          hashtag_shares: rawPoll.hashtag_engagement?.hashtag_shares ?? 0,
        },
        related_polls: Array.isArray(rawPoll.related_polls)
          ? rawPoll.related_polls.filter((id: unknown): id is string => typeof id === 'string')
          : [],
        hashtag_trending_score: rawPoll.hashtag_trending_score ?? 0,
      }
    : undefined;

  const primaryHashtag =
    typeof rawPoll.primary_hashtag === 'string' ? rawPoll.primary_hashtag : undefined;
  const trendingPosition =
    typeof rawPoll.trending_position === 'number' ? rawPoll.trending_position : undefined;
  const engagementRate =
    typeof rawPoll.engagement_rate === 'number' ? rawPoll.engagement_rate : undefined;
  const userInterestLevel =
    typeof rawPoll.user_interest_level === 'number' ? rawPoll.user_interest_level : undefined;

  return {
    id: rawPoll.id,
    title: rawPoll.title,
    description: rawPoll.description ?? '',
    status: rawPoll.status ?? 'active',
    category: rawPoll.category ?? 'general',
    tags: Array.isArray(rawPoll.tags)
      ? rawPoll.tags.filter((tag: unknown): tag is string => typeof tag === 'string')
      : [],
    totalVotes: rawPoll.totalVotes ?? rawPoll.total_votes ?? 0,
    createdAt: rawPoll.createdAt ?? rawPoll.created_at ?? new Date().toISOString(),
    ...(hashtags.length > 0 ? { hashtags } : {}),
    ...(primaryHashtag ? { primary_hashtag: primaryHashtag } : {}),
    ...(hashtagIntegration ? { hashtagIntegration } : {}),
    ...(trendingPosition !== undefined ? { trending_position: trendingPosition } : {}),
    ...(engagementRate !== undefined ? { engagement_rate: engagementRate } : {}),
    ...(userInterestLevel !== undefined ? { user_interest_level: userInterestLevel } : {}),
    author: {
      name: rawPoll.author?.name ?? 'Anonymous',
      verified: Boolean(rawPoll.author?.verified),
    },
  };
};

export default function PollsPage() {
  const polls = useFilteredPolls();
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

  const enhancedPolls = useMemo(() => polls.map(mapApiPollToEnhanced), [polls]);

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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Polls</h1>
        <p className="text-gray-600">Discover and participate in community polls</p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <PollFiltersPanel />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {enhancedPolls.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <div className="text-gray-400 mb-4">
              <BarChart3 className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No polls found</h3>
            <p className="text-gray-600 mb-4">
              {((search.query ?? '') || selectedCategory !== 'all' || activeFilter !== 'all')
                ? 'Try adjusting your filters or search terms'
                : 'Be the first to create a poll!'}
            </p>
            <Link
              href="/polls/create"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Poll
            </Link>
          </div>
        ) : (
          enhancedPolls.map((poll) => (
            <div key={poll.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                  {poll.title}
                </h3>
                {poll.trending_position && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                    <Flame className="h-3 w-3 mr-1" />
                    Trending #{poll.trending_position}
                  </span>
                )}
              </div>

              <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                {poll.description || 'No description provided'}
              </p>

              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <span className="inline-flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  {poll.totalVotes} votes
                </span>
                <span>{new Date(poll.createdAt).toLocaleDateString()}</span>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${getPollCategoryColor(poll.category)}`}>
                  {getPollCategoryIcon(poll.category)} {poll.category}
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
                  View Poll
                </Link>
                <Link
                  href={`/polls/${poll.id}/results`}
                  className="inline-flex items-center justify-center w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Results
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {pagination.totalPages > 1 && (
        <div className="mt-6 flex flex-col gap-2 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600 md:flex-row md:items-center md:justify-between">
          <span>
            Showing {(pagination.currentPage - 1) * pagination.itemsPerPage + 1}–
            {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalResults)} of{' '}
            {pagination.totalResults} polls
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1 || isLoading}
              className="rounded-md border border-gray-200 px-3 py-1 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-xs text-gray-500">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <button
              type="button"
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages || isLoading}
              className="rounded-md border border-gray-200 px-3 py-1 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
