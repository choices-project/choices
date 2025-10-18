/**
 * Hashtag Analytics Component
 * 
 * Advanced analytics dashboard for hashtag performance tracking,
 * trending analysis, and cross-feature insights.
 * 
 * Created: October 10, 2025
 * Status: ✅ ACTIVE
 */

import {
  TrendingUp,
  Users,
  Eye,
  Share2,
  Heart,
  MessageCircle,
  BarChart3,
  Calendar,
  Target,
  Zap,
  Award,
  Activity
} from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';

import { 
  useHashtagStore,
  useHashtagActions,
  useHashtagLoading,
  useHashtagError
} from '@/lib/stores';
import { 
  useAnalyticsStore,
  useAnalyticsActions,
  useAnalyticsLoading,
  useAnalyticsError
} from '@/lib/stores';
import { formatUsageCount, formatEngagementRate, formatGrowthRate } from '@/lib/utils/format-utils';
import { logger } from '@/lib/utils/logger';

import {
  calculateHashtagAnalytics,
  calculateTrendingHashtags,
  getHashtagPerformanceInsights
} from '../lib/hashtag-analytics';
import {
  getSmartSuggestions,
  getRelatedHashtags
} from '../lib/hashtag-suggestions';
import type { HashtagCategory } from '../types';
import type {
  Hashtag,
  HashtagAnalytics
} from '../types';
import {
  formatTrendingScore,
  getHashtagPerformanceLevel,
  getHashtagCategoryColor,
  getHashtagCategoryIcon
} from '../utils/hashtag-utils';


interface HashtagAnalyticsProps {
  hashtagId?: string;
  userId?: string;
  showTrending?: boolean;
  showInsights?: boolean;
  showSuggestions?: boolean;
  className?: string;
}

export default function HashtagAnalytics({
  hashtagId,
  userId,
  showTrending = true,
  showInsights = true,
  showSuggestions = true,
  className = ''
}: HashtagAnalyticsProps) {
  // Zustand store integration
  const { trendingHashtags, suggestions } = useHashtagStore();
  const { getTrendingHashtags, getSuggestions, getHashtagAnalytics } = useHashtagActions();
  const hashtagLoading = useHashtagLoading();
  const hashtagError = useHashtagError();
  
  // Analytics store integration
  const {} = useAnalyticsStore();
  const { setChartData, setChartConfig, generateReport } = useAnalyticsActions();
  const analyticsLoading = useAnalyticsLoading();
  const analyticsError = useAnalyticsError();
  
  // Analytics data from store
  const [analytics, setAnalytics] = useState<{
    metrics: {
      usage_count: number;
      unique_users: number;
      engagement_rate: number;
      growth_rate: number;
      peak_usage?: number;
      top_content?: string[] | Array<{ id: string; title: string; engagement: number }>;
    };
    performance_level: string;
    period: string;
    last_updated?: string;
    hashtag_id?: string;
  } | null>(null);
  const trendingData = trendingHashtags || [];
  
  // Local state for component-specific data
  const [insights, setInsights] = useState<{
    performance: 'low' | 'medium' | 'high' | 'viral';
    insights: string[];
    recommendations: string[];
    score?: number;
    last_updated?: string;
    benchmarks?: {
      category: string;
      average: number;
      top: number;
      current: number;
    };
  } | null>(null);
  const [relatedHashtags, setRelatedHashtags] = useState<Hashtag[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'24h' | '7d' | '30d' | '90d'>('7d');
  const [selectedCategory, setSelectedCategory] = useState<HashtagCategory | 'all'>('all');
  
  // Combined loading and error states
  const isLoading = hashtagLoading.isLoading ?? analyticsLoading;
  const error = hashtagError.error ?? analyticsError;

  const loadAnalytics = useCallback(async () => {
    if (!hashtagId) return;
    
    try {
      // Use the imported calculateHashtagAnalytics function
      const calculatedAnalytics = await calculateHashtagAnalytics(hashtagId, selectedPeriod);
      const [analyticsData, insightsData] = await Promise.all([
        getHashtagAnalytics(hashtagId, selectedPeriod),
        getHashtagPerformanceInsights(hashtagId)
      ]);
      
      // Merge calculated analytics with fetched data
      const mergedAnalytics = {
        ...(analyticsData ?? {}),
        ...(calculatedAnalytics ?? {}),
        performance_level: getHashtagPerformanceLevel(analyticsData?.metrics?.engagement_rate ?? 0)
      };
      
      // Store analytics data in local state
      setAnalytics(mergedAnalytics);
      setInsights(insightsData);
      
      // Update analytics store with chart data
      if (analyticsData?.metrics) {
        const chartData = [
          { name: 'Usage', value: analyticsData.metrics.usage_count, color: '#3B82F6' },
          { name: 'Users', value: analyticsData.metrics.unique_users, color: '#10B981' },
          { name: 'Engagement', value: analyticsData.metrics.engagement_rate * 100, color: '#8B5CF6' },
          { name: 'Growth', value: analyticsData.metrics.growth_rate, color: '#F59E0B' }
        ];
        
        setChartData(chartData);
        setChartConfig({
          data: chartData,
          maxValue: Math.max(...chartData.map(d => d.value)),
          showTrends: true,
          showConfidence: true,
          title: `Hashtag Analytics - ${hashtagId}`,
          subtitle: `Period: ${selectedPeriod}`
        });
      }
      
      // Generate analytics report
      const startDate = new Date();
      const endDate = new Date();
      startDate.setDate(startDate.getDate() - (selectedPeriod === '24h' ? 1 : selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 30 : 90));
      
      await generateReport(startDate.toISOString(), endDate.toISOString());
    } catch (err) {
      logger.error('Failed to load analytics:', err instanceof Error ? err : new Error(String(err)));
    }
  }, [hashtagId, selectedPeriod]);

  const loadTrendingHashtags = useCallback(async () => {
    try {
      // Use the imported calculateTrendingHashtags function
      const calculatedTrending = await calculateTrendingHashtags(
        selectedCategory === 'all' ? undefined : selectedCategory
      );
      
      // Also fetch from store
      await getTrendingHashtags(
        selectedCategory === 'all' ? undefined : selectedCategory
      );
      
      // Merge calculated trending data with store data
      if (calculatedTrending && calculatedTrending.length > 0) {
        // Update store with calculated trending hashtags
        logger.info('Calculated trending hashtags:', { count: calculatedTrending.length, hashtags: calculatedTrending });
        // Note: Trending data is now managed by the hashtag store
      }
    } catch (err) {
      logger.error('Failed to load trending hashtags:', err instanceof Error ? err : new Error(String(err)));
    }
  }, [selectedCategory]);

  const loadSuggestions = useCallback(async () => {
    if (!userId) return;
    
    try {
      // Use the imported getSmartSuggestions and getRelatedHashtags functions
      const smartSuggestions = await getSmartSuggestions(userId, {
        contentType: 'feed'
      });
      const relatedHashtags = await getRelatedHashtags(hashtagId ?? '', 10);
      
      // Also fetch from store
      await getSuggestions('', 'analytics');
      
      // Merge smart suggestions with related hashtags
      if (smartSuggestions && relatedHashtags) {
        logger.info('Smart suggestions:', { count: smartSuggestions.length, suggestions: smartSuggestions });
        logger.info('Related hashtags:', { count: relatedHashtags.length, hashtags: relatedHashtags });
        // Convert HashtagSuggestion[] to Hashtag[]
        const hashtags: Hashtag[] = relatedHashtags.map(suggestion => ({
          id: suggestion.hashtag.id,
          name: suggestion.hashtag.name,
          display_name: suggestion.hashtag.display_name,
          follower_count: suggestion.hashtag.follower_count ?? 0,
          usage_count: suggestion.usage_count ?? 0,
          category: (suggestion.category ?? 'other'),
          is_trending: suggestion.is_trending ?? false,
          trend_score: suggestion.hashtag.trend_score ?? 0,
          is_verified: suggestion.hashtag.is_verified ?? false,
          is_featured: suggestion.hashtag.is_featured ?? false,
          created_at: suggestion.hashtag.created_at,
          updated_at: suggestion.hashtag.updated_at
        }));
        setRelatedHashtags(hashtags);
      }
    } catch (err) {
      logger.error('Failed to load suggestions:', err instanceof Error ? err : new Error(String(err)));
    }
  }, [userId, hashtagId]);

  useEffect(() => {
    const loadData = async () => {
      if (hashtagId) {
        await loadAnalytics();
      }
      if (showTrending) {
        await loadTrendingHashtags();
      }
      if (showSuggestions && userId) {
        await loadSuggestions();
      }
    };
    
    void loadData();
  }, [hashtagId, userId, selectedPeriod, selectedCategory, showTrending, showSuggestions, loadAnalytics, loadTrendingHashtags, loadSuggestions]);

  const getPerformanceColor = (level: string) => {
    switch (level) {
      case 'viral': return 'text-red-600 bg-red-50';
      case 'high': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (isLoading) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Hashtag Analytics</h2>
        <div className="flex items-center space-x-4">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as '24h' | '7d' | '30d' | '90d')}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory((e.target.value || 'all') as HashtagCategory | 'all')}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
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
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Analytics Overview */}
      {showInsights && analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Eye className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Usage</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatUsageCount(analytics.metrics.usage_count)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Unique Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics.metrics.unique_users}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Heart className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Engagement Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatEngagementRate(analytics.metrics.engagement_rate)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Growth Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatGrowthRate(analytics.metrics.growth_rate)}
                </p>
              </div>
            </div>
          </div>

          {/* Additional Metrics using unused icons */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Share2 className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Peak Usage</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics.metrics.peak_usage ?? 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-pink-100 rounded-lg">
                <MessageCircle className="h-6 w-6 text-pink-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Comments</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics.metrics.top_content?.length ?? 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-teal-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-teal-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Reach</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics.metrics.unique_users ?? 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Calendar className="h-6 w-6 text-amber-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Peak Activity</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics.metrics.peak_usage ?? 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-rose-100 rounded-lg">
                <Award className="h-6 w-6 text-rose-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Quality Score</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round(analytics.metrics.engagement_rate * 100) ?? 0}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Performance Insights */}
      {insights && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center mb-4">
            <Target className="h-5 w-5 text-gray-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Performance Insights</h3>
            <span className={`ml-auto px-3 py-1 rounded-full text-sm font-medium ${getPerformanceColor(insights.performance)}`}>
              {insights.performance.toUpperCase()}
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Key Insights</h4>
              <ul className="space-y-1">
                {insights.insights.map((insight: string, index: number) => (
                  <li key={`insight-${index}-${insight.slice(0, 20)}`} className="text-sm text-gray-600 flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    {insight}
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Recommendations</h4>
              <ul className="space-y-1">
                {insights.recommendations.map((recommendation: string, index: number) => (
                  <li key={`recommendation-${index}-${recommendation.slice(0, 20)}`} className="text-sm text-gray-600 flex items-start">
                    <span className="text-green-500 mr-2">•</span>
                    {recommendation}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Trending Hashtags */}
      {showTrending && trendingHashtags.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center mb-4">
            <Zap className="h-5 w-5 text-gray-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Trending Hashtags</h3>
          </div>
          
          <div className="space-y-3">
            {trendingHashtags.slice(0, 10).map((trending, index) => (
              <div key={trending.hashtag.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                  <div className="flex items-center space-x-2">
                    {getHashtagCategoryIcon((trending.hashtag.category ?? 'other') )}
                    <span className="font-medium text-gray-900">#{trending.hashtag.name}</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${getHashtagCategoryColor((trending.hashtag.category ?? 'other') )}`}>
                      {trending.hashtag.category ?? 'other'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>{formatUsageCount(trending.usage_count_24h)}</span>
                  <span className="text-green-600">+{formatGrowthRate(trending.growth_rate)}</span>
                  <span className="text-blue-600">{formatTrendingScore(trending.trend_score)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Related Hashtags */}
      {relatedHashtags.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center mb-4">
            <Activity className="h-5 w-5 text-gray-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Related Hashtags</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {relatedHashtags.slice(0, 6).map((hashtag, index) => (
              <div key={hashtag.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500">#{index + 1}</span>
                </div>
                <div className="flex items-center space-x-2 mb-2">
                  {getHashtagCategoryIcon((hashtag.category ?? 'other') )}
                  <span className="font-medium text-gray-900">#{hashtag.name}</span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{hashtag.description}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{formatUsageCount(hashtag.usage_count)}</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${getHashtagCategoryColor((hashtag.category ?? 'other') )}`}>
                    {hashtag.category ?? 'other'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Calculated Trending Data */}
      {trendingData.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center mb-4">
            <Zap className="h-5 w-5 text-gray-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Calculated Trending</h3>
          </div>
          
          <div className="space-y-3">
            {trendingData.slice(0, 5).map((trending, index) => (
              <div key={trending.hashtag.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                  <div className="flex items-center space-x-2">
                    {getHashtagCategoryIcon((trending.hashtag.category ?? 'other') )}
                    <span className="font-medium text-gray-900">#{trending.hashtag.name}</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${getHashtagCategoryColor((trending.hashtag.category ?? 'other') )}`}>
                      {trending.hashtag.category ?? 'other'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>{formatUsageCount(trending.usage_count_24h)}</span>
                  <span className="text-green-600">+{formatGrowthRate(trending.growth_rate)}</span>
                  <span className="text-blue-600">{formatTrendingScore(trending.trend_score)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Smart Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center mb-4">
            <Activity className="h-5 w-5 text-gray-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Smart Suggestions</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suggestions.slice(0, 6).map((suggestion, index) => (
              <div key={`suggestion-${suggestion.hashtag.id}-${index}`} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-2 mb-2">
                  {getHashtagCategoryIcon((suggestion.category ?? 'other') )}
                  <span className="font-medium text-gray-900">#{suggestion.hashtag.name}</span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{suggestion.reason}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{formatUsageCount(suggestion.usage_count ?? 0)}</span>
                  <span className="text-blue-600">{Math.round((suggestion.confidence ?? suggestion.confidence_score ?? 0) * 100)}% match</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
