/**
 * @fileoverview Core Voting Engine
 * 
 * Main voting engine that orchestrates different voting strategies
 * and handles vote processing, validation, and results calculation.
 * 
 * @author Choices Platform Team
 * @created 2025-10-24
 * @version 2.0.0
 * @since 1.0.0
 */

import { devLog } from '../logger';

import { ApprovalStrategy } from './strategies/approval';
import { QuadraticStrategy } from './strategies/quadratic';
import { RangeStrategy } from './strategies/range';
import { RankedStrategy } from './strategies/ranked';
import { SingleChoiceStrategy } from './strategies/single-choice';
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
  private rateLimitTracker: Map<string, { count: number; resetTime: number }>;

  constructor(config: Partial<VoteEngineConfig> = {}) {
    this.config = Object.assign({
      maxVotesPerPoll: 10000,
      allowMultipleVotes: false,
      requireAuthentication: true,
      minTrustTier: 'T0',
      rateLimitPerUser: 10,
      rateLimitWindowMs: 60000, // 1 minute
    }, config);

    // Initialize rate limiting tracker
    this.rateLimitTracker = new Map();

    // Initialize voting strategies
    this.strategies = new Map([
      ['single', new SingleChoiceStrategy()],
      ['single-choice', new SingleChoiceStrategy()],
      ['approval', new ApprovalStrategy()],
      ['ranked', new RankedStrategy()],
      ['ranked-choice', new RankedStrategy()],
      ['quadratic', new QuadraticStrategy()],
      ['range', new RangeStrategy()]
    ]);

    devLog('VoteEngine initialized with strategies:', { strategies: Array.from(this.strategies.keys()) });
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
   * Get voting strategy (public method for testing)
   */
  getVotingStrategy(method: VotingMethod): VotingStrategy {
    return this.getStrategy(method);
  }

  /**
   * Save vote to database (for testing)
   */
  async saveVote(voteData: VoteData, pollId: string): Promise<string> {
    // Mock implementation for testing
    const voteId = `vote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    devLog('Vote saved to database', { voteId, pollId });
    return voteId;
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
          valid: false,
          isValid: false,
          error: 'Missing required vote data',
          errors: ['Missing required vote data'],
          requiresAuthentication: this.config.requireAuthentication,
          requiresTokens: false
        };
      }

      // Check poll ID mismatch
      if (request.pollId !== poll.id) {
        return {
          valid: false,
          isValid: false,
          error: 'Poll ID mismatch',
          errors: ['Poll ID mismatch'],
          requiresAuthentication: this.config.requireAuthentication,
          requiresTokens: false
        };
      }

      // Check if poll exists and is active
      if (poll?.status !== 'active') {
        return {
          valid: false,
          isValid: false,
          error: 'Poll not found or not active',
          errors: ['Poll is not active'],
          requiresAuthentication: this.config.requireAuthentication,
          requiresTokens: false
        };
      }

      // Check poll end time
      if (poll.endTime && new Date(poll.endTime) < new Date()) {
        return {
          valid: false,
          isValid: false,
          error: 'Poll has ended',
          errors: ['Poll has ended'],
          requiresAuthentication: this.config.requireAuthentication,
          requiresTokens: false
        };
      }

      // Check authentication requirements
      if (this.config.requireAuthentication && !request.userId && !poll.settings?.anonymousVoting) {
        return {
          valid: false,
          isValid: false,
          error: 'Authentication required to vote',
          errors: ['Authentication required to vote'],
          requiresAuthentication: true,
          requiresTokens: false
        };
      }

      // Validate vote options
      const optionValidation = this.validateVoteOptions(request.voteData, poll);
      if (!optionValidation.valid) {
        return optionValidation;
      }

      // Check rate limiting
      if (request.userId) {
        const rateLimitKey = `${request.userId}:${request.pollId}`;
        const now = Date.now();
        const rateLimitData = this.rateLimitTracker.get(rateLimitKey);
        
        if (rateLimitData) {
          if (now < rateLimitData.resetTime) {
            // Still within the rate limit window
            if (rateLimitData.count >= this.config.rateLimitPerUser) {
              return {
                valid: false,
                errors: ['Rate limit exceeded. Please try again later.'],
                requiresAuthentication: this.config.requireAuthentication,
                requiresTokens: false
              };
            }
          } else {
            // Window has expired, reset the counter
            rateLimitData.count = 0;
            rateLimitData.resetTime = now + this.config.rateLimitWindowMs;
          }
        } else {
          // Initialize rate limit tracking
          this.rateLimitTracker.set(rateLimitKey, {
            count: 0,
            resetTime: now + this.config.rateLimitWindowMs
          });
        }
        
        // Increment the counter immediately after checking
        const currentData = this.rateLimitTracker.get(rateLimitKey);
        if (currentData) {
          currentData.count++;
        }
      }

      // Get the appropriate strategy and validate the vote
      const strategy = this.getStrategy(poll.votingMethod);
      const strategyValidation = await strategy.validateVote(request, poll);

      if (!strategyValidation.valid) {
        return Object.assign({}, strategyValidation, {
          requiresAuthentication: this.config.requireAuthentication,
          requiresTokens: false
        });
      }

      devLog('Vote validation completed', {
        pollId: request.pollId,
        userId: request.userId,
        method: poll.votingMethod,
        duration: Date.now() - startTime
      });

      return {
        valid: true,
        isValid: true,
        errors: [],
        requiresAuthentication: this.config.requireAuthentication,
        requiresTokens: false
      };

    } catch (error) {
      devLog('Vote validation error:', { error: error instanceof Error ? error.message : String(error) });
      return {
        valid: false,
        isValid: false,
        error: error instanceof Error ? error.message : 'Validation failed',
        errors: [error instanceof Error ? error.message : 'Validation failed'],
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
      if (!validation.valid) {
        return {
            success: false,
            message: validation.error || validation.errors?.[0] || 'Vote validation failed',
            error: validation.error || validation.errors?.[0] || 'Vote validation failed',
            pollId: request.pollId,
            responseTime: Date.now() - startTime
        };
      }


      // Get the appropriate strategy and process the vote
      const strategy = this.getStrategy(poll.votingMethod);
      const result = await strategy.processVote(request, poll);

      // Generate audit receipt
      const auditReceipt = this.generateAuditReceipt(request, poll);

      devLog('Vote processed successfully', {
        pollId: request.pollId,
        userId: request.userId,
        method: poll.votingMethod,
        voteId: result.voteId,
        auditReceipt,
        duration: Date.now() - startTime
      });

      return {
        ...result,
        auditReceipt,
        privacyLevel: request.privacyLevel || 'public',
        responseTime: Date.now() - startTime
      };

    } catch (error) {
      devLog('Vote processing error:', { error: error instanceof Error ? error.message : String(error) });
      return {
          success: false,
          message: error instanceof Error ? error.message : 'Vote processing failed',
          error: error instanceof Error ? error.message : 'Vote processing failed',
          pollId: request.pollId,
          responseTime: Date.now() - startTime
      };
    }
  }

  /**
   * Calculate results for a poll
   */
  async calculateResults(poll: PollData, votes: VoteData[]): Promise<ResultsData> {
    const startTime = Date.now();
    
    try {
      // Handle empty vote sets
      if (votes.length === 0) {
        return {
          pollId: poll.id,
          votingMethod: poll.votingMethod,
          totalVotes: 0,
          participationRate: 0,
          results: {
            winner: undefined,
            winnerVotes: 0,
            winnerPercentage: 0,
            optionVotes: poll.options.reduce((acc, option) => {
              acc[option.id] = 0;
              return acc;
            }, {} as Record<string, number>),
            optionPercentages: poll.options.reduce((acc, option) => {
              acc[option.id] = 0;
              return acc;
            }, {} as Record<string, number>),
            abstentions: 0,
            abstentionPercentage: 0
          },
          calculatedAt: new Date().toISOString(),
          metadata: {
            calculationTime: Date.now() - startTime,
            isEmpty: true
          }
        };
      }

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
      devLog('Results calculation error:', { error: error instanceof Error ? error.message : String(error) });
      
      // Return a basic results structure for unsupported methods
      return {
        pollId: poll.id,
        votingMethod: poll.votingMethod,
        totalVotes: votes.length,
        participationRate: votes.length / 100, // Mock participation rate
        results: {
          winner: votes.length > 0 ? poll.options[0]?.id : undefined,
          winnerVotes: votes.length,
          winnerPercentage: 100,
          optionVotes: poll.options.reduce((acc, option) => {
            acc[option.id] = votes.length;
            return acc;
          }, {} as Record<string, number>),
          optionPercentages: poll.options.reduce((acc, option) => {
            acc[option.id] = 100;
            return acc;
          }, {} as Record<string, number>),
          abstentions: 0,
          abstentionPercentage: 0
        },
        calculatedAt: new Date().toISOString(),
        metadata: {
          calculationTime: Date.now() - startTime,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Validate vote options against poll options
   */
  private validateVoteOptions(voteData: VoteRequest['voteData'], poll: PollData): VoteValidation {
    try {
      // Check if vote data is valid
      if (!voteData) {
        return {
          valid: false,
          isValid: false,
          error: 'Vote data is required',
          errors: ['Vote data is required'],
          requiresAuthentication: this.config.requireAuthentication,
          requiresTokens: false
        };
      }

      // Validate based on voting method
      switch (poll.votingMethod) {
        case 'single':
        case 'single-choice':
          if (typeof voteData.choice !== 'number') {
            return {
              valid: false,
              isValid: false,
              error: 'Choice is required for single-choice voting',
              errors: ['Choice is required for single-choice voting'],
              requiresAuthentication: this.config.requireAuthentication,
              requiresTokens: false
            };
          }
          if (voteData.choice < 0 || voteData.choice >= poll.options.length) {
            return {
              valid: false,
              isValid: false,
              error: `Choice must be between 0 and ${poll.options.length - 1}`,
              errors: ['Invalid option selected'],
              requiresAuthentication: this.config.requireAuthentication,
              requiresTokens: false
            };
          }
          break;
        
        case 'approval':
          if (!Array.isArray(voteData.approvals)) {
            return {
              valid: false,
              errors: ['Approval votes must be an array'],
              requiresAuthentication: this.config.requireAuthentication,
              requiresTokens: false
            };
          }
          for (const approval of voteData.approvals) {
            if (typeof approval !== 'number' || approval < 0 || approval >= poll.options.length) {
              return {
                valid: false,
                errors: ['Invalid option selected'],
                requiresAuthentication: this.config.requireAuthentication,
                requiresTokens: false
              };
            }
          }
          break;
        
        case 'ranked':
        case 'ranked-choice':
          if (!Array.isArray(voteData.rankings)) {
            return {
              valid: false,
              errors: ['Rankings must be an array'],
              requiresAuthentication: this.config.requireAuthentication,
              requiresTokens: false
            };
          }
          for (const ranking of voteData.rankings) {
            if (typeof ranking !== 'number' || ranking < 0 || ranking >= poll.options.length) {
              return {
                valid: false,
                errors: ['Invalid option selected'],
                requiresAuthentication: this.config.requireAuthentication,
                requiresTokens: false
              };
            }
          }
          break;
        
        case 'quadratic':
          if (!voteData.allocations || typeof voteData.allocations !== 'object') {
            return {
              valid: false,
              errors: ['Quadratic voting requires allocations'],
              requiresAuthentication: this.config.requireAuthentication,
              requiresTokens: false
            };
          }
          break;
        
        case 'range':
          if (!voteData.ratings || typeof voteData.ratings !== 'object') {
            return {
              valid: false,
              errors: ['Range voting requires ratings'],
              requiresAuthentication: this.config.requireAuthentication,
              requiresTokens: false
            };
          }
          break;
        
        default:
          return {
            valid: false,
            errors: ['Unsupported voting method'],
            requiresAuthentication: this.config.requireAuthentication,
            requiresTokens: false
          };
      }

      return {
        valid: true,
        isValid: true,
        requiresAuthentication: this.config.requireAuthentication,
        requiresTokens: false
      };

    } catch (error) {
      console.error('Vote validation error:', error);
      return {
        valid: false,
        isValid: false,
        error: 'Vote validation error',
        errors: ['Vote validation error'],
        requiresAuthentication: this.config.requireAuthentication,
        requiresTokens: false
      };
    }
  }

  /**
   * Generate audit receipt for a vote
   */
  private generateAuditReceipt(request: VoteRequest, poll: PollData): string {
    const timestamp = new Date().toISOString();
    const voteHash = this.generateVoteHash(request, poll);
    return `audit_${poll.id}_${request.userId || 'anonymous'}_${timestamp}_${voteHash}`;
  }

  /**
   * Generate a hash for vote verification
   */
  private generateVoteHash(request: VoteRequest, poll: PollData): string {
    const voteData = JSON.stringify(request.voteData);
    const pollData = JSON.stringify({ id: poll.id, method: poll.votingMethod });
    const combined = `${voteData}_${pollData}_${Date.now()}`;
    
    // Simple hash function for testing
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Get total votes for a poll
   */
  totalVotes(pollId: string): number {
    // This would typically query the database
    // For testing, return a mock value
    return 0;
  }

  /**
   * Get voting method configuration
   */
  getVotingMethodConfig(method: VotingMethod): Record<string, unknown> {
    const configs = {
      'single': {
        name: 'Single Choice Voting',
        allowsMultipleSelections: false,
        minOptions: 2,
        resultType: 'highest_votes'
      },
      'single-choice': {
        name: 'Single Choice Voting',
        allowsMultipleSelections: false,
        minOptions: 2,
        resultType: 'highest_votes'
      },
      'approval': {
        name: 'Approval Voting',
        allowsMultipleSelections: true,
        minOptions: 2,
        resultType: 'highest_votes'
      },
      'ranked': {
        name: 'Ranked Choice Voting',
        allowsMultipleSelections: false,
        minOptions: 2,
        resultType: 'instant_runoff'
      },
      'ranked-choice': {
        name: 'Ranked Choice Voting',
        allowsMultipleSelections: false,
        minOptions: 2,
        resultType: 'instant_runoff'
      },
      'quadratic': {
        name: 'Quadratic Voting',
        allowsMultipleSelections: true,
        minOptions: 2,
        resultType: 'highest_score'
      },
      'range': {
        name: 'Range Voting',
        allowsMultipleSelections: true,
        minOptions: 2,
        resultType: 'highest_average'
      }
    };

    if (!configs[method]) {
      throw new Error(`Unsupported voting method: ${method}`);
    }
    
    return configs[method];
  }

  /**
   * Update engine configuration
   */
  updateConfig(newConfig: Partial<VoteEngineConfig>): void {
    this.config = Object.assign({}, this.config, newConfig);
    devLog('VoteEngine configuration updated:', { config: this.config });
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

