/**
 * Civics 2.0 Social Feed Component
 * 
 * Instagram-like social feed for civic content
 * Features:
 * - Infinite scroll
 * - Pull-to-refresh
 * - Touch interactions
 * - Personalized content
 * - Engagement metrics
 * - Real-time updates
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { 
  HeartIcon, 
  ChatBubbleLeftIcon, 
  ShareIcon, 
  BookmarkIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';
import { 
  HeartIcon as HeartSolidIcon,
  BookmarkIcon as BookmarkSolidIcon
} from '@heroicons/react/24/solid';

type FeedItem = {
  id: string;
  representativeId: string;
  representativeName: string;
  representativeParty: string;
  representativeOffice: string;
  representativePhoto: string;
  contentType: 'vote' | 'bill' | 'statement' | 'social_media' | 'photo';
  title: string;
  description?: string;
  imageUrl?: string;
  url?: string;
  date: Date;
  engagementMetrics: {
    likes: number;
    shares: number;
    comments: number;
    bookmarks: number;
  };
  isPublic: boolean;
  metadata: Record<string, any>;
}

type SocialFeedProps = {
  userId?: string;
  preferences?: UserPreferences;
  onLike?: (itemId: string) => void;
  onShare?: (itemId: string) => void;
  onBookmark?: (itemId: string) => void;
  onComment?: (itemId: string) => void;
  className?: string;
}

type UserPreferences = {
  state?: string;
  district?: string;
  interests?: string[];
  followedRepresentatives?: string[];
  feedPreferences?: {
    showVotes: boolean;
    showBills: boolean;
    showStatements: boolean;
    showSocialMedia: boolean;
    showPhotos: boolean;
  };
}

export default function SocialFeed({
  userId,
  preferences,
  onLike,
  onShare,
  onBookmark,
  onComment,
  className = ''
}: SocialFeedProps) {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());
  const [bookmarkedItems, setBookmarkedItems] = useState<Set<string>>(new Set());
  
  const feedRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastItemRef = useRef<HTMLDivElement>(null);
  
  // Touch gesture handling
  const [touchStart, setTouchStart] = useState<{ y: number } | null>(null);
  const [, setTouchEnd] = useState<{ y: number } | null>(null);
  const [pullDistance, setPullDistance] = useState(0);

  // Load initial feed
  useEffect(() => {
    loadFeedItems(1, true);
  }, [userId, preferences]);

  // Set up infinite scroll
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !isLoading) {
          loadFeedItems(page + 1, false);
        }
      },
      { threshold: 0.1 }
    );

    if (lastItemRef.current) {
      observerRef.current.observe(lastItemRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [page, hasMore, isLoading]);

  // Load feed items
  const loadFeedItems = async (pageNum: number, isRefresh: boolean = false) => {
    if (isLoading) return;

    setIsLoading(true);
    if (isRefresh) {
      setIsRefreshing(true);
    }

    try {
      const response = await fetch(`/api/v1/civics/feed?page=${pageNum}&limit=20`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(userId && { 'Authorization': `Bearer ${userId}` })
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load feed');
      }

      const data = await response.json();
      const newItems = data.items || [];

      if (isRefresh) {
        setFeedItems(newItems);
        setPage(1);
      } else {
        setFeedItems(prev => [...prev, ...newItems]);
        setPage(pageNum);
      }

      setHasMore(newItems.length === 20);
    } catch (error) {
      console.error('Error loading feed:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Handle pull-to-refresh
  const handleTouchStart = (e: React.TouchEvent) => {
    if (feedRef.current?.scrollTop === 0 && e.touches[0]) {
      setTouchStart({ y: e.touches[0].clientY });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart || !e.touches[0]) return;

    const currentY = e.touches[0].clientY;
    const deltaY = currentY - touchStart.y;

    if (deltaY > 0 && feedRef.current?.scrollTop === 0) {
      setPullDistance(Math.min(deltaY, 100));
      setTouchEnd({ y: currentY });
    }
  };

  const handleTouchEnd = () => {
    if (pullDistance > 50) {
      loadFeedItems(1, true);
    }
    setPullDistance(0);
    setTouchStart(null);
    setTouchEnd(null);
  };

  // Handle interactions
  const handleLike = (itemId: string) => {
    setLikedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });

    // Update engagement metrics
    setFeedItems(prev => prev.map(item => 
      item.id === itemId 
        ? {
            ...item,
            engagementMetrics: {
              ...item.engagementMetrics,
              likes: likedItems.has(itemId) 
                ? item.engagementMetrics.likes - 1 
                : item.engagementMetrics.likes + 1
            }
          }
        : item
    ));

    onLike?.(itemId);
  };

  const handleBookmark = (itemId: string) => {
    setBookmarkedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });

    onBookmark?.(itemId);
  };

  const handleShare = (itemId: string) => {
    onShare?.(itemId);
    
    // Native sharing if available
    if (navigator.share) {
      const item = feedItems.find(item => item.id === itemId);
      if (item) {
        navigator.share({
          title: item.title,
          text: item.description || '',
          url: item.url || window.location.href
        });
      }
    }
  };

  const handleComment = (itemId: string) => {
    onComment?.(itemId);
  };

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
      ref={feedRef}
      className={`h-full overflow-y-auto ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull-to-refresh indicator */}
      {isRefreshing && (
        <div className="flex items-center justify-center py-4 text-gray-500">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <span className="ml-2">Refreshing...</span>
        </div>
      )}

      {/* Feed items */}
      <div className="space-y-4 p-4">
        {feedItems.map((item, _index) => (
          <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
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
                  <p className="text-sm text-gray-500">{item.representativeOffice}</p>
                </div>
                
                <div className="text-right">
                  <p className="text-sm text-gray-500">{formatDate(item.date)}</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              <h4 className="font-semibold text-gray-900 mb-2">{item.title}</h4>
              {item.description && (
                <p className="text-gray-600 mb-4">{item.description}</p>
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
            <div className="px-4 py-3 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <button
                    onClick={() => handleLike(item.id)}
                    className={`flex items-center space-x-2 transition-colors ${
                      likedItems.has(item.id) 
                        ? 'text-red-500' 
                        : 'text-gray-500 hover:text-red-500'
                    }`}
                  >
                    {likedItems.has(item.id) ? (
                      <HeartSolidIcon className="w-5 h-5" />
                    ) : (
                      <HeartIcon className="w-5 h-5" />
                    )}
                    <span className="text-sm font-medium">
                      {item.engagementMetrics.likes}
                    </span>
                  </button>
                  
                  <button
                    onClick={() => handleComment(item.id)}
                    className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-colors"
                  >
                    <ChatBubbleLeftIcon className="w-5 h-5" />
                    <span className="text-sm font-medium">
                      {item.engagementMetrics.comments}
                    </span>
                  </button>
                  
                  <button
                    onClick={() => handleShare(item.id)}
                    className="flex items-center space-x-2 text-gray-500 hover:text-green-500 transition-colors"
                  >
                    <ShareIcon className="w-5 h-5" />
                    <span className="text-sm font-medium">
                      {item.engagementMetrics.shares}
                    </span>
                  </button>
                </div>
                
                <button
                  onClick={() => handleBookmark(item.id)}
                  className={`transition-colors ${
                    bookmarkedItems.has(item.id) 
                      ? 'text-blue-500' 
                      : 'text-gray-500 hover:text-blue-500'
                  }`}
                >
                  {bookmarkedItems.has(item.id) ? (
                    <BookmarkSolidIcon className="w-5 h-5" />
                  ) : (
                    <BookmarkIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-500">Loading more...</span>
        </div>
      )}

      {/* End of feed */}
      {!hasMore && feedItems.length > 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>You've reached the end of the feed</p>
          <p className="text-sm mt-1">Check back later for more updates</p>
        </div>
      )}

      {/* Scroll to top button */}
      {feedItems.length > 5 && (
        <button
          onClick={() => feedRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-4 right-4 p-3 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-colors"
        >
          <ChevronUpIcon className="w-6 h-6" />
        </button>
      )}

      {/* Last item ref for infinite scroll */}
      <div ref={lastItemRef} className="h-1" />
    </div>
  );
}

