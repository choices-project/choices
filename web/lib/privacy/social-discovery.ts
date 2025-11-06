// ============================================================================
// PHASE 2: PRIVACY-FIRST SOCIAL DISCOVERY
// ============================================================================
// Agent A2 - Privacy Specialist
// 
// This module implements privacy-first social discovery with aggregated
// insights only for the Ranked Choice Democracy Revolution platform.
// 
// Features:
// - Aggregated insights only (no individual data)
// - On-device similarity computation
// - Public centroids system
// - Opt-in discovery mechanisms
// - Cross-demographic insights with privacy protection

import { withOptional } from '@/lib/util/objects';
// 
// Created: January 15, 2025
// Status: Phase 2 Implementation
// ============================================================================

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export type UserProfile = {
  id: string;
  age: number;
  education: string;
  location: string;
  interests: string[];
  votingHistory: VotingRecord[];
  demographics: Demographics;
}

export type Demographics = {
  ageGroup: string;
  education: string;
  location: string;
  politicalAffiliation?: string;
  incomeBracket?: string;
}

export type VotingRecord = {
  pollId: string;
  ranking: string[];
  timestamp: Date;
  category: string;
}

export type AggregatedInsight = {
  type: 'cross-demographic' | 'geographic' | 'cross-interest' | 'similar-users';
  candidateId: string;
  candidateName: string;
  confidence: number;
  userCount: number;
  source: string;
  description: string;
  privacyProtected: boolean;
}

export type SimilarUser = {
  type: 'aggregated';
  sharedInterests: string[];
  userCount: number;
  averageRanking: Record<string, number>;
  confidence: number;
  privacyMetadata: {
    kAnonymity: boolean;
    differentialPrivacy: boolean;
    aggregationLevel: 'high' | 'medium' | 'low';
  };
}

export type ClusterInsight = {
  clusterId: string;
  similarity: number;
  insights: AggregatedInsight[];
  userCount: number;
  privacyProtected: boolean;
}

export type PublicCentroid = {
  id: string;
  coordinates: number[];
  userCount: number;
  interests: string[];
  averageRankings: Record<string, number>;
  lastUpdated: Date;
  privacyMetadata: {
    kAnonymity: boolean;
    aggregationLevel: 'high' | 'medium' | 'low';
  };
}

export type CrossDemographicInsight = {
  candidateId: string;
  candidateName: string;
  confidence: number;
  demographicGroup: string;
  userCount: number;
  privacyProtected: boolean;
}

export type GeographicInsight = {
  candidateId: string;
  candidateName: string;
  confidence: number;
  geographicArea: string;
  userCount: number;
  privacyProtected: boolean;
}

type DemographicBreakdown = {
  ageGroup: string;
  education: string;
  topCandidate: {
    id: string;
    name: string;
  };
  confidence: number;
  userCount: number;
}

type GeographicBreakdown = {
  area: string;
  topCandidate: {
    id: string;
    name: string;
  };
  confidence: number;
  userCount: number;
}

type InterestBreakdown = {
  interest: string;
  topCandidate: {
    id: string;
    name: string;
  };
  confidence: number;
  userCount: number;
}

type AggregatedInsightsData = {
  demographicBreakdowns?: DemographicBreakdown[];
  geographicBreakdowns?: GeographicBreakdown[];
  interestBreakdowns?: InterestBreakdown[];
}

export type CrossInterestInsight = {
  candidateId: string;
  candidateName: string;
  confidence: number;
  interestCategory: string;
  userCount: number;
  privacyProtected: boolean;
}

// ============================================================================
// PRIVACY-AWARE SOCIAL DISCOVERY MANAGER
// ============================================================================

export class PrivacyAwareSocialDiscoveryManager {
  private publicCentroids: Map<string, PublicCentroid> = new Map();
  private aggregatedInsights: Map<string, AggregatedInsight[]> = new Map();
  private kAnonymityThresholds = {
    public: 100,
    loggedIn: 50,
    internal: 25
  };

  constructor() {
    this.initializePublicCentroids();
  }

  // ============================================================================
  // MAIN SOCIAL DISCOVERY FUNCTION
  // ============================================================================

  /**
   * Find similar users with privacy protection
   * @param userId - User ID
   * @param userInterests - User interests
   * @param pollId - Poll ID
   * @returns Privacy-protected similar user insights
   */
  async findSimilarUsers(
    userId: string, 
    userInterests: string[], 
    pollId: string
  ): Promise<SimilarUser[]> {
    try {
      // Get aggregated insights (never individual user data)
      const aggregatedInsights = await this.getAggregatedInsights(userInterests, pollId);
      
      // Filter by k-anonymity and privacy requirements
      const privacyProtectedInsights = aggregatedInsights
        .filter(insight => this.meetsPrivacyRequirements(insight))
        .map(insight => this.applyDifferentialPrivacy(insight));

      // Convert to similar user format
      const similarUsers: SimilarUser[] = privacyProtectedInsights.map(insight => ({
        type: 'aggregated',
        sharedInterests: [insight.candidateName], // Simplified for privacy
        userCount: insight.userCount,
        averageRanking: { [insight.candidateId]: insight.confidence },
        confidence: insight.confidence,
        privacyMetadata: {
          kAnonymity: true,
          differentialPrivacy: true,
          aggregationLevel: this.getAggregationLevel(insight.userCount)
        }
      }));

      return similarUsers;
    } catch (error) {
      console.error('Error finding similar users:', error);
      return [];
    }
  }

  // ============================================================================
  // CROSS-DEMOGRAPHIC INSIGHTS
  // ============================================================================

  /**
   * Generate cross-demographic insights with privacy protection
   * @param userProfile - User profile
   * @param aggregatedInsights - Aggregated insights data
   * @returns Privacy-protected cross-demographic insights
   */
  async getCrossDemographicInsights(
    userProfile: UserProfile, 
    aggregatedInsights: AggregatedInsightsData
  ): Promise<CrossDemographicInsight[]> {
    // Get user's demographic group
    const userAgeGroup = this.getAgeGroup(userProfile.age);
    const userEducation = userProfile.education;
    
    // Find insights from different demographic groups
    const crossDemographicInsights = aggregatedInsights.demographicBreakdowns
      ?.filter((breakdown) => 
        breakdown.ageGroup !== userAgeGroup || 
        breakdown.education !== userEducation
      )
      ?.map((breakdown) => ({
        candidateId: breakdown.topCandidate.id,
        candidateName: breakdown.topCandidate.name,
        confidence: breakdown.confidence,
        demographicGroup: `${breakdown.ageGroup} ${breakdown.education}`,
        userCount: breakdown.userCount,
        privacyProtected: breakdown.userCount >= this.kAnonymityThresholds.loggedIn
      })) ?? [];

    return crossDemographicInsights.filter((insight) => insight.privacyProtected);
  }

  // ============================================================================
  // GEOGRAPHIC INSIGHTS
  // ============================================================================

  /**
   * Generate geographic insights with privacy protection
   * @param userLocation - User location
   * @param aggregatedInsights - Aggregated insights data
   * @returns Privacy-protected geographic insights
   */
  async getGeographicInsights(
    userLocation: string, 
    aggregatedInsights: AggregatedInsightsData
  ): Promise<GeographicInsight[]> {
    // Find insights from different geographic areas
    const geographicInsights = aggregatedInsights.geographicBreakdowns
      ?.filter((breakdown) => breakdown.area !== userLocation)
      ?.map((breakdown) => ({
        candidateId: breakdown.topCandidate.id,
        candidateName: breakdown.topCandidate.name,
        confidence: breakdown.confidence,
        geographicArea: breakdown.area,
        userCount: breakdown.userCount,
        privacyProtected: breakdown.userCount >= this.kAnonymityThresholds.public
      })) ?? [];

    return geographicInsights.filter((insight) => insight.privacyProtected);
  }

  // ============================================================================
  // CROSS-INTEREST INSIGHTS
  // ============================================================================

  /**
   * Generate cross-interest insights with privacy protection
   * @param userInterests - User interests
   * @param aggregatedInsights - Aggregated insights data
   * @returns Privacy-protected cross-interest insights
   */
  async getCrossInterestInsights(
    userInterests: string[], 
    aggregatedInsights: AggregatedInsightsData
  ): Promise<CrossInterestInsight[]> {
    // Find insights from different interest categories
    const crossInterestInsights = aggregatedInsights.interestBreakdowns
      ?.filter((breakdown) => !userInterests.includes(breakdown.interest))
      ?.map((breakdown) => ({
        candidateId: breakdown.topCandidate.id,
        candidateName: breakdown.topCandidate.name,
        confidence: breakdown.confidence,
        interestCategory: breakdown.interest,
        userCount: breakdown.userCount,
        privacyProtected: breakdown.userCount >= this.kAnonymityThresholds.loggedIn
      })) ?? [];

    return crossInterestInsights.filter((insight) => insight.privacyProtected);
  }

  // ============================================================================
  // ON-DEVICE SIMILARITY COMPUTATION
  // ============================================================================

  /**
   * Compute local similarity using public centroids
   * @param userInterests - User interests
   * @param pollId - Poll ID
   * @returns Local similarity computation result
   */
  async computeLocalSimilarity(
    userInterests: string[], 
    pollId: string
  ): Promise<ClusterInsight> {
    try {
      // Get public centroids for client-side computation
      const publicCentroids = this.getPublicCentroids();
      
      // Find best matching centroid
      const bestMatch = this.findBestCluster(userInterests, publicCentroids);
      
      if (!bestMatch) {
        return {
          clusterId: 'no-match',
          similarity: 0,
          insights: [],
          userCount: 0,
          privacyProtected: true
        };
      }

      // Get insights for this cluster
      const insights = await this.getClusterInsights(bestMatch.id, pollId);
      
      return {
        clusterId: bestMatch.id,
        similarity: bestMatch.score,
        insights: insights.filter(insight => insight.privacyProtected),
        userCount: bestMatch.userCount,
        privacyProtected: true
      };
    } catch (error) {
      console.error('Error computing local similarity:', error);
      return {
        clusterId: 'error',
        similarity: 0,
        insights: [],
        userCount: 0,
        privacyProtected: true
      };
    }
  }

  // ============================================================================
  // PUBLIC CENTROIDS SYSTEM
  // ============================================================================

  /**
   * Update public centroids with aggregated data
   * @param pollId - Poll ID
   * @param aggregatedData - Aggregated user data
   */
  async updatePublicCentroids(pollId: string, aggregatedData: unknown[]): Promise<void> {
    try {
      // Compute centroids from aggregated, anonymized data
      const newCentroids = this.computeCentroids(aggregatedData);
      
      // Update centroids
      newCentroids.forEach(centroid => {
        this.publicCentroids.set(centroid.id, centroid);
      });
      
      // Publish centroids for client-side computation
      await this.publishCentroids(newCentroids);
      
      console.log(`Updated ${newCentroids.length} public centroids for poll ${pollId}`);
    } catch (error) {
      console.error('Error updating public centroids:', error);
    }
  }

  /**
   * Get public centroids for client-side computation
   * @returns Array of public centroids
   */
  getPublicCentroids(): PublicCentroid[] {
    return Array.from(this.publicCentroids.values());
  }

  // ============================================================================
  // PRIVACY PROTECTION METHODS
  // ============================================================================

  /**
   * Check if insight meets privacy requirements
   * @param insight - Insight to check
   * @returns Whether insight meets privacy requirements
   */
  private meetsPrivacyRequirements(insight: AggregatedInsight): boolean {
    return insight.userCount >= this.kAnonymityThresholds.loggedIn;
  }

  /**
   * Apply differential privacy to insight
   * @param insight - Insight to protect
   * @returns Privacy-protected insight
   */
  private applyDifferentialPrivacy(insight: AggregatedInsight): AggregatedInsight {
    // Apply Laplace noise to user count
    const noise = this.laplaceNoise(0.8);
    const noisyCount = Math.max(0, Math.round(insight.userCount + noise));
    
    return withOptional(insight, {
      userCount: noisyCount,
      privacyProtected: true
    });
  }

  /**
   * Get aggregation level based on user count
   * @param userCount - Number of users
   * @returns Aggregation level
   */
  private getAggregationLevel(userCount: number): 'high' | 'medium' | 'low' {
    if (userCount >= 1000) return 'high';
    if (userCount >= 100) return 'medium';
    return 'low';
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private initializePublicCentroids(): void {
    // Initialize with default centroids
    const defaultCentroids: PublicCentroid[] = [
      {
        id: 'centroid_1',
        coordinates: [0.5, 0.3, 0.8],
        userCount: 150,
        interests: ['environment', 'education'],
        averageRankings: { 'candidate_1': 0.7, 'candidate_2': 0.3 },
        lastUpdated: new Date(),
        privacyMetadata: {
          kAnonymity: true,
          aggregationLevel: 'medium'
        }
      },
      {
        id: 'centroid_2',
        coordinates: [0.2, 0.9, 0.1],
        userCount: 200,
        interests: ['economy', 'healthcare'],
        averageRankings: { 'candidate_2': 0.8, 'candidate_1': 0.2 },
        lastUpdated: new Date(),
        privacyMetadata: {
          kAnonymity: true,
          aggregationLevel: 'medium'
        }
      }
    ];

    defaultCentroids.forEach(centroid => {
      this.publicCentroids.set(centroid.id, centroid);
    });
  }

  private getAgeGroup(age: number): string {
    if (age < 25) return '18-24';
    if (age < 35) return '25-34';
    if (age < 50) return '35-49';
    if (age < 65) return '50-64';
    return '65+';
  }

  private async getAggregatedInsights(interests: string[], pollId: string): Promise<AggregatedInsight[]> {
    // Get aggregated insights from storage
    const insights = this.aggregatedInsights.get(pollId) ?? [];
    
    // Filter by interests
    return insights.filter(insight => 
      interests.some(interest => insight.description.includes(interest))
    );
  }

  private findBestCluster(interests: string[], centroids: PublicCentroid[]): {
    id: string;
    score: number;
    userCount: number;
  } | null {
    let bestMatch: { id: string; score: number; userCount: number } | null = null;
    let bestScore = 0;

    centroids.forEach(centroid => {
      const score = this.calculateSimilarity(interests, centroid.interests);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = {
          id: centroid.id,
          score,
          userCount: centroid.userCount
        };
      }
    });

    return bestMatch;
  }

  private calculateSimilarity(interests1: string[], interests2: string[]): number {
    const set1 = new Set(interests1);
    const set2 = new Set(interests2);
    const intersection = new Set(Array.from(set1).filter(x => set2.has(x)));
    const union = new Set([...Array.from(set1), ...Array.from(set2)]);
    
    return intersection.size / union.size;
  }

  private async getClusterInsights(clusterId: string, pollId: string): Promise<AggregatedInsight[]> {
    // Get insights for specific cluster
    const allInsights = this.aggregatedInsights.get(pollId) || [];
    return allInsights.filter(insight => insight.source === clusterId);
  }

  private computeCentroids(aggregatedData: unknown[]): PublicCentroid[] {
    // Compute centroids using k-means or similar clustering
    // Ensure k-anonymity is maintained
    const centroids: PublicCentroid[] = [];
    
    // Simplified centroid computation
    aggregatedData.forEach((data: any, index: number) => {
      if ((data).userCount >= this.kAnonymityThresholds.public) {
        centroids.push({
          id: `centroid_${index}`,
          coordinates: (data).coordinates ?? [Math.random(), Math.random(), Math.random()],
          userCount: (data).userCount,
          interests: (data).interests ?? [],
          averageRankings: (data).averageRankings ?? {},
          lastUpdated: new Date(),
          privacyMetadata: {
            kAnonymity: true,
            aggregationLevel: this.getAggregationLevel((data).userCount)
          }
        });
      }
    });
    
    return centroids;
  }

  private async publishCentroids(centroids: PublicCentroid[]): Promise<void> {
    // Publish centroids for client-side computation
    // This would typically involve storing in a public endpoint or CDN
    console.log(`Published ${centroids.length} centroids for client-side computation`);
  }

  private laplaceNoise(epsilon: number): number {
    const u = Math.random() - 0.5;
    return -(1 / epsilon) * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
  }
}

// ============================================================================
// EXPORTED UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if user count meets k-anonymity requirements
 * @param userCount - Number of users
 * @param context - Display context
 * @returns Whether k-anonymity is satisfied
 */
export function meetsKAnonymity(
  userCount: number, 
  context: 'public' | 'loggedIn' | 'internal'
): boolean {
  const thresholds = {
    public: 100,
    loggedIn: 50,
    internal: 25
  };
  
  return userCount >= thresholds[context];
}

/**
 * Apply differential privacy to user count
 * @param count - Original count
 * @param epsilon - Privacy parameter
 * @returns Noisy count
 */
export function applyDifferentialPrivacy(count: number, epsilon: number = 0.8): number {
  const noise = laplaceNoise(epsilon);
  return Math.max(0, Math.round(count + noise));
}

/**
 * Generate Laplace noise
 * @param epsilon - Privacy parameter
 * @returns Laplace noise value
 */
function laplaceNoise(epsilon: number): number {
  const u = Math.random() - 0.5;
  return -(1 / epsilon) * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
}

// ============================================================================
// EXPORTED CLASS
// ============================================================================

export default PrivacyAwareSocialDiscoveryManager;
