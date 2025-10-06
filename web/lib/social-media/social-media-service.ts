/**
 * Social Media Service
 * Handles integration with social media APIs for representative data
 * Created: October 6, 2025
 */

import { createClient } from '@supabase/supabase-js';

// Types for social media data
export interface SocialMediaMetrics {
  platform: 'twitter' | 'facebook' | 'instagram' | 'linkedin' | 'youtube';
  followersCount: number;
  engagementRate: number;
  recentPostsCount: number;
  sentimentScore: number;
  verificationStatus: boolean;
  lastUpdated: Date;
  dataSource: string;
}

export interface SocialMediaPost {
  id: string;
  representativeId: string;
  platform: string;
  postId: string;
  content: string;
  engagementMetrics: {
    likes: number;
    shares: number;
    comments: number;
    views: number;
  };
  sentimentAnalysis: {
    score: number;
    magnitude: number;
    sentiment: 'positive' | 'negative' | 'neutral';
  };
  createdAt: Date;
}

export interface SocialMediaHandle {
  id: string;
  representativeId: string;
  platform: string;
  handle: string;
  url: string;
  isVerified: boolean;
  isActive: boolean;
  lastUpdated: Date;
}

export interface SentimentAnalysis {
  score: number;
  magnitude: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
}

export class SocialMediaService {
  private supabase;
  private apiKeys: {
    twitter: string;
    facebook: string;
    instagram: string;
    linkedin: string;
    youtube: string;
  };

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    this.apiKeys = {
      twitter: process.env.TWITTER_BEARER_TOKEN!,
      facebook: process.env.FACEBOOK_ACCESS_TOKEN!,
      instagram: process.env.INSTAGRAM_ACCESS_TOKEN!,
      linkedin: process.env.LINKEDIN_ACCESS_TOKEN!,
      youtube: process.env.YOUTUBE_API_KEY!
    };
  }

  /**
   * Get Twitter metrics for a representative
   */
  async getTwitterMetrics(handle: string): Promise<SocialMediaMetrics> {
    try {
      const response = await fetch(`https://api.twitter.com/2/users/by/username/${handle}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKeys.twitter}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Twitter API error: ${response.status}`);
      }

      const data = await response.json();
      const user = data.data;

      // Get additional metrics
      const metricsResponse = await fetch(`https://api.twitter.com/2/users/${user.id}?user.fields=public_metrics,verified`, {
        headers: {
          'Authorization': `Bearer ${this.apiKeys.twitter}`,
          'Content-Type': 'application/json'
        }
      });

      const metricsData = await metricsResponse.json();
      const metrics = metricsData.data.public_metrics;

      return {
        platform: 'twitter',
        followersCount: metrics.followers_count,
        engagementRate: this.calculateEngagementRate(metrics),
        recentPostsCount: metrics.tweet_count,
        sentimentScore: 0.75, // Placeholder - would need sentiment analysis
        verificationStatus: metricsData.data.verified,
        lastUpdated: new Date(),
        dataSource: 'twitter-api'
      };
    } catch (error) {
      console.error('Error fetching Twitter metrics:', error);
      throw error;
    }
  }

  /**
   * Get Facebook metrics for a representative
   */
  async getFacebookMetrics(pageId: string): Promise<SocialMediaMetrics> {
    try {
      const response = await fetch(`https://graph.facebook.com/v18.0/${pageId}?fields=followers_count,fan_count,posts.limit(10){likes,comments,shares}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKeys.facebook}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Facebook API error: ${response.status}`);
      }

      const data = await response.json();
      const followersCount = data.followers_count || data.fan_count || 0;
      const posts = data.posts?.data || [];

      return {
        platform: 'facebook',
        followersCount,
        engagementRate: this.calculateFacebookEngagementRate(posts),
        recentPostsCount: posts.length,
        sentimentScore: 0.68, // Placeholder - would need sentiment analysis
        verificationStatus: true, // Facebook pages are typically verified
        lastUpdated: new Date(),
        dataSource: 'facebook-api'
      };
    } catch (error) {
      console.error('Error fetching Facebook metrics:', error);
      throw error;
    }
  }

  /**
   * Get Instagram metrics for a representative
   */
  async getInstagramMetrics(handle: string): Promise<SocialMediaMetrics> {
    try {
      // Instagram Basic Display API
      const response = await fetch(`https://graph.instagram.com/v18.0/me?fields=id,username,media_count,followers_count,follows_count`, {
        headers: {
          'Authorization': `Bearer ${this.apiKeys.instagram}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Instagram API error: ${response.status}`);
      }

      const data = await response.json();

      return {
        platform: 'instagram',
        followersCount: data.followers_count || 0,
        engagementRate: 5.1, // Placeholder - would need engagement calculation
        recentPostsCount: data.media_count || 0,
        sentimentScore: 0.82, // Placeholder - would need sentiment analysis
        verificationStatus: true, // Instagram business accounts are typically verified
        lastUpdated: new Date(),
        dataSource: 'instagram-api'
      };
    } catch (error) {
      console.error('Error fetching Instagram metrics:', error);
      throw error;
    }
  }

  /**
   * Get LinkedIn metrics for a representative
   */
  async getLinkedInMetrics(profileId: string): Promise<SocialMediaMetrics> {
    try {
      const response = await fetch(`https://api.linkedin.com/v2/people/${profileId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKeys.linkedin}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`LinkedIn API error: ${response.status}`);
      }

      const data = await response.json();

      return {
        platform: 'linkedin',
        followersCount: 25000, // Placeholder - LinkedIn API has limited follower data
        engagementRate: 2.9, // Placeholder - would need engagement calculation
        recentPostsCount: 5, // Placeholder - would need post count
        sentimentScore: 0.71, // Placeholder - would need sentiment analysis
        verificationStatus: true, // LinkedIn profiles are typically verified
        lastUpdated: new Date(),
        dataSource: 'linkedin-api'
      };
    } catch (error) {
      console.error('Error fetching LinkedIn metrics:', error);
      throw error;
    }
  }

  /**
   * Get YouTube metrics for a representative
   */
  async getYouTubeMetrics(channelId: string): Promise<SocialMediaMetrics> {
    try {
      const response = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelId}&key=${this.apiKeys.youtube}`);

      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.status}`);
      }

      const data = await response.json();
      const stats = data.items?.[0]?.statistics;

      if (!stats) {
        throw new Error('YouTube channel not found');
      }

      return {
        platform: 'youtube',
        followersCount: parseInt(stats.subscriberCount) || 0,
        engagementRate: 6.3, // Placeholder - would need engagement calculation
        recentPostsCount: parseInt(stats.videoCount) || 0,
        sentimentScore: 0.79, // Placeholder - would need sentiment analysis
        verificationStatus: true, // YouTube channels are typically verified
        lastUpdated: new Date(),
        dataSource: 'youtube-api'
      };
    } catch (error) {
      console.error('Error fetching YouTube metrics:', error);
      throw error;
    }
  }

  /**
   * Get all social media handles for a representative
   */
  async getSocialMediaHandles(representativeId: string): Promise<SocialMediaHandle[]> {
    try {
      const { data, error } = await this.supabase
        .from('representative_social_handles')
        .select('*')
        .eq('representative_id', representativeId)
        .eq('is_active', true);

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching social media handles:', error);
      throw error;
    }
  }

  /**
   * Save social media metrics to database
   */
  async saveSocialMediaMetrics(representativeId: string, metrics: SocialMediaMetrics): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('representative_social_media_metrics')
        .upsert({
          representative_id: representativeId,
          platform: metrics.platform,
          followers_count: metrics.followersCount,
          engagement_rate: metrics.engagementRate,
          recent_posts_count: metrics.recentPostsCount,
          sentiment_score: metrics.sentimentScore,
          verification_status: metrics.verificationStatus,
          data_source: metrics.dataSource
        }, {
          onConflict: 'representative_id,platform'
        });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error saving social media metrics:', error);
      throw error;
    }
  }

  /**
   * Calculate engagement rate for Twitter
   */
  private calculateEngagementRate(metrics: any): number {
    const totalEngagement = metrics.like_count + metrics.retweet_count + metrics.reply_count;
    const totalImpressions = metrics.impression_count || 1000; // Fallback if impressions not available
    return (totalEngagement / totalImpressions) * 100;
  }

  /**
   * Calculate engagement rate for Facebook
   */
  private calculateFacebookEngagementRate(posts: any[]): number {
    if (posts.length === 0) return 0;
    
    const totalEngagement = posts.reduce((sum, post) => {
      return sum + (post.likes?.summary?.total_count || 0) + 
                   (post.comments?.summary?.total_count || 0) + 
                   (post.shares?.count || 0);
    }, 0);

    const totalReach = posts.length * 1000; // Estimated reach per post
    return (totalEngagement / totalReach) * 100;
  }

  /**
   * Analyze sentiment of social media content
   */
  async analyzeSentiment(content: string): Promise<SentimentAnalysis> {
    // This would integrate with a sentiment analysis service
    // For now, return a placeholder
    return {
      score: 0.75,
      magnitude: 0.5,
      sentiment: 'positive',
      confidence: 0.85
    };
  }

  /**
   * Get comprehensive social media data for a representative
   */
  async getRepresentativeSocialData(representativeId: string): Promise<SocialMediaMetrics[]> {
    try {
      const handles = await this.getSocialMediaHandles(representativeId);
      const metrics: SocialMediaMetrics[] = [];

      for (const handle of handles) {
        try {
          let platformMetrics: SocialMediaMetrics;

          switch (handle.platform) {
            case 'twitter':
              platformMetrics = await this.getTwitterMetrics(handle.handle);
              break;
            case 'facebook':
              platformMetrics = await this.getFacebookMetrics(handle.handle);
              break;
            case 'instagram':
              platformMetrics = await this.getInstagramMetrics(handle.handle);
              break;
            case 'linkedin':
              platformMetrics = await this.getLinkedInMetrics(handle.handle);
              break;
            case 'youtube':
              platformMetrics = await this.getYouTubeMetrics(handle.handle);
              break;
            default:
              continue;
          }

          metrics.push(platformMetrics);
          await this.saveSocialMediaMetrics(representativeId, platformMetrics);
        } catch (error) {
          console.error(`Error fetching ${handle.platform} metrics for ${representativeId}:`, error);
          // Continue with other platforms even if one fails
        }
      }

      return metrics;
    } catch (error) {
      console.error('Error fetching representative social data:', error);
      throw error;
    }
  }
}
