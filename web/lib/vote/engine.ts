/**
 * Core Voting Engine
 * 
 * This module provides the main voting engine that orchestrates different voting strategies
 * and handles vote processing, validation, and results calculation.
 * 
 * Created: September 15, 2025
 * Updated: September 15, 2025
 */

import { devLog } from '../logger';
import { withOptional } from '../util/objects';
import { SingleChoiceStrategy } from './strategies/single-choice';
import { ApprovalStrategy } from './strategies/approval';
import { RankedStrategy } from './strategies/ranked';
import { QuadraticStrategy } from './strategies/quadratic';
import { RangeStrategy } from './strategies/range';
import type { 
  VoteRequest, 
  VoteResponse, 
  VoteValidation, 
  VotingStrategy,
  PollData,
  VoteData,
  ResultsData,
  VotingMethod
} from './types';

export interface VoteEngineConfig {
  maxVotesPerPoll: number;
  allowMultipleVotes: boolean;
  requireAuthentication: boolean;
  minTrustTier: string;
  rateLimitPerUser: number;
  rateLimitWindowMs: number;
}

export class VoteEngine {
  private strategies: Map<VotingMethod, VotingStrategy>;
  private config: VoteEngineConfig;

  constructor(config: Partial<VoteEngineConfig> = {}) {
    this.config = {
      maxVotesPerPoll: 10000,
      allowMultipleVotes: false,
      requireAuthentication: true,
      minTrustTier: 'T0',
      rateLimitPerUser: 10,
      rateLimitWindowMs: 60000, // 1 minute
      ...config
    };

    // Initialize voting strategies
    this.strategies = new Map([
      ['single', new SingleChoiceStrategy()],
      ['approval', new ApprovalStrategy()],
      ['ranked', new RankedStrategy()],
      ['quadratic', new QuadraticStrategy()],
      ['range', new RangeStrategy()]
    ]);

    devLog('VoteEngine initialized with strategies:', Array.from(this.strategies.keys()));
  }

  /**
   * Get the appropriate voting strategy for a poll
   */
  private getStrategy(method: VotingMethod): VotingStrategy {
    const strategy = this.strategies.get(method);
    if (!strategy) {
      throw new Error(`Unsupported voting method: ${method}`);
    }
    return strategy;
  }

  /**
   * Validate a vote request
   */
  async validateVote(request: VoteRequest, poll: PollData): Promise<VoteValidation> {
    const startTime = Date.now();
    
    try {
      // Basic validation
      if (!request.pollId || !request.voteData) {
        return {
          isValid: false,
          error: 'Missing required vote data',
          requiresAuthentication: this.config.requireAuthentication,
          requiresTokens: false
        };
      }

      // Check if poll exists and is active
      if (!poll || poll.status !== 'active') {
        return {
          isValid: false,
          error: 'Poll not found or not active',
          requiresAuthentication: this.config.requireAuthentication,
          requiresTokens: false
        };
      }

      // Check poll end time
      if (poll.endTime && new Date(poll.endTime) < new Date()) {
        return {
          isValid: false,
          error: 'Poll has ended',
          requiresAuthentication: this.config.requireAuthentication,
          requiresTokens: false
        };
      }

      // Check authentication requirements
      if (this.config.requireAuthentication && !request.userId) {
        return {
          isValid: false,
          error: 'Authentication required to vote',
          requiresAuthentication: true,
          requiresTokens: false
        };
      }

      // Get the appropriate strategy and validate the vote
      const strategy = this.getStrategy(poll.votingMethod);
      const strategyValidation = await strategy.validateVote(request, poll);

      if (!strategyValidation.isValid) {
        return {
          ...strategyValidation,
          requiresAuthentication: this.config.requireAuthentication,
          requiresTokens: false
        };
      }

      devLog('Vote validation completed', {
        pollId: request.pollId,
        userId: request.userId,
        method: poll.votingMethod,
        duration: Date.now() - startTime
      });

      return {
        isValid: true,
        requiresAuthentication: this.config.requireAuthentication,
        requiresTokens: false
      };

    } catch (error) {
      devLog('Vote validation error:', error);
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Validation failed',
        requiresAuthentication: this.config.requireAuthentication,
        requiresTokens: false
      };
    }
  }

  /**
   * Process a vote
   */
  async processVote(request: VoteRequest, poll: PollData): Promise<VoteResponse> {
    const startTime = Date.now();
    
    try {
      // Validate the vote first
      const validation = await this.validateVote(request, poll);
      if (!validation.isValid) {
        return withOptional(
          {
            success: false,
            message: validation.error || 'Vote validation failed',
            pollId: request.pollId,
            responseTime: Date.now() - startTime
          },
          {
            privacyLevel: request.privacyLevel
          }
        );
      }

      // Get the appropriate strategy and process the vote
      const strategy = this.getStrategy(poll.votingMethod);
      const result = await strategy.processVote(request, poll);

      devLog('Vote processed successfully', {
        pollId: request.pollId,
        userId: request.userId,
        method: poll.votingMethod,
        voteId: result.voteId,
        duration: Date.now() - startTime
      });

      return {
        ...result,
        responseTime: Date.now() - startTime
      };

    } catch (error) {
      devLog('Vote processing error:', error);
      return withOptional(
        {
          success: false,
          message: error instanceof Error ? error.message : 'Vote processing failed',
          pollId: request.pollId,
          responseTime: Date.now() - startTime
        },
        {
          privacyLevel: request.privacyLevel
        }
      );
    }
  }

  /**
   * Calculate results for a poll
   */
  async calculateResults(poll: PollData, votes: VoteData[]): Promise<ResultsData> {
    const startTime = Date.now();
    
    try {
      const strategy = this.getStrategy(poll.votingMethod);
      const results = await strategy.calculateResults(poll, votes);

      devLog('Results calculated successfully', {
        pollId: poll.id,
        method: poll.votingMethod,
        totalVotes: votes.length,
        duration: Date.now() - startTime
      });

      return results;

    } catch (error) {
      devLog('Results calculation error:', error);
      throw new Error(`Failed to calculate results: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get voting method configuration
   */
  getVotingMethodConfig(method: VotingMethod): Record<string, unknown> {
    const strategy = this.getStrategy(method);
    return strategy.getConfiguration();
  }

  /**
   * Update engine configuration
   */
  updateConfig(newConfig: Partial<VoteEngineConfig>): void {
    this.config = { ...this.config, ...newConfig };
    devLog('VoteEngine configuration updated:', this.config);
  }

  /**
   * Get current configuration
   */
  getConfig(): VoteEngineConfig {
    return { ...this.config };
  }
}

// Export a default instance
export const voteEngine = new VoteEngine();
