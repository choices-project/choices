/**
 * Single Choice Voting Strategy
 * 
 * Implements single choice voting where voters select exactly one option.
 * Results show vote counts for each option, with the highest voted option winning.
 * 
 * Created: September 15, 2025
 * Updated: September 15, 2025
 */

import { devLog } from '@/lib/utils/logger';

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

export class SingleChoiceStrategy implements VotingStrategy {
  
  getVotingMethod(): VotingMethod {
    return 'single';
  }

  validateVote(request: VoteRequest, poll: PollData): Promise<VoteValidation> {
    try {
      const voteData = request.voteData;

      // Validate choice exists and is a number
      if (typeof voteData.choice !== 'number') {
        return Promise.resolve({
          valid: false,
          isValid: false,
          error: 'Choice is required for single-choice voting',
          errors: ['Choice is required for single-choice voting'],
          requiresAuthentication: false,
          requiresTokens: false
        });
      }

      // Validate choice is a valid integer
      if (!Number.isInteger(voteData.choice)) {
        return Promise.resolve({
          valid: false,
          isValid: false,
          error: 'Choice must be an integer',
          errors: ['Choice must be an integer'],
          requiresAuthentication: false,
          requiresTokens: false
        });
      }

      // Validate choice is within valid range
      if (voteData.choice < 0 || voteData.choice >= poll.options.length) {
        return Promise.resolve({
          valid: false,
          isValid: false,
          error: `Choice must be between 0 and ${poll.options.length - 1}`,
          errors: ['Invalid option selected'],
          requiresAuthentication: false,
          requiresTokens: false
        });
      }

      devLog('Single choice vote validated successfully', {
        pollId: request.pollId,
        choice: voteData.choice,
        userId: request.userId
      });

      return Promise.resolve({
        valid: true,
        isValid: true,
        requiresAuthentication: false,
        requiresTokens: false
      });

    } catch (error) {
      devLog('Single choice vote validation error:', { error: error instanceof Error ? error.message : String(error) });
      return Promise.resolve({
        valid: false,
        isValid: false,
        error: 'Single choice vote validation failed',
        errors: ['Single choice vote validation failed'],
        requiresAuthentication: false,
        requiresTokens: false
      });
    }
  }

  processVote(request: VoteRequest, poll: PollData): Promise<VoteResponse> {
    try {
      const voteData = request.voteData;
      
      // Validate choice against poll options
      if (typeof voteData.choice !== 'number' || voteData.choice < 0 || voteData.choice >= poll.options.length) {
        return Promise.resolve({
          success: false,
          error: 'Invalid choice selection',
          message: 'Selected choice is not valid for this poll',
          pollId: request.pollId
        });
      }
      
      // Create vote data for storage
      const voteRecord: VoteData = {
        id: `vote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        pollId: request.pollId,
        userId: request.userId,
        choice: voteData.choice,
        privacyLevel: 'standard',
        auditReceipt: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        ipAddress: request.ipAddress,
        userAgent: request.userAgent
      };

      devLog('Single choice vote processed successfully', {
        pollId: request.pollId,
        userId: request.userId,
        choice: voteData.choice,
        voteId: voteRecord.id
      });

      return Promise.resolve({
        success: true,
        voteId: voteRecord.id,
        message: 'Vote recorded successfully',
        pollId: request.pollId
      });

    } catch (error) {
      devLog('Single choice vote processing error:', { error: error instanceof Error ? error.message : String(error) });
      return Promise.resolve({
        success: false,
        error: 'Failed to process single choice vote',
        message: 'Failed to process single choice vote',
        pollId: request.pollId
      });
    }
  }

  calculateResults(poll: PollData, votes: VoteData[]): Promise<ResultsData> {
    try {
      const startTime = Date.now();
      
      // Initialize tracking objects
      const optionVotes: Record<string, number> = {};
      const optionPercentages: Record<string, number> = {};

      // Initialize all options with zero scores
      poll.options.forEach(option => {
        optionVotes[option.id] = 0;
        optionPercentages[option.id] = 0;
      });

      // Process each vote and count only valid votes
      let validVoteCount = 0;
      votes.forEach(vote => {
        // Handle both voteData.choice and direct choice property
        const choice = vote.voteData?.choice ?? vote.choice;
        if (typeof choice === 'number') {
          const option = poll.options[choice];
          if (option?.id) {
            optionVotes[option.id] = (optionVotes[option.id] || 0) + 1;
            validVoteCount++;
          }
        }
      });

      const totalVotes = validVoteCount || 0;

      // Calculate percentages
      if (totalVotes > 0) {
        Object.keys(optionVotes).forEach(optionId => {
          const votes = optionVotes[optionId] || 0;
          optionPercentages[optionId] = (votes / totalVotes) * 100;
        });
      }

      // Find winner (highest vote count)
      let winner: string | undefined;
      let winnerVotes = 0;
      let winnerPercentage = 0;

      if (totalVotes > 0) {
        Object.entries(optionVotes).forEach(([optionId, votes]) => {
          if (votes > winnerVotes) {
            winner = optionId;
            winnerVotes = votes;
            winnerPercentage = optionPercentages[optionId] || 0;
          }
        });
      }

      const results: PollResults = {
        winner: totalVotes > 0 ? winner : undefined,
        winnerVotes,
        winnerPercentage,
        optionVotes,
        optionPercentages,
        abstentions: 0,
        abstentionPercentage: 0
      };

      devLog('Single choice results calculated', {
        pollId: poll.id,
        totalVotes,
        winner,
        winnerVotes,
        winnerPercentage,
        calculationTime: Date.now() - startTime
      });

      return Promise.resolve({
        pollId: poll.id,
        votingMethod: poll.votingMethod,
        totalVotes,
        participationRate: totalVotes / 100, // Mock participation rate
        results,
        calculatedAt: new Date().toISOString(),
        metadata: {
          calculationTime: Date.now() - startTime,
          method: 'single'
        }
      });

    } catch (error) {
      devLog('Single choice results calculation error:', { error: error instanceof Error ? error.message : String(error) });
      
      // Return empty results on error
      return Promise.resolve({
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
      });
    }
  }

  getConfiguration(): Record<string, unknown> {
    return {
      method: 'single',
      description: 'Voters select exactly one option',
      allowsMultipleSelections: false,
      requiresRanking: false,
      maxSelections: 1,
      algorithm: 'plurality'
    };
  }
}