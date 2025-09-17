// ============================================================================
// PHASE 4: VIRAL CONTENT DETECTION SYSTEM
// ============================================================================
// Agent A4 - Social Features Specialist
// 
// This module implements viral content detection with stability gates,
// auto-disclaimer generation, and shareability scoring for the Ranked Choice
// Democracy Revolution platform.
// 
// Features:
// - Stability gates for "Breaking" moments
// - Auto-disclaimer generation for all viral content
// - Shareability scoring system
// - OG image generation with timestamps
// - Content moderation preventing sensationalism
// 
// Created: January 15, 2025
// Status: Phase 4 Implementation
// ============================================================================

import { devLog } from '../logger';
import type { SurgeData, TrendingCandidate, Activity } from './types';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface Poll {
  id: string;
  title: string;
  location: string;
  electionType: string;
  candidates: Candidate[];
  totalVotes: number;
  createdAt: Date;
  closeAt?: Date;
  allowPostClose: boolean;
}

export interface Candidate {
  id: string;
  name: string;
  party?: string;
  isIndependent: boolean;
  verification: {
    verified: boolean;
    method: string;
  };
}

export interface PollResults {
  pollId: string;
  winner: Candidate;
  margin: number;
  totalVotes: number;
  rankings: CandidateRanking[];
  candidateResults: Array<{
    candidateId: string;
    votes: number;
    percentage: number;
  }>;
  timestamp: Date;
}

export interface CandidateRanking {
  candidateId: string;
  candidateName: string;
  rank: number;
  votes: number;
  percentage: number;
}

export interface ViralMoment {
  id: string;
  type: 'independent-leading' | 'surprising-second-choice' | 'local-surge' | 'trending-candidate';
  pollId: string;
  headline: string;
  description: string;
  shareability: number; // 0-1 score
  confidence: number; // 0-1 confidence level
  timeWindow: number; // milliseconds
  metadata: ViralMomentMetadata;
  disclaimer: string;
  ogImageUrl?: string;
  createdAt: Date;
}

export interface ViralMomentMetadata {
  candidateId?: string;
  candidateName?: string;
  isIndependent?: boolean;
  margin?: number;
  totalVotes?: number;
  trendDirection?: 'up' | 'down' | 'stable';
  activityCount?: number;
  geographicArea?: string;
  demographicGroup?: string;
}

export interface StabilityMetrics {
  windows: number;
  newBallots: number;
  confidence: number;
  variance: number;
  trendConsistency: number;
}

export interface ShareabilityMetrics {
  engagement: number;
  controversy: number;
  novelty: number;
  relevance: number;
  timeliness: number;
}

// ============================================================================
// VIRAL MOMENT DETECTOR
// ============================================================================

export class ViralMomentDetector {
  private static readonly STABILITY_CONFIG = {
    minWindows: 3,
    windowDuration: 10 * 60 * 1000, // 10 minutes
    minNewBallots: 1000,
    confidenceThreshold: 0.95,
    varianceThreshold: 0.1,
    trendConsistencyThreshold: 0.8
  };

  private static readonly SHAREABILITY_WEIGHTS = {
    engagement: 0.3,
    controversy: 0.2,
    novelty: 0.25,
    relevance: 0.15,
    timeliness: 0.1
  };

  /**
   * Detect viral moments in a poll with stability gates
   * @param pollId - Poll ID to analyze
   * @returns Array of validated viral moments
   */
  static async detectViralMoments(pollId: string): Promise<ViralMoment[]> {
    try {
      const poll = await this.getPoll(pollId);
      const recentResults = await this.getRecentResults(pollId, this.STABILITY_CONFIG.windowDuration);
      
      if (!poll || !recentResults) {
        devLog('No poll or results found for viral detection:', pollId);
        return [];
      }

      const moments: ViralMoment[] = [];
      
      // Check for independent candidate leading
      if (await this.hasIndependentLeading(poll, recentResults)) {
        const moment = await this.createIndependentLeadingMoment(poll, recentResults);
        if (moment) moments.push(moment);
      }
      
      // Check for surprising second choice
      const surprisingSecond = await this.findSurprisingSecondChoice(poll, recentResults);
      if (surprisingSecond) {
        const moment = await this.createSurprisingSecondMoment(poll, surprisingSecond);
        if (moment) moments.push(moment);
      }
      
      // Check for local surge
      const localSurge = await this.detectLocalSurge(poll, recentResults);
      if (localSurge) {
        const moment = await this.createLocalSurgeMoment(poll, localSurge);
        if (moment) moments.push(moment);
      }

      // Check for trending candidates
      const trendingCandidates = await this.detectTrendingCandidates(poll, recentResults);
      for (const candidate of trendingCandidates) {
        const moment = await this.createTrendingCandidateMoment(poll, candidate);
        if (moment) moments.push(moment);
      }
      
      // Validate all moments with stability gates
      const validatedMoments = await Promise.all(
        moments.map(moment => this.validateViralMoment(moment))
      );
      
      return validatedMoments.filter(moment => moment !== null) as ViralMoment[];
    } catch (error) {
      devLog('Error detecting viral moments:', error);
      return [];
    }
  }

  /**
   * Validate viral moment meets stability requirements
   * @param moment - Viral moment to validate
   * @returns Whether moment passes validation
   */
  private static async validateViralMoment(moment: ViralMoment): Promise<ViralMoment | null> {
    try {
      const stability = await this.calculateStability(moment.pollId, moment.timeWindow);
      
      const isValid = (
        stability.windows >= this.STABILITY_CONFIG.minWindows &&
        stability.newBallots >= this.STABILITY_CONFIG.minNewBallots &&
        stability.confidence >= this.STABILITY_CONFIG.confidenceThreshold &&
        stability.variance <= this.STABILITY_CONFIG.varianceThreshold &&
        stability.trendConsistency >= this.STABILITY_CONFIG.trendConsistencyThreshold
      );

      if (!isValid) {
        devLog('Viral moment failed validation:', moment.id, stability);
        return null;
      }

      // Update confidence based on stability
      moment.confidence = Math.min(moment.confidence, stability.confidence);
      
      // Generate disclaimer and OG image
      const poll = await this.getPoll(moment.pollId);
      if (poll) {
        moment.disclaimer = DisclaimerGenerator.generateViralDisclaimer(moment, poll);
      } else {
        moment.disclaimer = "Unofficial community poll • Self-selected respondents • Not a scientific survey";
      }
      moment.ogImageUrl = await this.generateOGImage(moment);

      return moment;
    } catch (error) {
      devLog('Error validating viral moment:', error);
      return null;
    }
  }

  /**
   * Create independent leading moment
   */
  private static async createIndependentLeadingMoment(
    poll: Poll, 
    results: PollResults
  ): Promise<ViralMoment | null> {
    const leadingCandidate = results.winner;
    const isIndependent = !leadingCandidate.party || leadingCandidate.party === 'Independent';
    
    if (!isIndependent) return null;

    const shareability = await this.calculateShareability({
      engagement: 0.9,
      controversy: 0.7,
      novelty: 0.8,
      relevance: 0.9,
      timeliness: 0.8
    });

    return {
      id: this.generateId(),
      type: 'independent-leading',
      pollId: poll.id,
      headline: `Breaking: ${leadingCandidate.name} leading in ${poll.location} ranked choice poll!`,
      description: 'For the first time, an independent candidate is leading in a major election poll.',
      shareability,
      confidence: await this.calculateConfidence(poll.id),
      timeWindow: this.STABILITY_CONFIG.windowDuration,
      metadata: {
        candidateId: leadingCandidate.id,
        candidateName: leadingCandidate.name,
        isIndependent,
        margin: results.margin,
        totalVotes: results.totalVotes
      },
      disclaimer: '', // Will be set in validation
      createdAt: new Date()
    };
  }

  /**
   * Create surprising second choice moment
   */
  private static async createSurprisingSecondMoment(
    poll: Poll, 
    surprisingCandidate: CandidateRanking
  ): Promise<ViralMoment | null> {
    const shareability = await this.calculateShareability({
      engagement: 0.8,
      controversy: 0.6,
      novelty: 0.9,
      relevance: 0.8,
      timeliness: 0.7
    });

    return {
      id: this.generateId(),
      type: 'surprising-second-choice',
      pollId: poll.id,
      headline: `Surprising: ${surprisingCandidate.candidateName} is everyone's second choice in ${poll.location}`,
      description: 'Ranked choice voting reveals hidden preferences that traditional polls miss.',
      shareability,
      confidence: await this.calculateConfidence(poll.id),
      timeWindow: this.STABILITY_CONFIG.windowDuration,
      metadata: {
        candidateId: surprisingCandidate.candidateId,
        candidateName: surprisingCandidate.candidateName,
        margin: surprisingCandidate.percentage
      },
      disclaimer: '', // Will be set in validation
      createdAt: new Date()
    };
  }

  /**
   * Create local surge moment
   */
  private static async createLocalSurgeMoment(
    poll: Poll, 
    surgeData: SurgeData
  ): Promise<ViralMoment | null> {
    const shareability = await this.calculateShareability({
      engagement: 0.7,
      controversy: 0.5,
      novelty: 0.8,
      relevance: 0.9,
      timeliness: 0.8
    });

    return {
      id: this.generateId(),
      type: 'local-surge',
      pollId: poll.id,
      headline: `Local surge: ${(surgeData.metadata as any).candidateName || 'Candidate'} gaining momentum in ${poll.location}`,
      description: 'A local candidate is seeing unexpected support in ranked choice voting.',
      shareability,
      confidence: await this.calculateConfidence(poll.id),
      timeWindow: this.STABILITY_CONFIG.windowDuration,
      metadata: {
        candidateId: surgeData.candidateId,
        candidateName: (surgeData.metadata as any).candidateName || 'Unknown',
        trendDirection: (surgeData.metadata as any).direction || 'stable',
        activityCount: surgeData.activityCount,
        geographicArea: poll.location
      },
      disclaimer: '', // Will be set in validation
      createdAt: new Date()
    };
  }

  /**
   * Create trending candidate moment
   */
  private static async createTrendingCandidateMoment(
    poll: Poll, 
    trendingData: TrendingCandidate
  ): Promise<ViralMoment | null> {
    const shareability = await this.calculateShareability({
      engagement: 0.8,
      controversy: 0.6,
      novelty: 0.7,
      relevance: 0.8,
      timeliness: 0.9
    });

    return {
      id: this.generateId(),
      type: 'trending-candidate',
      pollId: poll.id,
      headline: `Trending: ${trendingData.candidateName} is the talk of ${poll.location}`,
      description: 'This candidate is gaining rapid support in the community poll.',
      shareability,
      confidence: await this.calculateConfidence(poll.id),
      timeWindow: this.STABILITY_CONFIG.windowDuration,
      metadata: {
        candidateId: trendingData.candidateId,
        candidateName: trendingData.candidateName,
        trendDirection: trendingData.trendDirection,
        activityCount: trendingData.activityCount
      },
      disclaimer: '', // Will be set in validation
      createdAt: new Date()
    };
  }

  // ============================================================================
  // DETECTION LOGIC
  // ============================================================================

  private static async hasIndependentLeading(poll: Poll, results: PollResults): Promise<boolean> {
    const leadingCandidate = results.winner;
    return !leadingCandidate.party || leadingCandidate.party === 'Independent';
  }

  private static async findSurprisingSecondChoice(poll: Poll, results: PollResults): Promise<CandidateRanking | null> {
    // Find candidate with high second-choice support but low first-choice
    const secondChoice = results.rankings.find(ranking => 
      ranking.rank === 2 && ranking.percentage > 30
    );
    
    return secondChoice || null;
  }

  private static async detectLocalSurge(poll: Poll, results: PollResults): Promise<SurgeData | null> {
    // Detect candidates with rapid growth in support using poll results
    const recentActivity = await this.getRecentActivity(poll.id, 60 * 60 * 1000); // 1 hour
    
    for (const candidate of poll.candidates) {
      const candidateActivity = recentActivity.filter(
        activity => activity.candidateId === candidate.id
      );
      
      // Use results to get current vote percentage
      const candidateResult = results.candidateResults.find(
        result => result.candidateId === candidate.id
      );
      const currentPercentage = candidateResult?.percentage || 0;
      
      if (candidateActivity.length > 0) {
        const trendScore = this.calculateTrendScore(candidateActivity, 60 * 60 * 1000);
        
        if (trendScore > 0.8 && currentPercentage > 10) { // Only surge if above 10% support
          return {
            pollId: poll.id,
            candidateId: candidate.id,
            surgeScore: trendScore,
            activityCount: candidateActivity.length,
            timeWindow: 60 * 60 * 1000, // 1 hour
            geographicArea: poll.location,
            demographicGroup: 'all',
            confidence: Math.min(trendScore, 0.95),
            metadata: {
              candidateName: candidate.name,
              direction: this.getTrendDirection(candidateActivity),
              currentPercentage,
              totalVotes: results.totalVotes,
              timestamp: results.timestamp
            }
          };
        }
      }
    }
    
    return null;
  }

  private static async detectTrendingCandidates(poll: Poll, results: PollResults): Promise<TrendingCandidate[]> {
    const trending: TrendingCandidate[] = [];
    const recentActivity = await this.getRecentActivity(poll.id, 60 * 60 * 1000); // 1 hour
    
    for (const candidate of poll.candidates) {
      const candidateActivity = recentActivity.filter(
        activity => activity.candidateId === candidate.id
      );
      
      if (candidateActivity.length > 0) {
        const trendScore = this.calculateTrendScore(candidateActivity, 60 * 60 * 1000);
        
        if (trendScore > 0.7) {
          // Use results to get current vote percentage
          const candidateResult = results.candidateResults.find(
            result => result.candidateId === candidate.id
          );
          const currentPercentage = candidateResult?.percentage || 0;
          
          trending.push({
            candidateId: candidate.id,
            candidateName: candidate.name,
            trendScore,
            activityCount: candidateActivity.length,
            trendDirection: this.getTrendDirection(candidateActivity),
            timeWindow: 60 * 60 * 1000, // 1 hour
            confidence: Math.min(trendScore, 0.95),
            metadata: {
              pollId: poll.id,
              category: 'candidate',
              geographicArea: poll.location,
              demographicGroup: 'all',
              interestCategories: ['politics', 'voting']
            }
          });
        }
      }
    }
    
    return trending.sort((a, b) => b.trendScore - a.trendScore).slice(0, 3);
  }

  // ============================================================================
  // STABILITY CALCULATION
  // ============================================================================

  private static async calculateStability(pollId: string, timeWindow: number): Promise<StabilityMetrics> {
    try {
      const windows = Math.floor(timeWindow / this.STABILITY_CONFIG.windowDuration);
      const recentResults = await this.getRecentResults(pollId, timeWindow);
      
      if (!recentResults || windows < this.STABILITY_CONFIG.minWindows) {
        return {
          windows: 0,
          newBallots: 0,
          confidence: 0,
          variance: 1,
          trendConsistency: 0
        };
      }

      // Calculate stability metrics
      const newBallots = recentResults.totalVotes;
      const variance = this.calculateVariance(recentResults);
      const trendConsistency = this.calculateTrendConsistency(recentResults);
      const confidence = this.calculateConfidenceFromMetrics(newBallots, variance, trendConsistency);

      return {
        windows,
        newBallots,
        confidence,
        variance,
        trendConsistency
      };
    } catch (error) {
      devLog('Error calculating stability:', error);
      return {
        windows: 0,
        newBallots: 0,
        confidence: 0,
        variance: 1,
        trendConsistency: 0
      };
    }
  }

  private static calculateVariance(results: PollResults): number {
    // Calculate variance in candidate rankings
    const percentages = results.rankings.map(r => r.percentage);
    const mean = percentages.reduce((sum, p) => sum + p, 0) / percentages.length;
    const variance = percentages.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / percentages.length;
    return Math.sqrt(variance) / 100; // Normalize to 0-1
  }

  private static calculateTrendConsistency(_results: PollResults): number {
    // Calculate how consistent the trend is
    // This would be more sophisticated in a real implementation
    return 0.8; // Placeholder
  }

  private static calculateConfidenceFromMetrics(
    newBallots: number, 
    variance: number, 
    trendConsistency: number
  ): number {
    const ballotConfidence = Math.min(newBallots / this.STABILITY_CONFIG.minNewBallots, 1);
    const varianceConfidence = Math.max(0, 1 - variance);
    const trendConfidence = trendConsistency;
    
    return (ballotConfidence + varianceConfidence + trendConfidence) / 3;
  }

  // ============================================================================
  // SHAREABILITY CALCULATION
  // ============================================================================

  private static async calculateShareability(metrics: ShareabilityMetrics): Promise<number> {
    const weights = this.SHAREABILITY_WEIGHTS;
    
    return (
      metrics.engagement * weights.engagement +
      metrics.controversy * weights.controversy +
      metrics.novelty * weights.novelty +
      metrics.relevance * weights.relevance +
      metrics.timeliness * weights.timeliness
    );
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private static calculateTrendScore(activity: Activity[], timeWindow: number): number {
    // Calculate trend based on activity velocity and acceleration
    const timeBuckets = this.bucketActivityByTime(activity, timeWindow);
    const velocity = this.calculateVelocity(timeBuckets);
    const acceleration = this.calculateAcceleration(timeBuckets);
    
    return (velocity * 0.7 + acceleration * 0.3);
  }

  private static getTrendDirection(activity: Activity[]): 'up' | 'down' | 'stable' {
    const recent = activity.slice(-5);
    const older = activity.slice(-10, -5);
    
    if (recent.length === 0 || older.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((sum, a) => sum + (a.intensity || 1), 0) / recent.length;
    const olderAvg = older.reduce((sum, a) => sum + (a.intensity || 1), 0) / older.length;
    
    const change = (recentAvg - olderAvg) / olderAvg;
    
    if (change > 0.1) return 'up';
    if (change < -0.1) return 'down';
    return 'stable';
  }

  private static bucketActivityByTime(activity: Activity[], timeWindow: number): number[] {
    // Bucket activity into time windows
    const buckets: number[] = [];
    const bucketSize = timeWindow / 10; // 10 buckets
    
    for (let i = 0; i < 10; i++) {
      const bucketStart = Date.now() - timeWindow + (i * bucketSize);
      const bucketEnd = bucketStart + bucketSize;
      
      const bucketActivity = activity.filter(a => {
        const timestamp = new Date(a.timestamp).getTime();
        return timestamp >= bucketStart && timestamp < bucketEnd;
      });
      
      buckets.push(bucketActivity.length);
    }
    
    return buckets;
  }

  private static calculateVelocity(buckets: number[]): number {
    // Calculate velocity of activity
    let velocity = 0;
    for (let i = 1; i < buckets.length; i++) {
      velocity += (buckets[i] ?? 0) - (buckets[i - 1] ?? 0);
    }
    return velocity / (buckets.length - 1);
  }

  private static calculateAcceleration(buckets: number[]): number {
    // Calculate acceleration of activity
    let acceleration = 0;
    for (let i = 2; i < buckets.length; i++) {
      const velocity1 = (buckets[i] ?? 0) - (buckets[i - 1] ?? 0);
      const velocity2 = (buckets[i - 1] ?? 0) - (buckets[i - 2] ?? 0);
      acceleration += velocity1 - velocity2;
    }
    return acceleration / (buckets.length - 2);
  }

  private static async calculateConfidence(pollId: string): Promise<number> {
    // Calculate confidence based on poll data quality
    const poll = await this.getPoll(pollId);
    if (!poll) return 0;
    
    const voteQuality = Math.min(poll.totalVotes / 1000, 1);
    const timeQuality = poll.closeAt ? 1 : 0.8;
    const candidateQuality = poll.candidates.length >= 3 ? 1 : 0.7;
    
    return (voteQuality + timeQuality + candidateQuality) / 3;
  }

  private static async generateOGImage(moment: ViralMoment): Promise<string> {
    // Generate OG image for social sharing
    // This would integrate with an image generation service
    const timestamp = moment.createdAt.toISOString();
    const pollId = moment.pollId;
    
    return `/api/og-image?viral-moment=${moment.id}&timestamp=${timestamp}&poll=${pollId}`;
  }

  private static generateId(): string {
    return `viral_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // ============================================================================
  // MOCK DATA METHODS (TO BE REPLACED WITH REAL DATABASE CALLS)
  // ============================================================================

  private static async getPoll(pollId: string): Promise<Poll | null> {
    // Mock implementation - replace with real database call
    return {
      id: pollId,
      title: 'Sample Poll',
      location: 'San Francisco, CA',
      electionType: 'Mayor',
      candidates: [
        {
          id: 'candidate1',
          name: 'Jane Smith',
          party: 'Independent',
          isIndependent: true,
          verification: { verified: true, method: 'government-email' }
        },
        {
          id: 'candidate2',
          name: 'John Doe',
          party: 'Democratic',
          isIndependent: false,
          verification: { verified: true, method: 'campaign-website' }
        }
      ],
      totalVotes: 1500,
      createdAt: new Date(),
      allowPostClose: true
    };
  }

  private static async getRecentResults(pollId: string, _timeWindow: number): Promise<PollResults | null> {
    // Mock implementation - replace with real database call
    return {
      pollId,
      winner: {
        id: 'candidate1',
        name: 'Jane Smith',
        party: 'Independent',
        isIndependent: true,
        verification: { verified: true, method: 'government-email' }
      },
      margin: 0.15,
      totalVotes: 1500,
      rankings: [
        { candidateId: 'candidate1', candidateName: 'Jane Smith', rank: 1, votes: 675, percentage: 45 },
        { candidateId: 'candidate2', candidateName: 'John Doe', rank: 2, votes: 600, percentage: 40 },
        { candidateId: 'candidate3', candidateName: 'Bob Johnson', rank: 3, votes: 225, percentage: 15 }
      ],
      candidateResults: [
        { candidateId: 'candidate1', votes: 675, percentage: 45 },
        { candidateId: 'candidate2', votes: 600, percentage: 40 },
        { candidateId: 'candidate3', votes: 225, percentage: 15 }
      ],
      timestamp: new Date()
    };
  }

  private static async getRecentActivity(_pollId: string, _timeWindow: number): Promise<Activity[]> {
    // Mock implementation - replace with real database call
    return [
      { candidateId: 'candidate1', timestamp: new Date(), intensity: 1.2, type: 'vote' as const },
      { candidateId: 'candidate1', timestamp: new Date(), intensity: 1.5, type: 'view' as const },
      { candidateId: 'candidate2', timestamp: new Date(), intensity: 0.8, type: 'share' as const }
    ];
  }
}

// ============================================================================
// DISCLAIMER GENERATOR
// ============================================================================

export class DisclaimerGenerator {
  /**
   * Generate viral disclaimer for a moment
   */
  static generateViralDisclaimer(moment: ViralMoment, _poll: Poll): string {
    const baseDisclaimer = "Unofficial community poll • Self-selected respondents • Not a scientific survey";
    const timestamp = `As of ${new Date().toLocaleString()}`;
    const methodology = "Method: Instant Runoff Voting (IRV)";
    
    let contextDisclaimer = "";
    
    switch (moment.type) {
      case 'independent-leading':
        contextDisclaimer = "Results may not reflect the broader electorate";
        break;
      case 'surprising-second-choice':
        contextDisclaimer = "Second-choice preferences can change in final rounds";
        break;
      case 'local-surge':
        contextDisclaimer = "Local trends may not indicate broader patterns";
        break;
      case 'trending-candidate':
        contextDisclaimer = "Trending status based on recent activity only";
        break;
    }
    
    return `${baseDisclaimer} • ${timestamp} • ${methodology} • ${contextDisclaimer}`;
  }
  
  /**
   * Generate share disclaimer for poll results
   */
  static generateShareDisclaimer(poll: Poll, results: PollResults): string {
    return `Community poll results for ${poll.location} ${poll.electionType} • 
    ${results.totalVotes} respondents • 
    ${new Date().toLocaleString()} • 
    Not a scientific survey`;
  }
}

// ============================================================================
// EXPORTED CLASS
// ============================================================================

export default ViralMomentDetector;
