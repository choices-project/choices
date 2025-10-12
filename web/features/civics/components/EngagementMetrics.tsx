/**
 * Enhanced Engagement Metrics Component
 * 
 * Advanced engagement tracking with analytics
 * Features:
 * - Real-time metrics
 * - Engagement history
 * - Social proof
 * - Performance analytics
 * - Accessibility compliance
 */

'use client';

import { 
  HeartIcon, 
  ChatBubbleLeftIcon, 
  ShareIcon, 
  BookmarkIcon,
  ChartBarIcon,
  EyeIcon,
  ClockIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';
import { 
  HeartIcon as HeartSolidIcon,
  BookmarkIcon as BookmarkSolidIcon
} from '@heroicons/react/24/solid';
import React, { useState, useEffect, useCallback } from 'react';

import { withOptional } from '@/lib/utils/objects';

import type { EngagementData } from '../lib/types/civics-types';

interface EngagementMetricsProps {
  itemId: string;
  initialMetrics: EngagementData;
  onEngagement?: (action: string, itemId: string, value: number) => void;
  showAnalytics?: boolean;
  showTrending?: boolean;
  enableHaptics?: boolean;
  className?: string;
}

export default function EngagementMetrics({
  itemId,
  initialMetrics,
  onEngagement,
  showAnalytics = false,
  showTrending = false,
  enableHaptics = false,
  className = ''
}: EngagementMetricsProps) {
  const [metrics, setMetrics] = useState<EngagementData>(initialMetrics);
  const [isLoading, setIsLoading] = useState(false);
  const [engagementHistory, setEngagementHistory] = useState<number[]>([]);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Load engagement history
  useEffect(() => {
    // Simulate loading engagement history
    const history = Array.from({ length: 7 }, () => 
      Math.floor(Math.random() * 100) + metrics.likes
    );
    setEngagementHistory(history);
  }, [metrics.likes]);

  // Handle engagement actions
  const handleEngagement = useCallback(async (
    action: string, 
    currentValue: number, 
    isActive: boolean
  ) => {
    if (isLoading) return;

    setIsLoading(true);
    
    if (enableHaptics && 'vibrate' in navigator) {
      navigator.vibrate(25);
    }

    try {
      const newValue = isActive ? currentValue - 1 : currentValue + 1;
      
      setMetrics(prev => withOptional(prev, {
        [action]: newValue,
        lastUpdated: new Date()
      }));

      // Update engagement history
      setEngagementHistory(prev => {
        const newHistory = [...prev];
        newHistory[newHistory.length - 1] = newValue;
        return newHistory;
      });

      onEngagement?.(action, itemId, newValue);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 200));
    } finally {
      setIsLoading(false);
    }
  }, [itemId, onEngagement, enableHaptics, isLoading]);

  const handleLike = useCallback(() => {
    handleEngagement('likes', metrics.likes, isLiked);
    setIsLiked(!isLiked);
  }, [handleEngagement, metrics.likes, isLiked]);

  const handleBookmark = useCallback(() => {
    handleEngagement('bookmarks', metrics.bookmarks, isBookmarked);
    setIsBookmarked(!isBookmarked);
  }, [handleEngagement, metrics.bookmarks, isBookmarked]);

  const handleShare = useCallback(() => {
    handleEngagement('shares', metrics.shares, false);
  }, [handleEngagement, metrics.shares]);

  const handleComment = useCallback(() => {
    handleEngagement('comments', metrics.comments, false);
  }, [handleEngagement, metrics.comments]);

  // Format numbers
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Get engagement rate color
  const getEngagementRateColor = (rate: number) => {
    if (rate >= 5) return 'text-green-600';
    if (rate >= 2) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Get trending indicator
  const getTrendingIndicator = () => {
    if (engagementHistory.length < 2) return null;
    
    const current = engagementHistory[engagementHistory.length - 1];
    const previous = engagementHistory[engagementHistory.length - 2];
    if (current === undefined || previous === undefined || previous === 0) return null;
    const change = ((current - previous) / previous) * 100;
    
    if (change > 10) return { direction: 'up', change: Math.abs(change) };
    if (change < -10) return { direction: 'down', change: Math.abs(change) };
    return null;
  };

  const trending = getTrendingIndicator();

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Engagement Metrics */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <button
            onClick={handleLike}
            disabled={isLoading}
            className={`flex items-center space-x-2 transition-colors ${
              isLiked 
                ? 'text-red-500' 
                : 'text-gray-500 hover:text-red-500'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-label={`${isLiked ? 'Unlike' : 'Like'} this post`}
          >
            {isLiked ? (
              <HeartSolidIcon className="w-5 h-5" />
            ) : (
              <HeartIcon className="w-5 h-5" />
            )}
            <span className="text-sm font-medium">
              {formatNumber(metrics.likes)}
            </span>
          </button>
          
          <button
            onClick={handleComment}
            disabled={isLoading}
            className={`flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-colors ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            aria-label="Comment on this post"
          >
            <ChatBubbleLeftIcon className="w-5 h-5" />
            <span className="text-sm font-medium">
              {formatNumber(metrics.comments)}
            </span>
          </button>
          
          <button
            onClick={handleShare}
            disabled={isLoading}
            className={`flex items-center space-x-2 text-gray-500 hover:text-green-500 transition-colors ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            aria-label="Share this post"
          >
            <ShareIcon className="w-5 h-5" />
            <span className="text-sm font-medium">
              {formatNumber(metrics.shares)}
            </span>
          </button>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleBookmark}
            disabled={isLoading}
            className={`transition-colors ${
              isBookmarked 
                ? 'text-blue-500' 
                : 'text-gray-500 hover:text-blue-500'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-label={`${isBookmarked ? 'Remove from' : 'Add to'} bookmarks`}
          >
            {isBookmarked ? (
              <BookmarkSolidIcon className="w-5 h-5" />
            ) : (
              <BookmarkIcon className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Analytics Section */}
      {showAnalytics && (
        <div className="border-t border-gray-100 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1 text-sm text-gray-500">
                <EyeIcon className="w-4 h-4" />
                <span>Views</span>
              </div>
              <p className="text-lg font-semibold text-gray-900">
                {formatNumber(metrics.views || 0)}
              </p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1 text-sm text-gray-500">
                <ChartBarIcon className="w-4 h-4" />
                <span>Engagement</span>
              </div>
              <p className={`text-lg font-semibold ${
                metrics.engagementRate 
                  ? getEngagementRateColor(metrics.engagementRate)
                  : 'text-gray-900'
              }`}>
                {metrics.engagementRate ? `${metrics.engagementRate.toFixed(1)}%` : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Trending Section */}
      {showTrending && trending && (
        <div className="border-t border-gray-100 pt-4">
          <div className="flex items-center justify-center space-x-2">
            <ArrowTrendingUpIcon className={`w-4 h-4 ${
              trending.direction === 'up' ? 'text-green-500' : 'text-red-500'
            }`} />
            <span className={`text-sm font-medium ${
              trending.direction === 'up' ? 'text-green-600' : 'text-red-600'
            }`}>
              {trending.direction === 'up' ? 'Trending up' : 'Trending down'} {trending.change.toFixed(1)}%
            </span>
          </div>
        </div>
      )}

      {/* Last Updated */}
      <div className="flex items-center justify-center space-x-1 text-xs text-gray-400">
        <ClockIcon className="w-3 h-3" />
        <span>
          Updated {new Date(metrics.lastUpdated).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}
