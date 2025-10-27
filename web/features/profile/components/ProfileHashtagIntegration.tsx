/**
 * Profile Hashtag Integration Component
 * 
 * Integrates hashtag functionality into the profile feature
 * Allows users to manage their hashtag interests and custom concerns
 * 
 * Created: December 19, 2024
 * Status: ✅ ACTIVE
 */

'use client';

import { Hash, TrendingUp, Users, Plus, X, Settings } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HashtagInput, HashtagDisplay, HashtagManagement } from '@/features/hashtags';
import type { Hashtag } from '@/features/hashtags/types';
import { useHashtagStore, useHashtagActions, useHashtagStats } from '@/lib/stores';
import { cn } from '@/lib/utils';

import type { 
  UserProfile 
} from '../index';

interface ProfileHashtagIntegrationProps {
  profile: UserProfile;
  onUpdate: (updates: Partial<UserProfile>) => void;
  className?: string;
}

export default function ProfileHashtagIntegration({
  profile,
  onUpdate,
  className
}: ProfileHashtagIntegrationProps) {
  const [activeTab, setActiveTab] = useState('interests');
  const [isEditing, setIsEditing] = useState(false);
  const [hashtagIntegration, setHashtagIntegration] = useState<any | null>(
    profile.hashtags || null
  );

  // Hashtag store hooks
  const { hashtags: _hashtags, userHashtags, trendingHashtags: _trendingHashtags, followedHashtags: _followedHashtags } = useHashtagStore();
  const { searchHashtags: _searchHashtags, followHashtag, unfollowHashtag, getUserHashtags } = useHashtagActions();
  const { followedCount, trendingCount } = useHashtagStats();

  // Load user hashtags on mount
  useEffect(() => {
    getUserHashtags();
  }, [getUserHashtags]);

  // Handle hashtag follow
  const handleFollowHashtag = async (hashtag: Hashtag) => {
    try {
      const success = await followHashtag(hashtag.id);
      if (success) {
        // Update local state
        setHashtagIntegration(prev => ({
          user_id: prev?.user_id || '',
          primary_hashtags: prev?.primary_hashtags || [],
          interest_hashtags: prev?.interest_hashtags || [],
          custom_hashtags: prev?.custom_hashtags || [],
          followed_hashtags: [...(prev?.followed_hashtags || []), hashtag.id],
          hashtag_preferences: prev?.hashtag_preferences,
          hashtag_activity: prev?.hashtag_activity || [],
          last_updated: new Date().toISOString()
        }));
        
        // Update profile
        onUpdate({
          hashtags: {
            user_id: hashtagIntegration?.user_id || '',
            primary_hashtags: hashtagIntegration?.primary_hashtags || [],
            interest_hashtags: hashtagIntegration?.interest_hashtags || [],
            custom_hashtags: hashtagIntegration?.custom_hashtags || [],
            followed_hashtags: [...(hashtagIntegration?.followed_hashtags || []), hashtag.id],
            hashtag_preferences: hashtagIntegration?.hashtag_preferences,
            hashtag_activity: hashtagIntegration?.hashtag_activity || [],
            last_updated: new Date().toISOString()
          }
        });
      }
    } catch (error) {
      console.error('Failed to follow hashtag:', error);
    }
  };

  // Handle hashtag unfollow
  const handleUnfollowHashtag = async (hashtag: Hashtag) => {
    try {
      const success = await unfollowHashtag(hashtag.id);
      if (success) {
        // Update local state
        setHashtagIntegration(prev => ({
          ...(prev || { user_id: '', last_updated: new Date().toISOString() }),
          followed_hashtags: (prev?.followed_hashtags || []).filter(id => id !== hashtag.id),
          last_updated: new Date().toISOString()
        }));
        
        // Update profile
        onUpdate({
          hashtags: {
            ...(hashtagIntegration || { user_id: '', last_updated: new Date().toISOString() }),
            followed_hashtags: (hashtagIntegration?.followed_hashtags || []).filter(id => id !== hashtag.id),
            last_updated: new Date().toISOString(),
            user_id: hashtagIntegration?.user_id || ''
          }
        });
      }
    } catch (error) {
      console.error('Failed to unfollow hashtag:', error);
    }
  };

  // Handle hashtag reordering
  const handleReorderHashtags = (reorderedHashtags: any[]) => {
    // Update local state with reordered hashtags
    setHashtagIntegration(prev => ({
      ...(prev || { user_id: '', last_updated: new Date().toISOString() }),
      followed_hashtags: reorderedHashtags.map(h => h.id),
      last_updated: new Date().toISOString(),
      user_id: prev?.user_id || ''
    }));
  };

  // Handle custom interests update
  const handleCustomInterestsUpdate = (interests: string[]) => {
    setHashtagIntegration(prev => ({
      ...(prev || { user_id: '', last_updated: new Date().toISOString() }),
      custom_hashtags: interests,
      last_updated: new Date().toISOString(),
      user_id: prev?.user_id || ''
    }));
    
    onUpdate({
      custom_interests: interests,
      hashtags: {
        ...(hashtagIntegration || { user_id: '', last_updated: new Date().toISOString() }),
        custom_hashtags: interests,
        last_updated: new Date().toISOString(),
        user_id: hashtagIntegration?.user_id || ''
      }
    });
  };

  // Handle primary hashtags update
  const handlePrimaryHashtagsUpdate = (hashtagIds: string[]) => {
    setHashtagIntegration(prev => ({
      ...(prev || { user_id: '', last_updated: new Date().toISOString() }),
      primary_hashtags: hashtagIds,
      last_updated: new Date().toISOString(),
      user_id: prev?.user_id || ''
    }));
    
    onUpdate({
      hashtags: {
        ...(hashtagIntegration || { user_id: '', last_updated: new Date().toISOString() }),
        primary_hashtags: hashtagIds,
        last_updated: new Date().toISOString(),
        user_id: hashtagIntegration?.user_id || ''
      }
    });
  };

  // Get followed hashtags
  const followedHashtagObjects = userHashtags.map(uh => uh.hashtag);
  const primaryHashtagObjects = followedHashtagObjects.filter(h => 
    hashtagIntegration?.primary_hashtags?.includes(h.id)
  );

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Hashtag Interests</h3>
          <p className="text-sm text-muted-foreground">
            Manage your hashtag interests and discover new ones
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsEditing(!isEditing)}
        >
          <Settings className="h-4 w-4 mr-2" />
          {isEditing ? 'Done' : 'Edit'}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Followed</p>
                <p className="text-2xl font-bold">{followedCount}</p>
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
              <Hash className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium">Custom</p>
                <p className="text-2xl font-bold">{hashtagIntegration?.custom_hashtags?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="interests">Interests</TabsTrigger>
          <TabsTrigger value="primary">Primary</TabsTrigger>
          <TabsTrigger value="custom">Custom</TabsTrigger>
          <TabsTrigger value="discover">Discover</TabsTrigger>
        </TabsList>

        {/* Interest Hashtags */}
        <TabsContent value="interests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Your Interest Hashtags
              </CardTitle>
            </CardHeader>
            <CardContent>
              {followedHashtagObjects.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>You haven&apos;t followed any hashtags yet</p>
                  <p className="text-sm">Discover trending hashtags to get started</p>
                </div>
              ) : (
                <HashtagDisplay
                  hashtags={followedHashtagObjects}
                  showCount={true}
                  showCategory={true}
                  clickable={true}
                  onFollow={handleFollowHashtag}
                  onUnfollow={handleUnfollowHashtag}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Primary Hashtags */}
        <TabsContent value="primary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hash className="h-5 w-5" />
                Primary Hashtags
                <Badge variant="secondary">{primaryHashtagObjects.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Select your most important hashtags that represent your core interests
              </p>
              
              {primaryHashtagObjects.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Hash className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No primary hashtags selected</p>
                  <p className="text-sm">Choose from your followed hashtags</p>
                </div>
              ) : (
                <HashtagDisplay
                  hashtags={primaryHashtagObjects}
                  showCount={true}
                  showCategory={true}
                  clickable={true}
                />
              )}
              
              {isEditing && followedHashtagObjects.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">Select Primary Hashtags:</p>
                  <div className="flex flex-wrap gap-2">
                    {followedHashtagObjects.map(hashtag => (
                      <Button
                        key={hashtag.id}
                        variant={hashtagIntegration?.primary_hashtags?.includes(hashtag.id) ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          const currentPrimary = hashtagIntegration?.primary_hashtags || [];
                          const isPrimary = currentPrimary.includes(hashtag.id);
                          const newPrimary = isPrimary
                            ? currentPrimary.filter(id => id !== hashtag.id)
                            : [...currentPrimary, hashtag.id];
                          handlePrimaryHashtagsUpdate(newPrimary);
                        }}
                      >
                        {hashtagIntegration?.primary_hashtags?.includes(hashtag.id) && (
                          <Hash className="h-3 w-3 mr-1" />
                        )}
                        {hashtag.display_name || hashtag.name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Custom Hashtags */}
        <TabsContent value="custom" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Custom Interests
                <Badge variant="secondary">{hashtagIntegration?.custom_hashtags?.length || 0}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Add your own custom hashtags for topics not covered by existing hashtags
              </p>
              
              <HashtagInput
                value={hashtagIntegration?.custom_hashtags || []}
                onChange={handleCustomInterestsUpdate}
                placeholder="Add custom hashtags..."
                maxTags={10}
                allowCustom={true}
                className="mb-4"
              />
              
              {hashtagIntegration?.custom_hashtags && hashtagIntegration.custom_hashtags.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Your Custom Hashtags:</p>
                  <div className="flex flex-wrap gap-2">
                    {hashtagIntegration.custom_hashtags.map((hashtag, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        <Hash className="h-3 w-3" />
                        {hashtag}
                        {isEditing && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 ml-1"
                            onClick={() => {
                              const newCustom = (hashtagIntegration?.custom_hashtags || []).filter((_: any, i: number) => i !== index);
                              handleCustomInterestsUpdate(newCustom);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Discover Hashtags */}
        <TabsContent value="discover" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Discover New Hashtags
              </CardTitle>
            </CardHeader>
            <CardContent>
              <HashtagManagement
                userHashtags={userHashtags}
                onFollow={handleFollowHashtag}
                onUnfollow={handleUnfollowHashtag}
                onReorder={handleReorderHashtags}
                showSuggestions={true}
              />
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
                <p className="font-medium">Total Followed:</p>
                <p className="text-muted-foreground">{followedCount} hashtags</p>
              </div>
              <div>
                <p className="font-medium">Primary Hashtags:</p>
                <p className="text-muted-foreground">{primaryHashtagObjects.length} selected</p>
              </div>
              <div>
                <p className="font-medium">Custom Hashtags:</p>
                <p className="text-muted-foreground">{hashtagIntegration?.custom_hashtags?.length || 0} created</p>
              </div>
              <div>
                <p className="font-medium">Last Updated:</p>
                <p className="text-muted-foreground">
                  {hashtagIntegration?.last_updated 
                    ? new Date(hashtagIntegration.last_updated).toLocaleDateString()
                    : 'Never'
                  }
                </p>
              </div>
            </div>
            
            <Separator />
            
            <div className="text-sm text-muted-foreground">
              <p>
                Your hashtag interests help personalize your experience and connect you with 
                relevant content across the platform. Primary hashtags are used for content 
                recommendations, while custom hashtags allow you to express unique interests.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
