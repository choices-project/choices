/**
 * Hashtag-Polls Feed Component
 * 
 * Advanced feed component that integrates hashtags and polls
 * Features:
 * - Intelligent hashtag-based poll recommendations
 * - Real-time hashtag trending display
 * - Interactive hashtag filtering
 * - Poll-hashtag engagement tracking
 * - Personalized feed generation
 * - Smooth animations and transitions
 * 
 * Created: January 19, 2025
 * Status: ✅ ACTIVE
 */

'use client';

import { Hash, TrendingUp, Users, BarChart3, Clock } from 'lucide-react';
import React, { useState, useEffect, useCallback, useMemo } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

import type { 
  PersonalizedHashtagFeed 
} from '../lib/hashtag-polls-integration';

interface HashtagPollsFeedProps {
  userId: string;
  className?: string;
  onPollSelect?: (pollId: string) => void;
  onHashtagSelect?: (hashtag: string) => void;
  enablePersonalization?: boolean;
  enableTrending?: boolean;
  enableAnalytics?: boolean;
  maxPolls?: number;
}

export default function HashtagPollsFeed({
  userId,
  className = '',
  onPollSelect,
  onHashtagSelect,
  enablePersonalization = true,
  enableTrending = true,
  enableAnalytics = false,
  maxPolls = 20
}: HashtagPollsFeedProps) {
  // State management
  const [feedData, setFeedData] = useState<PersonalizedHashtagFeed | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('recommended');
  const [selectedHashtags, setSelectedHashtags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'relevance' | 'trending' | 'engagement'>('relevance');

  // Load personalized hashtag-polls feed
  const loadFeedData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/feeds?userId=${userId}&limit=${maxPolls}`);
      if (!response.ok) {
        throw new Error(`Failed to load feed: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Extract hashtag-polls feed data from the integrated response
      if (data.ok && data.data?.hashtagPollsFeed) {
        setFeedData({
          user_id: userId,
          hashtag_interests: data.data.hashtagPollsFeed.user_followed_hashtags || [],
          recommended_polls: data.data.hashtagPollsFeed.recommended_polls || [],
          trending_hashtags: data.data.hashtagPollsFeed.trending_hashtags || [],
          hashtag_analytics: data.data.hashtagPollsFeed.hashtag_analytics || [],
          feed_score: data.data.hashtagPollsFeed.feed_score || 0,
          last_updated: new Date()
        });
      } else {
        throw new Error('No hashtag-polls feed data available');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load feed');
      console.error('Failed to load hashtag-polls feed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId, maxPolls]);

  // Load feed data on mount
  useEffect(() => {
    if (userId) {
      loadFeedData();
    }
  }, [userId, loadFeedData]);

  // Filter and sort polls based on selected hashtags and sort criteria
  const filteredPolls = useMemo(() => {
    if (!feedData?.recommended_polls) return [];

    let filtered = [...feedData.recommended_polls];

    // Filter by selected hashtags
    if (selectedHashtags.length > 0) {
      filtered = filtered.filter(poll => 
        selectedHashtags.some(hashtag => 
          poll.tags?.includes(hashtag)
        )
      );
    }

    // Sort by selected criteria
    switch (sortBy) {
      case 'trending':
        filtered.sort((a, b) => b.relevanceScore - a.relevanceScore);
        break;
      case 'engagement':
        filtered.sort((a, b) => (b.totalVotes || 0) - (a.totalVotes || 0));
        break;
      case 'relevance':
      default:
        filtered.sort((a, b) => b.relevanceScore - a.relevanceScore);
        break;
    }

    return filtered;
  }, [feedData?.recommended_polls, selectedHashtags, sortBy]);

  // Handle hashtag selection
  const handleHashtagSelect = useCallback((hashtag: string) => {
    setSelectedHashtags(prev => {
      if (prev.includes(hashtag)) {
        return prev.filter(h => h !== hashtag);
      } else {
        return [...prev, hashtag];
      }
    });
    onHashtagSelect?.(hashtag);
  }, [onHashtagSelect]);

  // Handle poll selection
  const handlePollSelect = useCallback((pollId: string) => {
    onPollSelect?.(pollId);
  }, [onPollSelect]);

  // Track hashtag engagement
  const trackHashtagEngagement = useCallback(async (hashtag: string, action: 'view' | 'click' | 'share') => {
    try {
      await fetch('/api/feeds/hashtag-engagement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          hashtag,
          action
        })
      });
    } catch (error) {
      console.warn('Failed to track hashtag engagement:', error);
    }
  }, [userId]);

  // Loading state
  if (isLoading) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={cn("space-y-6", className)}>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={loadFeedData} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No data state
  if (!feedData) {
    return (
      <div className={cn("space-y-6", className)}>
        <Card>
          <CardContent className="p-6 text-center">
            <Hash className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No hashtag-polls feed available</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header with feed score and analytics */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Hashtag-Polls Feed</h2>
          <p className="text-sm text-gray-600">
            Personalized polls based on your hashtag interests
          </p>
        </div>
        {enableAnalytics && (
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-gray-600">Feed Score</p>
              <p className="text-lg font-semibold text-blue-600">
                {Math.round(feedData.feed_score * 100)}%
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Polls</p>
              <p className="text-lg font-semibold text-green-600">
                {filteredPolls.length}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Hashtag filters and trending */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5" />
            Hashtag Filters
            {selectedHashtags.length > 0 && (
              <Badge variant="secondary">{selectedHashtags.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Selected hashtags */}
            {selectedHashtags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedHashtags.map(hashtag => (
                  <Badge
                    key={hashtag}
                    variant="default"
                    className="cursor-pointer hover:bg-red-100"
                    onClick={() => handleHashtagSelect(hashtag)}
                  >
                    #{hashtag} ×
                  </Badge>
                ))}
              </div>
            )}

            {/* Trending hashtags */}
            {enableTrending && feedData.trending_hashtags.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Trending Hashtags:</p>
                <div className="flex flex-wrap gap-2">
                  {feedData.trending_hashtags.slice(0, 10).map(hashtag => (
                    <Badge
                      key={hashtag}
                      variant={selectedHashtags.includes(hashtag) ? "default" : "outline"}
                      className="cursor-pointer hover:bg-blue-100"
                      onClick={() => handleHashtagSelect(hashtag)}
                    >
                      <TrendingUp className="h-3 w-3 mr-1" />
                      #{hashtag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Sort options */}
            <div className="flex items-center space-x-4">
              <p className="text-sm font-medium text-gray-700">Sort by:</p>
              <div className="flex space-x-2">
                {[
                  { value: 'relevance', label: 'Relevance' },
                  { value: 'trending', label: 'Trending' },
                  { value: 'engagement', label: 'Engagement' }
                ].map(option => (
                  <Button
                    key={option.value}
                    variant={sortBy === option.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSortBy(option.value as any)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main content tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="recommended">Recommended</TabsTrigger>
          <TabsTrigger value="trending">Trending</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Recommended polls */}
        <TabsContent value="recommended" className="space-y-4">
          {filteredPolls.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <Hash className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No polls match your current filters</p>
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedHashtags([])}
                  className="mt-4"
                >
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredPolls.map(poll => (
                <Card key={poll.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {poll.title}
                        </h3>
                        <p className="text-gray-600 mb-4">{poll.description}</p>
                        
                        {/* Poll hashtags */}
                        {poll.tags && poll.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {poll.tags.map((hashtag: any) => (
                              <Badge
                                key={hashtag}
                                variant="outline"
                                className="cursor-pointer hover:bg-blue-100"
                                onClick={() => handleHashtagSelect(hashtag)}
                              >
                                #{hashtag}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {/* Poll metadata */}
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {poll.totalVotes} votes
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {poll.created_at ? new Date(poll.created_at).toLocaleDateString() : 'Unknown date'}
                          </div>
                          <div className="flex items-center">
                            <BarChart3 className="h-4 w-4 mr-1" />
                            {Math.round(poll.relevanceScore * 100)}% match
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        {poll.interestMatches && poll.interestMatches.length > 0 ? `Matches: ${poll.interestMatches.join(', ')}` : 'Recommended poll'}
                      </div>
                      <Button
                        onClick={() => handlePollSelect(poll.id || poll.pollId)}
                        className="ml-4"
                      >
                        View Poll
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Trending hashtags */}
        <TabsContent value="trending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Trending Hashtags
              </CardTitle>
            </CardHeader>
            <CardContent>
              {feedData.trending_hashtags.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No trending hashtags available</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {feedData.trending_hashtags.map((hashtag, index) => (
                    <div
                      key={hashtag}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleHashtagSelect(hashtag)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl font-bold text-blue-600">
                          #{index + 1}
                        </div>
                        <div>
                          <p className="font-medium">#{hashtag}</p>
                          <p className="text-sm text-gray-600">Trending</p>
                        </div>
                      </div>
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics" className="space-y-4">
          {enableAnalytics && feedData.hashtag_analytics.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {feedData.hashtag_analytics.map(analytic => (
                <Card key={analytic.hashtag}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Hash className="h-4 w-4" />
                      #{analytic.hashtag}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Polls:</span>
                        <span className="font-medium">{analytic.poll_count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Engagement:</span>
                        <span className="font-medium">
                          {Math.round(analytic.engagement_rate * 100)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Interest:</span>
                        <span className="font-medium">
                          {Math.round(analytic.user_interest_level * 100)}%
                        </span>
                      </div>
                      {analytic.trending_position > 0 && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Trending:</span>
                          <span className="font-medium text-green-600">
                            #{analytic.trending_position}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Analytics not available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
