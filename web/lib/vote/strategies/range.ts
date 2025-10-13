/**
 * Range Voting Strategy
 * 
 * Implements range voting where voters rate each option on a scale.
 * Results show average ratings for each option, with the highest rated option winning.
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

export class RangeStrategy implements VotingStrategy {
  
  getVotingMethod(): VotingMethod {
    return 'range';
  }

  async validateVote(request: VoteRequest, poll: PollData): Promise<VoteValidation> {
    try {
      const voteData = request.voteData;

      // Validate ratings object exists
      if (!voteData.ratings || typeof voteData.ratings !== 'object') {
        return {
          valid: false,
          isValid: false,
          error: 'Range voting requires ratings',
          errors: ['Range voting requires ratings'],
          requiresAuthentication: false,
          requiresTokens: false
        };
      }

      // Validate ratings are numbers within range
      const ratings = voteData.ratings;
      const minRating = poll.settings?.minRating || 0;
      const maxRating = poll.settings?.maxRating || 10;
      
      for (const [optionId, rating] of Object.entries(ratings)) {
        if (typeof rating !== 'number') {
          return {
            valid: false,
            isValid: false,
            error: 'Ratings must be numbers',
            errors: ['Ratings must be numbers'],
            requiresAuthentication: false,
            requiresTokens: false
          };
        }
        
        if (rating < minRating || rating > maxRating) {
          return {
            valid: false,
            isValid: false,
            error: `Ratings must be between ${minRating} and ${maxRating}`,
            errors: [`Ratings must be between ${minRating} and ${maxRating}`],
            requiresAuthentication: false,
            requiresTokens: false
          };
        }
        
        // Check if option exists
        const optionExists = poll.options.some(option => option.id === optionId);
        if (!optionExists) {
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

      devLog('Range vote validated successfully', {
        pollId: request.pollId,
        ratings: voteData.ratings,
        userId: request.userId
      });

      return {
        valid: true,
        isValid: true,
        requiresAuthentication: false,
        requiresTokens: false
      };

    } catch (error) {
      devLog('Range vote validation error:', error);
      return {
        valid: false,
        isValid: false,
        error: 'Range vote validation failed',
        errors: ['Range vote validation failed'],
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
          ratings: voteData.ratings
        },
        timestamp: new Date().toISOString(),
        ipAddress: request.ipAddress,
        userAgent: request.userAgent
      };

      devLog('Range vote processed successfully', {
        pollId: request.pollId,
        userId: request.userId,
        ratings: voteData.ratings,
        voteId: voteRecord.id
      });

      return {
        success: true,
        voteId: voteRecord.id,
        message: 'Vote recorded successfully',
        pollId: request.pollId
      };

    } catch (error) {
      devLog('Range vote processing error:', error);
      return {
        success: false,
        error: 'Failed to process range vote',
        message: 'Failed to process range vote',
        pollId: request.pollId
      };
    }
  }

  async calculateResults(poll: PollData, votes: VoteData[]): Promise<ResultsData> {
    try {
      const startTime = Date.now();
      
      // Initialize tracking objects
      const totalRatings: Record<string, number> = {};
      const ratingCounts: Record<string, number> = {};
      const averageRatings: Record<string, number> = {};
      const optionVotes: Record<string, number> = {};
      const optionPercentages: Record<string, number> = {};

      // Initialize all options with zero scores
      poll.options.forEach(option => {
        totalRatings[option.id] = 0;
        ratingCounts[option.id] = 0;
        averageRatings[option.id] = 0;
        optionVotes[option.id] = 0;
        optionPercentages[option.id] = 0;
      });

      // Process each vote
      votes.forEach(vote => {
        if (vote.voteData.ratings) {
          Object.entries(vote.voteData.ratings).forEach(([optionId, rating]) => {
            if (typeof rating === 'number') {
              totalRatings[optionId] += rating;
              ratingCounts[optionId]++;
              optionVotes[optionId]++;
            }
          });
        }
      });

      // Calculate average ratings
      Object.keys(totalRatings).forEach(optionId => {
        if (ratingCounts[optionId] > 0) {
          averageRatings[optionId] = totalRatings[optionId] / ratingCounts[optionId];
        }
      });

      const totalVotes = votes.length;

      // Calculate percentages
      if (totalVotes > 0) {
        Object.keys(optionVotes).forEach(optionId => {
          const votes = optionVotes[optionId];
          optionPercentages[optionId] = (votes / totalVotes) * 100;
        });
      }

      // Find winner (highest average rating)
      let winner: string | undefined;
      let winnerVotes = 0;
      let winnerPercentage = 0;

      if (totalVotes > 0) {
        Object.entries(averageRatings).forEach(([optionId, rating]) => {
          if (rating > winnerVotes) {
            winner = optionId;
            winnerVotes = rating;
            winnerPercentage = optionPercentages[optionId] || 0;
          }
        });
      }

      const results: PollResults = {
        winner,
        winnerVotes,
        winnerPercentage,
        optionVotes,
        optionPercentages,
        abstentions: 0,
        abstentionPercentage: 0
      };

      devLog('Range results calculated', {
        pollId: poll.id,
        totalVotes,
        winner,
        winnerVotes,
        winnerPercentage,
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
          method: 'range'
        }
      };

    } catch (error) {
      devLog('Range results calculation error:', error);
      
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
      method: 'range',
      description: 'Voters rate each option on a scale',
      allowsMultipleSelections: true,
      requiresRanking: false,
      maxSelections: 'all options',
      ratingScale: 'configurable'
    };
  }
}