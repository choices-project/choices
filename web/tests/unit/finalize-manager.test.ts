/**
 * FinalizeManager Unit Tests
 * 
 * Comprehensive unit tests for poll finalization and snapshot creation
 * 
 * Created: January 15, 2025
 * Updated: January 15, 2025
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import FinalizePollManager from '@/lib/vote/finalize';
import type { 
  Poll, 
  Ballot, 
  FinalizeResult, 
  FinalizeOptions
} from '@/lib/vote/types';
import type { RankedChoiceResults } from '@/lib/vote/irv-calculator';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createMockSupabase } from '../utils/mocks/supabase';

// Mock the logger
jest.mock('@/lib/logger', () => ({
  devLog: jest.fn()
}));

// Supabase
const { from: mockFrom, channel: mockChannel, single: mockSingle, insert: mockInsert, update: mockUpdate, thenable: mockThenable } = createMockSupabase();
const mockSupabaseClient = { from: mockFrom, channel: mockChannel } as unknown as SupabaseClient;

jest.mock('@/utils/supabase/server', () => ({
  getSupabaseServerClient: jest.fn(() => Promise.resolve(mockSupabaseClient))
}));

// IRVCalculator
jest.mock('@/lib/vote/irv-calculator', () => {
  const calculateResults = jest
    .fn().mockResolvedValue({
      winner: 'candidate-1',
      rounds: [
        {
          round: 1,
          eliminated: 'candidate-3',
          votes: { 'candidate-1': 2, 'candidate-2': 1, 'candidate-3': 0 },
          percentages: { 'candidate-1': 66.67, 'candidate-2': 33.33, 'candidate-3': 0 },
        },
      ],
      totalVotes: 3,
      participationRate: 0.75,
      breakdown: { 'candidate-1': 2, 'candidate-2': 1, 'candidate-3': 0 },
      metadata: { algorithm: 'IRV', tieBreakingMethod: 'poll-seeded-hash', calculationTime: 15 },
    } as unknown as RankedChoiceResults);

  return {
    IRVCalculator: jest.fn().mockImplementation(() => ({ calculateResults })),
  };
});

// Mock MerkleTree
jest.mock('@/lib/audit/merkle-tree', () => ({
  MerkleTree: jest.fn().mockImplementation(() => ({
    addBallots: jest.fn().mockReturnValue(['hash1', 'hash2', 'hash3']),
    getRoot: jest.fn().mockReturnValue('merkle-root-hash'),
    generateReplayData: jest.fn().mockReturnValue({
      algorithm: 'IRV',
      steps: ['step1', 'step2', 'step3'],
      metadata: { totalSteps: 3 }
    })
  })),
  BallotVerificationManager: jest.fn().mockImplementation(() => ({
    createTree: jest.fn().mockReturnValue({
      addBallots: jest.fn().mockReturnValue(['hash1', 'hash2', 'hash3']),
      getRoot: jest.fn().mockReturnValue('merkle-root-hash'),
      generateReplayData: jest.fn().mockReturnValue({
        algorithm: 'IRV',
        steps: ['step1', 'step2', 'step3'],
        metadata: { totalSteps: 3 }
      })
    })
  })),
  snapshotChecksum: jest.fn().mockReturnValue('snapshot-checksum-hash')
}));

describe('FinalizeManager', () => {
  let finalizeManager: FinalizePollManager;
  let mockPoll: Poll;
  let mockBallots: Ballot[];

  beforeEach(() => {
    finalizeManager = new FinalizePollManager(mockSupabaseClient);
    
    mockPoll = {
      id: 'test-poll-123',
      title: 'Test Poll',
      description: 'A test poll for finalization',
      candidates: [
        { id: 'candidate-1', name: 'Candidate 1' },
        { id: 'candidate-2', name: 'Candidate 2' },
        { id: 'candidate-3', name: 'Candidate 3' }
      ],
      closeAt: new Date('2025-01-15T23:59:59Z'),
      allowPostclose: true,
      status: 'active',
      createdAt: new Date('2025-01-01T00:00:00Z'),
      updatedAt: new Date('2025-01-01T00:00:00Z')
    };

    mockBallots = [
      {
        id: 'ballot-1',
        pollId: 'test-poll-123',
        userId: 'user-1',
        ranking: ['candidate-1', 'candidate-2', 'candidate-3'],
        createdAt: new Date('2025-01-01T10:00:00Z'),
        isPostClose: false
      },
      {
        id: 'ballot-2',
        pollId: 'test-poll-123',
        userId: 'user-2',
        ranking: ['candidate-1', 'candidate-3', 'candidate-2'],
        createdAt: new Date('2025-01-01T11:00:00Z'),
        isPostClose: false
      },
      {
        id: 'ballot-3',
        pollId: 'test-poll-123',
        userId: 'user-3',
        ranking: ['candidate-2', 'candidate-1', 'candidate-3'],
        createdAt: new Date('2025-01-01T12:00:00Z'),
        isPostClose: false
      }
    ];

    // Reset mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Poll Finalization', () => {
    it('should finalize poll successfully', async () => {
      // Mock successful poll lookup
      mockSingle.mockResolvedValue({
        data: mockPoll,
        error: null
      });

      // Mock successful ballot retrieval
      mockThenable.then.mockResolvedValue({
        data: mockBallots,
        error: null
      });

      // Mock successful snapshot creation
      mockInsert.mockResolvedValue({
        data: { id: 'snapshot-123' },
        error: null
      });

      // Mock successful poll update
      mockUpdate.mockResolvedValue({
        data: null,
        error: null
      });

      const options: FinalizeOptions = {
        force: false,
        skipValidation: false,
        generateReplayData: true,
        broadcastUpdate: true
      };

      const result = await finalizeManager.finalizePoll('test-poll-123', options);
      
      expect(result.success).toBe(true);
      expect(result.snapshotId).toBe('snapshot-123');
      expect(result.error).toBeUndefined();
      expect(result.metadata.officialBallots).toBe(3);
      expect(result.metadata.postCloseBallots).toBe(0);
      expect(result.metadata.checksum).toBe('snapshot-checksum-hash');
      expect(result.metadata.merkleRoot).toBe('merkle-root-hash');
    });

    it('should handle poll not found', async () => {
      // Mock poll not found
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'Poll not found' }
      });

      const options: FinalizeOptions = {
        force: false,
        skipValidation: false,
        generateReplayData: true,
        broadcastUpdate: true
      };

      const result = await finalizeManager.finalizePoll('nonexistent-poll', options);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Poll not found');
    });

    it('should handle poll already finalized', async () => {
      const finalizedPoll = { ...mockPoll, status: 'closed' as const };
      
      // Mock poll already finalized
      mockSingle.mockResolvedValue({
        data: finalizedPoll,
        error: null
      });

      const options: FinalizeOptions = {
        force: false,
        skipValidation: false,
        generateReplayData: true,
        broadcastUpdate: true
      };

      const result = await finalizeManager.finalizePoll('test-poll-123', options);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Poll is already finalized');
    });

    it('should force finalization when force option is true', async () => {
      const finalizedPoll = { ...mockPoll, status: 'closed' as const };
      
      // Mock poll already finalized
      mockSingle.mockResolvedValue({
        data: finalizedPoll,
        error: null
      });

      // Mock successful ballot retrieval
      mockThenable.then.mockResolvedValue({
        data: mockBallots,
        error: null
      });

      // Mock successful snapshot creation
      mockInsert.mockResolvedValue({
        data: { id: 'snapshot-123' },
        error: null
      });

      // Mock successful poll update
      mockUpdate.mockResolvedValue({
        data: null,
        error: null
      });

      const options: FinalizeOptions = {
        force: true,
        skipValidation: false,
        generateReplayData: true,
        broadcastUpdate: true
      };

      const result = await finalizeManager.finalizePoll('test-poll-123', options);
      
      expect(result.success).toBe(true);
      expect(result.snapshotId).toBe('snapshot-123');
    });

    it('should handle no ballots found', async () => {
      // Mock successful poll lookup
      mockSingle.mockResolvedValue({
        data: mockPoll,
        error: null
      });

      // Mock no ballots found
      mockThenable.then.mockResolvedValue({
        data: [],
        error: null
      });

      const options: FinalizeOptions = {
        force: false,
        skipValidation: false,
        generateReplayData: true,
        broadcastUpdate: true
      };

      const result = await finalizeManager.finalizePoll('test-poll-123', options);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('No ballots found for poll');
    });
  });

  describe('Snapshot Creation', () => {
    it('should create snapshot successfully', async () => {
      // Mock successful snapshot creation
      mockInsert.mockResolvedValue({
        data: { id: 'snapshot-123' },
        error: null
      });

      const snapshot = await finalizeManager.createPollSnapshot('test-poll-123');
      
      expect(snapshot).toBeDefined();
      expect(snapshot.id).toBe('snapshot-123');
    });

    it('should handle snapshot creation error', async () => {
      // Mock snapshot creation error
      mockInsert.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      });

      await expect(finalizeManager.createPollSnapshot('test-poll-123'))
        .rejects.toThrow('Failed to create snapshot');
    });
  });

  describe('Ballot Retrieval', () => {
    it('should retrieve official ballots correctly', async () => {
      // Mock successful ballot retrieval
      mockThenable.then.mockResolvedValue({
        data: mockBallots,
        error: null
      });

      const ballots = await (finalizeManager as any).getOfficialBallots('test-poll-123');
      
      expect(ballots).toEqual(mockBallots);
      expect(ballots).toHaveLength(3);
    });

    it('should retrieve post-close ballots correctly', async () => {
      const postCloseBallots = [
        {
          ...mockBallots[0],
          id: 'ballot-post-1',
          isPostClose: true,
          createdAt: new Date('2025-01-16T10:00:00Z') // After close time
        }
      ];

      // Mock successful post-close ballot retrieval
      mockThenable.then.mockResolvedValue({
        data: postCloseBallots,
        error: null
      });

      const ballots = await (finalizeManager as any).getPostCloseBallots('test-poll-123');
      
      expect(ballots).toEqual(postCloseBallots);
      expect(ballots).toHaveLength(1);
      const firstBallot = ballots[0];
      if (firstBallot) {
        expect(firstBallot.isPostClose).toBe(true);
      }
    });

    it('should handle ballot retrieval error', async () => {
      // Mock ballot retrieval error
      mockThenable.then.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      });

      await expect((finalizeManager as any).getOfficialBallots('test-poll-123'))
        .rejects.toThrow('Failed to retrieve official ballots');
    });
  });

  describe('IRV Results Calculation', () => {
    it('should calculate IRV results correctly', async () => {
      const results = await (finalizeManager as any).calculateIRVResults(mockPoll, mockBallots);
      
      expect(results).toBeDefined();
      expect(results.winner).toBe('candidate-1');
      expect(results.totalVotes).toBe(3);
      expect(results.rounds).toHaveLength(1);
      expect(results.metadata?.algorithm).toBe('IRV');
    });

    it('should handle empty ballots array', async () => {
      const results = await (finalizeManager as any).calculateIRVResults(mockPoll, []);
      
      expect(results).toBeDefined();
      expect(results.totalVotes).toBe(0);
    });

    it('should handle IRV calculation error', async () => {
      // Mock IRVCalculator to throw error
      const { IRVCalculator } = jest.requireMock('@/lib/vote/irv-calculator') as any;
      (IRVCalculator as jest.Mock).mockImplementation(() => ({
        calculateResults: rejectErr(new Error('IRV calculation error')),
      }));

      await expect((finalizeManager as any).calculateIRVResults(mockPoll, mockBallots))
        .rejects.toThrow('Failed to calculate IRV results');
    });
  });

  describe('Checksum Generation', () => {
    it('should generate checksum correctly', async () => {
      const results = {
        winner: 'candidate-1',
        rounds: [],
        totalVotes: 3,
        participationRate: 0.75,
        breakdown: {},
        metadata: { algorithm: 'IRV' }
      };

      const checksum = await (finalizeManager as any).generateSnapshotChecksum(mockPoll, results, mockBallots);
      
      expect(checksum).toBe('snapshot-checksum-hash');
    });

    it('should handle checksum generation error', async () => {
      // Mock snapshotChecksum to throw error
      const { snapshotChecksum } = require('@/lib/audit/merkle-tree');
      snapshotChecksum.mockImplementation(() => {
        throw new Error('Checksum error');
      });

      const results = {
        winner: 'candidate-1',
        rounds: [],
        totalVotes: 3,
        participationRate: 0.75,
        breakdown: {},
        metadata: { algorithm: 'IRV' }
      };

      await expect((finalizeManager as any).generateSnapshotChecksum(mockPoll, results, mockBallots))
        .rejects.toThrow('Failed to generate checksum');
    });
  });

  describe('Merkle Tree Integration', () => {
    it('should create Merkle tree correctly', async () => {
      const tree = await finalizeManager.createMerkleTree('test-poll-123');
      
      expect(tree).toBeDefined();
      expect(tree.getRoot()).toBe('merkle-root-hash');
    });

    it('should handle Merkle tree creation error', async () => {
      // Mock BallotVerificationManager to throw error
      const { BallotVerificationManager } = require('@/lib/audit/merkle-tree');
      BallotVerificationManager.mockImplementation(() => {
        throw new Error('Merkle tree error');
      });

      await expect(finalizeManager.createMerkleTree('test-poll-123'))
        .rejects.toThrow('Failed to create Merkle tree');
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      // Mock Supabase client as unavailable
      (require('@/utils/supabase/server').getSupabaseServerClient as jest.Mock)
        .mockResolvedValue(null as any);

      const options: FinalizeOptions = {
        force: false,
        skipValidation: false,
        generateReplayData: true,
        broadcastUpdate: true
      };

      const result = await finalizeManager.finalizePoll('test-poll-123', options);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Database connection error');
    });

    it('should handle snapshot creation errors gracefully', async () => {
      // Mock successful poll lookup
      mockSingle.mockResolvedValue({
        data: mockPoll,
        error: null
      });

      // Mock successful ballot retrieval
      mockThenable.then.mockResolvedValue({
        data: mockBallots,
        error: null
      });

      // Mock snapshot creation error
      mockInsert.mockResolvedValue({
        data: null,
        error: { message: 'Snapshot creation failed' }
      });

      const options: FinalizeOptions = {
        force: false,
        skipValidation: false,
        generateReplayData: true,
        broadcastUpdate: true
      };

      const result = await finalizeManager.finalizePoll('test-poll-123', options);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to create snapshot');
    });

    it('should handle poll update errors gracefully', async () => {
      // Mock successful poll lookup
      mockSingle.mockResolvedValue({
        data: mockPoll,
        error: null
      });

      // Mock successful ballot retrieval
      mockThenable.then.mockResolvedValue({
        data: mockBallots,
        error: null
      });

      // Mock successful snapshot creation
      mockInsert.mockResolvedValue({
        data: { id: 'snapshot-123' },
        error: null
      });

      // Mock poll update error
      mockUpdate.mockResolvedValue({
        data: null,
        error: { message: 'Poll update failed' }
      });

      const options: FinalizeOptions = {
        force: false,
        skipValidation: false,
        generateReplayData: true,
        broadcastUpdate: true
      };

      const result = await finalizeManager.finalizePoll('test-poll-123', options);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to update poll status');
    });
  });

  describe('Performance', () => {
    it('should finalize poll efficiently', async () => {
      // Mock successful poll lookup
      mockSingle.mockResolvedValue({
        data: mockPoll,
        error: null
      });

      // Mock successful ballot retrieval
      mockThenable.then.mockResolvedValue({
        data: mockBallots,
        error: null
      });

      // Mock successful snapshot creation
      mockInsert.mockResolvedValue({
        data: { id: 'snapshot-123' },
        error: null
      });

      // Mock successful poll update
      mockUpdate.mockResolvedValue({
        data: null,
        error: null
      });

      const options: FinalizeOptions = {
        force: false,
        skipValidation: false,
        generateReplayData: true,
        broadcastUpdate: true
      };

      const startTime = Date.now();
      const result = await finalizeManager.finalizePoll('test-poll-123', options);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(1000); // Should complete in under 1 second
    });
  });
});
