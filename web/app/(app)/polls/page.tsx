'use client';

import { Plus, TrendingUp, Clock, Users, BarChart3, Search, Hash, Flame, Star, Eye } from 'lucide-react';
import Link from 'next/link';
import React, { useState, useEffect, useCallback } from 'react';

import type { HashtagSearchQuery } from '@/features/hashtags/types';
import { useHashtagStore, useHashtagActions, useHashtagStats } from '@/lib/stores';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/utils/logger';

// Import hashtag functionality

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
  hashtag_engagement?: {
    total_views: number;
    hashtag_clicks: number;
    hashtag_shares: number;
  };
  hashtag_trending_score?: number;
  trending_position?: number;
  engagement_rate?: number;
  user_interest_level?: number;
  author: {
    name: string;
    verified: boolean;
  };
}

// Removed unused type definitions

const CATEGORIES = [
  { id: 'general', name: 'General', icon: '📊', color: 'bg-gray-100 text-gray-700' },
  { id: 'business', name: 'Business', icon: '💼', color: 'bg-blue-100 text-blue-700' },
  { id: 'education', name: 'Education', icon: '🎓', color: 'bg-green-100 text-green-700' },
  { id: 'technology', name: 'Technology', icon: '💻', color: 'bg-purple-100 text-purple-700' },
  { id: 'health', name: 'Health', icon: '🏥', color: 'bg-red-100 text-red-700' },
  { id: 'finance', name: 'Finance', icon: '💰', color: 'bg-emerald-100 text-emerald-700' },
  { id: 'environment', name: 'Environment', icon: '🌱', color: 'bg-lime-100 text-lime-700' },
  { id: 'social', name: 'Social', icon: '👥', color: 'bg-teal-100 text-teal-700' }
];

export default function PollsPage() {
  const [polls, setPolls] = useState<EnhancedPoll[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'closed' | 'trending'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedHashtags, setSelectedHashtags] = useState<string[]>([]);
  const [sortBy, _setSortBy] = useState<'newest' | 'popular' | 'trending' | 'engagement'>('trending');
  const [viewMode, _setViewMode] = useState<'grid' | 'list' | 'trending'>('trending');
  
  // Hashtag store integration
  const hashtagStore = useHashtagStore();
  const hashtagStats = useHashtagStats();
  const hashtagActions = useHashtagActions();
  
  // Get hashtag data from store
  const _hashtags = hashtagStore?.hashtags ?? [];
  const _trendingHashtags = hashtagStore?.trendingHashtags ?? [];
  const _trendingCount = hashtagStats?.trendingCount ?? 0;
  
  // Use useCallback to prevent infinite loops
  const getTrendingHashtags = useCallback(async () => {
    try {
      if (hashtagActions?.getTrendingHashtags) {
        await hashtagActions.getTrendingHashtags();
      }
    } catch (error) {
      logger.warn('Failed to load trending hashtags:', error);
    }
  }, [hashtagActions]);
  
  const _searchHashtags = useCallback(async (query: string) => {
    try {
      if (hashtagActions?.searchHashtags) {
        const searchQuery: HashtagSearchQuery = { query };
        await hashtagActions.searchHashtags(searchQuery);
      }
    } catch (error) {
      logger.warn('Failed to search hashtags:', error);
    }
    return [];
  }, [hashtagActions]);

  // Load trending hashtags on mount with error handling
  useEffect(() => {
    const loadTrending = async () => {
      try {
        await getTrendingHashtags();
      } catch (error) {
        logger.warn('Failed to load trending hashtags:', error);
      }
    };
    loadTrending();
  }, [getTrendingHashtags]);

  useEffect(() => {
    const loadPolls = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (filter !== 'all') params.append('status', filter);
        if (selectedCategory !== 'all') params.append('category', selectedCategory);
        if (searchQuery) params.append('search', searchQuery);
        params.append('sort', sortBy);
        params.append('view_mode', viewMode);

        const response = await fetch(`/api/polls?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          setPolls(data.polls ?? []);
        } else {
          logger.error('Failed to load polls:', response.statusText);
          setPolls([]);
        }
      } catch (err) {
        logger.error('Failed to load polls:', err);
        setPolls([]);
      } finally {
        setLoading(false);
      }
    };

    loadPolls();
  }, [filter, selectedCategory, searchQuery, sortBy, viewMode]);

  // Enhanced filtering with hashtag support
  const filteredPolls = polls.filter(poll => {
    if (filter === 'all') return true;
    if (filter === 'trending') return poll.trending_position && poll.trending_position > 0;
    return poll.status === filter;
  });

  const getCategoryIcon = (category: string) => {
    return CATEGORIES.find(c => c.id === category)?.icon ?? '📊';
  };

  const getCategoryColor = (category: string) => {
    return CATEGORIES.find(c => c.id === category)?.color ?? 'bg-gray-100 text-gray-700';
  };

  // Hashtag management functions
  const handleHashtagSelect = (hashtag: string) => {
    if (!selectedHashtags.includes(hashtag)) {
      setSelectedHashtags([...selectedHashtags, hashtag]);
    }
  };

  const handleHashtagRemove = (hashtag: string) => {
    setSelectedHashtags(selectedHashtags.filter(h => h !== hashtag));
  };

  const _handleHashtagSearch = async (query: string) => {
    if (query.trim()) {
      try {
        // await searchHashtags({ query: query.trim(), limit: 10 });
        logger.debug('Hashtag search:', query.trim());
      } catch (error) {
        logger.warn('Hashtag search failed:', error);
      }
    }
  };

  if (loading) {
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
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Polls</h1>
        <p className="text-gray-600">Discover and participate in community polls</p>
      </div>

      {/* Enhanced Search and Filters */}
      <div className="mb-8 space-y-6">
        {/* Search Bar with Hashtag Integration */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search polls, hashtags, or topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Hashtag Input - Re-enabled with fixed infinite loop */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Filter by Hashtags:</label>
            <div className="flex flex-wrap gap-2">
              {selectedHashtags.map((hashtag, index) => (
                <span key={`hashtag-${index}-${hashtag}`} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700">
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
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                    const newHashtag = e.currentTarget.value.trim().replace(/^#/, ''); // Remove # if user types it
                    if (!selectedHashtags.includes(newHashtag) && selectedHashtags.length < 5) {
                      setSelectedHashtags([...selectedHashtags, newHashtag]);
                    }
                    e.currentTarget.value = '';
                  }
                }}
                className="px-2 py-1 border border-gray-300 rounded text-sm"
                aria-label="Add hashtag filter"
              />
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          {[
            { id: 'all', label: 'All', icon: BarChart3 },
            { id: 'active', label: 'Active', icon: TrendingUp },
            { id: 'trending', label: 'Trending', icon: Flame },
            { id: 'closed', label: 'Closed', icon: Clock }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setFilter(id as 'all' | 'active' | 'closed' | 'trending')}
              className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="h-4 w-4 mr-2" />
              {label}
            </button>
          ))}
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === 'all'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Categories
          </button>
          {CATEGORIES.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === category.id
                  ? category.color
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.icon} {category.name}
            </button>
          ))}
        </div>
      </div>

        {/* Trending Hashtags Display - Re-enabled with fixed infinite loop */}
        {_trendingHashtags.length > 0 && (
          <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
            <div className="flex items-center gap-2 mb-3">
              <Flame className="h-5 w-5 text-orange-500" />
              <h3 className="text-sm font-semibold text-gray-900">Trending Hashtags</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {_trendingHashtags.slice(0, 10).map((hashtag: any, index: number) => (
                <button
                  key={`trending-${index}-${typeof hashtag === 'string' ? hashtag : hashtag.name}`}
                  onClick={() => handleHashtagSelect(typeof hashtag === 'string' ? hashtag : hashtag.name)}
                  className={cn(
                    "inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                    selectedHashtags.includes(typeof hashtag === 'string' ? hashtag : hashtag.name)
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-700 hover:bg-blue-50 border border-gray-200"
                  )}
                >
                  <Hash className="h-3 w-3 mr-1" />
                  {typeof hashtag === 'string' ? hashtag : hashtag.name}
                </button>
              ))}
            </div>
          </div>
        )}

      {/* Polls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPolls.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <div className="text-gray-400 mb-4">
              <BarChart3 className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No polls found</h3>
            <p className="text-gray-600 mb-4">
              {(searchQuery || selectedCategory !== 'all' || filter !== 'all')
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
          filteredPolls.map((poll) => (
            <div key={poll.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                  {poll.title}
                </h3>
                {poll.totalVotes > 10 && (
                  <div className="flex items-center text-orange-600 ml-2">
                    <Flame className="h-4 w-4" />
                  </div>
                )}
              </div>

              <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                {poll.description}
              </p>

              {/* Enhanced Poll Stats with Hashtag Analytics */}
              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    {poll.totalVotes} votes
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {new Date(poll.createdAt).toLocaleDateString()}
                  </div>
                  {poll.hashtag_engagement && (
                    <div className="flex items-center">
                      <Eye className="h-4 w-4 mr-1" />
                      {poll.hashtag_engagement.total_views} views
                    </div>
                  )}
                </div>
                {poll.trending_position && poll.trending_position > 0 && (
                  <div className="flex items-center text-orange-600">
                    <Flame className="h-4 w-4 mr-1" />
                    #{poll.trending_position} trending
                  </div>
                )}
              </div>

              {/* Category Badge */}
              <div className="mb-4">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(poll.category)}`}>
                  {getCategoryIcon(poll.category)} {CATEGORIES.find(c => c.id === poll.category)?.name ?? poll.category}
                </span>
              </div>

              {/* Enhanced Tags with Hashtag Integration */}
              <div className="mb-4 space-y-2">
                {/* Regular Tags */}
                {poll.tags && poll.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {poll.tags.slice(0, 3).map((tag, index) => (
                      <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                        #{tag}
                      </span>
                    ))}
                    {poll.tags.length > 3 && (
                      <span className="text-xs text-gray-500">+{poll.tags.length - 3} more</span>
                    )}
                  </div>
                )}
                
                {/* Hashtags with Engagement */}
                {poll.hashtags && poll.hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {poll.hashtags.slice(0, 3).map((hashtag, index) => (
                      <button
                        key={index}
                        onClick={() => handleHashtagSelect(hashtag)}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                      >
                        <Hash className="h-3 w-3 mr-1" />
                        {hashtag}
                      </button>
                    ))}
                    {poll.hashtags.length > 3 && (
                      <span className="text-xs text-gray-500">+{poll.hashtags.length - 3} more</span>
                    )}
                  </div>
                )}
                
                {/* Primary Hashtag Highlight */}
                {poll.primary_hashtag && (
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-yellow-500" />
                    <span className="text-xs text-yellow-700 font-medium">
                      Primary: #{poll.primary_hashtag}
                    </span>
                  </div>
                )}
              </div>

              {/* Author */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-gray-600">
                      {poll.author.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{poll.author.name}</p>
                    {poll.author.verified && (
                      <div className="flex items-center text-xs text-blue-600">
                        <Star className="h-3 w-3 mr-1" />
                        Verified
                      </div>
                    )}
                  </div>
                </div>
                <Link
                  href={`/polls/${poll.id}`}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  View Poll →
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}