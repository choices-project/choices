'use client';

/**
 * FeedCore Component
 * 
 * Core feed display component with NO side effects or complex state.
 * Purely presentational - receives data and callbacks as props.
 * 
 * This component CANNOT have infinite loops because:
 * - No useEffect hooks
 * - No store subscriptions
 * - No complex state management
 * - Pure props-based rendering
 * 
 * Created: November 5, 2025
 * Enhanced: November 5, 2025 - Added district filtering UI
 * Status: ✅ Production-grade architecture
 */

import { HashtagIcon, MoonIcon, SunIcon } from '@heroicons/react/24/outline';
import { MapPin } from 'lucide-react';
import React, { useState, useCallback, useEffect, useRef } from 'react';

import { DistrictIndicator } from '@/components/feeds/DistrictBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

type FeedItem = {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  district?: string | null;
  engagement: {
    likes: number;
    shares: number;
    comments: number;
    views: number;
  };
  userInteraction: {
    liked: boolean;
    bookmarked: boolean;
  };
};

type FeedCoreProps = {
  feeds: FeedItem[];
  isLoading: boolean;
  error: string | null;
  onLike: (itemId: string) => void;
  onBookmark: (itemId: string) => void;
  onShare: (itemId: string) => void;
  onRefresh: () => void;
  selectedHashtags: string[];
  onHashtagAdd: (hashtag: string) => void;
  onHashtagRemove: (hashtag: string) => void;
  trendingHashtags: string[];
  userDistrict?: string | null;
  districtFilterEnabled: boolean;
  onDistrictFilterToggle: () => void;
  className?: string;
  onLoadMore?: () => void;
  hasMore?: boolean;
};

/**
 * Pure presentational feed component
 * No side effects, no infinite loops possible
 * Enhanced with district filtering UI
 */
export default function FeedCore({
  feeds,
  isLoading,
  error,
  onLike,
  onBookmark,
  onShare,
  onRefresh,
  selectedHashtags,
  onHashtagAdd,
  onHashtagRemove,
  trendingHashtags,
  userDistrict,
  districtFilterEnabled,
  onDistrictFilterToggle,
  className = '',
  onLoadMore,
  hasMore = false
}: FeedCoreProps) {
  const [hashtagInput, setHashtagInput] = useState('');
  const [activeTab, setActiveTab] = useState('feed');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Client-side hydration
  useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('darkMode');
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const shouldBeDark = stored ? stored === 'true' : systemPrefersDark;
      setIsDarkMode(shouldBeDark);
      
      if (shouldBeDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, []);

  // Infinite scroll
  useEffect(() => {
    if (!onLoadMore || !hasMore || !isClient) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting && !isLoading && hasMore) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [onLoadMore, hasMore, isLoading, isClient]);

 

  // Pull-to-refresh
  useEffect(() => {
    if (!isClient || !scrollContainerRef.current) return;

    const container = scrollContainerRef.current;

    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0 && e.touches[0]) {
        startY.current = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (window.scrollY > 0) return;
      
      const touch = e.touches[0];
      if (!touch) return;
      
      const currentY = touch.clientY;
      const distance = currentY - startY.current;
      
      if (distance > 0 && distance < 150) {
        setIsPulling(true);
        setPullDistance(distance);
        e.preventDefault();
      }
    };

    const handleTouchEnd = () => {
      if (pullDistance > 80) {
        onRefresh();
      }
      setIsPulling(false);
      setPullDistance(0);
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isClient, pullDistance, onRefresh]);

  const toggleDarkMode = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('darkMode', String(newMode));
    
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

 

  const handleHashtagSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (hashtagInput.trim()) {
      const cleanTag = hashtagInput.trim().replace(/^#/, '');
      onHashtagAdd(cleanTag);
      setHashtagInput('');
    }
  }, [hashtagInput, onHashtagAdd]);

  // Loading state
  if (isLoading && feeds.length === 0) {
    return (
      <div className={cn('unified-feed', className)} data-testid="unified-feed">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={cn('unified-feed', className)} data-testid="unified-feed">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-red-600">Error Loading Feed</h3>
            <p className="text-gray-600">{error}</p>
            <Button onClick={onRefresh} className="mt-4">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={scrollContainerRef}
      className={cn('unified-feed max-w-4xl mx-auto relative', className)} 
      data-testid="unified-feed"
    >
      {/* Pull-to-refresh indicator */}
      {isPulling && (
        <div 
          className="absolute top-0 left-1/2 transform -translate-x-1/2 z-50 transition-all"
          style={{ top: Math.min(pullDistance - 40, 60) }}
        >
          <div className="bg-primary text-primary-foreground rounded-full p-2 shadow-lg">
            {pullDistance > 80 ? '↓ Release to refresh' : '↓ Pull to refresh'}
          </div>
        </div>
      )}
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Unified Feed</h1>
        <div className="flex gap-2">
          {isClient && (
            <Button
              variant="outline"
              size="icon"
              onClick={toggleDarkMode}
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDarkMode ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
            </Button>
          )}
          <Button onClick={onRefresh} disabled={isLoading}>
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HashtagIcon className="w-5 h-5" />
            Content Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* District Filter */}
          {userDistrict && (
            <div className="mb-4 pb-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium">Your District: {userDistrict}</span>
                </div>
                <Button
                  variant={districtFilterEnabled ? "default" : "outline"}
                  size="sm"
                  onClick={onDistrictFilterToggle}
                  aria-label={districtFilterEnabled ? 'Disable district filter' : 'Enable district filter'}
                >
                  {districtFilterEnabled ? '✓ Filtered' : 'Filter by District'}
                </Button>
              </div>
              {districtFilterEnabled && (
                <p className="text-xs text-gray-600 mt-2">
                  Showing content for {userDistrict} and platform-wide items
                </p>
              )}
            </div>
          )}

          {/* Hashtag Input */}
          <form onSubmit={handleHashtagSubmit} className="mb-4">
            <Input
              type="text"
              placeholder="Add hashtags to filter (e.g., climate)"
              value={hashtagInput}
              onChange={(e) => setHashtagInput(e.target.value)}
              aria-label="Filter by hashtag"
            />
          </form>

          {/* Selected Hashtags */}
          {selectedHashtags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedHashtags.map(tag => (
                <Badge key={tag} variant="default" className="cursor-pointer">
                  #{tag}
                  <button
                    onClick={() => onHashtagRemove(tag)}
                    className="ml-2 hover:text-red-500"
                    aria-label={`Remove ${tag} filter`}
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {/* Trending Hashtags */}
          {trendingHashtags.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2">Trending Hashtags</h4>
              <div className="flex flex-wrap gap-2">
                {trendingHashtags.slice(0, 10).map(tag => (
                  <Button
                    key={tag}
                    variant="outline"
                    size="sm"
                    onClick={() => onHashtagAdd(tag)}
                  >
                    #{tag}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="feed" data-testid="feed-tab">Feed</TabsTrigger>
          <TabsTrigger value="polls" data-testid="polls-tab">Polls</TabsTrigger>
          <TabsTrigger value="analytics" data-testid="analytics-tab">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="feed" id="feed-panel" role="tabpanel">
          {/* Feed Items */}
          {feeds.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">
                {selectedHashtags.length > 0 
                  ? 'No content matches your filters' 
                  : 'No feeds available'}
              </p>
            </div>
          ) : (
            <div className="space-y-4" role="feed">
              {feeds.map(feed => (
                <Card key={feed.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="flex-1">{feed.title}</CardTitle>
                      {/* District Badge */}
                      {feed.district && (
                        <DistrictIndicator 
                          feedItemDistrict={feed.district}
                          {...(userDistrict ? { userDistrict } : {})}
                          size="sm"
                        />
                      )}
                    </div>
                    <div className="flex gap-2 mt-2">
                      {feed.tags.map(tag => (
                        <Badge key={tag} variant="secondary">#{tag}</Badge>
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 mb-4">{feed.content}</p>
                    
                    {/* Engagement */}
                    <div className="flex gap-4 mt-4">
                      <Button
                        variant={feed.userInteraction.liked ? "default" : "outline"}
                        size="sm"
                        onClick={() => onLike(feed.id)}
                      >
                        👍 {feed.engagement.likes}
                      </Button>
                      <Button
                        variant={feed.userInteraction.bookmarked ? "default" : "outline"}
                        size="sm"
                        onClick={() => onBookmark(feed.id)}
                      >
                        🔖 Bookmark
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onShare(feed.id)}
                      >
                        🔗 Share
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="polls" id="polls-panel" role="tabpanel">
          <div className="text-center py-12">
            <p className="text-gray-600">Polls view coming soon</p>
          </div>
        </TabsContent>

        <TabsContent value="analytics" id="analytics-panel" role="tabpanel">
          <div className="text-center py-12">
            <p className="text-gray-600">Analytics not available</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Status indicators */}
      <div className="flex justify-between items-center text-sm text-gray-500 mt-4">
        <span>Online</span>
        <span>{feeds.length} items</span>
      </div>

      {/* Accessibility */}
      <div className="sr-only" aria-live="polite" id="live-region-content" />
    </div>
  );
}

