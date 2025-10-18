/**
 * Approval Voting Strategy
 * 
 * Implements approval voting where voters can approve (vote for) multiple options.
 * Results show approval scores for each option, with the highest scoring option winning.
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

export class ApprovalStrategy implements VotingStrategy {
  
  getVotingMethod(): VotingMethod {
    return 'approval';
  }

  async validateVote(request: VoteRequest, poll: PollData): Promise<VoteValidation> {
    await Promise.resolve(); // Satisfy require-await rule
    try {
      const voteData = request.voteData;

      // Validate approvals array exists and is not empty
      if (!voteData.approvals || !Array.isArray(voteData.approvals)) {
        return {
          valid: false,
          isValid: false,
          error: 'Approval votes must be an array',
          errors: ['Approval votes must be an array'],
          requiresAuthentication: false,
          requiresTokens: false
        };
      }

      // Validate approvals array is not empty
      if (voteData.approvals.length === 0) {
        return {
          valid: false,
          isValid: false,
          error: 'At least one approval is required',
          errors: ['At least one approval is required'],
          requiresAuthentication: false,
          requiresTokens: false
        };
      }

      // Validate all approvals are valid integers
      for (const approval of voteData.approvals) {
        if (typeof approval !== 'number' || !Number.isInteger(approval)) {
          return {
            valid: false,
            isValid: false,
            error: 'Approval votes must be integers',
            errors: ['Approval votes must be integers'],
            requiresAuthentication: false,
            requiresTokens: false
          };
        }

        if (approval < 0 || approval >= poll.options.length) {
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

      // Check for duplicate approvals
      const uniqueApprovals = new Set(voteData.approvals);
      if (uniqueApprovals.size !== voteData.approvals.length) {
        return {
          valid: false,
          isValid: false,
          error: 'Duplicate approvals are not allowed',
          errors: ['Duplicate approvals are not allowed'],
          requiresAuthentication: false,
          requiresTokens: false
        };
      }

      // Check maximum approvals limit
      const maxApprovals = poll.votingConfig?.maxChoices || poll.options.length;
      if (voteData.approvals.length > maxApprovals) {
        return {
          valid: false,
          isValid: false,
          error: `Maximum ${maxApprovals} approvals allowed`,
          errors: [`Maximum ${maxApprovals} approvals allowed`],
          requiresAuthentication: false,
          requiresTokens: false
        };
      }

      devLog('Approval vote validated successfully', {
        pollId: request.pollId,
        approvals: voteData.approvals,
        userId: request.userId
      });

      return {
        valid: true,
        isValid: true,
        requiresAuthentication: false,
        requiresTokens: false
      };

    } catch (error) {
      devLog('Approval vote validation error:', { error: error instanceof Error ? error.message : String(error) });
      return {
        valid: false,
        isValid: false,
        error: 'Approval vote validation failed',
        errors: ['Approval vote validation failed'],
        requiresAuthentication: false,
        requiresTokens: false
      };
    }
  }

  async processVote(request: VoteRequest, poll: PollData): Promise<VoteResponse> {
    await Promise.resolve(); // Satisfy require-await rule
    try {
      const voteData = request.voteData;
      
      // Create vote data for storage
      const voteRecord: VoteData = {
        id: `vote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        pollId: request.pollId,
        userId: request.userId,
        approvals: voteData.approvals,
        privacyLevel: 'standard',
        auditReceipt: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        ipAddress: request.ipAddress,
        userAgent: request.userAgent
      };

      devLog('Approval vote processed successfully', {
        pollId: request.pollId,
        userId: request.userId,
        approvals: voteData.approvals,
        voteId: voteRecord.id
      });

      return {
        success: true,
        voteId: voteRecord.id,
        message: 'Vote recorded successfully',
        pollId: request.pollId
      };

    } catch (error) {
      devLog('Approval vote processing error:', { error: error instanceof Error ? error.message : String(error) });
      return {
        success: false,
        error: 'Failed to process approval vote',
        message: 'Failed to process approval vote',
        pollId: request.pollId
      };
    }
  }

  async calculateResults(poll: PollData, votes: VoteData[]): Promise<ResultsData> {
    await Promise.resolve(); // Satisfy require-await rule
    try {
      const startTime = Date.now();
      
      // Initialize tracking objects
      const approvalScores: Record<string, number> = {};
      const optionVotes: Record<string, number> = {};
      const approvalPercentages: Record<string, number> = {};
      const optionPercentages: Record<string, number> = {};

      // Initialize all options with zero scores
      poll.options.forEach(option => {
        approvalScores[option.id] = 0;
        optionVotes[option.id] = 0;
        approvalPercentages[option.id] = 0;
        optionPercentages[option.id] = 0;
      });

      // Process each vote
      votes.forEach(vote => {
        if (vote.voteData?.approvals) {
          vote.voteData.approvals.forEach(approval => {
            const option = poll.options[approval];
            if (option?.id) {
              approvalScores[option.id] = (approvalScores[option.id] || 0) + 1;
              optionVotes[option.id] = (optionVotes[option.id] || 0) + 1;
            }
          });
        }
      });

      const totalVotes = votes.length;

      // Calculate percentages
      if (totalVotes > 0) {
        Object.keys(approvalScores).forEach(optionId => {
          const approvalScore = approvalScores[optionId];
          const optionVote = optionVotes[optionId];
          if (approvalScore !== undefined) {
            approvalPercentages[optionId] = (approvalScore / totalVotes) * 100;
          }
          if (optionVote !== undefined) {
            optionPercentages[optionId] = (optionVote / totalVotes) * 100;
          }
        });
      }

      // Find winner (highest approval score)
      let winner: string | undefined;
      let winnerVotes = 0;
      let winnerPercentage = 0;

      if (totalVotes > 0) {
        Object.entries(approvalScores).forEach(([optionId, score]) => {
          if (score > winnerVotes) {
            winner = optionId;
            winnerVotes = score;
            winnerPercentage = approvalPercentages[optionId] || 0;
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

      devLog('Approval results calculated', {
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
          method: 'approval'
        }
      };

    } catch (error) {
      devLog('Approval results calculation error:', { error: error instanceof Error ? error.message : String(error) });
      
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
      method: 'approval',
      description: 'Voters can approve multiple options',
      allowsMultipleSelections: true,
      requiresRanking: false,
      maxSelections: 'unlimited'
    };
  }
}