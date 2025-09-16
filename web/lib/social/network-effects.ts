// ============================================================================
// PHASE 4: NETWORK EFFECTS ENGINE
// ============================================================================
// Agent A4 - Social Features Specialist
// 
// This module implements network effects with diversity nudges, exposure caps,
// and counterfactual previews for the Ranked Choice Democracy Revolution platform.
// 
// Features:
// - Diversity nudges ("People unlike you rank...")
// - Exposure caps for recommendations
// - Counterfactual previews
// - Friend graph with invite codes
// - Network growth metrics
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

export interface AggregatedInsights {
  demographicBreakdowns: DemographicBreakdown[];
  geographicBreakdowns: GeographicBreakdown[];
  interestBreakdowns: Record<string, InterestBreakdown>;
  totalUsers: number;
  lastUpdated: Date;
}

export interface DemographicBreakdown {
  ageGroup: string;
  education: string;
  topCandidate: {
    id: string;
    name: string;
    alignmentScore: number;
  };
  userCount: number;
  confidence: number;
}

export interface GeographicBreakdown {
  area: string;
  topCandidate: {
    id: string;
    name: string;
    alignmentScore: number;
  };
  userCount: number;
  confidence: number;
}

export interface InterestBreakdown {
  interest: string;
  topCandidate: {
    id: string;
    name: string;
    alignmentScore: number;
  };
  userCount: number;
  confidence: number;
}

export interface DiversityNudge {
  type: 'cross-demographic' | 'geographic' | 'cross-interest' | 'similar-users';
  message: string;
  candidateId: string;
  candidateName: string;
  confidence: number;
  source: string;
  userCount: number;
  privacyProtected: boolean;
}

export interface CrossDemographicInsight {
  candidateId: string;
  candidateName: string;
  confidence: number;
  demographicGroup: string;
  userCount: number;
  privacyProtected: boolean;
}

export interface GeographicInsight {
  candidateId: string;
  candidateName: string;
  confidence: number;
  geographicArea: string;
  userCount: number;
  privacyProtected: boolean;
}

export interface CrossInterestInsight {
  candidateId: string;
  candidateName: string;
  confidence: number;
  interestCategory: string;
  userCount: number;
  privacyProtected: boolean;
}

export interface ExposureRecord {
  userId: string;
  contentType: 'cluster' | 'candidate' | 'viral' | 'diversity';
  contentId: string;
  timestamp: number;
  sessionId: string;
}

export interface CounterfactualPreview {
  scenario: string;
  description: string;
  impact: {
    candidateId: string;
    candidateName: string;
    change: number;
    direction: 'up' | 'down';
  };
  confidence: number;
  userCount: number;
}

export interface FriendConnection {
  id: string;
  userId: string;
  friendId: string;
  inviteCode: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: Date;
  acceptedAt?: Date;
}

export interface NetworkMetrics {
  totalConnections: number;
  activeConnections: number;
  inviteCodesGenerated: number;
  inviteCodesUsed: number;
  networkGrowth: number;
  engagementRate: number;
}

// ============================================================================
// DIVERSITY NUDGE ENGINE
// ============================================================================

export class DiversityNudgeEngine {
  private static readonly K_ANONYMITY_THRESHOLDS = {
    public: 100,
    loggedIn: 50,
    internal: 25
  };

  /**
   * Generate diversity nudges for a user
   * @param userId - User ID
   * @param userRanking - User's current ranking
   * @param pollId - Poll ID
   * @returns Array of diversity nudges
   */
  static async generateDiversityNudges(
    userId: string, 
    userRanking: string[], 
    pollId: string
  ): Promise<DiversityNudge[]> {
    try {
      const userProfile = await this.getUserProfile(userId);
      const poll = await this.getPoll(pollId);
      const aggregatedInsights = await this.getAggregatedInsights(pollId);
      
      if (!userProfile || !aggregatedInsights) {
        devLog('Missing user profile or aggregated insights for diversity nudges');
        return [];
      }

      const nudges: DiversityNudge[] = [];
      
      // "People unlike you rank..." insights
      const crossDemographicInsights = await this.getCrossDemographicInsights(
        userProfile, 
        aggregatedInsights
      );
      
      for (const insight of crossDemographicInsights) {
        if (insight.privacyProtected) {
          nudges.push({
            type: 'cross-demographic',
            message: `People in different age groups rank ${insight.candidateName} highly`,
            candidateId: insight.candidateId,
            candidateName: insight.candidateName,
            confidence: insight.confidence,
            source: 'aggregated_demographics',
            userCount: insight.userCount,
            privacyProtected: true
          });
        }
      }
      
      // "Across town..." insights
      const geographicInsights = await this.getGeographicInsights(
        userProfile.location, 
        aggregatedInsights
      );
      
      for (const insight of geographicInsights) {
        if (insight.privacyProtected) {
          nudges.push({
            type: 'geographic',
            message: `Across town, ${insight.candidateName} is trending`,
            candidateId: insight.candidateId,
            candidateName: insight.candidateName,
            confidence: insight.confidence,
            source: 'geographic_aggregates',
            userCount: insight.userCount,
            privacyProtected: true
          });
        }
      }
      
      // "People with different interests..." insights
      const crossInterestInsights = await this.getCrossInterestInsights(
        userProfile.interests, 
        aggregatedInsights
      );
      
      for (const insight of crossInterestInsights) {
        if (insight.privacyProtected) {
          nudges.push({
            type: 'cross-interest',
            message: `People with different interests also support ${insight.candidateName}`,
            candidateId: insight.candidateId,
            candidateName: insight.candidateName,
            confidence: insight.confidence,
            source: 'interest_aggregates',
            userCount: insight.userCount,
            privacyProtected: true
          });
        }
      }
      
      // Filter by confidence and return top nudges
      return nudges
        .filter(nudge => nudge.confidence > 0.7)
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 5);
    } catch (error) {
      devLog('Error generating diversity nudges:', error);
      return [];
    }
  }

  /**
   * Get cross-demographic insights
   */
  private static async getCrossDemographicInsights(
    userProfile: UserProfile, 
    insights: AggregatedInsights
  ): Promise<CrossDemographicInsight[]> {
    const userAgeGroup = this.getAgeGroup(userProfile.age);
    const userEducation = userProfile.education;
    
    return insights.demographicBreakdowns
      .filter(breakdown => 
        breakdown.ageGroup !== userAgeGroup || 
        breakdown.education !== userEducation
      )
      .map(breakdown => ({
        candidateId: breakdown.topCandidate.id,
        candidateName: breakdown.topCandidate.name,
        confidence: breakdown.confidence,
        demographicGroup: `${breakdown.ageGroup} ${breakdown.education}`,
        userCount: breakdown.userCount,
        privacyProtected: breakdown.userCount >= this.K_ANONYMITY_THRESHOLDS.loggedIn
      }));
  }

  /**
   * Get geographic insights
   */
  private static async getGeographicInsights(
    userLocation: string, 
    insights: AggregatedInsights
  ): Promise<GeographicInsight[]> {
    return insights.geographicBreakdowns
      .filter(breakdown => breakdown.area !== userLocation)
      .map(breakdown => ({
        candidateId: breakdown.topCandidate.id,
        candidateName: breakdown.topCandidate.name,
        confidence: breakdown.confidence,
        geographicArea: breakdown.area,
        userCount: breakdown.userCount,
        privacyProtected: breakdown.userCount >= this.K_ANONYMITY_THRESHOLDS.public
      }));
  }

  /**
   * Get cross-interest insights
   */
  private static async getCrossInterestInsights(
    userInterests: string[], 
    insights: AggregatedInsights
  ): Promise<CrossInterestInsight[]> {
    return Object.values(insights.interestBreakdowns)
      .filter(breakdown => !userInterests.includes(breakdown.interest))
      .map(breakdown => ({
        candidateId: breakdown.topCandidate.id,
        candidateName: breakdown.topCandidate.name,
        confidence: breakdown.confidence,
        interestCategory: breakdown.interest,
        userCount: breakdown.userCount,
        privacyProtected: breakdown.userCount >= this.K_ANONYMITY_THRESHOLDS.loggedIn
      }));
  }

  private static getAgeGroup(age: number): string {
    if (age < 25) return '18-24';
    if (age < 35) return '25-34';
    if (age < 50) return '35-49';
    if (age < 65) return '50-64';
    return '65+';
  }

  // Mock data methods - replace with real database calls
  private static async getUserProfile(userId: string): Promise<UserProfile | null> {
    return {
      id: userId,
      age: 28,
      education: 'college',
      location: 'San Francisco, CA',
      interests: ['environment', 'education', 'technology'],
      demographics: {
        ageGroup: '25-34',
        education: 'college',
        location: 'San Francisco, CA',
        politicalAffiliation: 'independent',
        incomeBracket: 'middle'
      },
      votingHistory: []
    };
  }

  private static async getPoll(pollId: string): Promise<any> {
    return { id: pollId, title: 'Sample Poll' };
  }

  private static async getAggregatedInsights(pollId: string): Promise<AggregatedInsights> {
    return {
      demographicBreakdowns: [
        {
          ageGroup: '35-50',
          education: 'graduate',
          topCandidate: { id: 'candidate1', name: 'Jane Smith', alignmentScore: 0.8 },
          userCount: 75,
          confidence: 0.85
        }
      ],
      geographicBreakdowns: [
        {
          area: 'Oakland, CA',
          topCandidate: { id: 'candidate2', name: 'John Doe', alignmentScore: 0.7 },
          userCount: 120,
          confidence: 0.8
        }
      ],
      interestBreakdowns: {
        'healthcare': {
          interest: 'healthcare',
          topCandidate: { id: 'candidate3', name: 'Bob Johnson', alignmentScore: 0.9 },
          userCount: 60,
          confidence: 0.9
        }
      },
      totalUsers: 500,
      lastUpdated: new Date()
    };
  }
}

// ============================================================================
// EXPOSURE CAP MANAGER
// ============================================================================

export class ExposureCapManager {
  private static readonly CAPS = {
    sameClusterPerSession: 3,
    sameCandidatePerDay: 5,
    viralMomentsPerHour: 2,
    diversityNudgesPerSession: 5
  };

  /**
   * Check if user can be exposed to content
   * @param userId - User ID
   * @param contentType - Type of content
   * @param contentId - Content ID
   * @returns Whether exposure is allowed
   */
  static async checkExposureCap(
    userId: string, 
    contentType: 'cluster' | 'candidate' | 'viral' | 'diversity',
    contentId: string
  ): Promise<boolean> {
    try {
      const session = await this.getCurrentSession(userId);
      const today = new Date().toDateString();
      const lastHour = new Date(Date.now() - 60 * 60 * 1000);
      
      switch (contentType) {
        case 'cluster':
          const clusterCount = await this.getClusterExposureCount(userId, session.id);
          return clusterCount < this.CAPS.sameClusterPerSession;
          
        case 'candidate':
          const candidateCount = await this.getCandidateExposureCount(userId, contentId, today);
          return candidateCount < this.CAPS.sameCandidatePerDay;
          
        case 'viral':
          const viralCount = await this.getViralExposureCount(userId, lastHour);
          return viralCount < this.CAPS.viralMomentsPerHour;
          
        case 'diversity':
          const diversityCount = await this.getDiversityExposureCount(userId, session.id);
          return diversityCount < this.CAPS.diversityNudgesPerSession;
          
        default:
          return true;
      }
    } catch (error) {
      devLog('Error checking exposure cap:', error);
      return true; // Allow exposure on error
    }
  }
  
  /**
   * Record exposure event
   * @param userId - User ID
   * @param contentType - Type of content
   * @param contentId - Content ID
   */
  static   async recordExposure(
    userId: string, 
    contentType: 'cluster' | 'candidate' | 'viral' | 'diversity', 
    contentId: string
  ): Promise<void> {
    try {
      const exposure: ExposureRecord = {
        userId,
        contentType,
        contentId,
        timestamp: Date.now(),
        sessionId: await this.getCurrentSessionId(userId)
      };
      
      await this.recordExposureEvent(exposure);
      devLog('Exposure recorded:', exposure);
    } catch (error) {
      devLog('Error recording exposure:', error);
    }
  }

  private static async getClusterExposureCount(userId: string, sessionId: string): Promise<number> {
    // Mock implementation - replace with real database call
    return 1;
  }

  private static async getCandidateExposureCount(userId: string, candidateId: string, date: string): Promise<number> {
    // Mock implementation - replace with real database call
    return 2;
  }

  private static async getViralExposureCount(userId: string, since: Date): Promise<number> {
    // Mock implementation - replace with real database call
    return 1;
  }

  private static async getDiversityExposureCount(userId: string, sessionId: string): Promise<number> {
    // Mock implementation - replace with real database call
    return 2;
  }

  private static async getCurrentSession(userId: string): Promise<{ id: string }> {
    // Mock implementation - replace with real session management
    return { id: `session_${userId}_${Date.now()}` };
  }

  private static async getCurrentSessionId(userId: string): Promise<string> {
    const session = await this.getCurrentSession(userId);
    return session.id;
  }

  private static async recordExposureEvent(exposure: ExposureRecord): Promise<void> {
    // Mock implementation - replace with real database call
    devLog('Recording exposure event:', exposure);
  }
}

// ============================================================================
// COUNTERFACTUAL PREVIEW ENGINE
// ============================================================================

export class CounterfactualPreviewEngine {
  /**
   * Generate counterfactual previews for a user's ranking
   * @param userId - User ID
   * @param currentRanking - Current ranking
   * @param pollId - Poll ID
   * @returns Array of counterfactual previews
   */
  static async generateCounterfactualPreviews(
    userId: string,
    currentRanking: string[],
    pollId: string
  ): Promise<CounterfactualPreview[]> {
    try {
      const poll = await this.getPoll(pollId);
      const aggregatedInsights = await this.getAggregatedInsights(pollId);
      
      if (!poll || !aggregatedInsights) {
        return [];
      }

      const previews: CounterfactualPreview[] = [];
      
      // "If you added one more rank..." previews
      const availableCandidates = poll.candidates.filter(
        (candidate: any) => !currentRanking.includes(candidate.id)
      );
      
      for (const candidate of availableCandidates.slice(0, 3)) {
        const impact = await this.calculateRankingImpact(
          currentRanking,
          candidate.id,
          aggregatedInsights
        );
        
        if (impact.confidence > 0.6) {
          previews.push({
            scenario: 'add_rank',
            description: `If you ranked ${candidate.name} as your next choice...`,
            impact: {
              candidateId: candidate.id,
              candidateName: candidate.name,
              change: impact.change,
              direction: impact.direction
            },
            confidence: impact.confidence,
            userCount: impact.userCount
          });
        }
      }
      
      return previews.sort((a, b) => b.confidence - a.confidence);
    } catch (error) {
      devLog('Error generating counterfactual previews:', error);
      return [];
    }
  }

  private static async calculateRankingImpact(
    currentRanking: string[],
    newCandidateId: string,
    insights: AggregatedInsights
  ): Promise<{
    change: number;
    direction: 'up' | 'down';
    confidence: number;
    userCount: number;
  }> {
    // Mock implementation - calculate impact of adding candidate to ranking
    return {
      change: 0.15,
      direction: 'up',
      confidence: 0.8,
      userCount: 150
    };
  }

  private static async getPoll(pollId: string): Promise<any> {
    // Mock implementation
    return {
      id: pollId,
      candidates: [
        { id: 'candidate1', name: 'Jane Smith' },
        { id: 'candidate2', name: 'John Doe' },
        { id: 'candidate3', name: 'Bob Johnson' }
      ]
    };
  }

  private static async getAggregatedInsights(pollId: string): Promise<AggregatedInsights> {
    // Mock implementation
    return {
      demographicBreakdowns: [],
      geographicBreakdowns: [],
      interestBreakdowns: {},
      totalUsers: 500,
      lastUpdated: new Date()
    };
  }
}

// ============================================================================
// FRIEND GRAPH MANAGER
// ============================================================================

export class FriendGraphManager {
  /**
   * Generate invite code for user
   * @param userId - User ID
   * @returns Invite code
   */
  static async generateInviteCode(userId: string): Promise<string> {
    const code = `CHOICES_${userId.slice(-8)}_${Date.now().toString(36).toUpperCase()}`;
    await this.recordInviteCode(userId, code);
    return code;
  }

  /**
   * Accept invite code
   * @param userId - User ID
   * @param inviteCode - Invite code
   * @returns Whether invite was accepted
   */
  static async acceptInviteCode(userId: string, inviteCode: string): Promise<boolean> {
    try {
      const connection = await this.findInviteCode(inviteCode);
      if (!connection || connection.status !== 'pending') {
        return false;
      }

      await this.updateConnectionStatus(connection.id, 'accepted');
      await this.recordNetworkMetrics();
      
      return true;
    } catch (error) {
      devLog('Error accepting invite code:', error);
      return false;
    }
  }

  /**
   * Get user's network connections
   * @param userId - User ID
   * @returns Array of connections
   */
  static async getUserConnections(userId: string): Promise<FriendConnection[]> {
    // Mock implementation - replace with real database call
    return [
      {
        id: 'connection1',
        userId,
        friendId: 'friend1',
        inviteCode: 'CHOICES_12345678_ABC123',
        status: 'accepted',
        createdAt: new Date(),
        acceptedAt: new Date()
      }
    ];
  }

  /**
   * Get network metrics
   * @returns Network metrics
   */
  static async getNetworkMetrics(): Promise<NetworkMetrics> {
    // Mock implementation - replace with real database call
    return {
      totalConnections: 1250,
      activeConnections: 980,
      inviteCodesGenerated: 2100,
      inviteCodesUsed: 1250,
      networkGrowth: 0.15,
      engagementRate: 0.78
    };
  }

  private static async recordInviteCode(userId: string, code: string): Promise<void> {
    // Mock implementation - replace with real database call
    devLog('Recording invite code:', { userId, code });
  }

  private static async findInviteCode(code: string): Promise<FriendConnection | null> {
    // Mock implementation - replace with real database call
    return {
      id: 'connection1',
      userId: 'user1',
      friendId: 'user2',
      inviteCode: code,
      status: 'pending',
      createdAt: new Date()
    };
  }

  private static async updateConnectionStatus(connectionId: string, status: string): Promise<void> {
    // Mock implementation - replace with real database call
    devLog('Updating connection status:', { connectionId, status });
  }

  private static async recordNetworkMetrics(): Promise<void> {
    // Mock implementation - replace with real database call
    devLog('Recording network metrics');
  }
}

// ============================================================================
// EXPORTED CLASSES
// ============================================================================

export default {
  DiversityNudgeEngine,
  ExposureCapManager,
  CounterfactualPreviewEngine,
  FriendGraphManager
};
