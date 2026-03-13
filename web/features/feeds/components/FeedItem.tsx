/**
 * Enhanced Feed Item Component
 * 
 * Individual feed item with Instagram-like interactions
 * Features:
 * - Touch gesture support
 * - Progressive disclosure
 * - Engagement metrics
 * - Accessibility compliance
 * - Performance optimizations
 */

'use client';

/// <reference types="node" />

import { 
  Heart, 
  MessageSquare, 
  Share2, 
  Bookmark,
  MoreHorizontal,
  Calendar,
  MapPin
} from 'lucide-react';
import Image from 'next/image';
import React, { useState, useRef, useCallback, memo, useLayoutEffect } from 'react';

import type { FeedItemData } from '@/features/civics/lib/types/civics-types';

import { AVATAR_BLUR_DATA_URL, DEFAULT_BLUR_DATA_URL } from '@/lib/constants/image';

type FeedItemProps = {
  item: FeedItemData;
  onLike?: (itemId: string) => void;
  onShare?: (itemId: string) => void;
  onBookmark?: (itemId: string) => void;
  onComment?: (itemId: string) => void;
  onViewDetails?: (itemId: string) => void;
  isLiked?: boolean;
  isBookmarked?: boolean;
  showEngagement?: boolean;
  enableHaptics?: boolean;
  className?: string;
}

const FeedItem = memo(({
  item,
  onLike,
  onShare,
  onBookmark,
  onComment,
  onViewDetails,
  isLiked = false,
  isBookmarked = false,
  showEngagement = true,
  enableHaptics = false,
  className = ''
}: FeedItemProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const itemRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Touch gesture handling
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (touch) {
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now()
      };
    }

    // Long press detection
    longPressTimerRef.current = setTimeout(() => {
      if (enableHaptics && 'vibrate' in navigator) {
        navigator.vibrate(50); // Short haptic feedback
      }
      setShowActions(true);
    }, 500);
  }, [enableHaptics]);

  const handleTouchMove = useCallback((_e: React.TouchEvent) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  // Engagement handlers
  const handleLike = useCallback(() => {
    if (isLoading) return;
    
    setIsLoading(true);
    if (enableHaptics && 'vibrate' in navigator) {
      navigator.vibrate(25); // Light haptic feedback
    }
    onLike?.(item.id);
    setTimeout(() => setIsLoading(false), 200);
  }, [item.id, onLike, enableHaptics, isLoading]);

  const handleShare = useCallback(() => {
    if (isLoading) return;
    
    setIsLoading(true);
    if (enableHaptics && 'vibrate' in navigator) {
      navigator.vibrate(25);
    }
    onShare?.(item.id);
    setTimeout(() => setIsLoading(false), 200);
  }, [item.id, onShare, enableHaptics, isLoading]);

  const handleBookmark = useCallback(() => {
    if (isLoading) return;
    
    setIsLoading(true);
    if (enableHaptics && 'vibrate' in navigator) {
      navigator.vibrate(25);
    }
    onBookmark?.(item.id);
    setTimeout(() => setIsLoading(false), 200);
  }, [item.id, onBookmark, enableHaptics, isLoading]);

  const handleComment = useCallback(() => {
    if (isLoading) return;
    
    setIsLoading(true);
    if (enableHaptics && 'vibrate' in navigator) {
      navigator.vibrate(25);
    }
    onComment?.(item.id);
    setTimeout(() => setIsLoading(false), 200);
  }, [item.id, onComment, enableHaptics, isLoading]);

  const handleHashtagClick = useCallback((tag: string) => {
    if (isLoading) return;
    
    setIsLoading(true);
    if (enableHaptics && 'vibrate' in navigator) {
      navigator.vibrate(25);
    }
    
    // Simulate hashtag follow/unfollow
    setTimeout(() => {
      setIsLoading(false);
      // Announce to screen reader
      if (typeof window !== 'undefined' && window.document) {
        const liveRegion = document.getElementById('live-region-content');
        if (liveRegion) {
          liveRegion.textContent = `Followed hashtag ${tag}`;
        }
      }
    }, 500);
  }, [enableHaptics, isLoading]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (!touchStartRef.current) return;

    const touch = e.changedTouches[0];
    if (touch) {
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      const deltaTime = Date.now() - touchStartRef.current.time;

      // Swipe detection
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50 && deltaTime < 300) {
        if (deltaX > 0) {
          // Swipe right - like
          handleLike();
        } else {
          // Swipe left - share
          handleShare();
        }
      } else if (deltaTime < 200) {
        // Quick tap - toggle expansion
        setIsExpanded(!isExpanded);
      }
    }

    touchStartRef.current = null;
  }, [isExpanded, handleLike, handleShare]);

  // Track if component is mounted to prevent hydration mismatch from date formatting
  // CRITICAL: Use function initializer to ensure stable initial state
  const [isMounted, setIsMounted] = useState(() => false);
  
  // Use useLayoutEffect to ensure state update happens after initial render
  // This prevents hydration mismatches by ensuring the initial render always matches
  useLayoutEffect(() => {
    setIsMounted(true);
  }, []);

  // Format date - handle both Date objects and date strings with null safety
  // CRITICAL: Guard toLocaleDateString() to prevent hydration mismatch
  const formatDate = (date: Date | string | null | undefined) => {
    // #region agent log
    const log = (_message: string, _data: Record<string, unknown>, _hypothesisId: string) => {
      // Debug logging removed for production
    };
    // #endregion
    
    if (!date) {
      log('formatDate: no date', { date, isMounted }, 'A');
      return 'Unknown date';
    }
    
    // During SSR/initial render, use stable format
    if (!isMounted) {
      try {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        if (!dateObj || isNaN(dateObj.getTime())) {
          log('formatDate: invalid date', { date, isMounted }, 'A');
          return 'Invalid date';
        }
        // Use stable format that doesn't depend on locale
        const year = dateObj.getFullYear();
        const month = dateObj.getMonth() + 1;
        const day = dateObj.getDate();
        const formatted = `${month}/${day}/${year}`;
        log('formatDate: SSR/initial format', { date, formatted, isMounted }, 'A');
        return formatted;
      } catch (e) {
        log('formatDate: SSR error', { date, error: e instanceof Error ? e.message : String(e), isMounted }, 'A');
        return 'Invalid date';
      }
    }
    
    const now = new Date();
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Check if dateObj is valid
    if (!dateObj || isNaN(dateObj.getTime())) {
      log('formatDate: invalid dateObj', { date, isMounted }, 'A');
      return 'Invalid date';
    }
    
    const diffInHours = Math.floor((now.getTime() - dateObj.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      log('formatDate: Just now', { date, diffInHours, isMounted }, 'A');
      return 'Just now';
    }
    if (diffInHours < 24) {
      const formatted = `${diffInHours}h ago`;
      log('formatDate: hours ago', { date, diffInHours, formatted, isMounted }, 'A');
      return formatted;
    }
    if (diffInHours < 48) {
      log('formatDate: Yesterday', { date, diffInHours, isMounted }, 'A');
      return 'Yesterday';
    }
    const formatted = new Date(date).toLocaleDateString();
    log('formatDate: toLocaleDateString', { date, formatted, isMounted }, 'A');
    return formatted;
  };

  // Get content type icon
  const getContentTypeIcon = (type: string) => {
    const iconClass = "w-5 h-5";
    
    switch (type) {
      case 'vote':
        return <div className={`${iconClass} bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center`}>
          <span className="text-green-600 text-xs font-bold">V</span>
        </div>;
      case 'bill':
        return <div className={`${iconClass} bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center`}>
          <span className="text-blue-600 text-xs font-bold">B</span>
        </div>;
      case 'statement':
        return <div className={`${iconClass} bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center`}>
          <span className="text-purple-600 text-xs font-bold">S</span>
        </div>;
      case 'social_media':
        return <div className={`${iconClass} bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center`}>
          <span className="text-pink-600 text-xs font-bold">@</span>
        </div>;
      case 'photo':
        return <div className={`${iconClass} bg-muted rounded-full flex items-center justify-center`}>
          <span className="text-muted-foreground text-xs font-bold">📷</span>
        </div>;
      default:
        return <div className={`${iconClass} bg-muted rounded-full flex items-center justify-center`}>
          <span className="text-muted-foreground text-xs font-bold">?</span>
        </div>;
    }
  };

  // Get party color
  const getPartyColor = (party: string) => {
    const partyColors: Record<string, string> = {
      'Republican': 'text-red-600 bg-red-50 dark:bg-red-900/20 border-red-200',
      'Democrat': 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 border-blue-200',
      'Independent': 'text-gray-600 bg-gray-50 dark:bg-gray-800 border-gray-200',
      'Green': 'text-green-600 bg-green-50 border-green-200',
      'Libertarian': 'text-yellow-600 bg-yellow-50 border-yellow-200'
    };
    
    return partyColors[party] ?? 'text-gray-600 bg-gray-50 dark:bg-gray-800 border-gray-200';
  };

  return (
    <div 
      ref={itemRef}
      data-testid="feed-item"
      className={`bg-card rounded-2xl shadow-sm border border-border overflow-hidden transition-all duration-200 hover:shadow-md ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="relative">
            {item.representativePhoto ? (
              <Image
                src={item.representativePhoto}
                alt={item.representativeName}
                width={40}
                height={40}
                placeholder="blur"
                blurDataURL={AVATAR_BLUR_DATA_URL}
                className="rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                <span className="text-muted-foreground text-sm font-medium">
                  {item.representativeName?.charAt(0) || '?'}
                </span>
              </div>
            )}
            <div className="absolute -bottom-1 -right-1">
              {getContentTypeIcon(item.contentType)}
            </div>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-foreground">{item.representativeName}</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPartyColor(item.representativeParty)}`}>
                {item.representativeParty}
              </span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>{item.representativeOffice}</span>
            </div>
          </div>
          
          <div className="text-right">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(item.date)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h4 className="font-semibold text-foreground mb-2">{item.title}</h4>
        {item.description && (
          <div className="text-foreground/80 mb-4">
            {isExpanded ? (
              <p>{item.description}</p>
            ) : (
              <p className="line-clamp-3">{item.description}</p>
            )}
            {item.description.length > 100 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-primary text-sm font-medium mt-2 hover:text-primary/90"
              >
                {isExpanded ? 'Show less' : 'Show more'}
              </button>
            )}
          </div>
        )}
        
        {item.imageUrl && item.imageUrl.trim() !== '' && (
          <div className="relative mb-4">
            <Image
              src={item.imageUrl}
              alt={item.title}
              width={400}
              height={300}
              placeholder="blur"
              blurDataURL={DEFAULT_BLUR_DATA_URL}
              sizes="(max-width: 640px) 100vw, 400px"
              className="w-full h-64 object-cover rounded-lg"
            />
          </div>
        )}
        
        {/* Hashtags */}
        {(item as any).tags && (item as any).tags.length > 0 && (
          <div className="px-4 py-2">
            <div className="flex flex-wrap gap-2">
              {(item as any).tags.map((tag: string, index: number) => (
                <button
                  key={index}
                  onClick={() => handleHashtagClick(tag)}
                  className="text-primary hover:text-primary/90 text-sm font-medium hover:underline"
                  aria-label={`Click hashtag ${tag}`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Engagement */}
      {showEngagement && (
        <div className="px-4 py-3 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <button
                onClick={handleLike}
                disabled={isLoading}
                className={`flex items-center space-x-2 transition-colors ${
                  isLiked 
                    ? 'text-red-500' 
                    : 'text-muted-foreground hover:text-red-500'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                aria-label={`${isLiked ? 'Unlike' : 'Like'} ${item.title}`}
              >
                {isLiked ? (
                  <Heart className="w-5 h-5" fill="currentColor" />
                ) : (
                  <Heart className="w-5 h-5" />
                )}
                <span className="text-sm font-medium text-foreground">
                  {item.engagementMetrics?.likes ?? 0}
                </span>
              </button>
              
              <button
                onClick={handleComment}
                disabled={isLoading}
                className={`flex items-center space-x-2 text-muted-foreground hover:text-primary transition-colors ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                aria-label={`Comment on ${item.title}`}
              >
                <MessageSquare className="w-5 h-5" />
                <span className="text-sm font-medium text-foreground">
                  {item.engagementMetrics?.comments ?? 0}
                </span>
              </button>
              
              <button
                onClick={handleShare}
                disabled={isLoading}
                data-testid="share-button"
                className={`flex items-center space-x-2 text-muted-foreground hover:text-green-500 transition-colors ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                aria-label={`Share ${item.title}`}
              >
                <Share2 className="w-5 h-5" />
                <span className="text-sm font-medium" data-testid="share-count">
                  {item.engagementMetrics?.shares ?? 0}
                </span>
              </button>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={handleBookmark}
                disabled={isLoading}
                className={`transition-colors ${
                  isBookmarked 
                    ? 'text-primary' 
                    : 'text-muted-foreground hover:text-primary'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                aria-label={`${isBookmarked ? 'Remove from' : 'Add to'} bookmarks`}
              >
                {isBookmarked ? (
                  <Bookmark className="w-5 h-5" fill="currentColor" />
                ) : (
                  <Bookmark className="w-5 h-5" />
                )}
              </button>
              
              <button
                onClick={() => setShowActions(!showActions)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="More options"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Menu */}
      {showActions && (
        <div className="px-4 py-2 border-t border-border bg-muted">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => {
                onViewDetails?.(item.id);
                setShowActions(false);
              }}
              className="text-sm text-primary hover:text-primary/90 font-medium"
            >
              View Details
            </button>
            <button
              onClick={() => {
                handleShare();
                setShowActions(false);
              }}
              className="text-sm text-green-600 hover:text-green-700 font-medium"
            >
              Share
            </button>
            <button
              onClick={() => setShowActions(false)}
              className="text-sm text-muted-foreground hover:text-foreground font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

export default FeedItem;
