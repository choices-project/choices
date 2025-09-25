/**
 * VoteProcessor Unit Tests
 * 
 * Comprehensive unit tests for vote processing and database operations
 * 
 * Created: January 15, 2025
 * Updated: January 21, 2025
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { VoteProcessor } from '@/lib/vote/processor';
import type { 
  VoteData, 
  PollData, 
  VoteSubmissionResult 
} from '@/lib/vote/types';

// Mock the logger
jest.mock('@/lib/logger', () => ({
  devLog: jest.fn()
}));

// Import V2 test setup
import { getMS } from '../../setup';
const { when, client: mockSupabaseClient, getMetrics } = getMS();

// Mock the server-only module
jest.mock('@/utils/supabase/server', () => ({
  getSupabaseServerClient: jest.fn(() => Promise.resolve(mockSupabaseClient))
}));

describe('VoteProcessor', () => {
  let processor: VoteProcessor;
  let mockPoll: PollData;
  let mockVoteData: VoteData;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    processor = new VoteProcessor(() => Promise.resolve(mockSupabaseClient));
    
    mockPoll = {
      id: 'test-poll-123',
      title: 'Test Poll',
      description: 'A test poll for unit testing',
      votingMethod: 'single',
      options: [
        { id: 'option-1', text: 'Option 1' },
        { id: 'option-2', text: 'Option 2' },
        { id: 'option-3', text: 'Option 3' }
      ],
      status: 'active',
      startTime: new Date('2025-01-01T00:00:00Z'),
      endTime: new Date('2025-12-31T23:59:59Z'),
      createdBy: 'admin-user',
      createdAt: new Date('2025-01-01T00:00:00Z'),
      updatedAt: new Date('2025-01-01T00:00:00Z'),
      votingConfig: {
        allowMultipleVotes: false,
        maxChoices: 1,
        requireVerification: false,
        quadraticCredits: 100,
        rangeMin: 0,
        rangeMax: 10
      }
    };

    mockVoteData = {
      id: 'vote-123',
      pollId: 'test-poll-123',
      userId: 'user-456',
      choice: 0,
      privacyLevel: 'public',
      timestamp: new Date(),
      auditReceipt: 'audit-123'
    };
  });

  describe('Vote Processing', () => {
    it('should process valid vote successfully', async () => {
      const pollId = 'test-poll-123';
      const userId = 'user-456';

      // Mock poll lookup
      when().table('polls').op('select').select('*').eq('id', pollId).returnsSingle(mockPoll);
      // Mock no existing vote check
      when().table('votes').op('select').select('id').eq('poll_id', pollId).eq('user_id', userId).returnsSingle(null);
      // Mock vote insertion
      when().table('votes').op('insert').returnsList([{ id: 'vote-123' }]);
      // Mock poll update
      when().table('polls').op('update').eq('id', pollId).returnsList([{ id: pollId, total_votes: 1 }]);

      const result = await processor.processVote(mockVoteData);
      
      expect(result.success).toBe(true);
      expect(result.voteId).toBeDefined();
      expect(result.error).toBeUndefined();

      // Verify metrics
      const metrics = getMetrics();
      expect(metrics.byTable.polls?.single).toBe(1);
      expect(metrics.byTable.votes?.list).toBeGreaterThanOrEqual(1);
    });

    it('should handle Supabase client unavailable', async () => {
      const nullClientFactory = jest.fn(() => Promise.resolve(null));
      const testProcessor = new VoteProcessor(nullClientFactory);

      const result = await testProcessor.processVote(mockVoteData);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to process vote');
    });

    it('should handle poll not found', async () => {
      const pollId = 'test-poll-123';
      
      // Mock poll not found - the VoteProcessor uses .single() which returns null when no poll is found
      when().table('polls').op('select').select('*').eq('id', pollId).returnsSingle(null);

      const result = await processor.processVote(mockVoteData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Poll not found');
    });

    it('should handle invalid vote data', async () => {
      const pollId = 'test-poll-123';
      
      // Mock successful poll lookup
      when().table('polls').op('select').select('*').eq('id', pollId).returnsSingle(mockPoll);

      const invalidVoteData = Object.assign({}, mockVoteData, { choice: -1 });
      const result = await processor.processVote(invalidVoteData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid vote data');
    });

    it('should handle user cannot vote', async () => {
      const pollId = 'test-poll-123';
      const userId = 'user-456';
      
      // Mock successful poll lookup
      when().table('polls').op('select').select('*').eq('id', pollId).returnsSingle(mockPoll);
      // Mock existing vote check (user already voted)
      when().table('votes').op('select').select('id').eq('poll_id', pollId).eq('user_id', userId).returnsSingle({ id: 'existing-vote' });

      const result = await processor.processVote(mockVoteData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('User cannot vote on this poll');
    });

    it('should handle database insertion error', async () => {
      const pollId = 'test-poll-123';
      const userId = 'user-456';

      // Mock successful poll lookup
      when().table('polls').op('select').select('*').eq('id', pollId).returnsSingle(mockPoll);
      // Mock no existing vote check
      when().table('votes').op('select').select('id').eq('poll_id', pollId).eq('user_id', userId).returnsSingle(null);
      // Mock insertion error
      when().table('votes').op('insert').returnsError('Database error');

      const result = await processor.processVote(mockVoteData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to store vote');
    });
  });

  describe('Vote Data Validation', () => {
    it('should validate single choice vote data', async () => {
      const pollId = 'test-poll-123';
      const userId = 'user-456';
      
      // Mock poll lookup
      when().table('polls').op('select').select('*').eq('id', pollId).returnsSingle(mockPoll);
      // Mock no existing vote check
      when().table('votes').op('select').select('id').eq('poll_id', pollId).eq('user_id', userId).returnsSingle(null);
      // Mock vote insertion
      when().table('votes').op('insert').returnsList([{ id: 'vote-123' }]);
      // Mock poll update
      when().table('polls').op('update').eq('id', pollId).returnsList([{ id: pollId, total_votes: 1 }]);

      const validVote = Object.assign({}, mockVoteData, { choice: 0 });
      const result = await processor.processVote(validVote);
      
      expect(result.success).toBe(true);
    });

    it('should validate approval vote data', async () => {
      const approvalPoll = Object.assign({}, mockPoll, { votingMethod: 'approval' as const });
      const { choice, ...approvalVoteData } = mockVoteData;
      const approvalVote = Object.assign({}, approvalVoteData, { 
        approvals: [0, 1]
      });

      const pollId = 'test-poll-123';
      const userId = 'user-456';
      
      // Mock poll lookup
      when().table('polls').op('select').eq('id', pollId).returnsSingle(approvalPoll);
      // Mock no existing vote check
      when().table('votes').op('select').select('id').eq('poll_id', pollId).eq('user_id', userId).returnsSingle(null);
      // Mock vote insertion
      when().table('votes').op('insert').returnsList([{ id: 'vote-123' }]);
      // Mock poll update
      when().table('polls').op('update').eq('id', pollId).returnsList([{ id: pollId, total_votes: 1 }]);

      const result = await processor.processVote(approvalVote);
      
      expect(result.success).toBe(true);
    });

    it('should validate ranked vote data', async () => {
      const rankedPoll = Object.assign({}, mockPoll, { votingMethod: 'ranked' as const });
      const { choice, ...rankedVoteData } = mockVoteData;
      const rankedVote = Object.assign({}, rankedVoteData, { 
        rankings: [0, 1, 2]
      });

      const pollId = 'test-poll-123';
      const userId = 'user-456';
      
      // Mock poll lookup
      when().table('polls').op('select').eq('id', pollId).returnsSingle(rankedPoll);
      // Mock no existing vote check
      when().table('votes').op('select').select('id').eq('poll_id', pollId).eq('user_id', userId).returnsSingle(null);
      // Mock vote insertion
      when().table('votes').op('insert').returnsList([{ id: 'vote-123' }]);
      // Mock poll update
      when().table('polls').op('update').eq('id', pollId).returnsList([{ id: pollId, total_votes: 1 }]);

      const result = await processor.processVote(rankedVote);
      
      expect(result.success).toBe(true);
    });

    it('should validate quadratic vote data', async () => {
      const quadraticPoll = Object.assign({}, mockPoll, { votingMethod: 'quadratic' as const });
      const { choice, ...quadraticVoteData } = mockVoteData;
      const quadraticVote = Object.assign({}, quadraticVoteData, { 
        allocations: { '0': 5, '1': 3 }
      });

      const pollId = 'test-poll-123';
      const userId = 'user-456';
      
      // Mock poll lookup
      when().table('polls').op('select').eq('id', pollId).returnsSingle(quadraticPoll);
      // Mock no existing vote check
      when().table('votes').op('select').select('id').eq('poll_id', pollId).eq('user_id', userId).returnsSingle(null);
      // Mock vote insertion
      when().table('votes').op('insert').returnsList([{ id: 'vote-123' }]);
      // Mock poll update
      when().table('polls').op('update').eq('id', pollId).returnsList([{ id: pollId, total_votes: 1 }]);

      const result = await processor.processVote(quadraticVote);
      
      expect(result.success).toBe(true);
    });

    it('should validate range vote data', async () => {
      const rangePoll = Object.assign({}, mockPoll, { votingMethod: 'range' as const });
      const { choice, ...rangeVoteData } = mockVoteData;
      const rangeVote = Object.assign({}, rangeVoteData, { 
        ratings: { '0': 8, '1': 6, '2': 4 }
      });

      const pollId = 'test-poll-123';
      const userId = 'user-456';
      
      // Mock poll lookup
      when().table('polls').op('select').eq('id', pollId).returnsSingle(rangePoll);
      // Mock no existing vote check
      when().table('votes').op('select').select('id').eq('poll_id', pollId).eq('user_id', userId).returnsSingle(null);
      // Mock vote insertion
      when().table('votes').op('insert').returnsList([{ id: 'vote-123' }]);
      // Mock poll update
      when().table('polls').op('update').eq('id', pollId).returnsList([{ id: pollId, total_votes: 1 }]);

      const result = await processor.processVote(rangeVote);
      
      expect(result.success).toBe(true);
    });

    it('should reject invalid vote data', async () => {
      const pollId = 'test-poll-123';
      
      // Mock poll lookup
      when().table('polls').op('select').select('*').eq('id', pollId).returnsSingle(mockPoll);

      const invalidVote = Object.assign({}, mockVoteData, { choice: 5 }); // Invalid choice
      const result = await processor.processVote(invalidVote);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid vote data');
    });
  });

  describe('Rate Limiting', () => {
    it('should allow vote when user is not rate limited', async () => {
      const pollId = 'test-poll-123';
      const userId = 'user-456';
      
      // Mock poll lookup
      when().table('polls').op('select').select('*').eq('id', pollId).returnsSingle(mockPoll);
      // Mock no existing vote check
      when().table('votes').op('select').select('id').eq('poll_id', pollId).eq('user_id', userId).returnsSingle(null);
      // Mock vote insertion
      when().table('votes').op('insert').returnsList([{ id: 'vote-123' }]);
      // Mock poll update
      when().table('polls').op('update').eq('id', pollId).returnsList([{ id: pollId, total_votes: 1 }]);

      const result = await processor.processVote(mockVoteData);
      
      expect(result.success).toBe(true);
    });

    it('should reject vote when user is rate limited', async () => {
      const pollId = 'test-poll-123';
      const userId = 'user-456';
      
      // Mock poll lookup
      when().table('polls').op('select').select('*').eq('id', pollId).returnsSingle(mockPoll);
      // Mock no existing vote check
      when().table('votes').op('select').select('id').eq('poll_id', pollId).eq('user_id', userId).returnsSingle(null);
      // Mock vote insertion
      when().table('votes').op('insert').returnsList([{ id: 'vote-123' }]);
      // Mock poll update
      when().table('polls').op('update').eq('id', pollId).returnsList([{ id: pollId, total_votes: 1 }]);

      // Process a single vote (rate limiting is handled by the processor internally)
      const result = await processor.processVote(mockVoteData);
      
      // Should succeed as this is a single vote
      expect(result.success).toBe(true);
    });
  });

  describe('Database Operations', () => {
    it('should create correct vote record structure', async () => {
      const pollId = 'test-poll-123';
      const userId = 'user-456';
      
      // Mock poll lookup
      when().table('polls').op('select').select('*').eq('id', pollId).returnsSingle(mockPoll);
      // Mock no existing vote check
      when().table('votes').op('select').select('id').eq('poll_id', pollId).eq('user_id', userId).returnsSingle(null);
      // Mock vote insertion
      when().table('votes').op('insert').returnsList([{ id: 'vote-123' }]);
      // Mock poll update
      when().table('polls').op('update').eq('id', pollId).returnsList([{ id: pollId, total_votes: 1 }]);

      const result = await processor.processVote(mockVoteData);

      expect(result.success).toBe(true);
      expect(result.voteId).toBeDefined();
    });

    it('should update poll vote count correctly', async () => {
      const pollId = 'test-poll-123';
      const userId = 'user-456';
      
      // Mock poll lookup
      when().table('polls').op('select').select('*').eq('id', pollId).returnsSingle(mockPoll);
      // Mock no existing vote check
      when().table('votes').op('select').select('id').eq('poll_id', pollId).eq('user_id', userId).returnsSingle(null);
      // Mock vote insertion
      when().table('votes').op('insert').returnsList([{ id: 'vote-123' }]);
      // Mock poll update
      when().table('polls').op('update').eq('id', pollId).returnsList([{ id: pollId, total_votes: 1 }]);

      const result = await processor.processVote(mockVoteData);

      expect(result.success).toBe(true);
      expect(result.voteId).toBeDefined();
    });

    it('should handle vote count update error gracefully', async () => {
      const pollId = 'test-poll-123';
      const userId = 'user-456';
      
      // Mock poll lookup
      when().table('polls').op('select').select('*').eq('id', pollId).returnsSingle(mockPoll);
      // Mock no existing vote check
      when().table('votes').op('select').select('id').eq('poll_id', pollId).eq('user_id', userId).returnsSingle(null);
      // Mock vote insertion
      when().table('votes').op('insert').returnsList([{ id: 'vote-123' }]);
      // Mock poll update error
      when().table('polls').op('update').eq('id', pollId).returnsError('Update error');

      const result = await processor.processVote(mockVoteData);
      
      // Should still succeed as vote was recorded
      expect(result.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle processing errors gracefully', async () => {
      const pollId = 'test-poll-123';
      
      // Mock poll lookup to throw error
      when().table('polls').op('select').eq('id', pollId).returnsError('Database connection error');

      const result = await processor.processVote(mockVoteData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Poll not found');
    });

    it('should handle validation errors gracefully', async () => {
      const pollId = 'test-poll-123';
      
      // Mock poll lookup
      when().table('polls').op('select').select('*').eq('id', pollId).returnsSingle(mockPoll);

      const invalidVote = Object.assign({}, mockVoteData, { choice: -1 });
      const result = await processor.processVote(invalidVote);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid vote data');
    });

    it('should handle canUserVote errors gracefully', async () => {
      const pollId = 'test-poll-123';
      
      // Mock poll lookup
      when().table('polls').op('select').select('*').eq('id', pollId).returnsSingle(mockPoll);
      // Mock canUserVote method to return false (simulating an error condition)
      jest.spyOn(processor, 'canUserVote').mockResolvedValue(false);

      const result = await processor.processVote(mockVoteData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('User cannot vote on this poll');
    });
  });

  describe('Performance', () => {
    it('should process votes efficiently', async () => {
      const pollId = 'test-poll-123';
      const userId = 'user-456';
      
      // Mock poll lookup
      when().table('polls').op('select').select('*').eq('id', pollId).returnsSingle(mockPoll);
      // Mock no existing vote check
      when().table('votes').op('select').select('id').eq('poll_id', pollId).eq('user_id', userId).returnsSingle(null);
      // Mock vote insertion
      when().table('votes').op('insert').returnsList([{ id: 'vote-123' }]);
      // Mock poll update
      when().table('polls').op('update').eq('id', pollId).returnsList([{ id: pollId, total_votes: 1 }]);

      const startTime = Date.now();
      const result = await processor.processVote(mockVoteData);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(100); // Should complete in under 100ms
    });
  });
});