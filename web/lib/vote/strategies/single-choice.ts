/**
 * Single Choice Voting Strategy
 * 
 * Implements single-choice voting where voters select exactly one option.
 * Results show the option with the most votes as the winner.
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

  async validateVote(request: VoteRequest, poll: PollData): Promise<VoteValidation> {
    try {
      const { voteData } = request;
      
      // Check if choice is provided
      if (voteData.choice === undefined || voteData.choice === null) {
        return {
          isValid: false,
          error: 'Choice is required for single-choice voting',
          requiresAuthentication: true,
          requiresTokens: false
        };
      }

      // Validate choice is a number
      if (typeof voteData.choice !== 'number' || !Number.isInteger(voteData.choice)) {
        return {
          isValid: false,
          error: 'Choice must be a valid integer',
          requiresAuthentication: true,
          requiresTokens: false
        };
      }

      // Validate choice is within valid range
      if (voteData.choice < 0 || voteData.choice >= poll.options.length) {
        return {
          isValid: false,
          error: `Choice must be between 0 and ${poll.options.length - 1}`,
          requiresAuthentication: true,
          requiresTokens: false
        };
      }

      // Check if user has already voted (if not allowing multiple votes)
      if (!poll.votingConfig.allowMultipleVotes && request.userId) {
        // This would typically check the database, but for now we'll assume it's valid
        // In a real implementation, you'd query the votes table here
      }

      devLog('Single choice vote validated successfully', {
        pollId: request.pollId,
        choice: voteData.choice,
        userId: request.userId
      });

      return {
        isValid: true,
        requiresAuthentication: true,
        requiresTokens: false
      };

    } catch (error) {
      devLog('Single choice vote validation error:', error);
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

      // In a real implementation, this would:
      // 1. Store the vote in the database
      // 2. Update poll vote counts
      // 3. Trigger any necessary notifications
      // 4. Log the vote for audit purposes

      devLog('Single choice vote processed successfully', {
        pollId,
        voteId,
        choice: voteData.choice,
        userId,
        auditReceipt
      });

      return {
        success: true,
        message: 'Vote submitted successfully',
        pollId,
        voteId,
        auditReceipt,
        responseTime: 0, // Will be set by the engine
        metadata: {
          votingMethod: 'single'
        },
        ...(privacyLevel !== undefined ? { privacyLevel } : {}),
        choice: voteData.choice,
        optionText: poll.options[voteData.choice ?? 0],
      };

    } catch (error) {
      devLog('Single choice vote processing error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Vote processing failed',
        pollId: request.pollId,
        responseTime: 0,
        metadata: {
          votingMethod: 'single',
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        voteId: undefined,
        auditReceipt: undefined,
        ...(request.privacyLevel !== undefined ? { privacyLevel: request.privacyLevel } : {}),
      };
    }
  }

  async calculateResults(poll: PollData, votes: VoteData[]): Promise<ResultsData> {
    try {
      const startTime = Date.now();
      
      // Count votes for each option
      const optionVotes: Record<string, number> = {};
      const optionPercentages: Record<string, number> = {};
      
      // Initialize vote counts
      poll.options.forEach((_, index) => {
        optionVotes[index.toString()] = 0;
        optionPercentages[index.toString()] = 0;
      });

      // Count votes
      let totalVotes = 0;
      votes.forEach(vote => {
        if (vote.choice !== undefined && vote.choice >= 0 && vote.choice < poll.options.length) {
          const choiceKey = vote.choice.toString();
          if (optionVotes[choiceKey] !== undefined) {
            optionVotes[choiceKey]++;
            totalVotes++;
          }
        }
      });

      // Calculate percentages
      if (totalVotes > 0) {
        Object.keys(optionVotes).forEach(optionIndex => {
          const votes = optionVotes[optionIndex];
          if (votes !== undefined) {
            optionPercentages[optionIndex] = (votes / totalVotes) * 100;
          }
        });
      }

      // Find winner
      let winner: string | undefined;
      let winnerVotes = 0;
      let winnerPercentage = 0;

      if (totalVotes > 0) {
        Object.entries(optionVotes).forEach(([optionIndex, votes]) => {
          if (votes > winnerVotes) {
            winner = optionIndex;
            winnerVotes = votes;
            winnerPercentage = optionPercentages[optionIndex] ?? 0;
          }
        });
      }

      const results: PollResults = {
        winnerVotes,
        winnerPercentage,
        optionVotes,
        optionPercentages,
        abstentions: 0,
        abstentionPercentage: 0,
        ...(winner !== undefined ? { winner } : {}),
      };

      const resultsData: ResultsData = {
        pollId: poll.id,
        votingMethod: 'single',
        totalVotes,
        participationRate: totalVotes > 0 ? 100 : 0, // This would be calculated based on eligible voters
        results,
        calculatedAt: new Date().toISOString(),
        metadata: {
          calculationTime: Date.now() - startTime,
          hasWinner: winner !== undefined,
          isTie: winnerVotes > 0 && Object.values(optionVotes).filter(v => v === winnerVotes).length > 1
        }
      };

      devLog('Single choice results calculated', {
        pollId: poll.id,
        totalVotes,
        winner,
        winnerVotes,
        winnerPercentage,
        calculationTime: Date.now() - startTime
      });

      return resultsData;

    } catch (error) {
      devLog('Single choice results calculation error:', error);
      throw new Error(`Failed to calculate single choice results: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  getConfiguration(): Record<string, unknown> {
    return {
      name: 'Single Choice Voting',
      description: 'Voters select exactly one option. The option with the most votes wins.',
      minOptions: 2,
      maxOptions: 100,
      allowAbstention: false,
      requiresRanking: false,
      allowsMultipleSelections: false,
      resultType: 'winner',
      features: [
        'Simple and intuitive',
        'Fast to count',
        'Clear winner determination',
        'Suitable for binary decisions'
      ],
      limitations: [
        'May not reflect true preferences',
        'Can lead to vote splitting',
        'No consideration of second choices'
      ]
    };
  }
}