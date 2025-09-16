/**
 * Range Voting Strategy
 * 
 * Implements range voting where voters rate each option on a scale.
 * Results show the average rating for each option, with the highest average winning.
 * 
 * Created: September 15, 2025
 * Updated: September 15, 2025
 */

import { devLog } from '../../logger';
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
      const { voteData } = request;
      
      // Check if ratings object is provided
      if (!voteData.ratings || typeof voteData.ratings !== 'object') {
        return {
          isValid: false,
          error: 'Ratings object is required for range voting',
          requiresAuthentication: true,
          requiresTokens: false
        };
      }

      const ratings = voteData.ratings;
      const rangeMin = poll.votingConfig.rangeMin || 0;
      const rangeMax = poll.votingConfig.rangeMax || 10;
      
      // Validate all ratings are within range
      for (const [optionIndex, rating] of Object.entries(ratings)) {
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
      }

      // Check if all options are rated
      if (Object.keys(ratings).length !== poll.options.length) {
        return {
          isValid: false,
          error: 'All options must be rated',
          requiresAuthentication: true,
          requiresTokens: false
        };
      }

      // Check if at least one option has a non-zero rating
      const hasNonZeroRating = Object.values(ratings).some(rating => (rating as number) > rangeMin);
      if (!hasNonZeroRating) {
        return {
          isValid: false,
          error: 'At least one option must have a rating above the minimum',
          requiresAuthentication: true,
          requiresTokens: false
        };
      }

      devLog('Range vote validated successfully', {
        pollId: request.pollId,
        ratings,
        rangeMin,
        rangeMax,
        userId: request.userId
      });

      return {
        isValid: true,
        requiresAuthentication: true,
        requiresTokens: false
      };

    } catch (error) {
      devLog('Range vote validation error:', error);
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

      // Calculate total score for audit
      const ratings = voteData.ratings || {};
      const totalScore = Object.values(ratings).reduce((sum: number, rating) => sum + (rating as number), 0);
      const averageScore = Object.keys(ratings).length > 0 ? (totalScore as number) / Object.keys(ratings).length : 0;

      // In a real implementation, this would:
      // 1. Store the vote in the database
      // 2. Update poll vote counts
      // 3. Trigger any necessary notifications
      // 4. Log the vote for audit purposes

      devLog('Range vote processed successfully', {
        pollId,
        voteId,
        ratings,
        totalScore,
        averageScore,
        userId,
        auditReceipt
      });

      return {
        success: true,
        message: 'Vote submitted successfully',
        pollId,
        voteId,
        auditReceipt,
        privacyLevel,
        responseTime: 0, // Will be set by the engine
        metadata: {
          votingMethod: 'range',
          ratings,
          totalScore,
          averageScore,
          rangeMin: poll.votingConfig.rangeMin || 0,
          rangeMax: poll.votingConfig.rangeMax || 10
        }
      };

    } catch (error) {
      devLog('Range vote processing error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Vote processing failed',
        pollId: request.pollId,
        voteId: undefined,
        auditReceipt: undefined,
        privacyLevel: request.privacyLevel,
        responseTime: 0,
        metadata: {
          votingMethod: 'range',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  async calculateResults(poll: PollData, votes: VoteData[]): Promise<ResultsData> {
    try {
      const startTime = Date.now();
      
      // Calculate range scores and averages for each option
      const rangeScores: Record<string, number> = {};
      const rangeAverages: Record<string, number> = {};
      const optionVotes: Record<string, number> = {};
      const optionPercentages: Record<string, number> = {};
      const ratingCounts: Record<string, number> = {};
      
      // Initialize scores
      poll.options.forEach((_, index) => {
        rangeScores[index.toString()] = 0;
        rangeAverages[index.toString()] = 0;
        optionVotes[index.toString()] = 0;
        optionPercentages[index.toString()] = 0;
        ratingCounts[index.toString()] = 0;
      });

      // Calculate scores from votes
      let totalVotes = 0;
      votes.forEach(vote => {
        if (vote.ratings && typeof vote.ratings === 'object') {
          totalVotes++;
          Object.entries(vote.ratings).forEach(([optionIndex, rating]) => {
            const ratingNum = rating as number;
            const optionIdx = optionIndex.toString();
            rangeScores[optionIdx] += ratingNum;
            ratingCounts[optionIdx]++;
            optionVotes[optionIdx]++;
          });
        }
      });

      // Calculate averages
      Object.keys(rangeScores).forEach(optionIndex => {
        if (ratingCounts[optionIndex] > 0) {
          rangeAverages[optionIndex] = rangeScores[optionIndex] / ratingCounts[optionIndex];
        }
      });

      // Calculate percentages (based on vote count)
      if (totalVotes > 0) {
        Object.keys(optionVotes).forEach(optionIndex => {
          optionPercentages[optionIndex] = (optionVotes[optionIndex] / totalVotes) * 100;
        });
      }

      // Find winner (highest average rating)
      let winner: string | undefined;
      let winnerVotes = 0;
      let winnerPercentage = 0;

      if (totalVotes > 0) {
        Object.entries(rangeAverages).forEach(([optionIndex, average]) => {
          if (average > winnerVotes) {
            winner = optionIndex;
            winnerVotes = average;
            winnerPercentage = optionPercentages[optionIndex];
          }
        });
      }

      const results: PollResults = {
        winner,
        winnerVotes,
        winnerPercentage,
        rangeScores,
        rangeAverages,
        optionVotes,
        optionPercentages,
        abstentions: 0,
        abstentionPercentage: 0
      };

      const resultsData: ResultsData = {
        pollId: poll.id,
        votingMethod: 'range',
        totalVotes,
        participationRate: totalVotes > 0 ? 100 : 0, // This would be calculated based on eligible voters
        results,
        calculatedAt: new Date().toISOString(),
        metadata: {
          calculationTime: Date.now() - startTime,
          hasWinner: winner !== undefined,
          isTie: winnerVotes > 0 && Object.values(rangeAverages).filter(a => a === winnerVotes).length > 1,
          averageRating: totalVotes > 0 ? Object.values(rangeScores).reduce((sum, score) => sum + score, 0) / (Object.values(ratingCounts).reduce((sum, count) => sum + count, 0) || 1) : 0,
          rangeMin: poll.votingConfig.rangeMin || 0,
          rangeMax: poll.votingConfig.rangeMax || 10
        }
      };

      devLog('Range results calculated', {
        pollId: poll.id,
        totalVotes,
        winner,
        winnerVotes,
        winnerPercentage,
        calculationTime: Date.now() - startTime
      });

      return resultsData;

    } catch (error) {
      devLog('Range results calculation error:', error);
      throw new Error(`Failed to calculate range results: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  getConfiguration(): Record<string, any> {
    return {
      name: 'Range Voting',
      description: 'Voters rate each option on a scale. The option with the highest average rating wins.',
      minOptions: 2,
      maxOptions: 20,
      allowAbstention: false,
      requiresRanking: false,
      allowsMultipleSelections: true,
      resultType: 'highest_average',
      features: [
        'Captures intensity of preference',
        'Allows nuanced expression',
        'Good for satisfaction surveys',
        'Provides detailed feedback'
      ],
      limitations: [
        'Requires rating all options',
        'Can be time-consuming',
        'May not reflect true preferences',
        'Susceptible to strategic voting'
      ],
      defaultRangeMin: 0,
      defaultRangeMax: 10,
      allowDecimals: true
    };
  }
}