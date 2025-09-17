/**
 * Incremental Tally Manager
 * 
 * Implements incremental tallying system to avoid full recomputation
 * for ranked choice voting with Redis backing store.
 */

import { logger } from '../logger';
import { withOptional } from '../util/objects';

export interface Ballot {
  id: string;
  ranking: string[];
  timestamp: number;
}

export interface RoundState {
  pollId: string;
  currentRound: number;
  activeCandidates: Set<string>;
  eliminatedCandidates: Set<string>;
  currentRoundCounts: Record<string, number>;
  totalBallots: number;
  lastUpdate: number;
  roundHistory: RoundResult[];
}

export interface RoundResult {
  round: number;
  counts: Record<string, number>;
  eliminated: string[];
  winner?: string;
  timestamp: number;
}

export interface TallyUpdate {
  type: 'incremental' | 'full';
  round: number;
  counts: Record<string, number>;
  eliminated: string[];
  winner?: string;
  totalBallots: number;
  processingTime: number;
  timestamp: number;
}

export interface RedisClient {
  get(key: string): Promise<string | null>;
  setex(key: string, ttl: number, value: string): Promise<void>;
  del(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}

export class IncrementalTallyManager {
  private roundStates: Map<string, RoundState> = new Map();
  private redis: RedisClient;
  private cache: Map<string, any> = new Map();

  constructor(redis: RedisClient) {
    this.redis = redis;
  }

  /**
   * Update tally with new ballots
   */
  async updateTally(pollId: string, newBallots: Ballot[]): Promise<TallyUpdate> {
    const startTime = Date.now();
    
    try {
      const currentState = await this.getRoundState(pollId);
      
      // Only recompute if eliminations change
      const newState = await this.processNewBallots(currentState, newBallots);
      
      if (this.hasEliminationChange(currentState, newState)) {
        await this.saveRoundState(pollId, newState);
        const update = this.generateFullUpdate(newState, startTime);
        logger.info(`Full tally update for poll ${pollId}`, { 
          round: newState.currentRound, 
          totalBallots: newState.totalBallots,
          processingTime: update.processingTime 
        });
        return update;
      } else {
        const update = this.generateIncrementalUpdate(currentState, newState, startTime);
        logger.info(`Incremental tally update for poll ${pollId}`, { 
          round: newState.currentRound, 
          newBallots: newBallots.length,
          processingTime: update.processingTime 
        });
        return update;
      }
    } catch (error) {
      logger.error(`Failed to update tally for poll ${pollId}`, { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * Process new ballots and update round state
   */
  private async processNewBallots(state: RoundState, newBallots: Ballot[]): Promise<RoundState> {
    const updatedCounts = { ...state.currentRoundCounts };
    let processedBallots = 0;
    
    for (const ballot of newBallots) {
      const nextChoice = await this.getNextValidChoice(ballot, state.activeCandidates);
      if (nextChoice) {
        updatedCounts[nextChoice] = (updatedCounts[nextChoice] || 0) + 1;
        processedBallots++;
      }
    }
    
    // Check if we need to eliminate a candidate
    const newState = await this.checkForElimination(state, updatedCounts);
    
    return {
      ...newState,
      currentRoundCounts: updatedCounts,
      totalBallots: state.totalBallots + processedBallots,
      lastUpdate: Date.now()
    };
  }

  /**
   * Get next valid choice for a ballot
   */
  private async getNextValidChoice(ballot: Ballot, activeCandidates: Set<string>): Promise<string | null> {
    // Check Redis cache first
    const cacheKey = `ballot:${ballot.id}:next-choice:${Array.from(activeCandidates).sort().join(',')}`;
    const cached = await this.redis.get(cacheKey);
    
    if (cached) {
      return cached === 'null' ? null : cached;
    }
    
    // Compute next valid choice
    const nextChoice = this.computeNextValidChoice(ballot.ranking, activeCandidates);
    
    // Cache result with TTL
    await this.redis.setex(cacheKey, 3600, nextChoice || 'null');
    
    return nextChoice;
  }

  /**
   * Compute next valid choice from ballot ranking
   */
  private computeNextValidChoice(ranking: string[], activeCandidates: Set<string>): string | null {
    for (const candidate of ranking) {
      if (activeCandidates.has(candidate)) {
        return candidate;
      }
    }
    return null; // Exhausted ballot
  }

  /**
   * Check if elimination is needed and update state
   */
  private async checkForElimination(state: RoundState, counts: Record<string, number>): Promise<RoundState> {
    const totalVotes = Object.values(counts).reduce((sum, count) => sum + count, 0);
    const threshold = totalVotes / 2;
    
    // Check for winner
    for (const [candidate, count] of Object.entries(counts)) {
      if (count > threshold) {
        return {
          ...state,
          currentRound: state.currentRound + 1,
          roundHistory: [
            ...state.roundHistory,
            {
              round: state.currentRound,
              counts,
              eliminated: [],
              winner: candidate,
              timestamp: Date.now()
            }
          ]
        };
      }
    }
    
    // Find candidate to eliminate (lowest count)
    const candidates = Object.entries(counts);
    if (candidates.length <= 2) {
      // Final round - winner is the one with more votes
      const winner = candidates.reduce((a, b) => a[1] > b[1] ? a : b)[0];
      return {
        ...state,
        currentRound: state.currentRound + 1,
        roundHistory: [
          ...state.roundHistory,
          {
            round: state.currentRound,
            counts,
            eliminated: [],
            winner,
            timestamp: Date.now()
          }
        ]
      };
    }
    
    // Eliminate candidate with lowest count
    const eliminated = candidates.reduce((a, b) => a[1] < b[1] ? a : b)[0];
    const newActiveCandidates = new Set(state.activeCandidates);
    newActiveCandidates.delete(eliminated);
    
    const newEliminatedCandidates = new Set(state.eliminatedCandidates);
    newEliminatedCandidates.add(eliminated);
    
    return {
      ...state,
      currentRound: state.currentRound + 1,
      activeCandidates: newActiveCandidates,
      eliminatedCandidates: newEliminatedCandidates,
      roundHistory: [
        ...state.roundHistory,
        {
          round: state.currentRound,
          counts,
          eliminated: [eliminated],
          timestamp: Date.now()
        }
      ]
    };
  }

  /**
   * Check if elimination state has changed
   */
  private hasEliminationChange(currentState: RoundState, newState: RoundState): boolean {
    return (
      currentState.currentRound !== newState.currentRound ||
      currentState.activeCandidates.size !== newState.activeCandidates.size ||
      currentState.eliminatedCandidates.size !== newState.eliminatedCandidates.size
    );
  }

  /**
   * Generate full update (when eliminations change)
   */
  private generateFullUpdate(state: RoundState, startTime: number): TallyUpdate {
    const latestRound = state.roundHistory[state.roundHistory.length - 1];
    
    return withOptional(
      {
        type: 'full' as const,
        round: state.currentRound,
        counts: state.currentRoundCounts,
        eliminated: latestRound?.eliminated || [],
        totalBallots: state.totalBallots,
        processingTime: Date.now() - startTime,
        timestamp: Date.now()
      },
      {
        winner: latestRound?.winner
      }
    );
  }

  /**
   * Generate incremental update (when only counts change)
   */
  private generateIncrementalUpdate(
    currentState: RoundState, 
    newState: RoundState, 
    startTime: number
  ): TallyUpdate {
    return {
      type: 'incremental',
      round: newState.currentRound,
      counts: newState.currentRoundCounts,
      eliminated: [],
      totalBallots: newState.totalBallots,
      processingTime: Date.now() - startTime,
      timestamp: Date.now()
    };
  }

  /**
   * Save round state to Redis
   */
  private async saveRoundState(pollId: string, state: RoundState): Promise<void> {
    const key = `poll:${pollId}:round:${state.currentRound}:state`;
    await this.redis.setex(key, 86400, JSON.stringify({
      ...state,
      activeCandidates: Array.from(state.activeCandidates),
      eliminatedCandidates: Array.from(state.eliminatedCandidates)
    })); // 24 hour TTL
    
    this.roundStates.set(pollId, state);
  }

  /**
   * Get round state for a poll
   */
  private async getRoundState(pollId: string): Promise<RoundState> {
    // Check memory cache first
    if (this.roundStates.has(pollId)) {
      return this.roundStates.get(pollId)!;
    }
    
    // Try to load from Redis
    const key = `poll:${pollId}:current:state`;
    const cached = await this.redis.get(key);
    
    if (cached) {
      const state = JSON.parse(cached);
      // Convert arrays back to Sets
      state.activeCandidates = new Set(state.activeCandidates);
      state.eliminatedCandidates = new Set(state.eliminatedCandidates);
      this.roundStates.set(pollId, state);
      return state;
    }
    
    // Create initial state
    const initialState: RoundState = {
      pollId,
      currentRound: 1,
      activeCandidates: new Set(),
      eliminatedCandidates: new Set(),
      currentRoundCounts: {},
      totalBallots: 0,
      lastUpdate: Date.now(),
      roundHistory: []
    };
    
    this.roundStates.set(pollId, initialState);
    return initialState;
  }

  /**
   * Initialize poll with candidates
   */
  async initializePoll(pollId: string, candidates: string[]): Promise<void> {
    const initialState: RoundState = {
      pollId,
      currentRound: 1,
      activeCandidates: new Set(candidates),
      eliminatedCandidates: new Set(),
      currentRoundCounts: {},
      totalBallots: 0,
      lastUpdate: Date.now(),
      roundHistory: []
    };
    
    await this.saveRoundState(pollId, initialState);
    logger.info(`Initialized poll ${pollId} with candidates`, { candidates });
  }

  /**
   * Get current results for a poll
   */
  async getCurrentResults(pollId: string): Promise<RoundState | null> {
    return this.roundStates.get(pollId) || null;
  }

  /**
   * Clear poll data
   */
  async clearPoll(pollId: string): Promise<void> {
    this.roundStates.delete(pollId);
    
    // Clear Redis keys
    const pattern = `poll:${pollId}:*`;
    // Note: In a real Redis implementation, you'd use SCAN to find and delete keys
    // For now, we'll just clear the memory cache
    logger.info(`Cleared poll data for ${pollId}`);
  }
}
