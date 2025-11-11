'use client';

import { TrendingUp, Users, BarChart3, Hash } from 'lucide-react';
import React, { useCallback, useEffect } from 'react';

import {
  useHashtagActions,
  useHashtagAnalyticsSummary,
  useHashtagError,
  useHashtagLoading,
  useHashtagStats,
  useTrendingHashtags,
} from '@/lib/stores';
import type { HashtagStatsSummary } from '@/lib/stores/hashtagStore';

type HashtagAnalyticsProps = {
  className?: string;
  refreshInterval?: number;
};

const DEFAULT_SYSTEM_HEALTH: HashtagStatsSummary['systemHealth'] = {
  apiResponseTime: 0,
  cacheHitRate: 0,
  databasePerformance: 0,
  errorRate: 0,
};

export function HashtagAnalytics({
  className = '',
  refreshInterval = 30000, // 30 seconds
}: HashtagAnalyticsProps) {
  const trendingHashtags = useTrendingHashtags();
  const statsSummary = useHashtagAnalyticsSummary();
  const { trendingCount } = useHashtagStats();
  const { isLoading } = useHashtagLoading();
  const { error, searchError, followError, createError, hasError } = useHashtagError();
  const { getHashtagStats, getTrendingHashtags } = useHashtagActions();

  const refreshAnalytics = useCallback(async () => {
    await Promise.all([getHashtagStats(), getTrendingHashtags()]);
  }, [getHashtagStats, getTrendingHashtags]);

  useEffect(() => {
    void refreshAnalytics();

    if (refreshInterval > 0) {
      const intervalId = setInterval(() => {
        void refreshAnalytics();
      }, refreshInterval);

      return () => clearInterval(intervalId);
    }

    return undefined;
  }, [refreshAnalytics, refreshInterval]);

  const errorMessage = error ?? searchError ?? followError ?? createError ?? null;
  const loading = isLoading && !statsSummary;
  const resolvedStats: HashtagStatsSummary | null = statsSummary ?? null;
  const totalHashtags = resolvedStats?.totalHashtags ?? 0;
  const totalTrending = resolvedStats?.trendingCount ?? trendingCount;
  const verifiedCount = resolvedStats?.verifiedCount ?? 0;
  const systemHealth = resolvedStats?.systemHealth ?? DEFAULT_SYSTEM_HEALTH;
  const topTrending = trendingHashtags.slice(0, 10);

  if (loading) {
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

  const showErrorBanner = hasError && errorMessage;

  return (
    <div className={`space-y-6 ${className}`}>
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

      {showErrorBanner && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <div className="flex items-center justify-between">
            <p>{errorMessage}</p>
            <button
              type="button"
              onClick={() => void refreshAnalytics()}
              className="rounded bg-red-600 px-3 py-1 text-white hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center">
            <div className="rounded-lg bg-blue-100 p-2">
              <Hash className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Hashtags</p>
              <p className="text-2xl font-bold text-gray-900">{totalHashtags.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center">
            <div className="rounded-lg bg-orange-100 p-2">
              <TrendingUp className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Trending</p>
              <p className="text-2xl font-bold text-gray-900">{totalTrending.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center">
            <div className="rounded-lg bg-green-100 p-2">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Verified</p>
              <p className="text-2xl font-bold text-gray-900">{verifiedCount.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Trending Hashtags */}
      {topTrending.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-orange-500" />
              <h3 className="text-lg font-semibold text-gray-900">Top Trending</h3>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {topTrending.map((trending, index) => (
                <div key={trending.hashtag.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 font-bold text-orange-600">
                      {index + 1}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">#{trending.hashtag.name}</span>
                        <span className="rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-800">
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
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900">System Health</h3>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{systemHealth.apiResponseTime}ms</div>
              <div className="text-sm text-gray-600">API Response Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {systemHealth.databasePerformance}%
              </div>
              <div className="text-sm text-gray-600">Database Performance</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{systemHealth.cacheHitRate}%</div>
              <div className="text-sm text-gray-600">Cache Hit Rate</div>
            </div>
          </div>
          <div className="mt-4 text-center text-xs text-gray-500">
            Error rate {systemHealth.errorRate}%
          </div>
        </div>
      </div>
    </div>
  );
}

