/**
 * Vote Processor
 * 
 * Handles the processing and storage of votes, including validation,
 * rate limiting, and database operations.
 * 
 * Created: September 15, 2025
 * Updated: September 15, 2025
 */


import { devLog } from '@/lib/utils/logger';

import { getSupabaseServerClient } from '../../utils/supabase/server';

import type { 
  VoteData, 
  PollData, 
  VoteProcessor as IVoteProcessor,
  VoteSubmissionResult
} from './types';
import type { SupabaseClient } from '@supabase/supabase-js';

type ClientFactory = () => SupabaseClient | Promise<SupabaseClient>;

export class VoteProcessor implements IVoteProcessor {
  private _db?: SupabaseClient;
  private readonly clientFactory: ClientFactory;
  private rateLimitCache: Map<string, { count: number; resetTime: number }> = new Map();

  constructor(factory: ClientFactory = getSupabaseServerClient) {
    this.clientFactory = factory;
  }

  private async db(): Promise<SupabaseClient> {
    if (!this._db) {
      const c = this.clientFactory();
      this._db = (c instanceof Promise) ? await c : c;
    }
    return this._db;
  }

  /**
   * Process and store a vote
   */
  async processVote(vote: VoteData): Promise<VoteSubmissionResult> {
    const startTime = Date.now();
    
    try {
      // Get poll data from database
      const supabaseClient = await this.db();

      const { data: pollData, error: pollError } = await supabaseClient
        .from('polls')
        .select('*')
        .eq('id', vote.pollId)
        .single();

      if (pollError || !pollData) {
        return {
          success: false,
          error: 'Poll not found'
        };
      }

      // Validate vote data
      const isValid = await this.validateVoteData(vote, pollData);
      if (!isValid) {
        return {
          success: false,
          error: 'Invalid vote data'
        };
      }

      // Check if user can vote
      const canVote = await this.canUserVote(vote.pollId, vote.userId);
      if (!canVote) {
        return {
          success: false,
          error: 'User cannot vote on this poll'
        };
      }

      // Create vote record
      const voteRecord = {
        id: vote.id,
        poll_id: vote.pollId,
        user_id: vote.userId ?? null,
        voting_method: pollData.votingMethod,
        vote_data: vote,
        created_at: vote.timestamp.toISOString(),
        updated_at: vote.timestamp.toISOString(),
        verification_token: vote.verificationToken ?? null,
        is_verified: false,
        ip_address: vote.ipAddress ?? null,
        user_agent: vote.userAgent ?? null
      };

      // Insert vote into database
      const { error: voteError } = await supabaseClient
        .from('votes')
        .insert(voteRecord);

      if (voteError) {
        devLog('Error inserting vote:', voteError);
        return {
          success: false,
          error: 'Failed to store vote'
        };
      }

      // Update poll vote count
      await this.updatePollVoteCount(vote.pollId, await supabaseClient);

      // Update rate limit cache
      if (vote.userId) {
        this.updateRateLimit(vote.userId);
      }

      devLog('Vote processed successfully', {
        voteId: vote.id,
        pollId: vote.pollId,
        userId: vote.userId,
        votingMethod: pollData.votingMethod,
        processingTime: Date.now() - startTime
      });

      return {
        success: true,
        voteId: vote.id
      };

    } catch (error) {
      devLog('Vote processing error:', error);
      return {
        success: false,
        error: `Failed to process vote: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Validate vote data
   */
  async validateVoteData(vote: VoteData, poll: PollData): Promise<boolean> {
    try {
      // Basic validation
      if (!vote || typeof vote !== 'object') {
        return false;
      }

      // Check if poll is active
      if (poll.status !== 'active') {
        return false;
      }

      // Check poll end time
      if (poll.endTime && new Date(poll.endTime) < new Date()) {
        return false;
      }

      // Method-specific validation
      switch (poll.votingMethod) {
        case 'single':
          return this.validateSingleChoiceVote(vote, poll);
        case 'approval':
          return this.validateApprovalVote(vote, poll);
        case 'ranked':
          return this.validateRankedVote(vote, poll);
        case 'quadratic':
          return this.validateQuadraticVote(vote, poll);
        case 'range':
          return this.validateRangeVote(vote, poll);
        default:
          return false;
      }

    } catch (error) {
      devLog('Vote validation error:', error);
      return false;
    }
  }

  /**
   * Check if user can vote (rate limiting, existing votes, etc.)
   */
  async canUserVote(pollId: string, userId?: string): Promise<boolean> {
    try {
      // Check rate limiting
      if (userId && this.isRateLimited(userId)) {
        return false;
      }

      // Check if user has already voted (if not allowing multiple votes)
      if (userId) {
        const supabaseClient = await this.db();
        if (supabaseClient) {
          const { data: existingVote } = await supabaseClient
            .from('votes')
            .select('id')
            .eq('poll_id', pollId)
            .eq('user_id', userId)
            .single();

          if (existingVote) {
            return false;
          }
        }
      }

      return true;

    } catch (error) {
      devLog('Can user vote check error:', error);
      return false;
    }
  }

  /**
   * Update poll vote count
   */
  private async updatePollVoteCount(pollId: string, supabaseClient: Awaited<ReturnType<typeof getSupabaseServerClient>>): Promise<void> {
    try {
      // Get current vote count
      const { count } = await supabaseClient
        .from('votes')
        .select('*', { count: 'exact', head: true })
        .eq('poll_id', pollId);

      // Update poll with new count
      await supabaseClient
        .from('polls')
        .update({ 
          total_votes: count ?? 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', pollId);

    } catch (error) {
      devLog('Error updating poll vote count:', error);
      // Don't throw here as the vote was already recorded
    }
  }

  /**
   * Check if user is rate limited
   */
  private isRateLimited(userId: string): boolean {
    const now = Date.now();
    const userLimit = this.rateLimitCache.get(userId);

    if (!userLimit) {
      return false;
    }

    // Reset if window has passed
    if (now > userLimit.resetTime) {
      this.rateLimitCache.delete(userId);
      return false;
    }

    // Check if over limit (10 votes per minute)
    return userLimit.count >= 10;
  }

  /**
   * Update rate limit for user
   */
  private updateRateLimit(userId: string): void {
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    const userLimit = this.rateLimitCache.get(userId);

    if (!userLimit || now > userLimit.resetTime) {
      this.rateLimitCache.set(userId, {
        count: 1,
        resetTime: now + windowMs
      });
    } else {
      userLimit.count++;
    }
  }

  /**
   * Validate single choice vote
   */
  private validateSingleChoiceVote(vote: VoteData, poll: PollData): boolean {
    return vote.choice !== undefined && 
           typeof vote.choice === 'number' && 
           vote.choice >= 0 && 
           vote.choice < poll.options.length;
  }

  /**
   * Validate approval vote
   */
  private validateApprovalVote(vote: VoteData, poll: PollData): boolean {
    if (!vote.approvals || !Array.isArray(vote.approvals)) {
      return false;
    }

    return vote.approvals.length > 0 && 
           vote.approvals.every(approval => 
             typeof approval === 'number' && 
             approval >= 0 && 
             approval < poll.options.length
           );
  }

  /**
   * Validate ranked vote
   */
  private validateRankedVote(vote: VoteData, poll: PollData): boolean {
    if (!vote.rankings || !Array.isArray(vote.rankings)) {
      return false;
    }

    return vote.rankings.length === poll.options.length &&
           vote.rankings.every(ranking => 
             typeof ranking === 'number' && 
             ranking >= 0 && 
             ranking < poll.options.length
           ) &&
           new Set(vote.rankings).size === vote.rankings.length; // No duplicates
  }

  /**
   * Validate quadratic vote
   */
  private validateQuadraticVote(vote: VoteData, poll: PollData): boolean {
    if (!vote.allocations || typeof vote.allocations !== 'object') {
      return false;
    }

    const totalCredits = poll.votingConfig.quadraticCredits ?? 100;
    let totalSpent = 0;

    for (const [optionIndex, credits] of Object.entries(vote.allocations)) {
      if (typeof credits !== 'number' || credits < 0) {
        return false;
      }

      const optionIdx = parseInt(optionIndex);
      if (optionIdx < 0 || optionIdx >= poll.options.length) {
        return false;
      }

      totalSpent += credits * credits;
    }

    return totalSpent <= totalCredits;
  }

  /**
   * Validate range vote
   */
  private validateRangeVote(vote: VoteData, poll: PollData): boolean {
    if (!vote.ratings || typeof vote.ratings !== 'object') {
      return false;
    }

    const rangeMin = poll.votingConfig.rangeMin ?? 0;
    const rangeMax = poll.votingConfig.rangeMax ?? 10;

    for (const [optionIndex, rating] of Object.entries(vote.ratings)) {
      if (typeof rating !== 'number' || rating < rangeMin || rating > rangeMax) {
        return false;
      }

      const optionIdx = parseInt(optionIndex);
      if (optionIdx < 0 || optionIdx >= poll.options.length) {
        return false;
      }
    }

    return Object.keys(vote.ratings).length === poll.options.length;
  }
}
