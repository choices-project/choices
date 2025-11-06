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

import { withOptional } from '../../util/objects';
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
    try {
      const { voteData } = request;
      
      // Check if approvals array is provided
      if (!voteData.approvals || !Array.isArray(voteData.approvals)) {
        return {
          isValid: false,
          error: 'Approvals array is required for approval voting',
          requiresAuthentication: true,
          requiresTokens: false
        };
      }

      // Validate approvals array is not empty
      if (voteData.approvals.length === 0) {
        return {
          isValid: false,
          error: 'At least one option must be approved',
          requiresAuthentication: true,
          requiresTokens: false
        };
      }

      // Validate all approvals are valid integers
      for (const approval of voteData.approvals) {
        if (typeof approval !== 'number' || !Number.isInteger(approval)) {
          return {
            isValid: false,
            error: 'All approvals must be valid integers',
            requiresAuthentication: true,
            requiresTokens: false
          };
        }

        if (approval < 0 || approval >= poll.options.length) {
          return {
            isValid: false,
            error: `Approval index must be between 0 and ${poll.options.length - 1}`,
            requiresAuthentication: true,
            requiresTokens: false
          };
        }
      }

      // Check for duplicate approvals
      const uniqueApprovals = new Set(voteData.approvals);
      if (uniqueApprovals.size !== voteData.approvals.length) {
        return {
          isValid: false,
          error: 'Duplicate approvals are not allowed',
          requiresAuthentication: true,
          requiresTokens: false
        };
      }

      // Check maximum approvals limit
      const maxApprovals = poll.votingConfig.maxChoices ?? poll.options.length;
      if (voteData.approvals.length > maxApprovals) {
        return {
          isValid: false,
          error: `Maximum ${maxApprovals} approvals allowed`,
          requiresAuthentication: true,
          requiresTokens: false
        };
      }

      devLog('Approval vote validated successfully', {
        pollId: request.pollId,
        approvals: voteData.approvals,
        userId: request.userId
      });

      return {
        isValid: true,
        requiresAuthentication: true,
        requiresTokens: false
      };

    } catch (error) {
      devLog('Approval vote validation error:', error);
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

      devLog('Approval vote processed successfully', {
        pollId,
        voteId,
        approvals: voteData.approvals,
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
          votingMethod: 'approval',
          approvals: voteData.approvals,
          approvedOptions: voteData.approvals?.map(index => poll.options[index]?.text) ?? []
        }
      }, {
        privacyLevel
      });

    } catch (error) {
      devLog('Approval vote processing error:', error);
      return withOptional({
        success: false,
        message: error instanceof Error ? error.message : 'Vote processing failed',
        pollId: request.pollId,
        responseTime: 0,
        metadata: {
          votingMethod: 'approval',
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
      
      // Count approval votes for each option
      const approvalScores: Record<string, number> = {};
      const approvalPercentages: Record<string, number> = {};
      const optionVotes: Record<string, number> = {};
      const optionPercentages: Record<string, number> = {};
      
      // Initialize scores
      poll.options.forEach((_, index) => {
        approvalScores[index.toString()] = 0;
        approvalPercentages[index.toString()] = 0;
        optionVotes[index.toString()] = 0;
        optionPercentages[index.toString()] = 0;
      });

      // Count approvals
      let totalVotes = 0;
      votes.forEach(vote => {
        if (vote.approvals && Array.isArray(vote.approvals)) {
          totalVotes++;
          vote.approvals.forEach(approval => {
            if (approval !== undefined && approval >= 0 && approval < poll.options.length) {
              const key = approval.toString();
              approvalScores[key] = (approvalScores[key] ?? 0) + 1;
              optionVotes[key] = (optionVotes[key] ?? 0) + 1;
            }
          });
        }
      });

      // Calculate percentages
      if (totalVotes > 0) {
        Object.keys(approvalScores).forEach(optionIndex => {
          const approvalScore = approvalScores[optionIndex];
          const optionVote = optionVotes[optionIndex];
          if (approvalScore !== undefined) {
            approvalPercentages[optionIndex] = (approvalScore / totalVotes) * 100;
          }
          if (optionVote !== undefined) {
            optionPercentages[optionIndex] = (optionVote / totalVotes) * 100;
          }
        });
      }

      // Find winner (highest approval score)
      let winner: string | undefined;
      let winnerVotes = 0;
      let winnerPercentage = 0;

      if (totalVotes > 0) {
        Object.entries(approvalScores).forEach(([optionIndex, score]) => {
          if (score > winnerVotes) {
            winner = optionIndex;
            winnerVotes = score;
            const percentage = approvalPercentages[optionIndex];
            winnerPercentage = percentage ?? 0;
          }
        });
      }

      const results: PollResults = withOptional({
        winnerVotes,
        winnerPercentage,
        approvalScores,
        approvalPercentages,
        optionVotes,
        optionPercentages,
        abstentions: 0,
        abstentionPercentage: 0
      }, {
        winner
      });

      const resultsData: ResultsData = {
        pollId: poll.id,
        votingMethod: 'approval',
        totalVotes,
        participationRate: totalVotes > 0 ? 100 : 0, // This would be calculated based on eligible voters
        results,
        calculatedAt: new Date().toISOString(),
        metadata: {
          calculationTime: Date.now() - startTime,
          hasWinner: winner !== undefined,
          isTie: winnerVotes > 0 && Object.values(approvalScores).filter(s => s === winnerVotes).length > 1,
          averageApprovals: totalVotes > 0 ? votes.reduce((sum, vote) => sum + (vote.approvals?.length ?? 0), 0) / totalVotes : 0
        }
      };

      devLog('Approval results calculated', {
        pollId: poll.id,
        totalVotes,
        winner,
        winnerVotes,
        winnerPercentage,
        calculationTime: Date.now() - startTime
      });

      return resultsData;

    } catch (error) {
      devLog('Approval results calculation error:', error);
      throw new Error(`Failed to calculate approval results: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  getConfiguration(): Record<string, unknown> {
    return {
      name: 'Approval Voting',
      description: 'Voters can approve (vote for) multiple options. The option with the most approvals wins.',
      minOptions: 2,
      maxOptions: 100,
      allowAbstention: true,
      requiresRanking: false,
      allowsMultipleSelections: true,
      resultType: 'highest_score',
      features: [
        'Allows multiple selections',
        'Simple to understand',
        'Reduces vote splitting',
        'Good for consensus building'
      ],
      limitations: [
        'No intensity of preference',
        'May not reflect true preferences',
        'Can lead to strategic voting'
      ]
    };
  }
}