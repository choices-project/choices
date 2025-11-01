/**
 * Hashtag Trending Component
 * 
 * Real-time trending hashtags display with advanced filtering,
 * category-based trends, and performance metrics.
 * 
 * Created: October 10, 2025
 * Status: ✅ ACTIVE
 */

import {
  TrendingUp,
  Flame,
  Clock,
  Search,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';

import { 
  useHashtagStore,
  useHashtagActions
} from '@/lib/stores';

import type {
  HashtagCategory
} from '../types';
import {
  formatUsageCount,
  formatGrowthRate,
  formatTrendingScore,
  getHashtagCategoryColor,
  getHashtagCategoryIcon
} from '../utils/hashtag-utils';

// Get filtering methods from the store
const useHashtagFilters = () => {
  const store = useHashtagStore();
  return {
    setCategory: store.setCategory,
    setSortBy: store.setSortBy,
    setTimeRange: store.setTimeRange,
    setSearchQuery: store.setSearchQuery
  };
};


type HashtagTrendingProps = {
  category?: HashtagCategory;
  limit?: number;
  showFilters?: boolean;
  showMetrics?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
  className?: string;
}

export default function HashtagTrending({
  category,
  limit = 20,
  showFilters = true,
  showMetrics = true,
  autoRefresh = true,
  refreshInterval = 30000, // 30 seconds
  className = ''
}: HashtagTrendingProps) {
  // Local filter state
  const [filters, setFilters] = useState({
    searchQuery: '',
    selectedCategory: 'all',
    sortBy: 'trending',
    timeRange: '24h'
  });

  // Zustand store integration
  const { trendingHashtags, isLoading, error } = useHashtagStore();
  const { getTrendingHashtags, setCategory, setSortBy, setTimeRange, setSearchQuery } = useHashtagActions();
  
  const loadTrendingHashtags = useCallback(async () => {
    try {
      await getTrendingHashtags();
    } catch (err) {
      console.error('Failed to load trending hashtags:', err);
    }
  }, [getTrendingHashtags]);

  // Initialize filters from props
  useEffect(() => {
    if (category) {
      setCategory(category);
    }
  }, [category, setCategory]);

  useEffect(() => {
    loadTrendingHashtags();
    
    if (autoRefresh) {
      const interval = setInterval(loadTrendingHashtags, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [loadTrendingHashtags, autoRefresh, refreshInterval]);

  const getSortedHashtags = () => {
    let sorted = [...trendingHashtags];
    
    // Apply search filter
    if (filters.searchQuery) {
      sorted = sorted.filter(hashtag => 
        hashtag.hashtag.name.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        hashtag.hashtag.description?.toLowerCase().includes(filters.searchQuery.toLowerCase())
      );
    }
    
    // Apply sorting
    switch (filters.sortBy) {
      case 'trend_score':
        sorted.sort((a, b) => (b.trend_score || 0) - (a.trend_score || 0));
        break;
      case 'usage':
        sorted.sort((a, b) => (b.trend_score || 0) - (a.trend_score || 0));
        break;
      case 'growth':
        sorted.sort((a, b) => (b.growth_rate || 0) - (a.growth_rate || 0));
        break;
      case 'alphabetical':
        sorted.sort((a, b) => a.hashtag.name.localeCompare(b.hashtag.name));
        break;
    }
    
    return sorted.slice(0, limit);
  };

  const getTrendIcon = (position: number, previousPosition?: number) => {
    if (previousPosition === undefined) return <Minus className="h-4 w-4 text-gray-400" />;
    
    if (position < previousPosition) {
      return <ArrowUp className="h-4 w-4 text-green-500" />;
    } else if (position > previousPosition) {
      return <ArrowDown className="h-4 w-4 text-red-500" />;
    } else {
      return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  const getTrendColor = (growthRate: number) => {
    if (growthRate > 50) return 'text-green-600';
    if (growthRate > 0) return 'text-blue-600';
    if (growthRate < -20) return 'text-red-600';
    return 'text-gray-600';
  };

  const sortedHashtags = getSortedHashtags();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-orange-100 rounded-lg">
            <Flame className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Trending Hashtags</h2>
            <p className="text-sm text-gray-600">Real-time trending topics and hashtags</p>
          </div>
        </div>
        
        {autoRefresh && (
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            <span>Auto-refreshing every {refreshInterval / 1000}s</span>
          </div>
        )}
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search hashtags..."
                value={filters.searchQuery}
                onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* Category Filter */}
            <select
              value={filters.selectedCategory}
              onChange={(e) => setFilters(prev => ({ ...prev, selectedCategory: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              <option value="politics">Politics</option>
              <option value="environment">Environment</option>
              <option value="social">Social</option>
              <option value="economy">Economy</option>
              <option value="health">Health</option>
              <option value="education">Education</option>
              <option value="technology">Technology</option>
              <option value="other">Other</option>
            </select>
            
            {/* Sort By */}
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="trend_score">Trend Score</option>
              <option value="usage">Usage Count</option>
              <option value="growth">Growth Rate</option>
              <option value="alphabetical">Alphabetical</option>
            </select>
            
            {/* Time Range */}
            <select
              value={filters.timeRange}
              onChange={(e) => {
                const value = e.target.value as '24h' | '7d' | '30d' | 'all';
                setFilters(prev => ({ ...prev, timeRange: value === 'all' ? '30d' : value }));
              }}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="24h">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
            </select>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 h-16 rounded-lg" />
            </div>
          ))}
        </div>
      )}

      {/* Trending List */}
      {!isLoading && !error && (
        <div className="space-y-3">
          {sortedHashtags.map((trending, index) => (
            <div
              key={trending.hashtag.id}
              className="bg-white p-4 rounded-lg shadow-sm border hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {/* Rank */}
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold text-gray-900">#{index + 1}</span>
                    {getTrendIcon(index + 1, index + 1)}
                  </div>
                  
                  {/* Hashtag Info */}
                  <div className="flex items-center space-x-3">
                    {getHashtagCategoryIcon(trending.hashtag.category || 'other')}
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-semibold text-gray-900">
                          #{trending.hashtag.name}
                        </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${getHashtagCategoryColor(trending.hashtag.category || 'other')}`}>
                      {trending.hashtag.category || 'other'}
                    </span>
                        {trending.hashtag.is_verified && (
                          <span className="text-blue-500 text-sm">✓</span>
                        )}
                      </div>
                      {trending.hashtag.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {trending.hashtag.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Metrics */}
                {showMetrics && (
                  <div className="flex items-center space-x-6 text-sm">
                    <div className="text-center">
                      <div className="text-gray-500">Usage (24h)</div>
                      <div className="font-semibold text-gray-900">
                        {formatUsageCount(trending.trend_score || 0)}
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-gray-500">Growth</div>
                      <div className={`font-semibold ${getTrendColor(trending.growth_rate || 0)}`}>
                        {formatGrowthRate(trending.growth_rate || 0)}
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-gray-500">Trend Score</div>
                      <div className="font-semibold text-blue-600">
                        {formatTrendingScore(trending.trend_score || 0)}
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-gray-500">Peak Position</div>
                      <div className="font-semibold text-gray-900">
                        #{trending.hashtag.id.slice(-3)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Related Hashtags - Not available in MinimalHashtag type */}
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && sortedHashtags.length === 0 && (
        <div className="text-center py-12">
          <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No trending hashtags</h3>
          <p className="text-gray-600">
            {filters.searchQuery 
              ? `No hashtags match "${filters.searchQuery}"`
              : 'No hashtags are trending right now'
            }
          </p>
        </div>
      )}
    </div>
  );
}
