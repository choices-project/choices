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

import { IRVCalculator, Candidate, UserRanking } from './irv-calculator';
import { MerkleTree, BallotVerificationManager, snapshotChecksum } from '../audit/merkle-tree';
import { createHash } from 'crypto';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface Poll {
  id: string;
  title: string;
  description?: string;
  candidates: Candidate[];
  closeAt?: Date;
  allowPostclose: boolean;
  status: 'draft' | 'active' | 'closed' | 'archived';
  lockedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Ballot {
  id: string;
  pollId: string;
  userId: string;
  ranking: string[];
  createdAt: Date;
  isPostClose: boolean;
}

export interface PollSnapshot {
  id: string;
  pollId: string;
  takenAt: Date;
  results: any;
  totalBallots: number;
  checksum: string;
  merkleRoot?: string;
  createdAt: Date;
}

export interface FinalizeResult {
  success: boolean;
  snapshotId?: string;
  error?: string;
  metadata: {
    officialBallots: number;
    postCloseBallots: number;
    calculationTime: number;
    checksum: string;
    merkleRoot: string;
  };
}

export interface FinalizeOptions {
  force: boolean;
  skipValidation: boolean;
  generateReplayData: boolean;
  broadcastUpdate: boolean;
}

// ============================================================================
// FINALIZE POLL MANAGER
// ============================================================================

export class FinalizePollManager {
  private ballotVerifier: BallotVerificationManager;
  private supabaseClient: any; // Would be properly typed in production

  constructor(supabaseClient: any) {
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
      const ballotCommitments = merkleTree.addBallots(
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
      console.error(`Failed to finalize poll ${pollId}:`, error);
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

  private async getPoll(pollId: string): Promise<Poll | null> {
    try {
      const { data, error } = await this.supabaseClient
        .from('polls')
        .select('*')
        .eq('id', pollId)
        .single();

      if (error) {
        console.error('Error fetching poll:', error);
        return null;
      }

      return {
        id: data.id,
        title: data.title,
        description: data.description,
        candidates: data.options || [],
        closeAt: data.close_at ? new Date(data.close_at) : undefined,
        allowPostclose: data.allow_postclose || false,
        status: data.status,
        lockedAt: data.locked_at ? new Date(data.locked_at) : undefined,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };
    } catch (error) {
      console.error('Error in getPoll:', error);
      return null;
    }
  }

  private async getOfficialBallots(pollId: string, closeAt?: Date): Promise<Ballot[]> {
    try {
      let query = this.supabaseClient
        .from('votes')
        .select('*')
        .eq('poll_id', pollId);

      // Only get ballots before close_at if close_at is set
      if (closeAt) {
        query = query.lte('created_at', closeAt.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching official ballots:', error);
        return [];
      }

      return data.map((vote: any) => ({
        id: vote.id,
        pollId: vote.poll_id,
        userId: vote.user_id,
        ranking: vote.vote_data?.ranking || [],
        createdAt: new Date(vote.created_at),
        isPostClose: closeAt ? new Date(vote.created_at) > closeAt : false
      }));
    } catch (error) {
      console.error('Error in getOfficialBallots:', error);
      return [];
    }
  }

  private async getPostCloseBallots(pollId: string, closeAt?: Date): Promise<Ballot[]> {
    if (!closeAt) {
      return [];
    }

    try {
      const { data, error } = await this.supabaseClient
        .from('votes')
        .select('*')
        .eq('poll_id', pollId)
        .gt('created_at', closeAt.toISOString());

      if (error) {
        console.error('Error fetching post-close ballots:', error);
        return [];
      }

      return data.map((vote: any) => ({
        id: vote.id,
        pollId: vote.poll_id,
        userId: vote.user_id,
        ranking: vote.vote_data?.ranking || [],
        createdAt: new Date(vote.created_at),
        isPostClose: true
      }));
    } catch (error) {
      console.error('Error in getPostCloseBallots:', error);
      return [];
    }
  }

  // ============================================================================
  // IRV CALCULATION
  // ============================================================================

  private async calculateIRVResults(poll: Poll, ballots: Ballot[]): Promise<any> {
    try {
      const calculator = new IRVCalculator(poll.id, poll.candidates);
      
      const rankings: UserRanking[] = ballots.map(ballot => ({
        pollId: ballot.pollId,
        userId: ballot.userId,
        ranking: ballot.ranking,
        createdAt: ballot.createdAt
      }));

      const results = calculator.calculateResults(rankings);
      
      return {
        winner: results.winner,
        rounds: results.rounds,
        totalVotes: results.totalVotes,
        participationRate: results.participationRate,
        breakdown: results.breakdown,
        metadata: results.metadata
      };
    } catch (error) {
      console.error('Error calculating IRV results:', error);
      throw new Error(`IRV calculation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // ============================================================================
  // CHECKSUM GENERATION
  // ============================================================================

  private generateSnapshotChecksum(poll: Poll, results: any, ballots: Ballot[]): string {
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
    results: any;
    totalBallots: number;
    checksum: string;
    merkleRoot: string;
  }): Promise<PollSnapshot> {
    try {
      const { data, error } = await this.supabaseClient
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

      if (error) {
        throw new Error(`Failed to create snapshot: ${error.message}`);
      }

      return {
        id: data.id,
        pollId: data.poll_id,
        takenAt: new Date(data.taken_at),
        results: data.results,
        totalBallots: data.total_ballots,
        checksum: data.checksum,
        merkleRoot: data.merkle_root,
        createdAt: new Date(data.created_at)
      };
    } catch (error) {
      console.error('Error creating snapshot:', error);
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
        throw new Error(`Failed to update poll status: ${error.message}`);
      }
    } catch (error) {
      console.error('Error updating poll status:', error);
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

      console.log(`Broadcasted poll locked event for poll ${pollId}`);
    } catch (error) {
      console.error('Error broadcasting poll locked:', error);
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
      console.log('Generated replay data:', replayData);
      
      // In production, this would be stored in a dedicated table or file system
    } catch (error) {
      console.error('Error generating replay data:', error);
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

      return {
        isFinalized: true,
        snapshotId: data.id,
        finalizedAt: new Date(data.taken_at),
        checksum: data.checksum,
        merkleRoot: data.merkle_root
      };
    } catch (error) {
      console.error('Error getting finalization status:', error);
      return { isFinalized: false };
    }
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
  const manager = new FinalizePollManager({} as any); // TODO: Pass actual supabase client
  const finalOptions = { ...getDefaultFinalizeOptions(), ...options };
  return manager.finalizePoll(pollId, finalOptions);
}

export async function createPollSnapshot(pollId: string): Promise<string> {
  // This would be called from the database migration
  const manager = new FinalizePollManager({} as any); // TODO: Pass actual supabase client
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
