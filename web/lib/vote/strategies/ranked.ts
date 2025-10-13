/**
 * Ranked Choice Voting Strategy
 * 
 * Implements ranked choice voting where voters rank options in order of preference.
 * Uses instant runoff voting (IRV) to determine the winner.
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

export class RankedStrategy implements VotingStrategy {
  
  getVotingMethod(): VotingMethod {
    return 'ranked';
  }

  async validateVote(request: VoteRequest, poll: PollData): Promise<VoteValidation> {
    try {
      const voteData = request.voteData;

      // Validate rankings array exists
      if (!voteData.rankings || !Array.isArray(voteData.rankings)) {
        return {
          valid: false,
          isValid: false,
          error: 'Rankings must be an array',
          errors: ['Rankings must be an array'],
          requiresAuthentication: false,
          requiresTokens: false
        };
      }

      // Validate rankings array is not empty
      if (voteData.rankings.length === 0) {
        return {
          valid: false,
          isValid: false,
          error: 'At least one ranking is required',
          errors: ['At least one ranking is required'],
          requiresAuthentication: false,
          requiresTokens: false
        };
      }

      // Validate all rankings are valid integers
      for (const ranking of voteData.rankings) {
        if (typeof ranking !== 'number' || !Number.isInteger(ranking)) {
          return {
            valid: false,
            isValid: false,
            error: 'Rankings must be integers',
            errors: ['Rankings must be integers'],
            requiresAuthentication: false,
            requiresTokens: false
          };
        }

        if (ranking < 0 || ranking >= poll.options.length) {
          return {
            valid: false,
            isValid: false,
            error: 'Invalid option selected',
            errors: ['Invalid option selected'],
            requiresAuthentication: false,
            requiresTokens: false
          };
        }
      }

      // Check for duplicate rankings
      const uniqueRankings = new Set(voteData.rankings);
      if (uniqueRankings.size !== voteData.rankings.length) {
        return {
          valid: false,
          isValid: false,
          error: 'Duplicate rankings are not allowed',
          errors: ['Duplicate rankings are not allowed'],
          requiresAuthentication: false,
          requiresTokens: false
        };
      }

      // Check maximum rankings limit
      const maxRankings = poll.maxChoices || poll.options.length;
      if (voteData.rankings.length > maxRankings) {
        return {
          valid: false,
          isValid: false,
          error: `Maximum ${maxRankings} rankings allowed`,
          errors: [`Maximum ${maxRankings} rankings allowed`],
          requiresAuthentication: false,
          requiresTokens: false
        };
      }

      devLog('Ranked vote validated successfully', {
        pollId: request.pollId,
        rankings: voteData.rankings,
        userId: request.userId
      });

      return {
        valid: true,
        isValid: true,
        requiresAuthentication: false,
        requiresTokens: false
      };

    } catch (error) {
      devLog('Ranked vote validation error:', error);
      return {
        valid: false,
        isValid: false,
        error: 'Ranked vote validation failed',
        errors: ['Ranked vote validation failed'],
        requiresAuthentication: false,
        requiresTokens: false
      };
    }
  }

  async processVote(request: VoteRequest, poll: PollData): Promise<VoteResponse> {
    try {
      const voteData = request.voteData;
      
      // Create vote data for storage
      const voteRecord: VoteData = {
        id: `vote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        pollId: request.pollId,
        userId: request.userId,
        voteData: {
          rankings: voteData.rankings
        },
        timestamp: new Date().toISOString(),
        ipAddress: request.ipAddress,
        userAgent: request.userAgent
      };

      devLog('Ranked vote processed successfully', {
        pollId: request.pollId,
        userId: request.userId,
        rankings: voteData.rankings,
        voteId: voteRecord.id
      });

      return {
        success: true,
        voteId: voteRecord.id,
        message: 'Vote recorded successfully',
        pollId: request.pollId
      };

    } catch (error) {
      devLog('Ranked vote processing error:', error);
      return {
        success: false,
        error: 'Failed to process ranked vote',
        message: 'Failed to process ranked vote',
        pollId: request.pollId
      };
    }
  }

  async calculateResults(poll: PollData, votes: VoteData[]): Promise<ResultsData> {
    try {
      const startTime = Date.now();
      
      // Import IRV calculator for proper ranked choice implementation
      const { IRVCalculator } = await import('../irv-calculator');
      
      // Convert poll options to candidates format
      const candidates = poll.options.map(option => ({
        id: option.id,
        name: option.text,
        description: option.description || ''
      }));

      // Convert votes to user rankings format
      const userRankings = votes
        .filter(vote => vote.voteData.rankings && vote.voteData.rankings.length > 0)
        .map(vote => ({
          pollId: poll.id,
          userId: vote.userId,
          ranking: vote.voteData.rankings.map(index => poll.options[index]?.id).filter(Boolean),
          createdAt: new Date(vote.timestamp)
        }));

      // Create IRV calculator and calculate results
      const calculator = new IRVCalculator(poll.id, candidates);
      const irvResults = calculator.calculateResults(userRankings);

      // Convert IRV results to our format
      const optionVotes: Record<string, number> = {};
      const optionPercentages: Record<string, number> = {};

      // Initialize all options with zero scores
      poll.options.forEach(option => {
        optionVotes[option.id] = 0;
        optionPercentages[option.id] = 0;
      });

      // Count votes from first round
      if (irvResults.rounds.length > 0) {
        const firstRound = irvResults.rounds[0];
        Object.entries(firstRound.votes).forEach(([optionId, votes]) => {
          optionVotes[optionId] = votes;
        });
      }

      const totalVotes = irvResults.totalVotes;

      // Calculate percentages
      if (totalVotes > 0) {
        Object.keys(optionVotes).forEach(optionId => {
          const votes = optionVotes[optionId];
          optionPercentages[optionId] = (votes / totalVotes) * 100;
        });
      }

      // Get winner from IRV results
      const winner = irvResults.winner;
      const winnerVotes = winner ? optionVotes[winner] || 0 : 0;
      const winnerPercentage = winner ? optionPercentages[winner] || 0 : 0;

      const results: PollResults = {
        winner,
        winnerVotes,
        winnerPercentage,
        optionVotes,
        optionPercentages,
        abstentions: 0,
        abstentionPercentage: 0
      };

      devLog('Ranked results calculated with IRV', {
        pollId: poll.id,
        totalVotes,
        winner,
        winnerVotes,
        winnerPercentage,
        rounds: irvResults.rounds.length,
        calculationTime: Date.now() - startTime
      });

      return {
        pollId: poll.id,
        votingMethod: poll.votingMethod,
        totalVotes,
        participationRate: totalVotes / 100, // Mock participation rate
        results,
        calculatedAt: new Date().toISOString(),
        metadata: {
          calculationTime: Date.now() - startTime,
          method: 'ranked',
          rounds: irvResults.rounds.length,
          eliminated: irvResults.rounds
            .filter(round => round.eliminated)
            .map(round => round.eliminated!)
        }
      };

    } catch (error) {
      devLog('Ranked results calculation error:', error);
      
      // Return empty results on error
      return {
        pollId: poll.id,
        votingMethod: poll.votingMethod,
        totalVotes: 0,
        participationRate: 0,
        results: {
          winner: undefined,
          winnerVotes: 0,
          winnerPercentage: 0,
          optionVotes: {},
          optionPercentages: {},
          abstentions: 0,
          abstentionPercentage: 0
        },
        calculatedAt: new Date().toISOString(),
        metadata: {
          calculationTime: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  getConfiguration(): Record<string, unknown> {
    return {
      method: 'ranked',
      description: 'Voters rank options in order of preference',
      allowsMultipleSelections: true,
      requiresRanking: true,
      maxSelections: 'configurable',
      algorithm: 'instant runoff voting'
    };
  }
}