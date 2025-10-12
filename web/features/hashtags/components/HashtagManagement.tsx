/**
 * Hashtag Management Component
 * 
 * Comprehensive hashtag management interface for users to follow/unfollow hashtags,
 * reorder their hashtags, and discover new ones
 * 
 * Created: December 19, 2024
 * Status: ✅ ACTIVE
 */

'use client';

import { Search, Plus, Minus, GripVertical, TrendingUp, Users, Hash } from 'lucide-react';
import React, { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

import { useUserHashtags, useTrendingHashtags, useHashtagSearch, useFollowHashtag, useUnfollowHashtag } from '../hooks/use-hashtags';
import type { HashtagManagementProps, UserHashtag, Hashtag, HashtagCategory } from '../types';

import HashtagDisplay from './HashtagDisplay';

export default function HashtagManagement({
  userHashtags = [],
  onFollow,
  onUnfollow,
  onReorder,
  showSuggestions = true,
  className
}: HashtagManagementProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<HashtagCategory | undefined>();
  const [activeTab, setActiveTab] = useState('followed');

  // Hooks
  const { data: userHashtagsData, isLoading: isUserHashtagsLoading } = useUserHashtags();
  const { data: trendingData, isLoading: isTrendingLoading } = useTrendingHashtags({
    category: selectedCategory
  });
  const { data: searchData, isLoading: isSearchLoading } = useHashtagSearch({
    query: searchQuery,
    filters: selectedCategory ? { category: selectedCategory } : undefined,
    limit: 20
  });

  const followHashtagMutation = useFollowHashtag();
  const unfollowHashtagMutation = useUnfollowHashtag();

  // Get current user hashtags
  const currentUserHashtags: UserHashtag[] = userHashtagsData?.data || userHashtags;
  const followedHashtags = currentUserHashtags.map(uh => uh.hashtag);
  
  // Use the isHashtagFollowed function in the UI
  const followedHashtagIds = currentUserHashtags.map(uh => uh.hashtag_id);

  // Get trending hashtags
  const trendingHashtags = trendingData?.data || [];

  // Get search results
  const searchResults = searchData?.data?.hashtags || [];

  // Handle follow hashtag
  const handleFollowHashtag = async (hashtag: Hashtag) => {
    try {
      await followHashtagMutation.mutateAsync(hashtag.id);
      onFollow?.(hashtag);
    } catch (error) {
      // Failed to follow hashtag
    }
  };

  // Handle unfollow hashtag
  const handleUnfollowHashtag = async (hashtag: Hashtag) => {
    try {
      await unfollowHashtagMutation.mutateAsync(hashtag.id);
      onUnfollow?.(hashtag);
    } catch (error) {
      // Failed to unfollow hashtag
    }
  };

  // Check if hashtag is followed
  const isHashtagFollowed = (hashtagId: string) => {
    return currentUserHashtags.some(uh => uh.hashtag_id === hashtagId);
  };

  // Handle reordering hashtags
  const handleReorderHashtags = (fromIndex: number, toIndex: number) => {
    if (onReorder) {
      const reorderedHashtags = [...currentUserHashtags];
      const [movedHashtag] = reorderedHashtags.splice(fromIndex, 1);
      if (movedHashtag) {
        reorderedHashtags.splice(toIndex, 0, movedHashtag);
        onReorder(reorderedHashtags);
      }
    }
  };

  // Handle suggestion toggle
  const toggleSuggestions = () => {
    if (showSuggestions) {
      // Hide suggestions logic
      // Hiding suggestions
    } else {
      // Show suggestions logic
      // Showing suggestions
    }
  };

  // Get category options
  const categories: HashtagCategory[] = [
    'politics', 'civics', 'social', 'environment', 'economy',
    'health', 'education', 'technology', 'culture', 'sports',
    'entertainment', 'news', 'local', 'national', 'international'
  ];

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold">Hashtag Management</h2>
          <p className="text-muted-foreground">
            Manage your followed hashtags and discover new ones
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search hashtags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto">
            <Button
              variant={selectedCategory === undefined ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(undefined)}
            >
              All
            </Button>
            {categories.slice(0, 6).map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="followed">
            Followed ({currentUserHashtags.length})
          </TabsTrigger>
          <TabsTrigger value="trending">
            Trending ({trendingHashtags.length})
          </TabsTrigger>
          <TabsTrigger value="search">
            Search ({searchResults.length})
          </TabsTrigger>
        </TabsList>

        {/* Followed Hashtags */}
        <TabsContent value="followed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hash className="h-5 w-5" />
                Your Hashtags
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isUserHashtagsLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading your hashtags...
                </div>
              ) : followedHashtags.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Hash className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>You haven&apos;t followed any hashtags yet</p>
                  <p className="text-sm">Discover trending hashtags to get started</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-4">
                    {/* Reorder Controls */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Drag to reorder your hashtags</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReorderHashtags(0, currentUserHashtags.length - 1)}
                          className="text-xs"
                        >
                          Move first to last
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={toggleSuggestions}
                          className="flex items-center gap-1"
                        >
                          {showSuggestions ? (
                            <>
                              <Minus className="h-3 w-3" />
                              Hide Suggestions
                            </>
                          ) : (
                            <>
                              <Plus className="h-3 w-3" />
                              Show Suggestions
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Scrollable hashtag list */}
                    <ScrollArea className="h-64">
                      <HashtagDisplay
                        hashtags={followedHashtags}
                        showCount={true}
                        showCategory={true}
                        clickable={true}
                        onFollow={handleFollowHashtag}
                        onUnfollow={handleUnfollowHashtag}
                      />
                    </ScrollArea>
                  </div>
                  
                  <Separator />
                  
                  <div className="text-sm text-muted-foreground">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4" />
                      <span>You&apos;re following {currentUserHashtags.length} hashtags</span>
                    </div>
                    <p>Click on hashtags to view their content and analytics</p>
                    
                    {/* User hashtag statistics */}
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Your Hashtag Activity</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Total Follows:</span>
                          <span className="ml-2 font-medium">{currentUserHashtags.length}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Categories:</span>
                          <span className="ml-2 font-medium">
                            {new Set(currentUserHashtags.map(uh => uh.hashtag.category)).size}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Follow Status:</span>
                          <span className="ml-2 font-medium">
                            {followedHashtagIds.length > 0 ? 'Active' : 'None'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Check Status:</span>
                          <span className="ml-2 font-medium">
                            {isHashtagFollowed(followedHashtagIds[0] || '') ? 'Following' : 'Not Following'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trending Hashtags */}
        <TabsContent value="trending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Trending Hashtags
                {selectedCategory && (
                  <Badge variant="secondary">{selectedCategory}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isTrendingLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading trending hashtags...
                </div>
              ) : trendingHashtags.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No trending hashtags found</p>
                  <p className="text-sm">Try a different category or check back later</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <HashtagDisplay
                    hashtags={trendingHashtags.map(th => th.hashtag)}
                    showCount={true}
                    showCategory={true}
                    clickable={true}
                    onFollow={handleFollowHashtag}
                    onUnfollow={handleUnfollowHashtag}
                  />
                  
                  <Separator />
                  
                  <div className="text-sm text-muted-foreground">
                    <p>Showing trending hashtags</p>
                    <p>Follow hashtags to get updates in your feed</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Search Results */}
        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search Results
                {searchQuery && (
                  <Badge variant="secondary">&ldquo;{searchQuery}&rdquo;</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isSearchLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Searching hashtags...
                </div>
              ) : searchResults.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hashtags found</p>
                  <p className="text-sm">Try a different search term or category</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <HashtagDisplay
                    hashtags={searchResults}
                    showCount={true}
                    showCategory={true}
                    clickable={true}
                    onFollow={handleFollowHashtag}
                    onUnfollow={handleUnfollowHashtag}
                  />
                  
                  <Separator />
                  
                  <div className="text-sm text-muted-foreground">
                    <p>Found {searchResults.length} hashtags</p>
                    <p>Follow hashtags to get updates in your feed</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveTab('trending')}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              View Trending
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearchQuery('')}
            >
              <Search className="h-4 w-4 mr-2" />
              Clear Search
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedCategory(undefined)}
            >
              <Hash className="h-4 w-4 mr-2" />
              All Categories
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
