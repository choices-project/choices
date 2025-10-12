/**
 * Ranked Choice Voting Strategy
 * 
 * Implements ranked choice voting (Instant Runoff Voting) where voters rank options
 * in order of preference. Results are calculated using multiple rounds of elimination.
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
  PollResults,
  InstantRunoffRound
} from '../types';

export class RankedStrategy implements VotingStrategy {
  
  getVotingMethod(): VotingMethod {
    return 'ranked';
  }

  async validateVote(request: VoteRequest, poll: PollData): Promise<VoteValidation> {
    try {
      const { voteData } = request;
      
      // Check if rankings array is provided
      if (!voteData.rankings || !Array.isArray(voteData.rankings)) {
        return {
          isValid: false,
          error: 'Rankings array is required for ranked choice voting',
          requiresAuthentication: true,
          requiresTokens: false
        };
      }

      // Validate rankings array is not empty
      if (voteData.rankings.length === 0) {
        return {
          isValid: false,
          error: 'At least one option must be ranked',
          requiresAuthentication: true,
          requiresTokens: false
        };
      }

      // Validate all rankings are valid integers
      for (const ranking of voteData.rankings) {
        if (typeof ranking !== 'number' || !Number.isInteger(ranking)) {
          return {
            isValid: false,
            error: 'All rankings must be valid integers',
            requiresAuthentication: true,
            requiresTokens: false
          };
        }

        if (ranking < 0 || ranking >= poll.options.length) {
          return {
            isValid: false,
            error: `Ranking index must be between 0 and ${poll.options.length - 1}`,
            requiresAuthentication: true,
            requiresTokens: false
          };
        }
      }

      // Check for duplicate rankings
      const uniqueRankings = new Set(voteData.rankings);
      if (uniqueRankings.size !== voteData.rankings.length) {
        return {
          isValid: false,
          error: 'Duplicate rankings are not allowed',
          requiresAuthentication: true,
          requiresTokens: false
        };
      }

      // Validate ranking completeness (all options must be ranked)
      if (voteData.rankings.length !== poll.options.length) {
        return {
          isValid: false,
          error: 'All options must be ranked',
          requiresAuthentication: true,
          requiresTokens: false
        };
      }

      devLog('Ranked vote validated successfully', {
        pollId: request.pollId,
        rankings: voteData.rankings,
        userId: request.userId
      });

      return {
        isValid: true,
        requiresAuthentication: true,
        requiresTokens: false
      };

    } catch (error) {
      devLog('Ranked vote validation error:', error);
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

      devLog('Ranked vote processed successfully', {
        pollId,
        voteId,
        rankings: voteData.rankings,
        userId,
        auditReceipt
      });

      return withOptional(
        {
          success: true,
          message: 'Vote submitted successfully',
          pollId,
          voteId,
          auditReceipt,
          responseTime: 0, // Will be set by the engine
          metadata: {
            votingMethod: 'ranked',
            rankings: voteData.rankings,
            rankedOptions: voteData.rankings?.map((rank, index) => ({
              rank: index + 1,
              option: poll.options[rank]?.text
            })) || []
          }
        },
        {
          privacyLevel
        }
      );

    } catch (error) {
      devLog('Ranked vote processing error:', error);
      return withOptional(
        {
          success: false,
          message: error instanceof Error ? error.message : 'Vote processing failed',
          pollId: request.pollId,
          responseTime: 0,
          metadata: {
            votingMethod: 'ranked',
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        },
        {
          voteId: undefined,
          auditReceipt: undefined,
          privacyLevel: request.privacyLevel
        }
      );
    }
  }

  async calculateResults(poll: PollData, votes: VoteData[]): Promise<ResultsData> {
    try {
      const startTime = Date.now();
      
      // Run instant runoff voting
      const runoffRounds = this.runInstantRunoff(poll, votes);
      
      // Calculate Borda scores
      const bordaScores = this.calculateBordaScores(poll, votes);
      
      // Find winner from final round
      const finalRound = runoffRounds[runoffRounds.length - 1];
      let winner: string | undefined;
      let winnerVotes = 0;
      let winnerPercentage = 0;

      if (finalRound && Object.keys(finalRound.votes).length > 0) {
        const entries = Object.entries(finalRound.votes);
        const maxEntry = entries.reduce((max, current) => 
          current[1] > max[1] ? current : max
        );
        
        winner = maxEntry[0];
        winnerVotes = maxEntry[1];
        winnerPercentage = finalRound.percentages[winner] || 0;
      }

      // Calculate option votes and percentages
      const optionVotes: Record<string, number> = {};
      const optionPercentages: Record<string, number> = {};
      
      poll.options.forEach((_, index) => {
        optionVotes[index.toString()] = 0;
        optionPercentages[index.toString()] = 0;
      });

      // Count first-choice votes
      votes.forEach(vote => {
        if (vote.rankings && vote.rankings.length > 0) {
          const firstRanking = vote.rankings[0];
          if (firstRanking !== undefined) {
            const firstChoice = firstRanking.toString();
            if (optionVotes[firstChoice] !== undefined) {
              optionVotes[firstChoice]++;
            }
          }
        }
      });

      const totalVotes = votes.length;
      if (totalVotes > 0) {
        Object.keys(optionVotes).forEach(optionIndex => {
          const votes = optionVotes[optionIndex];
          if (votes !== undefined) {
            optionPercentages[optionIndex] = (votes / totalVotes) * 100;
          }
        });
      }

      const results: PollResults = withOptional(
        {
          winnerVotes,
          winnerPercentage,
          bordaScores,
          instantRunoffRounds: runoffRounds,
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
        votingMethod: 'ranked',
        totalVotes,
        participationRate: totalVotes > 0 ? 100 : 0, // This would be calculated based on eligible voters
        results,
        calculatedAt: new Date().toISOString(),
        metadata: {
          calculationTime: Date.now() - startTime,
          hasWinner: winner !== undefined,
          totalRounds: runoffRounds.length,
          isTie: winnerVotes > 0 && Object.values(finalRound?.votes || {}).filter(v => v === winnerVotes).length > 1
        }
      };

      devLog('Ranked results calculated', {
        pollId: poll.id,
        totalVotes,
        winner,
        winnerVotes,
        winnerPercentage,
        totalRounds: runoffRounds.length,
        calculationTime: Date.now() - startTime
      });

      return resultsData;

    } catch (error) {
      devLog('Ranked results calculation error:', error);
      throw new Error(`Failed to calculate ranked results: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private runInstantRunoff(poll: PollData, votes: VoteData[]): InstantRunoffRound[] {
    const rounds: InstantRunoffRound[] = [];
    const remainingOptions = new Set(poll.options.map((_, index) => index.toString()));
    const currentVotes = [...votes];

    let round = 1;
    while (remainingOptions.size > 1) {
      // Count first-choice votes for remaining options
      const roundVotes: Record<string, number> = {};
      remainingOptions.forEach(option => {
        roundVotes[option] = 0;
      });

      currentVotes.forEach(vote => {
        if (vote.rankings && vote.rankings.length > 0) {
          // Find the highest-ranked remaining option
          for (const ranking of vote.rankings) {
            if (ranking !== undefined) {
              const optionIndex = ranking.toString();
              if (remainingOptions.has(optionIndex)) {
                roundVotes[optionIndex] = (roundVotes[optionIndex] ?? 0) + 1;
                break;
              }
            }
          }
        }
      });

      // Calculate percentages
      const totalVotes = Object.values(roundVotes).reduce((sum, count) => sum + count, 0);
      const roundPercentages: Record<string, number> = {};
      Object.keys(roundVotes).forEach(option => {
        const votes = roundVotes[option];
        if (votes !== undefined) {
          roundPercentages[option] = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
        }
      });

      // Check for majority winner
      const majorityThreshold = totalVotes / 2;
      const winner = Object.entries(roundVotes).find(([_, votes]) => votes > majorityThreshold);
      
      if (winner) {
        // We have a majority winner
        rounds.push({
          round,
          votes: roundVotes,
          percentages: roundPercentages
        });
        break;
      }

      // Find option with fewest votes to eliminate
      const minVotes = Math.min(...Object.values(roundVotes));
      const eliminatedOptions = Object.entries(roundVotes)
        .filter(([_, votes]) => votes === minVotes)
        .map(([option, _]) => option);

      // If there's a tie for elimination, eliminate the first one
      const eliminated = eliminatedOptions[0];
      if (!eliminated) {
        throw new Error('No options to eliminate');
      }
      remainingOptions.delete(eliminated);

      rounds.push(withOptional(
        {
          round,
          votes: roundVotes,
          percentages: roundPercentages
        },
        {
          eliminated
        }
      ));

      round++;
    }

    return rounds;
  }

  private calculateBordaScores(poll: PollData, votes: VoteData[]): Record<string, number> {
    const bordaScores: Record<string, number> = {};
    
    // Initialize scores
    poll.options.forEach((_, index) => {
      bordaScores[index.toString()] = 0;
    });

    // Calculate Borda scores
    votes.forEach(vote => {
      if (vote.rankings && vote.rankings.length > 0) {
        vote.rankings.forEach((optionIndex, rank) => {
          const score = poll.options.length - rank - 1; // Higher rank = higher score
          const optionKey = optionIndex.toString();
          if (bordaScores[optionKey] !== undefined) {
            bordaScores[optionKey] += score;
          }
        });
      }
    });

    return bordaScores;
  }

  getConfiguration(): Record<string, unknown> {
    return {
      name: 'Ranked Choice Voting',
      description: 'Voters rank options in order of preference. Results use instant runoff voting.',
      minOptions: 3,
      maxOptions: 20,
      allowAbstention: false,
      requiresRanking: true,
      allowsMultipleSelections: false,
      resultType: 'instant_runoff',
      features: [
        'Eliminates vote splitting',
        'Reflects true preferences',
        'Majority winner guaranteed',
        'No wasted votes'
      ],
      limitations: [
        'More complex to understand',
        'Requires complete ranking',
        'Can be time-consuming to count',
        'May not satisfy Condorcet criterion'
      ]
    };
  }
}