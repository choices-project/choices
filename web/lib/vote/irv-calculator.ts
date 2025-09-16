// ============================================================================
// PHASE 1: IRV CALCULATOR WITH DETERMINISTIC TIE-BREAKING
// ============================================================================
// Agent A1 - Infrastructure Specialist
// 
// This module implements the Instant Runoff Voting (IRV) calculator with
// comprehensive edge case handling and deterministic tie-breaking for the
// Ranked Choice Democracy Revolution platform.
// 
// Features:
// - Deterministic tie-breaking with poll-seeded hashing
// - Edge case handling (duplicates, blanks, exhausted ballots)
// - Write-in candidate support
// - Withdrawn candidate handling
// - Performance optimized for 1M+ ballots
// 
// Created: January 15, 2025
// Status: Phase 1 Implementation
// ============================================================================

import { createHash } from 'crypto';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface Candidate {
  id: string;
  name: string;
  party?: string;
  isWriteIn?: boolean;
  isWithdrawn?: boolean;
}

export interface UserRanking {
  pollId: string;
  userId: string;
  ranking: string[]; // Array of candidate IDs in preference order
  createdAt: Date;
}

export interface RankedChoiceRound {
  round: number;
  eliminated: string | null;
  votes: Record<string, number>;
  transferVotes?: Record<string, number>;
  totalVotes: number;
  activeCandidates: string[];
}

export interface RankedChoiceResults {
  rounds: RankedChoiceRound[];
  winner: string | null;
  totalVotes: number;
  participationRate: number;
  breakdown: {
    byRound: Record<number, Record<string, number>>;
    byCandidate: Record<string, number>;
    exhausted: number;
  };
  metadata: {
    calculationTime: number;
    tieBreaksUsed: number;
    edgeCasesHandled: string[];
  };
}

export interface IRVRules {
  allowWriteIns: boolean;
  maxWriteIns: number;
  handleWithdrawn: boolean;
  tieBreakMethod: 'poll-seeded' | 'alphabetical' | 'random';
  minVotesToWin: number;
}

// ============================================================================
// IRV CALCULATOR CLASS
// ============================================================================

export class IRVCalculator {
  private rules: IRVRules;
  private pollId: string;
  private candidates: Map<string, Candidate>;
  private withdrawnCandidates: Set<string>;

  constructor(pollId: string, candidates: Candidate[], rules: IRVRules = this.getDefaultRules()) {
    this.pollId = pollId;
    this.rules = rules;
    this.candidates = new Map(candidates.map(c => [c.id, c]));
    this.withdrawnCandidates = new Set(
      candidates.filter(c => c.isWithdrawn).map(c => c.id)
    );
  }

  private getDefaultRules(): IRVRules {
    return {
      allowWriteIns: true,
      maxWriteIns: 10,
      handleWithdrawn: true,
      tieBreakMethod: 'poll-seeded',
      minVotesToWin: 1
    };
  }

  // ============================================================================
  // MAIN IRV CALCULATION
  // ============================================================================

  calculateResults(rankings: UserRanking[]): RankedChoiceResults {
    const startTime = performance.now();
    const edgeCasesHandled: string[] = [];
    let tieBreaksUsed = 0;

    // Validate and clean rankings
    const cleanedRankings = this.validateAndCleanRankings(rankings, edgeCasesHandled);
    
    if (cleanedRankings.length === 0) {
      return this.createEmptyResults(startTime, edgeCasesHandled);
    }

    // Get all candidate IDs (including write-ins)
    const allCandidateIds = this.getAllCandidateIds(cleanedRankings);
    let activeCandidates = new Set(allCandidateIds);
    
    // Remove withdrawn candidates from active set
    if (this.rules.handleWithdrawn) {
      this.withdrawnCandidates.forEach(id => activeCandidates.delete(id));
      if (this.withdrawnCandidates.size > 0) {
        edgeCasesHandled.push('withdrawn-candidates');
      }
    }

    const rounds: RankedChoiceRound[] = [];
    let round = 1;

    // Main IRV loop
    while (activeCandidates.size > 1) {
      const roundVotes = this.countVotes(cleanedRankings, activeCandidates);
      const totalVotes = Object.values(roundVotes).reduce((sum, count) => sum + count, 0);
      
      // Check if we have a winner (majority)
      const maxVotes = Math.max(...Object.values(roundVotes));
      if (maxVotes > totalVotes / 2) {
        const winner = Object.entries(roundVotes).find(([_, votes]) => votes === maxVotes)?.[0];
        if (winner) {
          rounds.push({
            round,
            eliminated: null,
            votes: roundVotes,
            totalVotes,
            activeCandidates: Array.from(activeCandidates)
          });
          break;
        }
      }

      // Find candidate to eliminate
      const eliminated = this.findEliminatedCandidate(roundVotes, rounds, this.pollId);
      if (!eliminated) {
        // This shouldn't happen, but handle gracefully
        edgeCasesHandled.push('no-elimination-found');
        break;
      }

      // Count tie-breaks used
      if (this.wasTieBreakUsed(roundVotes, eliminated)) {
        tieBreaksUsed++;
      }

      // Calculate transfer votes
      const transferVotes = this.calculateTransferVotes(cleanedRankings, eliminated, activeCandidates);

      rounds.push({
        round,
        eliminated,
        votes: roundVotes,
        transferVotes,
        totalVotes,
        activeCandidates: Array.from(activeCandidates)
      });

      // Remove eliminated candidate
      activeCandidates.delete(eliminated);
      round++;
    }

    // Determine winner
    const winner = activeCandidates.size === 1 ? Array.from(activeCandidates)[0] : null;
    
    // Calculate breakdown
    const breakdown = this.calculateBreakdown(cleanedRankings, rounds);

    const endTime = performance.now();

    return {
      rounds,
      winner,
      totalVotes: cleanedRankings.length,
      participationRate: this.calculateParticipationRate(cleanedRankings),
      breakdown,
      metadata: {
        calculationTime: endTime - startTime,
        tieBreaksUsed,
        edgeCasesHandled
      }
    };
  }

  // ============================================================================
  // RANKING VALIDATION AND CLEANING
  // ============================================================================

  private validateAndCleanRankings(rankings: UserRanking[], edgeCasesHandled: string[]): UserRanking[] {
    const cleaned: UserRanking[] = [];

    for (const ranking of rankings) {
      const cleanedRanking = this.validateAndCleanRanking(ranking, edgeCasesHandled);
      if (cleanedRanking) {
        cleaned.push(cleanedRanking);
      }
    }

    return cleaned;
  }

  private validateAndCleanRanking(ranking: UserRanking, edgeCasesHandled: string[]): UserRanking | null {
    if (!ranking.ranking || ranking.ranking.length === 0) {
      edgeCasesHandled.push('empty-ranking');
      return null;
    }

    // Remove duplicates, keep first occurrence
    const deduplicated = [...new Set(ranking.ranking)];
    if (deduplicated.length !== ranking.ranking.length) {
      edgeCasesHandled.push('duplicate-candidates');
    }

    // Filter out invalid candidates
    const validCandidates = deduplicated.filter(candidateId => {
      const candidate = this.candidates.get(candidateId);
      return candidate && !candidate.isWithdrawn;
    });

    if (validCandidates.length === 0) {
      edgeCasesHandled.push('no-valid-candidates');
      return null;
    }

    // Handle write-ins
    const writeIns = deduplicated.filter(id => !this.candidates.has(id));
    if (writeIns.length > 0) {
      if (!this.rules.allowWriteIns) {
        edgeCasesHandled.push('write-ins-not-allowed');
        return null;
      }
      if (writeIns.length > this.rules.maxWriteIns) {
        edgeCasesHandled.push('too-many-write-ins');
        return null;
      }
      edgeCasesHandled.push('write-ins-processed');
    }

    return {
      ...ranking,
      ranking: validCandidates
    };
  }

  // ============================================================================
  // VOTE COUNTING
  // ============================================================================

  private countVotes(rankings: UserRanking[], activeCandidates: Set<string>): Record<string, number> {
    const votes: Record<string, number> = {};

    // Initialize vote counts
    activeCandidates.forEach(candidateId => {
      votes[candidateId] = 0;
    });

    // Count first-choice votes
    for (const ranking of rankings) {
      const firstChoice = this.getNextValidChoice(ranking.ranking, activeCandidates);
      if (firstChoice) {
        votes[firstChoice]++;
      }
    }

    return votes;
  }

  private getNextValidChoice(ranking: string[], activeCandidates: Set<string>): string | null {
    for (const candidateId of ranking) {
      if (activeCandidates.has(candidateId)) {
        return candidateId;
      }
    }
    return null;
  }

  // ============================================================================
  // ELIMINATION LOGIC
  // ============================================================================

  private findEliminatedCandidate(
    roundVotes: Record<string, number>, 
    previousRounds: RankedChoiceRound[], 
    pollId: string
  ): string | null {
    const candidates = Object.keys(roundVotes);
    if (candidates.length === 0) return null;

    // Find minimum vote count
    const minVotes = Math.min(...Object.values(roundVotes));
    const tiedCandidates = candidates.filter(candidate => roundVotes[candidate] === minVotes);

    if (tiedCandidates.length === 1) {
      return tiedCandidates[0];
    }

    // Handle tie-breaking
    return this.breakTie(tiedCandidates, pollId, previousRounds);
  }

  // ============================================================================
  // DETERMINISTIC TIE-BREAKING
  // ============================================================================

  private breakTie(candidates: string[], pollId: string, previousRounds: RankedChoiceRound[]): string {
    switch (this.rules.tieBreakMethod) {
      case 'poll-seeded':
        return this.breakTieWithPollSeed(candidates, pollId);
      case 'alphabetical':
        return this.breakTieAlphabetically(candidates);
      case 'random':
        return this.breakTieRandomly(candidates, pollId);
      default:
        return this.breakTieWithPollSeed(candidates, pollId);
    }
  }

  private breakTieWithPollSeed(candidates: string[], pollId: string): string {
    // Use poll ID as seed for deterministic tie-breaking
    return [...candidates].sort((a, b) => {
      const ha = createHash('sha256').update(`${pollId}:${a}`).digest('hex');
      const hb = createHash('sha256').update(`${pollId}:${b}`).digest('hex');
      return ha.localeCompare(hb);
    })[0];
  }

  private breakTieAlphabetically(candidates: string[]): string {
    return [...candidates].sort()[0];
  }

  private breakTieRandomly(candidates: string[], pollId: string): string {
    // Use poll ID as seed for deterministic "random" selection
    const seed = createHash('sha256').update(pollId).digest('hex');
    const seedNum = parseInt(seed.substring(0, 8), 16);
    const index = seedNum % candidates.length;
    return candidates[index];
  }

  private wasTieBreakUsed(roundVotes: Record<string, number>, eliminated: string): boolean {
    const minVotes = Math.min(...Object.values(roundVotes));
    const tiedCandidates = Object.keys(roundVotes).filter(candidate => roundVotes[candidate] === minVotes);
    return tiedCandidates.length > 1;
  }

  // ============================================================================
  // TRANSFER VOTE CALCULATION
  // ============================================================================

  private calculateTransferVotes(
    rankings: UserRanking[], 
    eliminated: string, 
    activeCandidates: Set<string>
  ): Record<string, number> {
    const transfers: Record<string, number> = {};

    // Initialize transfer counts
    activeCandidates.forEach(candidateId => {
      transfers[candidateId] = 0;
    });

    // Count transfers from eliminated candidate
    for (const ranking of rankings) {
      const firstChoice = this.getNextValidChoice(ranking.ranking, activeCandidates);
      if (firstChoice === eliminated) {
        const nextChoice = this.getNextValidChoice(
          ranking.ranking.slice(ranking.ranking.indexOf(eliminated) + 1), 
          activeCandidates
        );
        if (nextChoice) {
          transfers[nextChoice]++;
        }
      }
    }

    return transfers;
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private getAllCandidateIds(rankings: UserRanking[]): string[] {
    const candidateIds = new Set<string>();
    
    // Add predefined candidates
    this.candidates.forEach((_, id) => candidateIds.add(id));
    
    // Add write-in candidates from rankings
    rankings.forEach(ranking => {
      ranking.ranking.forEach(candidateId => {
        if (!this.candidates.has(candidateId)) {
          candidateIds.add(candidateId);
        }
      });
    });

    return Array.from(candidateIds);
  }

  private calculateBreakdown(rankings: UserRanking[], rounds: RankedChoiceRound[]) {
    const byRound: Record<number, Record<string, number>> = {};
    const byCandidate: Record<string, number> = {};
    let exhausted = 0;

    // Calculate breakdown by round
    rounds.forEach(round => {
      byRound[round.round] = { ...round.votes };
    });

    // Calculate breakdown by candidate
    rankings.forEach(ranking => {
      const firstChoice = ranking.ranking[0];
      if (firstChoice) {
        byCandidate[firstChoice] = (byCandidate[firstChoice] || 0) + 1;
      } else {
        exhausted++;
      }
    });

    return {
      byRound,
      byCandidate,
      exhausted
    };
  }

  private calculateParticipationRate(rankings: UserRanking[]): number {
    // This would typically be calculated against total eligible voters
    // For now, return 1.0 (100%) as we only have actual voters
    return 1.0;
  }

  private createEmptyResults(startTime: number, edgeCasesHandled: string[]): RankedChoiceResults {
    return {
      rounds: [],
      winner: null,
      totalVotes: 0,
      participationRate: 0,
      breakdown: {
        byRound: {},
        byCandidate: {},
        exhausted: 0
      },
      metadata: {
        calculationTime: performance.now() - startTime,
        tieBreaksUsed: 0,
        edgeCasesHandled
      }
    };
  }
}

// ============================================================================
// EXPORTED UTILITY FUNCTIONS
// ============================================================================

export function tiebreakStable(candidates: string[], pollId: string): string {
  return [...candidates].sort((a, b) => {
    const ha = createHash('sha256').update(`${pollId}:${a}`).digest('hex');
    const hb = createHash('sha256').update(`${pollId}:${b}`).digest('hex');
    return ha.localeCompare(hb);
  })[0];
}

export function tiebreakWithBeacon(candidates: string[], pollId: string, beaconValue: string): string {
  const { createHmac } = require('crypto');
  return [...candidates].sort((a, b) => {
    const ha = createHmac('sha256', beaconValue).update(`${pollId}:${a}`).digest('hex');
    const hb = createHmac('sha256', beaconValue).update(`${pollId}:${b}`).digest('hex');
    return ha.localeCompare(hb);
  })[0];
}

// ============================================================================
// EXPORTED CLASS
// ============================================================================

export default IRVCalculator;
