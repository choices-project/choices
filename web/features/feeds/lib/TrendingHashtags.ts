/**
 * Trending Hashtags System
 * 
 * Tracks hashtag-style interests and identifies trending content
 * for viral content discovery and user engagement
 */

import { devLog } from '@/lib/utils/logger';

// Local type definitions
export type HashtagAnalytics = {
  hashtag: string;
  usageCount: number;
  trendScore: number;
  engagementRate: number;
  lastUsed: Date;
  totalHashtags?: number;
  trendingHashtags?: TrendingHashtag[];
  categoryBreakdown?: Record<string, number>;
  userEngagement?: Record<string, number>;
  viralPotential?: TrendingHashtag[];
}

export type TrendingHashtag = {
  hashtag: string;
  trendScore: number;
  usageCount: number;
  growthRate: number;
  category?: string;
}

export type HashtagUsage = {
  hashtag: string;
  count: number;
  lastUsed: Date;
  users: string[];
  source?: string;
  userId?: string;
  timestamp?: string;
  metadata?: Record<string, any>;
}

// Types are now imported from ../types

export class TrendingHashtagsTracker {
  private static instance: TrendingHashtagsTracker;
  private hashtagUsage: HashtagUsage[] = [];
  private trendingCache: TrendingHashtag[] = [];
  private lastUpdate: Date = new Date();

  public static getInstance(): TrendingHashtagsTracker {
    if (!TrendingHashtagsTracker.instance) {
      TrendingHashtagsTracker.instance = new TrendingHashtagsTracker();
    }
    return TrendingHashtagsTracker.instance;
  }

  /**
   * Track hashtag usage
   */
  trackHashtagUsage(usage: HashtagUsage): void {
    try {
      // Store locally (in production, this would go to database)
      this.hashtagUsage.push(usage);
      
      // Update trending cache
      this.updateTrendingCache();
      
      devLog('Hashtag usage tracked:', { usage });
    } catch (error) {
      devLog('Error tracking hashtag usage:', { error });
    }
  }

  /**
   * Track multiple hashtag usages (e.g., from onboarding)
   */
  trackMultipleHashtags(hashtags: string[], userId: string, source: HashtagUsage['source']): void {
    const timestamp = new Date().toISOString();
    
    for (const hashtag of hashtags) {
      this.trackHashtagUsage({
        hashtag: hashtag.toLowerCase().trim(),
        userId,
        timestamp,
        source,
        count: 1,
        lastUsed: new Date(),
        users: [userId]
      });
    }
  }

  /**
   * Get trending hashtags
   */
  getTrendingHashtags(limit = 20): TrendingHashtag[] {
    // Return cached results if recent
    if (this.trendingCache.length > 0 && 
        Date.now() - this.lastUpdate.getTime() < 5 * 60 * 1000) { // 5 minutes
      return this.trendingCache.slice(0, limit);
    }

    this.updateTrendingCache();
    return this.trendingCache.slice(0, limit);
  }

  /**
   * Get hashtag analytics
   */
  getHashtagAnalytics(): HashtagAnalytics {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Filter recent usage
    const recentUsage = this.hashtagUsage.filter(usage => 
      usage.timestamp && new Date(usage.timestamp) > last24Hours
    );

    // Calculate trending hashtags
    let trendingHashtags = this.calculateTrendingHashtags(recentUsage);

    // Build 7-day baseline (exclude the last 24h window)
    const baselineCounts: Record<string, number> = {};
    this.hashtagUsage.forEach(u => {
      if (u.timestamp) {
        const t = new Date(u.timestamp);
        if (t > last7Days && t <= last24Hours) {
          baselineCounts[u.hashtag] = (baselineCounts[u.hashtag] ?? 0) + 1;
        }
      }
    });

    // Normalize trending score by 7-day baseline
    trendingHashtags = trendingHashtags.map(h => {
      const baselinePerDay = (baselineCounts[h.hashtag] ?? 0) / 7;
      // Adjustment factor emphasizes spikes above baseline, bounded for stability
      const factor = 1 + Math.min(0.5, (h.usageCount - baselinePerDay) / (baselinePerDay + 1)) * 0.3;
      return Object.assign({}, h, {
        trendScore: Number((h.trendScore * factor).toFixed(2))
      });
    });

    // Category breakdown
    const categoryBreakdown: Record<string, number> = {};
    recentUsage.forEach(usage => {
      const category = usage.metadata?.category ?? 'general';
      categoryBreakdown[category] = (categoryBreakdown[category] ?? 0) + 1;
    });

    // User engagement
    const userEngagement: Record<string, number> = {};
    recentUsage.forEach(usage => {
      if (usage.userId) {
        userEngagement[usage.userId] = (userEngagement[usage.userId] ?? 0) + 1;
      }
    });

    // Viral potential (hashtags with high growth rate and engagement)
    const viralPotential = trendingHashtags
      .filter(hashtag => hashtag.growthRate > 50 && hashtag.usageCount > 5)
      .sort((a, b) => b.trendScore - a.trendScore)
      .slice(0, 10);

    return {
      hashtag: 'all',
      usageCount: this.hashtagUsage.length,
      trendScore: trendingHashtags.length > 0 ? trendingHashtags[0]?.trendScore ?? 0 : 0,
      engagementRate: Object.keys(userEngagement).length > 0 ? Object.values(userEngagement).reduce((a, b) => a + b, 0) / Object.keys(userEngagement).length : 0,
      lastUsed: new Date(),
      totalHashtags: new Set(this.hashtagUsage.map(u => u.hashtag)).size,
      trendingHashtags: trendingHashtags.slice(0, 20),
      categoryBreakdown,
      userEngagement,
      viralPotential
    };
  }

  /**
   * Get suggested hashtags for a user based on their interests
   */
  getSuggestedHashtags(userInterests: string[], limit = 10): string[] {
    const analytics = this.getHashtagAnalytics();
    
    // Find hashtags that are trending and related to user interests
    const relatedTrending = analytics.trendingHashtags?.filter((hashtag: any) => {
      return userInterests.some(interest => 
        hashtag.hashtag.includes(interest) || 
        interest.includes(hashtag.hashtag) ||
        this.calculateSimilarity(hashtag.hashtag, interest) > 0.3
      );
    }) ?? [];

    // Add some viral potential hashtags
    const viralSuggestions = analytics.viralPotential
      ?.filter((hashtag: any) => !userInterests.includes(hashtag.hashtag))
      .slice(0, 5) ?? [];

    return [
      ...relatedTrending.map((h: any) => h.hashtag),
      ...viralSuggestions.map((h: any) => h.hashtag)
    ].slice(0, limit);
  }

  /**
   * Get hashtag performance for admin dashboard
   */
  getHashtagPerformance(hashtag: string): {
    hashtag: string;
    totalUsage: number;
    uniqueUsers: number;
    growthRate: number;
    topCategories: string[];
    recentActivity: HashtagUsage[];
  } {
    const hashtagUsage = this.hashtagUsage.filter(u => u.hashtag === hashtag);
    const uniqueUsers = new Set(hashtagUsage.map(u => u.userId)).size;
    
    // Calculate growth rate (last 7 days vs previous 7 days)
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const previous7Days = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    
    const recentUsage = hashtagUsage.filter(u => u.timestamp && new Date(u.timestamp) > last7Days).length;
    const previousUsage = hashtagUsage.filter(u => {
      if (!u.timestamp) return false;
      const date = new Date(u.timestamp);
      return date > previous7Days && date <= last7Days;
    }).length;
    
    const growthRate = previousUsage > 0 ? ((recentUsage - previousUsage) / previousUsage) * 100 : 0;
    
    // Top categories
    const categoryCount: Record<string, number> = {};
    hashtagUsage.forEach(usage => {
      const category = usage.metadata?.category ?? 'general';
      categoryCount[category] = (categoryCount[category] ?? 0) + 1;
    });
    
    const topCategories = Object.entries(categoryCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([category]) => category);

    return {
      hashtag,
      totalUsage: hashtagUsage.length,
      uniqueUsers,
      growthRate,
      topCategories,
      recentActivity: hashtagUsage.slice(-10)
    };
  }

  // Private helper methods

  private updateTrendingCache(): void {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last48Hours = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    // Prune entries older than 48 hours to keep memory bounded and focus on recency
    this.hashtagUsage = this.hashtagUsage.filter(usage => {
      return usage.timestamp && new Date(usage.timestamp) > last48Hours;
    });

    const recentUsage = this.hashtagUsage.filter(usage => 
      usage.timestamp && new Date(usage.timestamp) > last24Hours
    );

    this.trendingCache = this.calculateTrendingHashtags(recentUsage);
    this.lastUpdate = now;
  }

  private calculateTrendingHashtags(usage: HashtagUsage[]): TrendingHashtag[] {
    const hashtagStats: Record<string, {
      usageCount: number;
      uniqueUsers: Set<string>;
      categories: Set<string>;
      lastUsed: string;
      previousCount: number;
    }> = {};

    // Count current usage
    usage.forEach(usage => {
      if (!hashtagStats[usage.hashtag]) {
        hashtagStats[usage.hashtag] = {
          usageCount: 0,
          uniqueUsers: new Set(),
          categories: new Set(),
          lastUsed: usage.timestamp || new Date().toISOString(),
          previousCount: 0
        };
      }
      
      const stats = hashtagStats[usage.hashtag];
      if (stats) {
        stats.usageCount++;
        if (usage.userId) {
          stats.uniqueUsers.add(usage.userId);
        }
        if (usage.metadata?.category) {
          stats.categories.add(usage.metadata.category);
        }
        if (usage.timestamp && usage.timestamp > stats.lastUsed) {
          stats.lastUsed = usage.timestamp;
        }
      }
    });

    // Calculate previous period usage for growth rate
    const now = new Date();
    const last48Hours = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const previousUsage = this.hashtagUsage.filter(usage => {
      if (!usage.timestamp) return false;
      const date = new Date(usage.timestamp);
      return date > last48Hours && date <= last24Hours;
    });

    previousUsage.forEach(usage => {
      const stats = hashtagStats[usage.hashtag];
      if (stats) {
        stats.previousCount++;
      }
    });

    // Convert to TrendingHashtag objects
    const trendingHashtags: TrendingHashtag[] = Object.entries(hashtagStats).map(([hashtag, stats]) => {
      const growthRate = stats.previousCount > 0 
        ? ((stats.usageCount - stats.previousCount) / stats.previousCount) * 100 
        : stats.usageCount > 0 ? 100 : 0;

      // Calculate trending score (usage count + growth rate + unique users)
      const trendingScore = stats.usageCount + (growthRate * 0.1) + (stats.uniqueUsers.size * 0.5);

      return {
        hashtag,
        usageCount: stats.usageCount,
        growthRate,
        recentUsers: Array.from(stats.uniqueUsers),
        categories: Array.from(stats.categories),
        lastUsed: stats.lastUsed,
        trendScore: trendingScore
      };
    });

    // Sort by trending score
    return trendingHashtags.sort((a, b) => b.trendScore - a.trendScore);
  }

  private calculateSimilarity(str1: string, str2: string): number {
    // Simple similarity calculation based on common words
    const words1 = str1.split('-');
    const words2 = str2.split('-');
    const commonWords = words1.filter(word => words2.includes(word));
    return commonWords.length / Math.max(words1.length, words2.length);
  }
}

// Export singleton instance
export const trendingHashtagsTracker = TrendingHashtagsTracker.getInstance();
