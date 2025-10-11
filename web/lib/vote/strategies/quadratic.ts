/**
 * Quadratic Voting Strategy
 * 
 * Implements quadratic voting where voters allocate credits across options.
 * The cost of votes increases quadratically with the number of votes for an option.
 * 
 * Created: September 15, 2025
 * Updated: September 15, 2025
 */

import { devLog } from '@/lib/utils/logger';
import { withOptional } from '@/lib/utils/objects';
import type { 
  VotingStrategy, 
  VoteRequest, 
  VoteResponse, 
  VoteValidation, 
  PollData, 
  VoteData, 
  ResultsData,
  VotingMethod,
  PollResults
} from '../types';

export class QuadraticStrategy implements VotingStrategy {
  
  getVotingMethod(): VotingMethod {
    return 'quadratic';
  }

  async validateVote(request: VoteRequest, poll: PollData): Promise<VoteValidation> {
    try {
      const { voteData } = request;
      
      // Check if allocations object is provided
      if (!voteData.allocations || typeof voteData.allocations !== 'object') {
        return {
          isValid: false,
          error: 'Allocations object is required for quadratic voting',
          requiresAuthentication: true,
          requiresTokens: false
        };
      }

      const allocations = voteData.allocations;
      const totalCredits = poll.votingConfig.quadraticCredits || 100;
      
      // Validate all allocations are valid numbers
      let totalSpent = 0;
      for (const [optionIndex, credits] of Object.entries(allocations)) {
        if (typeof credits !== 'number' || !Number.isInteger(credits) || credits < 0) {
          return {
            isValid: false,
            error: 'All allocations must be non-negative integers',
            requiresAuthentication: true,
            requiresTokens: false
          };
        }

        // Validate option index is valid
        const optionIdx = parseInt(optionIndex);
        if (optionIdx < 0 || optionIdx >= poll.options.length) {
          return {
            isValid: false,
            error: `Invalid option index: ${optionIndex}`,
            requiresAuthentication: true,
            requiresTokens: false
          };
        }

        // Calculate quadratic cost
        const cost = credits * credits;
        totalSpent += cost;
      }

      // Validate total spending doesn't exceed credits
      if (totalSpent > totalCredits) {
        return {
          isValid: false,
          error: `Total spending (${totalSpent}) exceeds available credits (${totalCredits})`,
          requiresAuthentication: true,
          requiresTokens: false
        };
      }

      // Check if at least one option has votes
      const hasVotes = Object.values(allocations).some(credits => (credits as number) > 0);
      if (!hasVotes) {
        return {
          isValid: false,
          error: 'At least one option must receive votes',
          requiresAuthentication: true,
          requiresTokens: false
        };
      }

      devLog('Quadratic vote validated successfully', {
        pollId: request.pollId,
        allocations,
        totalSpent,
        totalCredits,
        userId: request.userId
      });

      return {
        isValid: true,
        requiresAuthentication: true,
        requiresTokens: false
      };

    } catch (error) {
      devLog('Quadratic vote validation error:', error);
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Validation failed',
        requiresAuthentication: true,
        requiresTokens: false
      };
    }
  }

  async processVote(request: VoteRequest, poll: PollData): Promise<VoteResponse> {
    try {
      const { voteData, userId, pollId, privacyLevel } = request;
      
      // Generate vote ID
      const voteId = `vote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create audit receipt
      const auditReceipt = `receipt_${voteId}_${Date.now()}`;

      // Calculate total spending for audit
      const allocations = voteData.allocations || {};
      const totalSpent = Object.values(allocations).reduce((sum: number, credits) => {
        return sum + (credits as number) * (credits as number);
      }, 0);

      // In a real implementation, this would:
      // 1. Store the vote in the database
      // 2. Update poll vote counts
      // 3. Trigger any necessary notifications
      // 4. Log the vote for audit purposes

      devLog('Quadratic vote processed successfully', {
        pollId,
        voteId,
        allocations,
        totalSpent,
        userId,
        auditReceipt
      });

      return withOptional({
        success: true,
        message: 'Vote submitted successfully',
        pollId,
        voteId,
        auditReceipt,
        responseTime: 0, // Will be set by the engine
        metadata: {
          votingMethod: 'quadratic',
          allocations,
          totalSpent,
          totalCredits: poll.votingConfig.quadraticCredits || 100,
          remainingCredits: (poll.votingConfig.quadraticCredits || 100) - (totalSpent as number)
        }
      }, {
        privacyLevel
      });

    } catch (error) {
      devLog('Quadratic vote processing error:', error);
      return withOptional({
        success: false,
        message: error instanceof Error ? error.message : 'Vote processing failed',
        pollId: request.pollId,
        responseTime: 0,
        metadata: {
          votingMethod: 'quadratic',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }, {
        voteId: undefined,
        auditReceipt: undefined,
        privacyLevel: request.privacyLevel
      });
    }
  }

  async calculateResults(poll: PollData, votes: VoteData[]): Promise<ResultsData> {
    try {
      const startTime = Date.now();
      
      // Calculate quadratic scores for each option
      const quadraticScores: Record<string, number> = {};
      const quadraticSpending: Record<string, number> = {};
      const optionVotes: Record<string, number> = {};
      const optionPercentages: Record<string, number> = {};
      
      // Initialize scores
      poll.options.forEach((_, index) => {
        quadraticScores[index.toString()] = 0;
        quadraticSpending[index.toString()] = 0;
        optionVotes[index.toString()] = 0;
        optionPercentages[index.toString()] = 0;
      });

      // Calculate scores from votes
      let totalVotes = 0;
      votes.forEach(vote => {
        if (vote.allocations && typeof vote.allocations === 'object') {
          totalVotes++;
          Object.entries(vote.allocations).forEach(([optionIndex, credits]) => {
            const creditsNum = credits as number;
            if (creditsNum > 0) {
              const optionIdx = optionIndex.toString();
              // Ensure the option exists in our tracking objects
              if (quadraticScores[optionIdx] !== undefined && 
                  quadraticSpending[optionIdx] !== undefined && 
                  optionVotes[optionIdx] !== undefined) {
                quadraticScores[optionIdx] += creditsNum;
                quadraticSpending[optionIdx] += creditsNum * creditsNum;
                optionVotes[optionIdx]++;
              }
            }
          });
        }
      });

      // Calculate percentages
      if (totalVotes > 0) {
        Object.keys(quadraticScores).forEach(optionIndex => {
          const votes = optionVotes[optionIndex];
          if (votes !== undefined) {
            optionPercentages[optionIndex] = (votes / totalVotes) * 100;
          }
        });
      }

      // Find winner (highest quadratic score)
      let winner: string | undefined;
      let winnerVotes = 0;
      let winnerPercentage = 0;

      if (totalVotes > 0) {
        Object.entries(quadraticScores).forEach(([optionIndex, score]) => {
          if (score > winnerVotes) {
            winner = optionIndex;
            winnerVotes = score;
            winnerPercentage = optionPercentages[optionIndex] ?? 0;
          }
        });
      }

      const results: PollResults = withOptional(
        {
          winnerVotes,
          winnerPercentage,
          quadraticScores,
          quadraticSpending,
          optionVotes,
          optionPercentages,
          abstentions: 0,
          abstentionPercentage: 0
        },
        {
          winner
        }
      );

      const resultsData: ResultsData = {
        pollId: poll.id,
        votingMethod: 'quadratic',
        totalVotes,
        participationRate: totalVotes > 0 ? 100 : 0, // This would be calculated based on eligible voters
        results,
        calculatedAt: new Date().toISOString(),
        metadata: {
          calculationTime: Date.now() - startTime,
          hasWinner: winner !== undefined,
          isTie: winnerVotes > 0 && Object.values(quadraticScores).filter(s => s === winnerVotes).length > 1,
          totalCreditsAllocated: Object.values(quadraticScores).reduce((sum, score) => sum + score, 0),
          totalCreditsSpent: Object.values(quadraticSpending).reduce((sum, spent) => sum + spent, 0),
          averageCreditsPerVote: totalVotes > 0 ? Object.values(quadraticScores).reduce((sum, score) => sum + score, 0) / totalVotes : 0
        }
      };

      devLog('Quadratic results calculated', {
        pollId: poll.id,
        totalVotes,
        winner,
        winnerVotes,
        winnerPercentage,
        calculationTime: Date.now() - startTime
      });

      return resultsData;

    } catch (error) {
      devLog('Quadratic results calculation error:', error);
      throw new Error(`Failed to calculate quadratic results: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  getConfiguration(): Record<string, unknown> {
    return {
      name: 'Quadratic Voting',
      description: 'Voters allocate credits across options. Cost increases quadratically with votes.',
      minOptions: 2,
      maxOptions: 20,
      allowAbstention: true,
      requiresRanking: false,
      allowsMultipleSelections: true,
      resultType: 'highest_score',
      features: [
        'Allows intensity of preference',
        'Prevents vote buying',
        'Encourages diverse participation',
        'Good for budget allocation'
      ],
      limitations: [
        'More complex to understand',
        'Requires credit management',
        'Can be gamed with coordination',
        'May favor wealthy participants'
      ],
      defaultCredits: 100,
      maxCreditsPerOption: 10
    };
  }
}