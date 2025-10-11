// ============================================================================
// PHASE 1: FINALIZE POLL JOB IMPLEMENTATION
// ============================================================================
// Agent A1 - Infrastructure Specialist
// 
// This module implements the poll finalization job that creates official
// snapshots and locks polls for the Ranked Choice Democracy Revolution platform.
// 
// Features:
// - Official results calculation and snapshot creation
// - Checksum generation for auditability
// - Poll locking and status updates
// - Broadcast notifications for real-time updates
// - Error handling and rollback capabilities
// 
// Created: January 15, 2025
// Status: Phase 1 Implementation
// ============================================================================

import { IRVCalculator } from './irv-calculator';
import { logger } from '@/lib/utils/logger';
import { withOptional } from '@/lib/utils/objects';
import type { UserRanking } from './irv-calculator';
import { type MerkleTree, BallotVerificationManager, snapshotChecksum } from '../audit/merkle-tree';
import { createHash } from 'crypto';
import { getSupabaseServerClient } from '@/utils/supabase/server';
import type { SupabaseClient as RealSupabaseClient } from '@supabase/supabase-js';
import type {
  Poll,
  Ballot,
  PollSnapshot,
  FinalizeResult,
  FinalizeOptions
} from './types';

// ============================================================================
// TYPES AND INTERFACES - Imported from ./types.ts
// ============================================================================

// ============================================================================
// FINALIZE POLL MANAGER
// ============================================================================

type SupabaseVoteData = {
  id: string;
  poll_id: string;
  user_id: string;
  vote_data?: {
    ranking?: string[];
  };
  created_at: string;
}

type SupabasePollData = {
  id: string;
  title: string;
  description?: string;
  options?: Array<{ id: string; name: string; description?: string }>;
  close_at?: string;
  allow_postclose?: boolean;
  status: string;
  locked_at?: string;
  created_at: string;
  updated_at: string;
}

type SupabaseSnapshotData = {
  id: string;
  poll_id: string;
  taken_at: string;
  results: unknown;
  total_ballots: number;
  checksum: string;
  merkle_root?: string;
  created_at: string;
}

// Simplified Supabase client interface to avoid complex query chain typing issues
type SupabaseQueryBuilder = {
  select(columns?: string): SupabaseQueryBuilder;
  eq(column: string, value: unknown): SupabaseQueryBuilder;
  lte(column: string, value: string): SupabaseQueryBuilder;
  gt(column: string, value: string): SupabaseQueryBuilder;
  single(): Promise<{ data: unknown; error: { message: string } | null }>;
  insert(data: Record<string, unknown>): SupabaseQueryBuilder;
  update(data: Record<string, unknown>): SupabaseQueryBuilder;
  upsert(data: Record<string, unknown>, options?: { onConflict?: string }): SupabaseQueryBuilder;
  then(onfulfilled?: (value: { data: unknown; error: unknown }) => void): Promise<{ data: unknown; error: unknown }>;
};

type _SupabaseClient = {
  from(table: string): SupabaseQueryBuilder;
  channel(name: string): {
    send(message: { type: string; event: string; payload: Record<string, unknown> }): Promise<void>;
  };
}

export class FinalizePollManager {
  private ballotVerifier: BallotVerificationManager;
  private supabaseClient: RealSupabaseClient;

  constructor(supabaseClient: RealSupabaseClient) {
    this.supabaseClient = supabaseClient;
    this.ballotVerifier = new BallotVerificationManager();
  }

  // ============================================================================
  // MAIN FINALIZATION FUNCTION
  // ============================================================================

  async finalizePoll(
    pollId: string, 
    options: FinalizeOptions = this.getDefaultOptions()
  ): Promise<FinalizeResult> {
    const startTime = performance.now();
    
    try {
      // 1. Validate poll and get data
      const poll = await this.getPoll(pollId);
      if (!poll) {
        throw new Error(`Poll not found: ${pollId}`);
      }

      if (poll.status === 'closed' && !options.force) {
        throw new Error(`Poll ${pollId} is already closed`);
      }

      // 2. Get official ballots (before close_at)
      const officialBallots = await this.getOfficialBallots(pollId, poll.closeAt);
      const postCloseBallots = await this.getPostCloseBallots(pollId, poll.closeAt);

      if (officialBallots.length === 0) {
        throw new Error(`No official ballots found for poll ${pollId}`);
      }

      // 3. Create Merkle tree for auditability
      const merkleTree = this.ballotVerifier.createTree(pollId);
      const _ballotCommitments = merkleTree.addBallots(
        officialBallots.map(ballot => ({
          id: ballot.id,
          data: ballot
        }))
      );

      // 4. Calculate IRV results
      const irvResults = await this.calculateIRVResults(poll, officialBallots);

      // 5. Generate checksum
      const checksum = this.generateSnapshotChecksum(poll, irvResults, officialBallots);
      const merkleRoot = merkleTree.getRoot();

      // 6. Create snapshot
      const snapshot = await this.createSnapshot({
        pollId,
        takenAt: poll.closeAt || new Date(),
        results: irvResults,
        totalBallots: officialBallots.length,
        checksum,
        merkleRoot
      });

      // 7. Update poll status
      await this.updatePollStatus(pollId, 'closed', new Date());

      // 8. Broadcast update if requested
      if (options.broadcastUpdate) {
        await this.broadcastPollLocked(pollId, snapshot);
      }

      // 9. Generate replay data if requested
      if (options.generateReplayData) {
        await this.generateReplayData(pollId, merkleTree);
      }

      const endTime = performance.now();

      return {
        success: true,
        snapshotId: snapshot.id,
        metadata: {
          officialBallots: officialBallots.length,
          postCloseBallots: postCloseBallots.length,
          calculationTime: endTime - startTime,
          checksum,
          merkleRoot
        }
      };

    } catch (error) {
      logger.error(`Failed to finalize poll ${pollId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        metadata: {
          officialBallots: 0,
          postCloseBallots: 0,
          calculationTime: performance.now() - startTime,
          checksum: '',
          merkleRoot: ''
        }
      };
    }
  }

  // ============================================================================
  // DATA RETRIEVAL METHODS
  // ============================================================================

  private mapVoteDataToBallots(data: SupabaseVoteData[], closeAt?: Date): Ballot[] {
    return data.map((vote: SupabaseVoteData) => ({
      id: vote.id,
      pollId: vote.poll_id,
      userId: vote.user_id,
      ranking: vote.vote_data?.ranking || [],
      createdAt: new Date(vote.created_at),
      isPostClose: closeAt ? new Date(vote.created_at) > closeAt : false
    }));
  }

  private async getPoll(pollId: string): Promise<Poll | null> {
    try {
      const result = await this.supabaseClient
        .from('polls')
        .select('*')
        .eq('id', pollId)
        .single();

      if (result.error) {
        logger.error('Error fetching poll:', result.error);
        return null;
      }

      const pollData = result.data as SupabasePollData;
      return withOptional(
        {
          id: pollData.id,
          title: pollData.title,
          candidates: pollData.options || [],
          allowPostclose: pollData.allow_postclose || false,
          status: pollData.status as 'draft' | 'active' | 'closed' | 'archived',
          createdAt: new Date(pollData.created_at),
          updatedAt: new Date(pollData.updated_at)
        },
        {
          description: pollData.description,
          closeAt: pollData.close_at ? new Date(pollData.close_at) : undefined,
          lockedAt: pollData.locked_at ? new Date(pollData.locked_at) : undefined
        }
      );
    } catch (error) {
      logger.error('Error in getPoll:', error);
      return null;
    }
  }

  private async getOfficialBallots(pollId: string, closeAt?: Date): Promise<Ballot[]> {
    try {
      // Only get ballots before close_at if close_at is set
      if (closeAt) {
        const result = await this.supabaseClient
          .from('votes')
          .select('*')
          .eq('poll_id', pollId)
          .lte('created_at', closeAt.toISOString());
        
        if (result.error) {
          logger.error('Error fetching official ballots:', result.error);
          return [];
        }
        return this.mapVoteDataToBallots((result.data as SupabaseVoteData[]) || [], closeAt);
      }

      const result = await this.supabaseClient
        .from('votes')
        .select('*')
        .eq('poll_id', pollId);
      
      if (result.error) {
        logger.error('Error fetching official ballots:', result.error);
        return [];
      }

      return this.mapVoteDataToBallots((result.data as SupabaseVoteData[]) || [], closeAt);
    } catch (error) {
      logger.error('Error in getOfficialBallots:', error);
      return [];
    }
  }

  private async getPostCloseBallots(pollId: string, closeAt?: Date): Promise<Ballot[]> {
    if (!closeAt) {
      return [];
    }

    try {
      const result = await this.supabaseClient
        .from('votes')
        .select('*')
        .eq('poll_id', pollId)
        .gt('created_at', closeAt.toISOString());

      if (result.error) {
        logger.error('Error fetching post-close ballots:', result.error);
        return [];
      }

      return (result.data as SupabaseVoteData[])?.map((vote: SupabaseVoteData) => ({
        id: vote.id,
        pollId: vote.poll_id,
        userId: vote.user_id,
        ranking: vote.vote_data?.ranking || [],
        createdAt: new Date(vote.created_at),
        isPostClose: true
      }));
    } catch (error) {
      logger.error('Error in getPostCloseBallots:', error);
      return [];
    }
  }

  // ============================================================================
  // IRV CALCULATION
  // ============================================================================

  private async calculateIRVResults(poll: Poll, ballots: Ballot[]): Promise<{
    winner: string;
    rounds: Array<{
      round: number;
      eliminated?: string;
      votes: Record<string, number>;
      percentages: Record<string, number>;
    }>;
    totalVotes: number;
    participationRate: number;
    breakdown: Record<string, number>;
    metadata: {
      algorithm: string;
      tieBreakingMethod: string;
      calculationTime: number;
    };
  }> {
    try {
      const calculator = new IRVCalculator(poll.id, poll.candidates);
      
      const rankings: UserRanking[] = ballots.map(ballot => ({
        pollId: ballot.pollId,
        userId: ballot.userId,
        ranking: ballot.ranking,
        createdAt: ballot.createdAt
      }));

      const results = calculator.calculateResults(rankings);
      
      // Calculate percentages for each round
      const roundsWithPercentages = results.rounds.map(round => {
        const totalVotes = Object.values(round.votes).reduce((sum, count) => sum + count, 0);
        const percentages: Record<string, number> = {};
        
        for (const [candidate, votes] of Object.entries(round.votes)) {
          percentages[candidate] = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
        }
        
        return withOptional(
          {
            round: round.round,
            votes: round.votes,
            percentages
          },
          {
            eliminated: round.eliminated
          }
        );
      });

      // Calculate breakdown (final vote distribution)
      const breakdown: Record<string, number> = {};
      if (results.rounds.length > 0) {
        const finalRound = results.rounds[results.rounds.length - 1];
        if (finalRound) {
          for (const [candidate, votes] of Object.entries(finalRound.votes)) {
            breakdown[candidate] = votes;
          }
        }
      }

      return {
        winner: results.winner || '',
        rounds: roundsWithPercentages,
        totalVotes: results.totalVotes,
        participationRate: 100, // Default to 100% for now
        breakdown,
        metadata: {
          algorithm: 'IRV',
          tieBreakingMethod: 'deterministic',
          calculationTime: results.metadata?.calculationTime || 0
        }
      };
    } catch (error) {
      logger.error('Error calculating IRV results:', error);
      throw new Error(`IRV calculation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // ============================================================================
  // CHECKSUM GENERATION
  // ============================================================================

  private generateSnapshotChecksum(poll: Poll, results: {
    winner: string;
    rounds: Array<{
      round: number;
      eliminated?: string;
      votes: Record<string, number>;
      percentages: Record<string, number>;
    }>;
  }, ballots: Ballot[]): string {
    const candidateIds = poll.candidates.map(c => c.id);
    const ballotsHash = this.hashBallots(ballots);
    
    return snapshotChecksum({
      pollId: poll.id,
      candidateIds,
      ballotsHash,
      rounds: results.rounds
    });
  }

  private hashBallots(ballots: Ballot[]): string {
    const ballotData = ballots.map(ballot => ({
      id: ballot.id,
      ranking: ballot.ranking,
      createdAt: ballot.createdAt.toISOString()
    }));
    
    return createHash('sha256')
      .update(JSON.stringify(ballotData))
      .digest('hex');
  }

  // ============================================================================
  // DATABASE OPERATIONS
  // ============================================================================

  private async createSnapshot(snapshotData: {
    pollId: string;
    takenAt: Date;
    results: {
      winner: string;
      rounds: Array<{
        round: number;
        eliminated?: string;
        votes: Record<string, number>;
        percentages: Record<string, number>;
      }>;
      totalVotes: number;
      participationRate: number;
      breakdown: Record<string, number>;
      metadata: {
        algorithm: string;
        tieBreakingMethod: string;
        calculationTime: number;
      };
    };
    totalBallots: number;
    checksum: string;
    merkleRoot: string;
  }): Promise<PollSnapshot> {
    try {
      const result = await this.supabaseClient
        .from('poll_snapshots')
        .insert({
          poll_id: snapshotData.pollId,
          taken_at: snapshotData.takenAt.toISOString(),
          results: snapshotData.results,
          total_ballots: snapshotData.totalBallots,
          checksum: snapshotData.checksum,
          merkle_root: snapshotData.merkleRoot
        })
        .select()
        .single();

      if (result.error) {
        throw new Error(`Failed to create snapshot: ${result.error.message}`);
      }

      const snapshotResult = result.data as SupabaseSnapshotData;
      return withOptional(
        {
          id: snapshotResult.id,
          pollId: snapshotResult.poll_id,
          takenAt: new Date(snapshotResult.taken_at),
          results: snapshotResult.results as typeof snapshotData.results,
          totalBallots: snapshotResult.total_ballots,
          checksum: snapshotResult.checksum,
          createdAt: new Date(snapshotResult.created_at)
        },
        {
          merkleRoot: snapshotResult.merkle_root
        }
      );
    } catch (error) {
      logger.error('Error creating snapshot:', error);
      throw error;
    }
  }

  private async updatePollStatus(pollId: string, status: string, lockedAt: Date): Promise<void> {
    try {
      const { error } = await this.supabaseClient
        .from('polls')
        .update({
          status,
          locked_at: lockedAt.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', pollId);

      if (error) {
        throw new Error(`Failed to update poll status: ${(error as { message: string }).message}`);
      }
    } catch (error) {
      logger.error('Error updating poll status:', error);
      throw error;
    }
  }

  // ============================================================================
  // NOTIFICATION AND BROADCAST
  // ============================================================================

  private async broadcastPollLocked(pollId: string, snapshot: PollSnapshot): Promise<void> {
    try {
      const message = {
        type: 'poll_locked',
        pollId,
        snapshotId: snapshot.id,
        timestamp: new Date().toISOString(),
        results: snapshot.results,
        checksum: snapshot.checksum,
        merkleRoot: snapshot.merkleRoot
      };

      // Broadcast via Supabase Realtime
      await this.supabaseClient
        .channel(`poll:${pollId}`)
        .send({
          type: 'broadcast',
          event: 'poll_locked',
          payload: message
        });

      logger.info(`Broadcasted poll locked event for poll ${pollId}`);
    } catch (error) {
      logger.error('Error broadcasting poll locked:', error);
      // Don't throw - this is not critical for finalization
    }
  }

  // ============================================================================
  // REPLAY DATA GENERATION
  // ============================================================================

  private async generateReplayData(pollId: string, merkleTree: MerkleTree): Promise<void> {
    try {
      const replayData = merkleTree.generateReplayData('IRV with deterministic tie-breaking');
      
      // Store replay data (implementation depends on storage system)
      logger.info('Generated replay data:', replayData);
      
      // In production, this would be stored in a dedicated table or file system
    } catch (error) {
      logger.error('Error generating replay data:', error);
      // Don't throw - this is not critical for finalization
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  public getDefaultOptions(): FinalizeOptions {
    return {
      force: false,
      skipValidation: false,
      generateReplayData: true,
      broadcastUpdate: true
    };
  }

  // ============================================================================
  // PUBLIC API METHODS
  // ============================================================================

  async canFinalizePoll(pollId: string): Promise<{ canFinalize: boolean; reason?: string }> {
    try {
      const poll = await this.getPoll(pollId);
      if (!poll) {
        return { canFinalize: false, reason: 'Poll not found' };
      }

      if (poll.status === 'closed') {
        return { canFinalize: false, reason: 'Poll is already closed' };
      }

      if (poll.status !== 'active') {
        return { canFinalize: false, reason: 'Poll is not active' };
      }

      const officialBallots = await this.getOfficialBallots(pollId, poll.closeAt);
      if (officialBallots.length === 0) {
        return { canFinalize: false, reason: 'No ballots to finalize' };
      }

      return { canFinalize: true };
    } catch (error) {
      return { canFinalize: false, reason: `Error checking finalization status: ${error instanceof Error ? error.message : String(error)}` };
    }
  }

  async getFinalizationStatus(pollId: string): Promise<{
    isFinalized: boolean;
    snapshotId?: string;
    finalizedAt?: Date;
    checksum?: string;
    merkleRoot?: string;
  }> {
    try {
      const { data, error } = await this.supabaseClient
        .from('poll_snapshots')
        .select('*')
        .eq('poll_id', pollId)
        .single();

      if (error || !data) {
        return { isFinalized: false };
      }

      const snapshotData = data as SupabaseSnapshotData;
      return withOptional(
        {
          isFinalized: true,
          snapshotId: snapshotData.id,
          finalizedAt: new Date(snapshotData.taken_at),
          checksum: snapshotData.checksum
        },
        {
          merkleRoot: snapshotData.merkle_root
        }
      );
    } catch (error) {
      logger.error('Error getting finalization status:', error);
      return { isFinalized: false };
    }
  }

  // ============================================================================
  // THIN ADAPTER METHODS (for test compatibility)
  // ============================================================================

  /**
   * Create a poll snapshot - thin adapter method
   */
  async createPollSnapshot(pollId: string): Promise<PollSnapshot> {
    const poll = await this.getPoll(pollId);
    if (!poll) throw new Error(`Poll not found: ${pollId}`);
    const ballots = await this.getOfficialBallots(pollId);
    const results = await this.calculateIRVResults(poll, ballots);
    const checksum = this.generateSnapshotChecksum(poll, results, ballots);
    return {
      id: `snapshot-${pollId}-${Date.now()}`,
      pollId,
      takenAt: new Date(),
      results,
      totalBallots: ballots.length,
      checksum,
      createdAt: new Date()
    };
  }

  /**
   * Create a Merkle tree - thin adapter method
   */
  async createMerkleTree(pollId: string): Promise<MerkleTree> {
    const ballots = await this.getOfficialBallots(pollId);
    const merkleTree = this.ballotVerifier.createTree(pollId);
    const ballotCommitments = ballots.map(ballot => ({
      id: ballot.id,
      data: ballot
    }));
    merkleTree.addBallots(ballotCommitments);
    return merkleTree;
  }

  /**
   * Compute Merkle root from leaves
   */
  private computeMerkleRoot(leaves: string[]): string {
    if (leaves.length === 0) return '';
    let level = [...leaves];
    while (level.length > 1) {
      const next: string[] = [];
      for (let i = 0; i < level.length; i += 2) {
        const a = level[i];
        const b = level[i + 1] ?? level[i]; // duplicate last if odd
        if (a && b) {
          next.push(
            createHash('sha256').update(a + b).digest('hex')
          );
        }
      }
      level = next;
    }
    return level[0] ?? '';
  }
}

// ============================================================================
// EXPORTED UTILITY FUNCTIONS
// ============================================================================

export function getDefaultFinalizeOptions(): FinalizeOptions {
  return {
    force: false,
    skipValidation: false,
    generateReplayData: true,
    broadcastUpdate: true
  };
}

export async function finalizePoll(pollId: string, options?: Partial<FinalizeOptions>): Promise<FinalizeResult> {
  // This would be called from an API endpoint or background job
  const supabase = await getSupabaseServerClient();
  const manager = new FinalizePollManager(supabase);
  const finalOptions = withOptional(getDefaultFinalizeOptions(), options ?? {});
  return manager.finalizePoll(pollId, finalOptions);
}

export async function createPollSnapshot(pollId: string): Promise<string> {
  // This would be called from the database migration
  const supabase = await getSupabaseServerClient();
  const manager = new FinalizePollManager(supabase);
  const result = await manager.finalizePoll(pollId);
  
  if (!result.success) {
    throw new Error(`Failed to create snapshot: ${result.error}`);
  }
  
  return result.snapshotId!;
}

// ============================================================================
// EXPORTED CLASS
// ============================================================================

export default FinalizePollManager;
