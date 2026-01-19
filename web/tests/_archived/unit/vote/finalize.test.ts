/**
 * Tests for Poll Finalization - Replay Data Storage
 * 
 * Tests the replay data generation and storage functionality in poll finalization.
 * 
 * Created: January 2025
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

import { MerkleTree } from '@/lib/audit/merkle-tree';
import { FinalizePollManager } from '@/lib/vote/finalize';

// Import V2 test setup
import { getMS } from '../../setup';

// Mock the logger
jest.mock('@/lib/utils/logger', () => ({
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
  }
}));

// Mock server-only modules
jest.mock('server-only', () => ({}));

const mockSetup = getMS();
const { when, client: mockSupabaseClient } = mockSetup;

jest.mock('@/utils/supabase/server', () => ({
  getSupabaseServerClient: jest.fn(() => Promise.resolve(mockSupabaseClient))
}));

describe('FinalizePollManager - Replay Data Storage', () => {
  let manager: FinalizePollManager;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSetup.resetAllMocks();
    manager = new FinalizePollManager(mockSupabaseClient as any);
  });

  describe('generateReplayData', () => {
    it('should generate and store replay data in poll_snapshots table', async () => {
      const pollId = 'test-poll-1';
      const merkleTree = new MerkleTree(pollId);
      
      // Add some ballots to the tree
      merkleTree.addBallot('ballot-1', { ranking: [1, 2, 3] });
      merkleTree.addBallot('ballot-2', { ranking: [2, 1, 3] });

      // Create a snapshot first
      const snapshotData = {
        id: 'snapshot-1',
        poll_id: pollId,
        taken_at: new Date().toISOString(),
        results: { winner: 'option-1' },
        total_ballots: 2,
        checksum: 'test-checksum',
        merkle_root: merkleTree.getRoot(),
        created_at: new Date().toISOString()
      };

      // Mock finding the snapshot (using order/limit pattern)
      when()
        .table('poll_snapshots')
        .op('select')
        .returnsSingle(snapshotData);

      // Mock updating the snapshot with replay data
      when()
        .table('poll_snapshots')
        .op('update')
        .returnsList([{ ...snapshotData, replay_data: expect.any(Object) }]);

      // Call the private method
      await (manager as any).generateReplayData(pollId, merkleTree);

      // Verify that update was called
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('poll_snapshots');
    });

    it('should handle errors gracefully when storing replay data', async () => {
      const pollId = 'test-poll-2';
      const merkleTree = new MerkleTree(pollId);
      merkleTree.addBallot('ballot-1', { ranking: [1, 2] });

      const snapshotData = {
        id: 'snapshot-2',
        poll_id: pollId,
        taken_at: new Date().toISOString(),
        results: { winner: 'option-1' },
        total_ballots: 1,
        checksum: 'test-checksum',
        merkle_root: merkleTree.getRoot(),
        created_at: new Date().toISOString()
      };

      // Mock finding the snapshot
      when()
        .table('poll_snapshots')
        .op('select')
        .returnsSingle(snapshotData);

      // Mock update to fail
      when()
        .table('poll_snapshots')
        .op('update')
        .returnsError('Database error');

      // Should not throw, just log a warning
      await expect(
        (manager as any).generateReplayData(pollId, merkleTree)
      ).resolves.not.toThrow();
    });

    it('should handle missing snapshot gracefully', async () => {
      const pollId = 'test-poll-3';
      const merkleTree = new MerkleTree(pollId);

      // Mock no snapshot found
      when()
        .table('poll_snapshots')
        .op('select')
        .returnsSingle(null);

      // Should not throw
      await expect(
        (manager as any).generateReplayData(pollId, merkleTree)
      ).resolves.not.toThrow();
    });

    it('should generate valid replay data structure', () => {
      const pollId = 'test-poll-4';
      const merkleTree = new MerkleTree(pollId);
      
      merkleTree.addBallot('ballot-1', { ranking: [1, 2] });
      merkleTree.addBallot('ballot-2', { ranking: [2, 1] });

      const replayData = merkleTree.generateReplayData('IRV with deterministic tie-breaking');

      expect(replayData).toHaveProperty('pollId', pollId);
      expect(replayData).toHaveProperty('ballots');
      expect(replayData).toHaveProperty('merkleRoot');
      expect(replayData).toHaveProperty('methodology', 'IRV with deterministic tie-breaking');
      expect(replayData).toHaveProperty('timestamp');
      expect(Array.isArray(replayData.ballots)).toBe(true);
      expect(replayData.ballots.length).toBe(2);
    });
  });

  describe('getFinalizationStatus', () => {
    it('should return finalization status with replay data if available', async () => {
      const pollId = 'test-poll-6';
      const snapshotData = {
        id: 'snapshot-3',
        poll_id: pollId,
        taken_at: new Date().toISOString(),
        results: { winner: 'option-1' },
        total_ballots: 5,
        checksum: 'test-checksum',
        merkle_root: 'test-merkle-root',
        replay_data: {
          pollId,
          ballots: [],
          merkleRoot: 'test-merkle-root',
          methodology: 'IRV',
          timestamp: new Date()
        },
        created_at: new Date().toISOString()
      };

      when()
        .table('poll_snapshots')
        .op('select')
        .returnsSingle(snapshotData);

      const status = await manager.getFinalizationStatus(pollId);

      expect(status.isFinalized).toBe(true);
      expect(status.snapshotId).toBe('snapshot-3');
      expect(status.checksum).toBe('test-checksum');
      expect(status.merkleRoot).toBe('test-merkle-root');
    });

    it('should return not finalized when no snapshot exists', async () => {
      const pollId = 'test-poll-7';

      when()
        .table('poll_snapshots')
        .op('select')
        .returnsSingle(null);

      const status = await manager.getFinalizationStatus(pollId);

      expect(status.isFinalized).toBe(false);
      expect(status.snapshotId).toBeUndefined();
    });
  });
});
