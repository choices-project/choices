/**
 * Vote Validator
 * 
 * Provides comprehensive validation for votes across all voting methods.
 * Handles business logic validation, security checks, and data integrity.
 * 
 * Created: September 15, 2025
 * Updated: September 15, 2025
 */

import { devLog } from '@/lib/utils/logger';
import { getSupabaseServerClient } from '../../utils/supabase/server';
import type { 
  VoteData, 
  PollData, 
  VoteValidation,
  VotingMethod
} from './types';

export class VoteValidator {
  private supabase: ReturnType<typeof getSupabaseServerClient>;

  constructor() {
    this.supabase = getSupabaseServerClient();
  }

  /**
   * Validate a vote request comprehensively
   */
  async validateVote(
    voteData: VoteData, 
    poll: PollData, 
    userId?: string
  ): Promise<VoteValidation> {
    try {
      // Basic validation
      const basicValidation = this.validateBasicVoteData(voteData, poll);
      if (!basicValidation.isValid) {
        return basicValidation;
      }

      // Method-specific validation
      const methodValidation = await this.validateVotingMethod(voteData, poll);
      if (!methodValidation.isValid) {
        return methodValidation;
      }

      // Business logic validation
      const businessValidation = await this.validateBusinessRules(voteData, poll, userId);
      if (!businessValidation.isValid) {
        return businessValidation;
      }

      // Security validation
      const securityValidation = await this.validateSecurity(voteData, poll, userId);
      if (!securityValidation.isValid) {
        return securityValidation;
      }

      devLog('Vote validation passed', {
        pollId: poll.id,
        votingMethod: poll.votingMethod,
        userId
      });

      return {
        isValid: true,
        requiresAuthentication: true,
        requiresTokens: false
      };

    } catch (error) {
      devLog('Vote validation error:', error);
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Validation failed',
        requiresAuthentication: true,
        requiresTokens: false
      };
    }
  }

  /**
   * Validate basic vote data structure
   */
  private validateBasicVoteData(voteData: VoteData, poll: PollData): VoteValidation {
    if (!voteData || typeof voteData !== 'object') {
      return {
        isValid: false,
        error: 'Vote data must be an object',
        requiresAuthentication: true,
        requiresTokens: false
      };
    }

    if (!poll || typeof poll !== 'object') {
      return {
        isValid: false,
        error: 'Poll data is required',
        requiresAuthentication: true,
        requiresTokens: false
      };
    }

    if (!poll.id || !poll.votingMethod) {
      return {
        isValid: false,
        error: 'Invalid poll data',
        requiresAuthentication: true,
        requiresTokens: false
      };
    }

    return {
      isValid: true,
      requiresAuthentication: true,
      requiresTokens: false
    };
  }

  /**
   * Validate voting method specific data
   */
  private async validateVotingMethod(voteData: VoteData, poll: PollData): Promise<VoteValidation> {
    const method = poll.votingMethod as VotingMethod;

    switch (method) {
      case 'single':
        return this.validateSingleChoice(voteData, poll);
      case 'approval':
        return this.validateApproval(voteData, poll);
      case 'ranked':
        return this.validateRanked(voteData, poll);
      case 'quadratic':
        return this.validateQuadratic(voteData, poll);
      case 'range':
        return this.validateRange(voteData, poll);
      default:
        return {
          isValid: false,
          error: `Unsupported voting method: ${method}`,
          requiresAuthentication: true,
          requiresTokens: false
        };
    }
  }

  /**
   * Validate business rules
   */
  private async validateBusinessRules(
    voteData: VoteData, 
    poll: PollData, 
    userId?: string
  ): Promise<VoteValidation> {
    // Check if poll is active
    if (poll.status !== 'active') {
      return {
        isValid: false,
        error: 'Poll is not active',
        requiresAuthentication: true,
        requiresTokens: false
      };
    }

    // Check poll end time
    if (poll.endTime && new Date(poll.endTime) < new Date()) {
      return {
        isValid: false,
        error: 'Poll has ended',
        requiresAuthentication: true,
        requiresTokens: false
      };
    }

    // Check if poll is locked
    if (poll.lockedAt) {
      return {
        isValid: false,
        error: 'Poll is locked',
        requiresAuthentication: true,
        requiresTokens: false
      };
    }

    // Check if user has already voted (if not allowing multiple votes)
    if (userId && !poll.votingConfig.allowMultipleVotes) {
      const hasVoted = await this.checkExistingVote(poll.id, userId);
      if (hasVoted) {
        return {
          isValid: false,
          error: 'You have already voted on this poll',
          requiresAuthentication: true,
          requiresTokens: false
        };
      }
    }

    return {
      isValid: true,
      requiresAuthentication: true,
      requiresTokens: false
    };
  }

  /**
   * Validate security constraints
   */
  private async validateSecurity(
    voteData: VoteData, 
    poll: PollData, 
    userId?: string
  ): Promise<VoteValidation> {
    // Check authentication requirements
    if (poll.votingConfig.requireVerification && !userId) {
      return {
        isValid: false,
        error: 'Authentication required for this poll',
        requiresAuthentication: true,
        requiresTokens: false
      };
    }

    // Check trust tier requirements
    if (userId && poll.votingConfig.minTrustTier) {
      const userTier = await this.getUserTrustTier(userId);
      if (!this.isTrustTierSufficient(userTier, poll.votingConfig.minTrustTier)) {
        return {
          isValid: false,
          error: 'Insufficient trust tier for this poll',
          requiresAuthentication: true,
          requiresTokens: false
        };
      }
    }

    // Rate limiting check
    if (userId) {
      const isRateLimited = await this.checkRateLimit(userId);
      if (isRateLimited) {
        return {
          isValid: false,
          error: 'Rate limit exceeded. Please try again later.',
          requiresAuthentication: true,
          requiresTokens: false
        };
      }
    }

    return {
      isValid: true,
      requiresAuthentication: true,
      requiresTokens: false
    };
  }

  /**
   * Validate single choice vote
   */
  private validateSingleChoice(voteData: VoteData, poll: PollData): VoteValidation {
    if (voteData.choice === undefined || voteData.choice === null) {
      return {
        isValid: false,
        error: 'Choice is required for single choice voting',
        requiresAuthentication: true,
        requiresTokens: false
      };
    }

    if (typeof voteData.choice !== 'number' || !Number.isInteger(voteData.choice)) {
      return {
        isValid: false,
        error: 'Choice must be a valid integer',
        requiresAuthentication: true,
        requiresTokens: false
      };
    }

    if (voteData.choice < 0 || voteData.choice >= poll.options.length) {
      return {
        isValid: false,
        error: `Choice must be between 0 and ${poll.options.length - 1}`,
        requiresAuthentication: true,
        requiresTokens: false
      };
    }

    return {
      isValid: true,
      requiresAuthentication: true,
      requiresTokens: false
    };
  }

  /**
   * Validate approval vote
   */
  private validateApproval(voteData: VoteData, poll: PollData): VoteValidation {
    if (!voteData.approvals || !Array.isArray(voteData.approvals)) {
      return {
        isValid: false,
        error: 'Approvals array is required for approval voting',
        requiresAuthentication: true,
        requiresTokens: false
      };
    }

    if (voteData.approvals.length === 0) {
      return {
        isValid: false,
        error: 'At least one option must be approved',
        requiresAuthentication: true,
        requiresTokens: false
      };
    }

    const maxApprovals = poll.votingConfig.maxChoices || poll.options.length;
    if (voteData.approvals.length > maxApprovals) {
      return {
        isValid: false,
        error: `Maximum ${maxApprovals} approvals allowed`,
        requiresAuthentication: true,
        requiresTokens: false
      };
    }

    for (const approval of voteData.approvals) {
      if (typeof approval !== 'number' || !Number.isInteger(approval)) {
        return {
          isValid: false,
          error: 'All approvals must be valid integers',
          requiresAuthentication: true,
          requiresTokens: false
        };
      }

      if (approval < 0 || approval >= poll.options.length) {
        return {
          isValid: false,
          error: `Approval index must be between 0 and ${poll.options.length - 1}`,
          requiresAuthentication: true,
          requiresTokens: false
        };
      }
    }

    // Check for duplicates
    const uniqueApprovals = new Set(voteData.approvals);
    if (uniqueApprovals.size !== voteData.approvals.length) {
      return {
        isValid: false,
        error: 'Duplicate approvals are not allowed',
        requiresAuthentication: true,
        requiresTokens: false
      };
    }

    return {
      isValid: true,
      requiresAuthentication: true,
      requiresTokens: false
    };
  }

  /**
   * Validate ranked vote
   */
  private validateRanked(voteData: VoteData, poll: PollData): VoteValidation {
    if (!voteData.rankings || !Array.isArray(voteData.rankings)) {
      return {
        isValid: false,
        error: 'Rankings array is required for ranked choice voting',
        requiresAuthentication: true,
        requiresTokens: false
      };
    }

    if (voteData.rankings.length !== poll.options.length) {
      return {
        isValid: false,
        error: 'All options must be ranked',
        requiresAuthentication: true,
        requiresTokens: false
      };
    }

    for (const ranking of voteData.rankings) {
      if (typeof ranking !== 'number' || !Number.isInteger(ranking)) {
        return {
          isValid: false,
          error: 'All rankings must be valid integers',
          requiresAuthentication: true,
          requiresTokens: false
        };
      }

      if (ranking < 0 || ranking >= poll.options.length) {
        return {
          isValid: false,
          error: `Ranking index must be between 0 and ${poll.options.length - 1}`,
          requiresAuthentication: true,
          requiresTokens: false
        };
      }
    }

    // Check for duplicates
    const uniqueRankings = new Set(voteData.rankings);
    if (uniqueRankings.size !== voteData.rankings.length) {
      return {
        isValid: false,
        error: 'Duplicate rankings are not allowed',
        requiresAuthentication: true,
        requiresTokens: false
      };
    }

    return {
      isValid: true,
      requiresAuthentication: true,
      requiresTokens: false
    };
  }

  /**
   * Validate quadratic vote
   */
  private validateQuadratic(voteData: VoteData, poll: PollData): VoteValidation {
    if (!voteData.allocations || typeof voteData.allocations !== 'object') {
      return {
        isValid: false,
        error: 'Allocations object is required for quadratic voting',
        requiresAuthentication: true,
        requiresTokens: false
      };
    }

    const totalCredits = poll.votingConfig.quadraticCredits || 100;
    let totalSpent = 0;

    for (const [optionIndex, credits] of Object.entries(voteData.allocations)) {
      if (typeof credits !== 'number' || !Number.isInteger(credits) || credits < 0) {
        return {
          isValid: false,
          error: 'All allocations must be non-negative integers',
          requiresAuthentication: true,
          requiresTokens: false
        };
      }

      const optionIdx = parseInt(optionIndex);
      if (optionIdx < 0 || optionIdx >= poll.options.length) {
        return {
          isValid: false,
          error: `Invalid option index: ${optionIndex}`,
          requiresAuthentication: true,
          requiresTokens: false
        };
      }

      const cost = credits * credits;
      totalSpent += cost;
    }

    if (totalSpent > totalCredits) {
      return {
        isValid: false,
        error: `Total spending (${totalSpent}) exceeds available credits (${totalCredits})`,
        requiresAuthentication: true,
        requiresTokens: false
      };
    }

    const hasVotes = Object.values(voteData.allocations).some(credits => credits > 0);
    if (!hasVotes) {
      return {
        isValid: false,
        error: 'At least one option must receive votes',
        requiresAuthentication: true,
        requiresTokens: false
      };
    }

    return {
      isValid: true,
      requiresAuthentication: true,
      requiresTokens: false
    };
  }

  /**
   * Validate range vote
   */
  private validateRange(voteData: VoteData, poll: PollData): VoteValidation {
    if (!voteData.ratings || typeof voteData.ratings !== 'object') {
      return {
        isValid: false,
        error: 'Ratings object is required for range voting',
        requiresAuthentication: true,
        requiresTokens: false
      };
    }

    const rangeMin = poll.votingConfig.rangeMin || 0;
    const rangeMax = poll.votingConfig.rangeMax || 10;

    for (const [optionIndex, rating] of Object.entries(voteData.ratings)) {
      if (typeof rating !== 'number' || isNaN(rating)) {
        return {
          isValid: false,
          error: 'All ratings must be valid numbers',
          requiresAuthentication: true,
          requiresTokens: false
        };
      }

      if (rating < rangeMin || rating > rangeMax) {
        return {
          isValid: false,
          error: `Rating must be between ${rangeMin} and ${rangeMax}`,
          requiresAuthentication: true,
          requiresTokens: false
        };
      }

      const optionIdx = parseInt(optionIndex);
      if (optionIdx < 0 || optionIdx >= poll.options.length) {
        return {
          isValid: false,
          error: `Invalid option index: ${optionIndex}`,
          requiresAuthentication: true,
          requiresTokens: false
        };
      }
    }

    if (Object.keys(voteData.ratings).length !== poll.options.length) {
      return {
        isValid: false,
        error: 'All options must be rated',
        requiresAuthentication: true,
        requiresTokens: false
      };
    }

    const hasNonZeroRating = Object.values(voteData.ratings).some(rating => rating > rangeMin);
    if (!hasNonZeroRating) {
      return {
        isValid: false,
        error: 'At least one option must have a rating above the minimum',
        requiresAuthentication: true,
        requiresTokens: false
      };
    }

    return {
      isValid: true,
      requiresAuthentication: true,
      requiresTokens: false
    };
  }

  /**
   * Check if user has already voted
   */
  private async checkExistingVote(pollId: string, userId: string): Promise<boolean> {
    try {
      const supabaseClient = await this.supabase;
      if (!supabaseClient) return false;

      const { data } = await supabaseClient
        .from('votes')
        .select('id')
        .eq('poll_id', pollId)
        .eq('user_id', userId)
        .single();

      return !!data;
    } catch {
      return false;
    }
  }

  /**
   * Get user trust tier
   */
  private async getUserTrustTier(userId: string): Promise<string> {
    try {
      const supabaseClient = await this.supabase;
      if (!supabaseClient) return 'T0';

      const { data } = await supabaseClient
        .from('user_profiles')
        .select('trust_tier')
        .eq('user_id', userId)
        .single();

      return data?.trust_tier || 'T0';
    } catch {
      return 'T0';
    }
  }

  /**
   * Check if trust tier is sufficient
   */
  private isTrustTierSufficient(userTier: string, requiredTier: string): boolean {
    const tiers = ['T0', 'T1', 'T2', 'T3'];
    const userIndex = tiers.indexOf(userTier);
    const requiredIndex = tiers.indexOf(requiredTier);
    
    return userIndex >= requiredIndex;
  }

  /**
   * Check rate limit for user
   */
  private async checkRateLimit(_userId: string): Promise<boolean> {
    // This would implement actual rate limiting logic
    // For now, return false (no rate limiting)
    return false;
  }
}
