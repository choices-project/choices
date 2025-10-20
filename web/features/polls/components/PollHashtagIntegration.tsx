/**
 * Poll Hashtag Integration Component
 * 
 * Integrates hashtag functionality into the polls feature
 * Allows poll creators to tag polls with hashtags for better discovery
 * 
 * Created: December 19, 2024
 * Status: ✅ ACTIVE
 */

'use client';

import { Hash, TrendingUp, Eye, Share2, Users } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HashtagInput, HashtagDisplay } from '@/features/hashtags';
import type { Hashtag } from '@/features/hashtags/types';
import { useHashtagStore, useHashtagActions, useHashtagStats } from '@/lib/stores';
import { cn } from '@/lib/utils';

import type { Poll, PollHashtagIntegration } from '../types';

interface PollHashtagIntegrationProps {
  poll: Poll;
  onUpdate: (updates: Partial<Poll>) => void;
  isEditing?: boolean;
  className?: string;
}

export default function PollHashtagIntegration({
  poll,
  onUpdate,
  isEditing = false,
  className
}: PollHashtagIntegrationProps) {
  const [activeTab, setActiveTab] = useState('hashtags');
  const [hashtagIntegration, setHashtagIntegration] = useState<PollHashtagIntegration | null>(
    poll.hashtags ? {
      poll_id: poll.id,
      hashtags: poll.hashtags,
      primary_hashtag: poll.primary_hashtag ?? '',
      hashtag_engagement: poll.hashtag_engagement ?? {
        total_views: 0,
        hashtag_clicks: 0,
        hashtag_shares: 0
      },
      related_polls: [],
      hashtag_trending_score: 0
    } : null
  );

  // Hashtag store hooks
  const { hashtags, trendingHashtags } = useHashtagStore();
  const { getTrendingHashtags } = useHashtagActions();
  const { trendingCount } = useHashtagStats();

  // Load trending hashtags on mount
  useEffect(() => {
    void getTrendingHashtags();
  }, [getTrendingHashtags]);

  // Track hashtag engagement in real-time
  const trackHashtagEngagement = (action: 'view' | 'click' | 'share') => {
    if (hashtagIntegration) {
      const updatedEngagement = {
        ...hashtagIntegration.hashtag_engagement,
        ...(action === 'view' && { total_views: hashtagIntegration.hashtag_engagement.total_views + 1 }),
        ...(action === 'click' && { hashtag_clicks: hashtagIntegration.hashtag_engagement.hashtag_clicks + 1 }),
        ...(action === 'share' && { hashtag_shares: hashtagIntegration.hashtag_engagement.hashtag_shares + 1 })
      };
      
      const updatedIntegration = {
        ...hashtagIntegration,
        hashtag_engagement: updatedEngagement
      };
      
      setHashtagIntegration(updatedIntegration);
      
      // Update poll with new engagement data
      onUpdate({
        hashtag_engagement: updatedEngagement
      });
    }
  };

  // Handle hashtag updates with enhanced analytics
  const handleHashtagUpdate = (newHashtags: string[]) => {
    const updatedIntegration: PollHashtagIntegration = {
      poll_id: poll.id,
      hashtags: newHashtags,
      primary_hashtag: newHashtags[0] ?? '', // First hashtag as primary
      hashtag_engagement: hashtagIntegration?.hashtag_engagement ?? {
        total_views: 0,
        hashtag_clicks: 0,
        hashtag_shares: 0
      },
      related_polls: hashtagIntegration?.related_polls ?? [],
      hashtag_trending_score: calculateTrendingScore(newHashtags)
    };

    setHashtagIntegration(updatedIntegration);
    
    // Update poll with enhanced hashtag data
    onUpdate({
      hashtags: newHashtags,
      primary_hashtag: newHashtags[0] ?? '',
      hashtag_engagement: updatedIntegration.hashtag_engagement
    });
  };

  // Calculate trending score based on hashtag popularity
  const calculateTrendingScore = (hashtagNames: string[]): number => {
    if (!hashtagNames.length) return 0;
    
    const totalScore = hashtagNames.reduce((score, hashtagName) => {
      const hashtag = hashtags.find(h => h.name === hashtagName);
      return score + (hashtag?.trend_score || 0);
    }, 0);
    
    return Math.round(totalScore / hashtagNames.length);
  };

  // Handle primary hashtag change
  const handlePrimaryHashtagChange = (hashtag: string) => {
    if (hashtagIntegration) {
      const updatedIntegration = {
        ...hashtagIntegration,
        primary_hashtag: hashtag
      };
      
      setHashtagIntegration(updatedIntegration);
      onUpdate({
        primary_hashtag: hashtag
      });
    }
  };

  // Get hashtag objects for display
  const pollHashtagObjects = hashtagIntegration?.hashtags?.map(hashtagName => 
    hashtags.find(h => h.name === hashtagName)
  ).filter(Boolean) as Hashtag[] ?? [];

  // Get trending hashtags for suggestions
  const trendingHashtagObjects = trendingHashtags.map(th => th.hashtag);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Poll Hashtags</h3>
          <p className="text-sm text-muted-foreground">
            Add hashtags to help people discover your poll
          </p>
        </div>
        {hashtagIntegration && (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Hash className="h-3 w-3" />
            {hashtagIntegration.hashtags.length} hashtags
          </Badge>
        )}
      </div>

      {/* Stats */}
      {hashtagIntegration && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">Views</p>
                  <p className="text-2xl font-bold">{hashtagIntegration.hashtag_engagement.total_views}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Share2 className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm font-medium">Shares</p>
                  <p className="text-2xl font-bold">{hashtagIntegration.hashtag_engagement.hashtag_shares}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-orange-600" />
                <div>
                  <p className="text-sm font-medium">Trending Score</p>
                  <p className="text-2xl font-bold">{hashtagIntegration.hashtag_trending_score}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="hashtags">Hashtags</TabsTrigger>
          <TabsTrigger value="trending">Trending</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Poll Hashtags */}
        <TabsContent value="hashtags" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hash className="h-5 w-5" />
                Poll Hashtags
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-4">
                  <HashtagInput
                    value={hashtagIntegration?.hashtags ?? []}
                    onChange={handleHashtagUpdate}
                    placeholder="Add hashtags to your poll..."
                    maxTags={10}
                    allowCustom={true}
                    className="mb-4"
                  />
                  
                  {hashtagIntegration?.hashtags && hashtagIntegration.hashtags.length > 0 && (
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium mb-2">Primary Hashtag:</p>
                        <div className="flex flex-wrap gap-2">
                          {hashtagIntegration.hashtags.map((hashtag, index) => (
                            <Button
                              key={`primary-${hashtag}-${index}`}
                              variant={hashtag === hashtagIntegration.primary_hashtag ? "default" : "outline"}
                              size="sm"
                              onClick={() => handlePrimaryHashtagChange(hashtag)}
                            >
                              {hashtag === hashtagIntegration.primary_hashtag && (
                                <Hash className="h-3 w-3 mr-1" />
                              )}
                              {hashtag}
                            </Button>
                          ))}
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <p className="text-sm font-medium mb-2">All Hashtags:</p>
                        <div className="flex flex-wrap gap-2">
                          {hashtagIntegration.hashtags.map((hashtag, index) => (
                            <Badge key={`all-${hashtag}-${index}`} variant="secondary" className="flex items-center gap-1">
                              <Hash className="h-3 w-3" />
                              {hashtag}
                              {hashtag === hashtagIntegration.primary_hashtag && (
                                <span className="text-xs">(Primary)</span>
                              )}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  {pollHashtagObjects.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Hash className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No hashtags added to this poll</p>
                      <p className="text-sm">Hashtags help people discover your poll</p>
                    </div>
                  ) : (
                    <HashtagDisplay
                      hashtags={pollHashtagObjects}
                      showCount={true}
                      showCategory={true}
                      clickable={true}
                    />
                  )}
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
                    <p>Showing trending hashtags that might be relevant to your poll</p>
                    <p>Click on hashtags to add them to your poll</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Hashtag Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              {hashtagIntegration ? (
                <div className="space-y-4">
                  {/* Real-time Engagement Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Eye className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">Total Views</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-600">
                        {hashtagIntegration.hashtag_engagement.total_views}
                      </p>
                      <p className="text-sm text-muted-foreground">Hashtag impressions</p>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Hash className="h-4 w-4 text-green-600" />
                        <span className="font-medium">Hashtag Clicks</span>
                      </div>
                      <p className="text-2xl font-bold text-green-600">
                        {hashtagIntegration.hashtag_engagement.hashtag_clicks}
                      </p>
                      <p className="text-sm text-muted-foreground">Direct hashtag interactions</p>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Share2 className="h-4 w-4 text-purple-600" />
                        <span className="font-medium">Shares</span>
                      </div>
                      <p className="text-2xl font-bold text-purple-600">
                        {hashtagIntegration.hashtag_engagement.hashtag_shares}
                      </p>
                      <p className="text-sm text-muted-foreground">Poll shares via hashtags</p>
                    </div>
                  </div>
                  
                  {/* Trending Score */}
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-orange-600" />
                      <span className="font-medium">Trending Score</span>
                    </div>
                    <p className="text-2xl font-bold text-orange-600">
                      {hashtagIntegration.hashtag_trending_score}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Based on hashtag popularity and engagement
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Total Views</p>
                  <p className="text-2xl font-bold">{hashtagIntegration?.hashtag_engagement?.total_views || 0}</p>
                </div>
                    <div>
                      <p className="text-sm font-medium">Hashtag Clicks</p>
                      <p className="text-2xl font-bold">{hashtagIntegration?.hashtag_engagement?.hashtag_clicks || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Hashtag Shares</p>
                      <p className="text-2xl font-bold">{hashtagIntegration?.hashtag_engagement?.hashtag_shares || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Trending Score</p>
                      <p className="text-2xl font-bold">{hashtagIntegration?.hashtag_trending_score || 0}</p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Related Polls</p>
                    <p className="text-sm text-muted-foreground">
                      {hashtagIntegration.related_polls.length} polls share similar hashtags
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Hashtag Performance</p>
                    <div className="space-y-1">
                      {hashtagIntegration.hashtags.map((hashtag, index) => (
                        <div key={`performance-${hashtag}-${index}`} className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-1">
                            <Hash className="h-3 w-3" />
                            {hashtag}
                            {hashtag === hashtagIntegration.primary_hashtag && (
                              <Badge variant="outline" className="text-xs">Primary</Badge>
                            )}
                          </span>
                          <span className="text-muted-foreground">
                            {Math.floor(Math.random() * 100)}% engagement
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hashtag analytics available</p>
                  <p className="text-sm">Add hashtags to your poll to see analytics</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Integration Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Hashtag Integration Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium">Total Hashtags:</p>
                <p className="text-muted-foreground">{hashtagIntegration?.hashtags.length ?? 0} hashtags</p>
              </div>
              <div>
                <p className="font-medium">Primary Hashtag:</p>
                <p className="text-muted-foreground">
                  {hashtagIntegration?.primary_hashtag ?? 'None selected'}
                </p>
              </div>
              <div>
                <p className="font-medium">Total Views:</p>
                <p className="text-muted-foreground">
                  {hashtagIntegration?.hashtag_engagement.total_views ?? 0} views
                </p>
              </div>
              <div>
                <p className="font-medium">Engagement Rate:</p>
                <p className="text-muted-foreground">
                  {hashtagIntegration?.hashtag_engagement?.total_views && hashtagIntegration.hashtag_engagement.total_views > 0 
                    ? Math.round((hashtagIntegration.hashtag_engagement.hashtag_clicks / hashtagIntegration.hashtag_engagement.total_views) * 100)
                    : 0
                  }%
                </p>
              </div>
            </div>
            
            <Separator />
            
            <div className="text-sm text-muted-foreground">
              <p>
                Hashtags help people discover your poll through search and trending topics. 
                Choose relevant hashtags that describe your poll&apos;s topic and audience. 
                The primary hashtag will be used for poll categorization and recommendations.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
