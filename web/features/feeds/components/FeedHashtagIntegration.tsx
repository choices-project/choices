/**
 * Feed Hashtag Integration Component
 * 
 * Integrates hashtag functionality into the feeds feature
 * Enables hashtag-based content filtering and trending topic discovery
 * 
 * Created: December 19, 2024
 * Status: ✅ ACTIVE
 */

'use client';

import { Hash, TrendingUp, Filter, Search, Users, Eye, Share2, Clock, X } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HashtagDisplay } from '@/features/hashtags';
import type { Hashtag } from '@/features/hashtags/types';
import { useHashtagStore, useHashtagActions, useHashtagStats } from '@/lib/stores';
import { cn } from '@/lib/utils';
import { withOptional } from '@/lib/utils/objects';

import type { 
  FeedItemData, 
  FeedHashtagIntegration, 
  HashtagFilter,
  HashtagSort 
} from '../types';

interface FeedHashtagIntegrationProps {
  feedItems: FeedItemData[];
  onFilter: (filters: HashtagFilter[]) => void;
  onSort: (sort: HashtagSort) => void;
  className?: string;
}

export default function FeedHashtagIntegration({
  feedItems,
  onFilter,
  onSort,
  className
}: FeedHashtagIntegrationProps) {
  const [activeTab, setActiveTab] = useState('trending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<HashtagFilter[]>([]);
  const [selectedSort, setSelectedSort] = useState<HashtagSort>({
    option: 'relevance',
    direction: 'desc',
    label: 'Most Relevant'
  });
  // Removed unused hashtagIntegration state - not needed for this component

  // Hashtag store hooks
  const { hashtags, trendingHashtags, searchResults, followedHashtags } = useHashtagStore();
  const { searchHashtags, getTrendingHashtags } = useHashtagActions();
  const { followedCount, trendingCount } = useHashtagStats();

  // Load trending hashtags on mount
  useEffect(() => {
    getTrendingHashtags();
  }, [getTrendingHashtags]);

  // Handle hashtag search
  const handleHashtagSearch = async (query: string) => {
    if (query.length >= 2) {
      await searchHashtags({
        query,
        limit: 20
      });
    }
  };

  // Handle filter application
  const handleFilterApply = (filter: HashtagFilter) => {
    const newFilters = selectedFilters.filter(f => f.type !== filter.type);
    if (filter.active) {
      setSelectedFilters([...newFilters, filter]);
    } else {
      setSelectedFilters(newFilters);
    }
    onFilter([...newFilters, filter]);
  };

  // Handle sort change
  const handleSortChange = (sort: HashtagSort) => {
    setSelectedSort(sort);
    onSort(sort);
  };

  // Get filtered feed items
  const getFilteredFeedItems = () => {
    let filtered = feedItems;

    // Apply hashtag filters
    if (selectedFilters.length > 0) {
      filtered = filtered.filter(item => {
        return selectedFilters.every(filter => {
          switch (filter.type) {
            case 'category':
              return item.hashtags?.some(tag => 
                hashtags.find(h => h.name === tag)?.category === filter.value
              );
            case 'trending':
              return item.hashtags?.some(tag => 
                trendingHashtags.some(th => th.hashtag.name === tag)
              );
            case 'usage_count':
              return item.hashtags?.some(tag => {
                const hashtag = hashtags.find(h => h.name === tag);
                return hashtag && hashtag.usage_count >= filter.value;
              });
            default:
              return true;
          }
        });
      });
    }

    // Apply search query
    if (searchQuery) {
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.hashtags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    return filtered;
  };

  const filteredFeedItems = getFilteredFeedItems();

  // Get trending hashtag objects
  const trendingHashtagObjects = trendingHashtags.map(th => th.hashtag);

  // Get search result hashtags
  const searchResultHashtags = searchResults?.hashtags || [];

  // Get followed hashtag objects
  const followedHashtagObjects = followedHashtags.map(hashtagId => 
    hashtags.find(h => h.id === hashtagId)
  ).filter(Boolean) as Hashtag[];

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Hashtag Feed</h3>
          <p className="text-sm text-muted-foreground">
            Discover content through hashtags and trending topics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Hash className="h-3 w-3" />
            {filteredFeedItems.length} items
          </Badge>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search hashtags or content..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                handleHashtagSearch(e.target.value);
              }}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={selectedSort.option === 'relevance' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSortChange({
                option: 'relevance',
                direction: 'desc',
                label: 'Most Relevant'
              })}
            >
              Relevance
            </Button>
            <Button
              variant={selectedSort.option === 'trending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSortChange({
                option: 'trending',
                direction: 'desc',
                label: 'Trending'
              })}
            >
              Trending
            </Button>
            <Button
              variant={selectedSort.option === 'created' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSortChange({
                option: 'created',
                direction: 'desc',
                label: 'Newest'
              })}
            >
              Newest
            </Button>
          </div>
        </div>

        {/* Active Filters */}
        {selectedFilters.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedFilters.map((filter, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="flex items-center gap-1 cursor-pointer"
                onClick={() => handleFilterApply(withOptional(filter, { active: false }))}
              >
                {filter.label}
                <X className="h-3 w-3" />
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Total Items</p>
                <p className="text-2xl font-bold">{feedItems.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium">Filtered</p>
                <p className="text-2xl font-bold">{filteredFeedItems.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-sm font-medium">Trending</p>
                <p className="text-2xl font-bold">{trendingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-sm font-medium">Followed</p>
                <p className="text-2xl font-bold">{followedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trending">Trending</TabsTrigger>
          <TabsTrigger value="search">Search</TabsTrigger>
          <TabsTrigger value="followed">Followed</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
        </TabsList>

        {/* Trending Hashtags */}
        <TabsContent value="trending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Trending Hashtags
                <Badge variant="secondary">{trendingCount}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {trendingHashtagObjects.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No trending hashtags available</p>
                  <p className="text-sm">Check back later for trending topics</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <HashtagDisplay
                    hashtags={trendingHashtagObjects.slice(0, 10)}
                    showCount={true}
                    showCategory={true}
                    clickable={true}
                  />
                  
                  <Separator />
                  
                  <div className="text-sm text-muted-foreground">
                    <p>Showing trending hashtags that might be relevant to your feed</p>
                    <p>Click on hashtags to filter content</p>
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
              {searchResultHashtags.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hashtags found</p>
                  <p className="text-sm">Try a different search term</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <HashtagDisplay
                    hashtags={searchResultHashtags}
                    showCount={true}
                    showCategory={true}
                    clickable={true}
                  />
                  
                  <Separator />
                  
                  <div className="text-sm text-muted-foreground">
                    <p>Found {searchResultHashtags.length} hashtags</p>
                    <p>Click on hashtags to filter content</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Followed Hashtags */}
        <TabsContent value="followed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Your Followed Hashtags
                <Badge variant="secondary">{followedCount}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {followedHashtagObjects.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>You haven&apos;t followed any hashtags yet</p>
                  <p className="text-sm">Follow hashtags to personalize your feed</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <HashtagDisplay
                    hashtags={followedHashtagObjects}
                    showCount={true}
                    showCategory={true}
                    clickable={true}
                  />
                  
                  <Separator />
                  
                  <div className="text-sm text-muted-foreground">
                    <p>Your followed hashtags help personalize your feed</p>
                    <p>Content matching these hashtags will appear in your feed</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Feed */}
        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hash className="h-5 w-5" />
                Filtered Content
                <Badge variant="secondary">{filteredFeedItems.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredFeedItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Hash className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No content found</p>
                  <p className="text-sm">Try adjusting your filters or search terms</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredFeedItems.map((item) => (
                    <Card key={item.id} className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex-1">
                          <h4 className="font-medium">{item.title}</h4>
                          {item.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {item.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {item.engagementMetrics.likes || 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <Share2 className="h-3 w-3" />
                              {item.engagementMetrics.shares}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(item.date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        {item.hashtags && item.hashtags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {item.hashtags.slice(0, 3).map((hashtag, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                #{hashtag}
                              </Badge>
                            ))}
                            {item.hashtags.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{item.hashtags.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Integration Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Hashtag Feed Integration Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium">Total Content:</p>
                <p className="text-muted-foreground">{feedItems.length} items</p>
              </div>
              <div>
                <p className="font-medium">Filtered Content:</p>
                <p className="text-muted-foreground">{filteredFeedItems.length} items</p>
              </div>
              <div>
                <p className="font-medium">Trending Hashtags:</p>
                <p className="text-muted-foreground">{trendingCount} hashtags</p>
              </div>
              <div>
                <p className="font-medium">Followed Hashtags:</p>
                <p className="text-muted-foreground">{followedCount} hashtags</p>
              </div>
            </div>
            
            <Separator />
            
            <div className="text-sm text-muted-foreground">
              <p>
                Hashtag integration enables personalized content discovery through trending topics, 
                followed hashtags, and smart filtering. Use hashtags to find relevant content 
                and discover new topics of interest.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
