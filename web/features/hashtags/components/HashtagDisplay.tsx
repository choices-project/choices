'use client';

import { Hash, TrendingUp, Users, MessageSquare, Star, Verified } from 'lucide-react';
import React from 'react';

// React import not needed for this component

import type { Hashtag, TrendingHashtag } from '../types';

type HashtagDisplayProps = {
  hashtags: Hashtag[];
  showStats?: boolean;
  showTrending?: boolean;
  maxDisplay?: number;
  className?: string;
  onHashtagClick?: (hashtag: Hashtag) => void;
  showCount?: boolean;
  showCategory?: boolean;
  clickable?: boolean;
  onFollow?: (hashtag: Hashtag) => Promise<void>;
  onUnfollow?: (hashtag: Hashtag) => Promise<void>;
}

export function HashtagDisplay({
  hashtags,
  showStats = true,
  showTrending: _showTrending = true,
  maxDisplay = 10,
  className = "",
  onHashtagClick,
  showCount: _showCount = true,
  showCategory: _showCategory = true,
  clickable: _clickable = true,
  onFollow: _onFollow,
  onUnfollow: _onUnfollow
}: HashtagDisplayProps) {
  const displayHashtags = hashtags.slice(0, maxDisplay);
  const remainingCount = hashtags.length - maxDisplay;

  const getHashtagIcon = (hashtag: Hashtag) => {
    if (hashtag.is_verified) return <Verified className="h-3 w-3 text-blue-500" />;
    if (hashtag.is_trending) return <TrendingUp className="h-3 w-3 text-orange-500" />;
    if (hashtag.is_featured) return <Star className="h-3 w-3 text-yellow-500" />;
    return <Hash className="h-3 w-3 text-gray-400" />;
  };

  const getHashtagBadges = (hashtag: Hashtag) => {
    const badges = [];
    if (hashtag.is_verified) badges.push('verified');
    if (hashtag.is_trending) badges.push('trending');
    if (hashtag.is_featured) badges.push('featured');
    return badges;
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {displayHashtags.map((hashtag) => (
        <button
          key={hashtag.id}
          type="button"
          onClick={() => onHashtagClick?.(hashtag)}
          className="w-full text-left group flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <div className="flex items-center space-x-3">
            {getHashtagIcon(hashtag)}
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-900">
                  #{hashtag.name}
                </span>
                {getHashtagBadges(hashtag).map((badge) => (
                  <span
                    key={badge}
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      badge === 'verified' 
                        ? 'bg-blue-100 text-blue-800'
                        : badge === 'trending'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {badge}
                  </span>
                ))}
              </div>
              {hashtag.description && (
                <p className="text-sm text-gray-600 mt-1">{hashtag.description}</p>
              )}
            </div>
          </div>

          {showStats && (
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <Users className="h-4 w-4" />
                <span>{(hashtag.follower_count ?? 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center space-x-1">
                <MessageSquare className="h-4 w-4" />
                <span>{hashtag.usage_count.toLocaleString()}</span>
              </div>
              {hashtag.is_trending && (
                <div className="flex items-center space-x-1 text-orange-500">
                  <TrendingUp className="h-4 w-4" />
                  <span>{(hashtag.trend_score ?? 0).toFixed(1)}</span>
                </div>
              )}
            </div>
          )}
        </button>
      ))}

      {remainingCount > 0 && (
        <div className="text-center py-2">
          <span className="text-sm text-gray-500">
            +{remainingCount} more hashtag{remainingCount !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  );
}

type TrendingHashtagDisplayProps = {
  trendingHashtags: TrendingHashtag[];
  showGrowth?: boolean;
  maxDisplay?: number;
  className?: string;
  onHashtagClick?: (hashtag: Hashtag) => void;
}

export function TrendingHashtagDisplay({
  trendingHashtags,
  showGrowth = true,
  maxDisplay = 5,
  className = "",
  onHashtagClick
}: TrendingHashtagDisplayProps) {
  const displayHashtags = trendingHashtags.slice(0, maxDisplay);

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center space-x-2 mb-4">
        <TrendingUp className="h-5 w-5 text-orange-500" />
        <h3 className="text-lg font-semibold text-gray-900">Trending Hashtags</h3>
      </div>

      {displayHashtags.map((trending, index) => (
        <button
          key={trending.hashtag.id}
          type="button"
          onClick={() => onHashtagClick?.(trending.hashtag)}
          className="w-full text-left group flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg hover:border-orange-300 hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
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
                  #{index + 1} trending
                </span>
              </div>
              <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                <span>{trending.hashtag.usage_count.toLocaleString()} uses</span>
                <span>{(trending.hashtag.follower_count ?? 0).toLocaleString()} followers</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-orange-600">
              {trending.trend_score.toFixed(1)}
            </div>
            {showGrowth && (
              <div className="flex items-center space-x-1 text-sm text-gray-500">
                <TrendingUp className="h-3 w-3" />
                <span>+{trending.growth_rate.toFixed(1)}%</span>
              </div>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
