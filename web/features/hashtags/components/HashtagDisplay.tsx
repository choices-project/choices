/**
 * Hashtag Display Component
 * 
 * Flexible hashtag display with various layouts and interaction options
 * Supports clickable hashtags, follow/unfollow actions, and category display
 * 
 * Created: December 19, 2024
 * Status: ✅ ACTIVE
 */

'use client';

import { Hash, TrendingUp, Users, Eye, Plus, Minus, Verified } from 'lucide-react';
import React from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

import type { HashtagDisplayProps, Hashtag, HashtagCategory } from '../types';

export default function HashtagDisplay({
  hashtags,
  showCount = false,
  showCategory = false,
  clickable = true,
  onHashtagClick,
  onFollow,
  onUnfollow,
  className
}: HashtagDisplayProps) {
  // Get category color
  const getCategoryColor = (category?: HashtagCategory) => {
    if (!category) return 'bg-gray-100 text-gray-700';
    
    const colors: Record<HashtagCategory, string> = {
      politics: 'bg-red-100 text-red-700',
      civics: 'bg-blue-100 text-blue-700',
      social: 'bg-green-100 text-green-700',
      environment: 'bg-emerald-100 text-emerald-700',
      economy: 'bg-yellow-100 text-yellow-700',
      health: 'bg-pink-100 text-pink-700',
      education: 'bg-purple-100 text-purple-700',
      technology: 'bg-indigo-100 text-indigo-700',
      culture: 'bg-orange-100 text-orange-700',
      sports: 'bg-cyan-100 text-cyan-700',
      entertainment: 'bg-violet-100 text-violet-700',
      news: 'bg-slate-100 text-slate-700',
      local: 'bg-amber-100 text-amber-700',
      national: 'bg-rose-100 text-rose-700',
      international: 'bg-teal-100 text-teal-700',
      global: 'bg-blue-100 text-blue-700',
      activism: 'bg-red-100 text-red-700',
      community: 'bg-green-100 text-green-700',
      business: 'bg-purple-100 text-purple-700',
      science: 'bg-indigo-100 text-indigo-700',
      art: 'bg-pink-100 text-pink-700',
      music: 'bg-violet-100 text-violet-700',
      food: 'bg-orange-100 text-orange-700',
      travel: 'bg-cyan-100 text-cyan-700',
      fashion: 'bg-rose-100 text-rose-700',
      lifestyle: 'bg-amber-100 text-amber-700',
      custom: 'bg-gray-100 text-gray-700',
      other: 'bg-gray-100 text-gray-700'
    };
    
    return colors[category] || 'bg-gray-100 text-gray-700';
  };

  // Get category icon
  const getCategoryIcon = (category?: HashtagCategory) => {
    if (!category) return null;
    
    const icons: Record<HashtagCategory, React.ReactNode> = {
      politics: '🏛️',
      civics: '🗳️',
      social: '👥',
      environment: '🌱',
      economy: '💰',
      health: '🏥',
      education: '📚',
      technology: '💻',
      culture: '🎭',
      sports: '⚽',
      entertainment: '🎬',
      news: '📰',
      local: '🏘️',
      national: '🇺🇸',
      international: '🌍',
      global: '🌐',
      activism: '✊',
      community: '🤝',
      business: '💼',
      science: '🔬',
      art: '🎨',
      music: '🎵',
      food: '🍽️',
      travel: '✈️',
      fashion: '👗',
      lifestyle: '🌟',
      custom: '🏷️',
      other: '📌'
    };
    
    return icons[category] || '🏷️';
  };

  // Format usage count
  const formatCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  // Handle hashtag click
  const handleHashtagClick = (hashtag: Hashtag) => {
    if (clickable && onHashtagClick) {
      onHashtagClick(hashtag);
    }
  };

  // Handle follow action
  const handleFollow = (hashtag: Hashtag, e: React.MouseEvent) => {
    e.stopPropagation();
    onFollow?.(hashtag);
  };

  // Handle unfollow action
  const handleUnfollow = (hashtag: Hashtag, e: React.MouseEvent) => {
    e.stopPropagation();
    onUnfollow?.(hashtag);
  };

  // Handle remove action (using Minus icon)
  const handleRemove = (hashtag: Hashtag, e: React.MouseEvent) => {
    e.stopPropagation();
    // This could be used for removing from a list or unfollowing
    onUnfollow?.(hashtag);
  };

  if (hashtags.length === 0) {
    return (
      <div className={cn("text-sm text-muted-foreground", className)}>
        No hashtags to display
      </div>
    );
  }

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {hashtags.map((hashtag) => (
        <TooltipProvider key={hashtag.id}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Card
                className={cn(
                  "group relative transition-all duration-200",
                  clickable && "cursor-pointer hover:shadow-md hover:scale-105",
                  hashtag.is_trending && "ring-2 ring-orange-200 bg-orange-50/50",
                  hashtag.is_verified && "ring-2 ring-blue-200 bg-blue-50/50"
                )}
                onClick={() => handleHashtagClick(hashtag)}
              >
                <CardContent className="p-2">
                  <div className="flex items-center gap-2">
                    {/* Hashtag Icon */}
                    <div className="flex items-center gap-1">
                      <Hash className="h-3 w-3 text-muted-foreground" />
                      {hashtag.is_verified && (
                        <Verified className="h-3 w-3 text-blue-600" />
                      )}
                    </div>

                    {/* Hashtag Name */}
                    <span className="font-medium text-sm">
                      {hashtag.display_name || hashtag.name}
                    </span>

                    {/* Category Badge */}
                    {showCategory && hashtag.category && (
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-xs px-1.5 py-0.5",
                          getCategoryColor(hashtag.category)
                        )}
                      >
                        <span className="mr-1">
                          {getCategoryIcon(hashtag.category)}
                        </span>
                        {hashtag.category}
                      </Badge>
                    )}

                    {/* Usage Count */}
                    {showCount && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        {formatCount(hashtag.usage_count)}
                      </div>
                    )}

                    {/* Trending Indicator */}
                    {hashtag.is_trending && (
                      <div className="flex items-center gap-1 text-xs text-orange-600">
                        <TrendingUp className="h-3 w-3" />
                        <span>Trending</span>
                      </div>
                    )}

                    {/* Action Buttons */}
                    {(onFollow || onUnfollow) && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {onFollow && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={(e) => handleFollow(hashtag, e)}
                            title="Follow hashtag"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        )}
                        {onUnfollow && (
                          <>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={(e) => handleUnfollow(hashtag, e)}
                              title="Unfollow hashtag"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={(e) => handleRemove(hashtag, e)}
                              title="Remove hashtag"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  {hashtag.description && (
                    <div className="mt-1 text-xs text-muted-foreground line-clamp-2">
                      {hashtag.description}
                    </div>
                  )}

                  {/* Stats Row */}
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>{formatCount(hashtag.follower_count)} followers</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        <span>{formatCount(hashtag.usage_count)} uses</span>
                      </div>
                    </div>
                    
                    {hashtag.is_trending && (
                      <div className="flex items-center gap-1 text-orange-600">
                        <TrendingUp className="h-3 w-3" />
                        <span>Score: {hashtag.trend_score}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            
            <TooltipContent>
              <div className="space-y-1">
                <div className="font-medium">#{hashtag.name}</div>
                {hashtag.description && (
                  <div className="text-sm text-muted-foreground">
                    {hashtag.description}
                  </div>
                )}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{formatCount(hashtag.usage_count)} uses</span>
                  <span>{formatCount(hashtag.follower_count)} followers</span>
                  {hashtag.is_trending && (
                    <span className="text-orange-600">Trending</span>
                  )}
                  {hashtag.is_verified && (
                    <span className="text-blue-600">Verified</span>
                  )}
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
    </div>
  );
}
