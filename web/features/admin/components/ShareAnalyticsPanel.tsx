'use client';

import { Share2, TrendingUp, BarChart3, RefreshCw } from 'lucide-react';
import React, { useEffect, useState, useCallback } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

import { isFeatureEnabled } from '@/lib/core/feature-flags';
import { devLog } from '@/lib/utils/logger';

type ShareAnalyticsData = {
  totalShares: number;
  platformBreakdown: Record<string, number>;
  topPolls: Array<{ pollId: string; shares: number }>;
  periodDays: number;
  filters: {
    platform: string;
    pollId: string;
  };
};

type ShareAnalyticsPanelProps = {
  refreshInterval?: number;
};

export default function ShareAnalyticsPanel({ refreshInterval = 30000 }: ShareAnalyticsPanelProps) {
  const [analytics, setAnalytics] = useState<ShareAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(7);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    if (!isFeatureEnabled('SOCIAL_SHARING')) {
      setError('Social sharing is disabled');
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const params = new URLSearchParams({
        days: days.toString(),
      });
      if (selectedPlatform !== 'all') {
        params.append('platform', selectedPlatform);
      }

      const response = await fetch(`/api/share?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch share analytics: ${response.status}`);
      }

      const payload = await response.json();
      if (!payload.success || !payload.data?.analytics) {
        throw new Error('Invalid response format');
      }

      setAnalytics(payload.data.analytics);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load share analytics';
      setError(errorMessage);
      devLog('Share analytics fetch error:', { error: err });
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [days, selectedPlatform]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setLoading(true);
    await fetchAnalytics();
  }, [fetchAnalytics]);

  useEffect(() => {
    void fetchAnalytics();

    const interval = setInterval(() => {
      void fetchAnalytics();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [fetchAnalytics, refreshInterval]);

  if (!isFeatureEnabled('SOCIAL_SHARING')) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Share Analytics</CardTitle>
          <CardDescription>Social sharing feature is disabled</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (loading && !analytics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Analytics
          </CardTitle>
          <CardDescription>Loading share analytics data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && !analytics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const platformEntries = analytics
    ? Object.entries(analytics.platformBreakdown).sort((a, b) => b[1] - a[1])
    : [];
  const totalShares = analytics?.totalShares ?? 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Share Analytics
            </CardTitle>
            <CardDescription>
              Social sharing metrics for the last {analytics?.periodDays ?? days} days
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Time Period</label>
            <Select value={days.toString()} onValueChange={(value) => setDays(parseInt(value, 10))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Last 24 hours</SelectItem>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Platform</label>
            <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                <SelectItem value="twitter">Twitter</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
                <SelectItem value="reddit">Reddit</SelectItem>
                <SelectItem value="copy">Copy Link</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="telegram">Telegram</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Shares</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalShares.toLocaleString()}</p>
                </div>
                <Share2 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Platforms</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{platformEntries.length}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Top Polls</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {analytics?.topPolls.length ?? 0}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Platform Breakdown */}
        {platformEntries.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Platform Breakdown</h3>
            <div className="space-y-3">
              {platformEntries.map(([platform, count]) => {
                const percentage = totalShares > 0 ? ((count / totalShares) * 100).toFixed(1) : '0';
                return (
                  <div key={platform} className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <Badge variant="outline" className="capitalize min-w-[100px]">
                        {platform}
                      </Badge>
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-right min-w-[120px]">
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {count.toLocaleString()}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">({percentage}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Top Polls */}
        {analytics && analytics.topPolls.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Most Shared Polls</h3>
            <div className="space-y-2">
              {analytics.topPolls.map(({ pollId, shares }, index) => (
                <div
                  key={pollId}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="w-8 h-8 flex items-center justify-center">
                      {index + 1}
                    </Badge>
                    <span className="text-sm font-mono text-gray-700 dark:text-gray-300">{pollId}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Share2 className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {shares.toLocaleString()}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">shares</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {analytics && platformEntries.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Share2 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>No share data available for the selected period</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

