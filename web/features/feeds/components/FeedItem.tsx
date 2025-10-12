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

import { 
  HeartIcon, 
  ChatBubbleLeftIcon, 
  ShareIcon, 
  BookmarkIcon,
  EllipsisHorizontalIcon,
  CalendarIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import { 
  HeartIcon as HeartSolidIcon,
  BookmarkIcon as BookmarkSolidIcon
} from '@heroicons/react/24/solid';
import Image from 'next/image';
import React, { useState, useRef, useCallback } from 'react';

import type { FeedItemData } from '../types';

interface FeedItemProps {
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

export default function FeedItem({
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
}: FeedItemProps) {
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

  // Format date
  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  // Get content type icon
  const getContentTypeIcon = (type: string) => {
    const iconClass = "w-5 h-5";
    
    switch (type) {
      case 'vote':
        return <div className={`${iconClass} bg-green-100 rounded-full flex items-center justify-center`}>
          <span className="text-green-600 text-xs font-bold">V</span>
        </div>;
      case 'bill':
        return <div className={`${iconClass} bg-blue-100 rounded-full flex items-center justify-center`}>
          <span className="text-blue-600 text-xs font-bold">B</span>
        </div>;
      case 'statement':
        return <div className={`${iconClass} bg-purple-100 rounded-full flex items-center justify-center`}>
          <span className="text-purple-600 text-xs font-bold">S</span>
        </div>;
      case 'social_media':
        return <div className={`${iconClass} bg-pink-100 rounded-full flex items-center justify-center`}>
          <span className="text-pink-600 text-xs font-bold">@</span>
        </div>;
      case 'photo':
        return <div className={`${iconClass} bg-gray-100 rounded-full flex items-center justify-center`}>
          <span className="text-gray-600 text-xs font-bold">📷</span>
        </div>;
      default:
        return <div className={`${iconClass} bg-gray-100 rounded-full flex items-center justify-center`}>
          <span className="text-gray-600 text-xs font-bold">?</span>
        </div>;
    }
  };

  // Get party color
  const getPartyColor = (party: string) => {
    const partyColors: Record<string, string> = {
      'Republican': 'text-red-600 bg-red-50 border-red-200',
      'Democrat': 'text-blue-600 bg-blue-50 border-blue-200',
      'Independent': 'text-gray-600 bg-gray-50 border-gray-200',
      'Green': 'text-green-600 bg-green-50 border-green-200',
      'Libertarian': 'text-yellow-600 bg-yellow-50 border-yellow-200'
    };
    
    return partyColors[party] || 'text-gray-600 bg-gray-50 border-gray-200';
  };

  return (
    <div 
      ref={itemRef}
      className={`bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-200 hover:shadow-md ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Image
              src={item.representativePhoto}
              alt={item.representativeName}
              width={40}
              height={40}
              className="rounded-full object-cover"
            />
            <div className="absolute -bottom-1 -right-1">
              {getContentTypeIcon(item.contentType)}
            </div>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-gray-900">{item.representativeName}</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPartyColor(item.representativeParty)}`}>
                {item.representativeParty}
              </span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <MapPinIcon className="w-4 h-4" />
              <span>{item.representativeOffice}</span>
            </div>
          </div>
          
          <div className="text-right">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <CalendarIcon className="w-4 h-4" />
              <span>{formatDate(item.date)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h4 className="font-semibold text-gray-900 mb-2">{item.title}</h4>
        {item.description && (
          <div className="text-gray-600 mb-4">
            {isExpanded ? (
              <p>{item.description}</p>
            ) : (
              <p className="line-clamp-3">{item.description}</p>
            )}
            {item.description.length > 100 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-blue-500 text-sm font-medium mt-2 hover:text-blue-600"
              >
                {isExpanded ? 'Show less' : 'Show more'}
              </button>
            )}
          </div>
        )}
        
        {item.imageUrl && (
          <div className="relative mb-4">
            <Image
              src={item.imageUrl}
              alt={item.title}
              width={400}
              height={300}
              className="w-full h-64 object-cover rounded-lg"
            />
          </div>
        )}
      </div>

      {/* Engagement */}
      {showEngagement && (
        <div className="px-4 py-3 border-t border-gray-100">
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
                  {item.engagementMetrics.likes}
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
                  {item.engagementMetrics.comments}
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
                  {item.engagementMetrics.shares}
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
              
              <button
                onClick={() => setShowActions(!showActions)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="More options"
              >
                <EllipsisHorizontalIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Menu */}
      {showActions && (
        <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => {
                onViewDetails?.(item.id);
                setShowActions(false);
              }}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
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
              className="text-sm text-gray-600 hover:text-gray-700 font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
