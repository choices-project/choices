// ============================================================================
// PHASE 4: SOCIAL DISCOVERY FEATURES
// ============================================================================
// Agent A4 - Social Features Specialist
// 
// This module implements social discovery features with interest-based
// recommendations, network insights, and trending candidates for the Ranked
// Choice Democracy Revolution platform.
// 
// Features:
// - Interest-based recommendations with k-anonymity
// - Network insights from aggregated data only
// - Trending candidates detection
// - Community discussions
// - Social engagement tracking
// 
// Created: January 15, 2025
// Status: Phase 4 Implementation
// ============================================================================

import { devLog } from '@/lib/logger';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface UserProfile {
  id: string;
  age: number;
  education: string;
  location: string;
  interests: string[];
  demographics: Demographics;
  votingHistory: VotingRecord[];
}

export interface Demographics {
  ageGroup: string;
  education: string;
  location: string;
  politicalAffiliation?: string;
  incomeBracket?: string;
}

export interface VotingRecord {
  pollId: string;
  ranking: string[];
  timestamp: Date;
  category: string;
}

export interface InterestRecommendation {
  candidateId: string;
  candidateName: string;
  interest: string;
  alignmentScore: number;
  userCount: number;
  confidence: number;
  reason: string;
  privacyProtected: boolean;
}

export interface NetworkInsight {
  connectionId: string;
  connectionName: string;
  sharedInterests: string[];
  ranking: string[];
  confidence: number;
  privacyProtected: boolean;
}

export interface TrendingCandidate {
  candidateId: string;
  candidateName: string;
  trendScore: number;
  activityCount: number;
  trendDirection: 'up' | 'down' | 'stable';
  timeWindow: number;
  confidence: number;
  metadata: TrendingMetadata;
}

export interface TrendingMetadata {
  pollId: string;
  category: string;
  geographicArea: string;
  demographicGroup: string;
  interestCategories: string[];
}

export interface Activity {
  candidateId: string;
  timestamp: Date;
  intensity: number;
  type: 'vote' | 'view' | 'share' | 'discuss';
  userId?: string;
  metadata?: Record<string, any>;
}

export interface CommunityDiscussion {
  id: string;
  pollId: string;
  candidateId?: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: Date;
  updatedAt: Date;
  upvotes: number;
  downvotes: number;
  replies: number;
  isModerated: boolean;
  tags: string[];
}

export interface SocialEngagement {
  userId: string;
  pollId: string;
  actions: {
    voted: boolean;
    shared: boolean;
    discussed: boolean;
    recommended: boolean;
  };
  timestamp: Date;
  engagementScore: number;
}

// ============================================================================
// INTEREST RECOMMENDATION ENGINE
// ============================================================================

export class InterestRecommendationEngine {
  private static readonly K_ANONYMITY_THRESHOLD = 50;

  /**
   * Get interest-based recommendations for a user
   * @param userId - User ID
   * @param pollId - Poll ID
   * @returns Array of interest-based recommendations
   */
  static async getInterestBasedRecommendations(
    userId: string, 
    pollId: string
  ): Promise<InterestRecommendation[]> {
    try {
      const userInterests = await this.getUserInterests(userId);
      const poll = await this.getPoll(pollId);
      const aggregatedInsights = await this.getAggregatedInsights(pollId);
      
      if (!userInterests || !poll || !aggregatedInsights) {
        devLog('Missing data for interest recommendations');
        return [];
      }

      const recommendations: InterestRecommendation[] = [];
      
      // Find candidates that align with user interests
      for (const interest of userInterests) {
        const interestInsights = aggregatedInsights.interestBreakdowns[interest];
        if (interestInsights && interestInsights.userCount >= this.K_ANONYMITY_THRESHOLD) {
          const topCandidate = interestInsights.topCandidate;
          
          recommendations.push({
            candidateId: topCandidate.id,
            candidateName: topCandidate.name,
            interest: interest,
            alignmentScore: topCandidate.alignmentScore,
            userCount: this.applyDifferentialPrivacy(interestInsights.userCount, 0.8),
            confidence: interestInsights.confidence,
            reason: `People with ${interest} interest rank this candidate highly`,
            privacyProtected: true
          });
        }
      }
      
      // Sort by alignment score and return top recommendations
      return recommendations
        .sort((a, b) => b.alignmentScore - a.alignmentScore)
        .slice(0, 5);
    } catch (error) {
      devLog('Error getting interest-based recommendations:', error);
      return [];
    }
  }
  
  /**
   * Get network insights from user's connections
   * @param userId - User ID
   * @param pollId - Poll ID
   * @returns Array of network insights
   */
  static async getNetworkInsights(
    userId: string, 
    pollId: string
  ): Promise<NetworkInsight[]> {
    try {
      const userConnections = await this.getUserConnections(userId);
      const poll = await this.getPoll(pollId);
      
      if (!userConnections || !poll) {
        devLog('Missing connections or poll data for network insights');
        return [];
      }

      const insights: NetworkInsight[] = [];
      
      // Get aggregated insights from user's network
      for (const connection of userConnections) {
        const connectionInsights = await this.getConnectionInsights(connection.id, pollId);
        if (connectionInsights && connectionInsights.privacyProtected) {
          insights.push({
            connectionId: connection.id,
            connectionName: connection.name,
            sharedInterests: connection.sharedInterests,
            ranking: connectionInsights.ranking,
            confidence: connectionInsights.confidence,
            privacyProtected: true
          });
        }
      }
      
      return insights.filter(insight => insight.confidence > 0.6);
    } catch (error) {
      devLog('Error getting network insights:', error);
      return [];
    }
  }

  private static applyDifferentialPrivacy(count: number, epsilon: number = 0.8): number {
    const noise = this.laplaceNoise(epsilon);
    return Math.max(0, Math.round(count + noise));
  }

  private static laplaceNoise(epsilon: number): number {
    const u = Math.random() - 0.5;
    return -(1 / epsilon) * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
  }

  // Mock data methods - replace with real database calls
  private static async getUserInterests(userId: string): Promise<string[]> {
    return ['environment', 'education', 'technology'];
  }

  private static async getPoll(pollId: string): Promise<any> {
    return {
      id: pollId,
      title: 'Sample Poll',
      candidates: [
        { id: 'candidate1', name: 'Jane Smith' },
        { id: 'candidate2', name: 'John Doe' }
      ]
    };
  }

  private static async getAggregatedInsights(pollId: string): Promise<any> {
    return {
      interestBreakdowns: {
        'environment': {
          interest: 'environment',
          topCandidate: { id: 'candidate1', name: 'Jane Smith', alignmentScore: 0.9 },
          userCount: 75,
          confidence: 0.85
        },
        'education': {
          interest: 'education',
          topCandidate: { id: 'candidate2', name: 'John Doe', alignmentScore: 0.8 },
          userCount: 60,
          confidence: 0.8
        }
      }
    };
  }

  private static async getUserConnections(userId: string): Promise<any[]> {
    return [
      {
        id: 'connection1',
        name: 'Friend 1',
        sharedInterests: ['environment', 'technology']
      }
    ];
  }

  private static async getConnectionInsights(connectionId: string, pollId: string): Promise<any> {
    return {
      ranking: ['candidate1', 'candidate2'],
      confidence: 0.8,
      privacyProtected: true
    };
  }
}

// ============================================================================
// TRENDING CANDIDATES DETECTOR
// ============================================================================

export class TrendingCandidateDetector {
  /**
   * Detect trending candidates in a poll
   * @param pollId - Poll ID
   * @param timeWindow - Time window in milliseconds
   * @returns Array of trending candidates
   */
  static async detectTrendingCandidates(
    pollId: string, 
    timeWindow: number = 60 * 60 * 1000 // 1 hour
  ): Promise<TrendingCandidate[]> {
    try {
      const poll = await this.getPoll(pollId);
      const recentActivity = await this.getRecentActivity(pollId, timeWindow);
      
      if (!poll || !recentActivity) {
        devLog('Missing poll or activity data for trending detection');
        return [];
      }

      const trending: TrendingCandidate[] = [];
      
      for (const candidate of poll.candidates) {
        const candidateActivity = recentActivity.filter(
          activity => activity.candidateId === candidate.id
        );
        
        if (candidateActivity.length > 0) {
          const trendScore = this.calculateTrendScore(candidateActivity, timeWindow);
          
          if (trendScore > 0.7) {
            const metadata = await this.getTrendingMetadata(candidate.id, pollId);
            
            trending.push({
              candidateId: candidate.id,
              candidateName: candidate.name,
              trendScore,
              activityCount: candidateActivity.length,
              trendDirection: this.getTrendDirection(candidateActivity),
              timeWindow,
              confidence: this.calculateConfidence(candidateActivity),
              metadata
            });
          }
        }
      }
      
      return trending
        .sort((a, b) => b.trendScore - a.trendScore)
        .slice(0, 3); // Top 3 trending
    } catch (error) {
      devLog('Error detecting trending candidates:', error);
      return [];
    }
  }
  
  /**
   * Calculate trend score based on activity
   * @param activity - Array of activity records
   * @param timeWindow - Time window in milliseconds
   * @returns Trend score (0-1)
   */
  private static calculateTrendScore(
    activity: Activity[], 
    timeWindow: number
  ): number {
    // Calculate trend based on activity velocity and acceleration
    const timeBuckets = this.bucketActivityByTime(activity, timeWindow);
    const velocity = this.calculateVelocity(timeBuckets);
    const acceleration = this.calculateAcceleration(timeBuckets);
    
    return Math.min(1, Math.max(0, (velocity * 0.7 + acceleration * 0.3)));
  }
  
  /**
   * Get trend direction from activity
   * @param activity - Array of activity records
   * @returns Trend direction
   */
  private static getTrendDirection(activity: Activity[]): 'up' | 'down' | 'stable' {
    if (activity.length < 2) return 'stable';
    
    const recent = activity.slice(-5);
    const older = activity.slice(-10, -5);
    
    if (recent.length === 0 || older.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((sum, a) => sum + a.intensity, 0) / recent.length;
    const olderAvg = older.reduce((sum, a) => sum + a.intensity, 0) / older.length;
    
    const change = olderAvg > 0 ? (recentAvg - olderAvg) / olderAvg : 0;
    
    if (change > 0.1) return 'up';
    if (change < -0.1) return 'down';
    return 'stable';
  }

  /**
   * Calculate confidence in trend
   * @param activity - Array of activity records
   * @returns Confidence score (0-1)
   */
  private static calculateConfidence(activity: Activity[]): number {
    const activityCount = activity.length;
    const timeSpan = this.getTimeSpan(activity);
    const intensity = activity.reduce((sum, a) => sum + a.intensity, 0) / activity.length;
    
    // Higher confidence with more activity, longer time span, and higher intensity
    const countScore = Math.min(1, activityCount / 20);
    const timeScore = Math.min(1, timeSpan / (60 * 60 * 1000)); // 1 hour
    const intensityScore = Math.min(1, intensity / 2);
    
    return (countScore + timeScore + intensityScore) / 3;
  }

  private static bucketActivityByTime(activity: Activity[], timeWindow: number): number[] {
    const buckets: number[] = [];
    const bucketSize = timeWindow / 10; // 10 buckets
    
    for (let i = 0; i < 10; i++) {
      const bucketStart = Date.now() - timeWindow + (i * bucketSize);
      const bucketEnd = bucketStart + bucketSize;
      
      const bucketActivity = activity.filter(a => {
        const timestamp = a.timestamp.getTime();
        return timestamp >= bucketStart && timestamp < bucketEnd;
      });
      
      buckets.push(bucketActivity.length);
    }
    
    return buckets;
  }

  private static calculateVelocity(buckets: number[]): number {
    let velocity = 0;
    for (let i = 1; i < buckets.length; i++) {
      velocity += buckets[i] - buckets[i - 1];
    }
    return velocity / (buckets.length - 1);
  }

  private static calculateAcceleration(buckets: number[]): number {
    let acceleration = 0;
    for (let i = 2; i < buckets.length; i++) {
      const velocity1 = buckets[i] - buckets[i - 1];
      const velocity2 = buckets[i - 1] - buckets[i - 2];
      acceleration += velocity1 - velocity2;
    }
    return acceleration / (buckets.length - 2);
  }

  private static getTimeSpan(activity: Activity[]): number {
    if (activity.length < 2) return 0;
    
    const timestamps = activity.map(a => a.timestamp.getTime());
    const min = Math.min(...timestamps);
    const max = Math.max(...timestamps);
    
    return max - min;
  }

  private static async getTrendingMetadata(candidateId: string, pollId: string): Promise<TrendingMetadata> {
    // Mock implementation - replace with real data
    return {
      pollId,
      category: 'politics',
      geographicArea: 'San Francisco, CA',
      demographicGroup: '25-34',
      interestCategories: ['environment', 'education']
    };
  }

  // Mock data methods - replace with real database calls
  private static async getPoll(pollId: string): Promise<any> {
    return {
      id: pollId,
      candidates: [
        { id: 'candidate1', name: 'Jane Smith' },
        { id: 'candidate2', name: 'John Doe' },
        { id: 'candidate3', name: 'Bob Johnson' }
      ]
    };
  }

  private static async getRecentActivity(pollId: string, timeWindow: number): Promise<Activity[]> {
    // Mock implementation - replace with real database call
    const now = new Date();
    return [
      {
        candidateId: 'candidate1',
        timestamp: new Date(now.getTime() - 30 * 60 * 1000),
        intensity: 1.2,
        type: 'vote'
      },
      {
        candidateId: 'candidate1',
        timestamp: new Date(now.getTime() - 20 * 60 * 1000),
        intensity: 1.5,
        type: 'share'
      },
      {
        candidateId: 'candidate2',
        timestamp: new Date(now.getTime() - 15 * 60 * 1000),
        intensity: 0.8,
        type: 'view'
      }
    ];
  }
}

// ============================================================================
// COMMUNITY DISCUSSIONS MANAGER
// ============================================================================

export class CommunityDiscussionsManager {
  /**
   * Create a new discussion
   * @param discussion - Discussion data
   * @returns Created discussion
   */
  static async createDiscussion(discussion: Omit<CommunityDiscussion, 'id' | 'createdAt' | 'updatedAt'>): Promise<CommunityDiscussion> {
    try {
      const newDiscussion: CommunityDiscussion = {
        ...discussion,
        id: this.generateId(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await this.saveDiscussion(newDiscussion);
      devLog('Discussion created:', newDiscussion.id);
      
      return newDiscussion;
    } catch (error) {
      devLog('Error creating discussion:', error);
      throw error;
    }
  }

  /**
   * Get discussions for a poll
   * @param pollId - Poll ID
   * @param limit - Maximum number of discussions
   * @returns Array of discussions
   */
  static async getPollDiscussions(pollId: string, limit: number = 20): Promise<CommunityDiscussion[]> {
    try {
      const discussions = await this.getDiscussionsByPoll(pollId);
      
      // Sort by engagement (upvotes - downvotes + replies)
      return discussions
        .sort((a, b) => {
          const engagementA = a.upvotes - a.downvotes + a.replies;
          const engagementB = b.upvotes - b.downvotes + b.replies;
          return engagementB - engagementA;
        })
        .slice(0, limit);
    } catch (error) {
      devLog('Error getting poll discussions:', error);
      return [];
    }
  }

  /**
   * Get discussions for a candidate
   * @param candidateId - Candidate ID
   * @param limit - Maximum number of discussions
   * @returns Array of discussions
   */
  static async getCandidateDiscussions(candidateId: string, limit: number = 20): Promise<CommunityDiscussion[]> {
    try {
      const discussions = await this.getDiscussionsByCandidate(candidateId);
      
      return discussions
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, limit);
    } catch (error) {
      devLog('Error getting candidate discussions:', error);
      return [];
    }
  }

  /**
   * Vote on a discussion
   * @param discussionId - Discussion ID
   * @param userId - User ID
   * @param voteType - 'upvote' or 'downvote'
   * @returns Whether vote was recorded
   */
  static async voteOnDiscussion(
    discussionId: string, 
    userId: string, 
    voteType: 'upvote' | 'downvote'
  ): Promise<boolean> {
    try {
      const discussion = await this.getDiscussion(discussionId);
      if (!discussion) return false;

      // Check if user already voted
      const existingVote = await this.getUserVote(discussionId, userId);
      if (existingVote) {
        // Update existing vote
        await this.updateVote(discussionId, userId, voteType);
      } else {
        // Create new vote
        await this.createVote(discussionId, userId, voteType);
      }

      // Update discussion vote counts
      await this.updateDiscussionVotes(discussionId);
      
      return true;
    } catch (error) {
      devLog('Error voting on discussion:', error);
      return false;
    }
  }

  private static generateId(): string {
    return `discussion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Mock data methods - replace with real database calls
  private static async saveDiscussion(discussion: CommunityDiscussion): Promise<void> {
    devLog('Saving discussion:', discussion.id);
  }

  private static async getDiscussionsByPoll(pollId: string): Promise<CommunityDiscussion[]> {
    // Mock implementation
    return [
      {
        id: 'discussion1',
        pollId,
        title: 'Great discussion about the candidates',
        content: 'I think this is really interesting...',
        authorId: 'user1',
        authorName: 'John Doe',
        createdAt: new Date(),
        updatedAt: new Date(),
        upvotes: 15,
        downvotes: 2,
        replies: 8,
        isModerated: false,
        tags: ['politics', 'election']
      }
    ];
  }

  private static async getDiscussionsByCandidate(candidateId: string): Promise<CommunityDiscussion[]> {
    // Mock implementation
    return [];
  }

  private static async getDiscussion(discussionId: string): Promise<CommunityDiscussion | null> {
    // Mock implementation
    return null;
  }

  private static async getUserVote(discussionId: string, userId: string): Promise<any> {
    // Mock implementation
    return null;
  }

  private static async updateVote(discussionId: string, userId: string, voteType: string): Promise<void> {
    // Mock implementation
  }

  private static async createVote(discussionId: string, userId: string, voteType: string): Promise<void> {
    // Mock implementation
  }

  private static async updateDiscussionVotes(discussionId: string): Promise<void> {
    // Mock implementation
  }
}

// ============================================================================
// SOCIAL ENGAGEMENT TRACKER
// ============================================================================

export class SocialEngagementTracker {
  /**
   * Track social engagement for a user
   * @param engagement - Engagement data
   */
  static async trackEngagement(engagement: SocialEngagement): Promise<void> {
    try {
      await this.saveEngagement(engagement);
      await this.updateEngagementMetrics(engagement);
      devLog('Engagement tracked:', engagement.userId, engagement.pollId);
    } catch (error) {
      devLog('Error tracking engagement:', error);
    }
  }

  /**
   * Get engagement rate for a poll
   * @param pollId - Poll ID
   * @returns Engagement rate (0-1)
   */
  static async getPollEngagementRate(pollId: string): Promise<number> {
    try {
      const totalUsers = await this.getPollTotalUsers(pollId);
      const engagedUsers = await this.getEngagedUsers(pollId);
      
      return totalUsers > 0 ? engagedUsers / totalUsers : 0;
    } catch (error) {
      devLog('Error getting engagement rate:', error);
      return 0;
    }
  }

  /**
   * Get user engagement score
   * @param userId - User ID
   * @returns Engagement score (0-1)
   */
  static async getUserEngagementScore(userId: string): Promise<number> {
    try {
      const userEngagements = await this.getUserEngagements(userId);
      
      if (userEngagements.length === 0) return 0;
      
      const totalScore = userEngagements.reduce((sum, engagement) => sum + engagement.engagementScore, 0);
      return totalScore / userEngagements.length;
    } catch (error) {
      devLog('Error getting user engagement score:', error);
      return 0;
    }
  }

  // Mock data methods - replace with real database calls
  private static async saveEngagement(engagement: SocialEngagement): Promise<void> {
    devLog('Saving engagement:', engagement);
  }

  private static async updateEngagementMetrics(engagement: SocialEngagement): Promise<void> {
    devLog('Updating engagement metrics:', engagement);
  }

  private static async getPollTotalUsers(pollId: string): Promise<number> {
    // Mock implementation
    return 1000;
  }

  private static async getEngagedUsers(pollId: string): Promise<number> {
    // Mock implementation
    return 300;
  }

  private static async getUserEngagements(userId: string): Promise<SocialEngagement[]> {
    // Mock implementation
    return [
      {
        userId,
        pollId: 'poll1',
        actions: {
          voted: true,
          shared: true,
          discussed: false,
          recommended: true
        },
        timestamp: new Date(),
        engagementScore: 0.8
      }
    ];
  }
}

// ============================================================================
// EXPORTED CLASSES
// ============================================================================

export default {
  InterestRecommendationEngine,
  TrendingCandidateDetector,
  CommunityDiscussionsManager,
  SocialEngagementTracker
};
