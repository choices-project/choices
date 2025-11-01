'use client';

import { TrendingUp, Users, BarChart3, Hash } from 'lucide-react';
import React, { useState, useEffect } from 'react';


import { getHashtagStats, getTrendingHashtags } from '../lib/hashtag-service';
import type { TrendingHashtag } from '../types';

// Local type definition
type HashtagStatsResponse = {
  totalHashtags: number;
  trendingHashtags: TrendingHashtag[];
  categoryBreakdown: Record<string, number>;
  userEngagement: Record<string, number>;
  viralPotential: TrendingHashtag[];
  verified_count?: number;
  system_health?: {
    api_response_time: number;
    cache_hit_rate: number;
    error_rate: number;
  };
}

type HashtagAnalyticsProps = {
  className?: string;
  refreshInterval?: number;
}

export function HashtagAnalytics({ 
  className = "",
  refreshInterval = 30000 // 30 seconds
}: HashtagAnalyticsProps) {
  const [stats, setStats] = useState<HashtagStatsResponse | null>(null);
  const [trendingHashtags, setTrendingHashtags] = useState<TrendingHashtag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [statsResult, trendingResult] = await Promise.all([
        getHashtagStats(),
        getTrendingHashtags('politics', 5)
      ]);

      if (statsResult.success && statsResult.data) {
        setStats(statsResult.data);
      }

      if (trendingResult.success && trendingResult.data) {
        setTrendingHashtags(trendingResult.data);
      }
    } catch (err) {
      setError('Failed to load analytics data');
      console.error('Analytics fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    
    if (refreshInterval > 0) {
      const interval = setInterval(fetchAnalytics, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval]);

  if (isLoading) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="text-center text-red-600">
          <p>{error}</p>
          <button 
            onClick={fetchAnalytics}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Hashtag Analytics</h2>
          <p className="text-gray-600">Real-time hashtag performance metrics</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span>Live data</span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Hash className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Hashtags</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalHashtags.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Trending</p>
              <p className="text-2xl font-bold text-gray-900">{stats.trendingHashtags.length.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Verified</p>
              <p className="text-2xl font-bold text-gray-900">{(stats.verified_count || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Trending Hashtags */}
      {trendingHashtags.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-orange-500" />
              <h3 className="text-lg font-semibold text-gray-900">Top Trending</h3>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {trendingHashtags.map((trending, index) => (
                <div key={trending.hashtag.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-8 h-8 bg-orange-100 text-orange-600 rounded-full font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">
                          #{trending.hashtag.name}
                        </span>
                        <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">
                          +{trending.growth_rate.toFixed(1)}%
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {trending.hashtag.usage_count.toLocaleString()} uses
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-orange-600">
                      {trending.trend_score.toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-500">trend score</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* System Health */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900">System Health</h3>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {stats.system_health?.api_response_time || 0}ms
              </div>
              <div className="text-sm text-gray-600">API Response Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {stats.system_health?.cache_hit_rate || 0}%
              </div>
              <div className="text-sm text-gray-600">Database Performance</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {stats.system_health?.error_rate || 0}%
              </div>
              <div className="text-sm text-gray-600">Cache Hit Rate</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
