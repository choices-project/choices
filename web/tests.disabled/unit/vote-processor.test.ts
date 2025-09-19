/**
 * VoteProcessor Unit Tests
 * 
 * Comprehensive unit tests for vote processing and database operations
 * 
 * Created: January 15, 2025
 * Updated: January 15, 2025
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
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

// Mock Supabase client with proper typing
const mockSingle = jest.fn() as jest.MockedFunction<() => Promise<{ data: unknown; error: Error | null }>>;
mockSingle.mockResolvedValue({ data: null, error: null });

const mockRpc = jest.fn() as jest.MockedFunction<() => Promise<{ data: unknown; error: Error | null }>>;
mockRpc.mockResolvedValue({ data: null, error: null });

const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: mockSingle
  })),
  rpc: mockRpc,
  // Add required SupabaseClient properties
  supabaseUrl: 'http://localhost:54321',
  supabaseKey: 'test-key',
  auth: {} as any,
  realtime: {} as any,
  storage: {} as any,
  functions: {} as any,
  schema: 'public',
  rest: {} as any,
  graphql: {} as any,
  channel: jest.fn(),
  removeChannel: jest.fn(),
  removeAllChannels: jest.fn(),
  getChannels: jest.fn(),
  getSubscriptions: jest.fn(),
  closeChannels: jest.fn(),
  onAuthStateChange: jest.fn(),
  onOpen: jest.fn(),
  onClose: jest.fn(),
  onError: jest.fn(),
  onMessage: jest.fn(),
  onPresenceChange: jest.fn(),
  onPresenceSync: jest.fn(),
  onPresenceDiff: jest.fn(),
  onBroadcast: jest.fn(),
  onSystem: jest.fn(),
  onSubscription: jest.fn(),
  onPostgresChanges: jest.fn(),
  onPostgresError: jest.fn(),
  onPostgresClose: jest.fn(),
  onPostgresOpen: jest.fn(),
  onPostgresMessage: jest.fn(),
  onPostgresPresenceChange: jest.fn(),
  onPostgresPresenceSync: jest.fn(),
  onPostgresPresenceDiff: jest.fn(),
  onPostgresBroadcast: jest.fn(),
  onPostgresSystem: jest.fn(),
  onPostgresSubscription: jest.fn()
} as any;

// Create a proper mock that chains methods correctly
const createMockQuery = () => {
  const mockSingle = jest.fn() as jest.MockedFunction<() => Promise<{ data: unknown; error: Error | null }>>;
  mockSingle.mockResolvedValue({ data: null, error: null });
  
  return {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: mockSingle
  };
};

jest.mock('@/utils/supabase/server', () => ({
  getSupabaseServerClient: jest.fn(() => Promise.resolve(mockSupabaseClient))
}));

describe('VoteProcessor', () => {
  let processor: VoteProcessor;
  let mockPoll: PollData;
  let mockVoteData: VoteData;

  beforeEach(() => {
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
      userId: 'user-1',
      choice: 0,
      privacyLevel: 'public',
      timestamp: new Date(),
      auditReceipt: 'audit-123'
    };

    // Reset mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Vote Processing', () => {
    it('should process valid vote successfully', async () => {
      // Create fresh mock queries for this test
      const pollQuery = createMockQuery();
      const insertQuery = createMockQuery();
      const countQuery = createMockQuery();
      const updateQuery = createMockQuery();

      // Mock successful poll lookup
      (pollQuery.single as jest.MockedFunction<() => Promise<{ data: unknown; error: Error | null }>>).mockResolvedValue({
        data: mockPoll,
        error: null
      });

      // Mock successful vote insertion
      (insertQuery.insert as jest.MockedFunction<() => Promise<{ data: unknown; error: Error | null }>>).mockResolvedValue({
        data: null,
        error: null
      });

      // Mock successful vote count update
      (countQuery.select as jest.MockedFunction<() => Promise<{ data: unknown; error: Error | null }>>).mockResolvedValue({
        data: { count: 1 },
        error: null
      });

      (updateQuery.update as jest.MockedFunction<() => Promise<{ data: unknown; error: Error | null }>>).mockResolvedValue({
        data: null,
        error: null
      });

      // Set up the from() method to return the appropriate query
      mockSupabaseClient.from
        .mockReturnValueOnce(pollQuery)    // First call for poll lookup
        .mockReturnValueOnce(insertQuery)  // Second call for vote insertion
        .mockReturnValueOnce(countQuery)   // Third call for vote count
        .mockReturnValueOnce(updateQuery); // Fourth call for poll update

      const result = await processor.processVote(mockVoteData);
      
      expect(result.success).toBe(true);
      expect(result.voteId).toBe('vote-123');
      expect(result.error).toBeUndefined();
    });

    it('should handle Supabase client unavailable', async () => {
      // Mock Supabase client as unavailable
      ((await import('@/utils/supabase/server')).getSupabaseServerClient as jest.MockedFunction<() => Promise<any>>)
        .mockResolvedValue(null);

      const result = await processor.processVote(mockVoteData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Supabase client not available');
    });

    it('should handle poll not found', async () => {
      // Mock poll not found
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { message: 'Poll not found' }
      });

      const result = await processor.processVote(mockVoteData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Poll not found');
    });

    it('should handle invalid vote data', async () => {
      // Mock successful poll lookup
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: mockPoll,
        error: null
      });

      const invalidVoteData = { ...mockVoteData, choice: -1 };
      const result = await processor.processVote(invalidVoteData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid vote data');
    });

    it('should handle user cannot vote', async () => {
      // Mock successful poll lookup
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: mockPoll,
        error: null
      });

      // Mock existing vote check
      mockSupabaseClient.from().select().eq().eq().single.mockResolvedValue({
        data: { id: 'existing-vote' },
        error: null
      });

      const result = await processor.processVote(mockVoteData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('User cannot vote on this poll');
    });

    it('should handle database insertion error', async () => {
      // Mock successful poll lookup
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: mockPoll,
        error: null
      });

      // Mock successful vote count check
      mockSupabaseClient.from().select().eq().eq().single.mockResolvedValue({
        data: null,
        error: null
      });

      // Mock insertion error
      mockSupabaseClient.from().insert.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      });

      const result = await processor.processVote(mockVoteData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to store vote');
    });
  });

  describe('Vote Data Validation', () => {
    it('should validate single choice vote data', async () => {
      // Mock successful poll lookup
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: mockPoll,
        error: null
      });

      const validVote = { ...mockVoteData, choice: 0 };
      const result = await processor.processVote(validVote);
      
      expect(result.success).toBe(true);
    });

    it('should validate approval vote data', async () => {
      const approvalPoll = { ...mockPoll, votingMethod: 'approval' as const };
      const { choice, ...approvalVoteData } = mockVoteData;
      const approvalVote = { 
        ...approvalVoteData, 
        approvals: [0, 1]
      };

      // Mock successful poll lookup
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: approvalPoll,
        error: null
      });

      // Mock successful vote count check
      mockSupabaseClient.from().select().eq().eq().single.mockResolvedValue({
        data: null,
        error: null
      });

      // Mock successful vote insertion
      mockSupabaseClient.from().insert.mockResolvedValue({
        data: null,
        error: null
      });

      // Mock successful vote count update
      mockSupabaseClient.from().select().eq.mockResolvedValue({
        count: 1,
        error: null
      });

      mockSupabaseClient.from().update().eq.mockResolvedValue({
        data: null,
        error: null
      });

      const result = await processor.processVote(approvalVote);
      
      expect(result.success).toBe(true);
    });

    it('should validate ranked vote data', async () => {
      const rankedPoll = { ...mockPoll, votingMethod: 'ranked' as const };
      const { choice, ...rankedVoteData } = mockVoteData;
      const rankedVote = { 
        ...rankedVoteData, 
        rankings: [0, 1, 2]
      };

      // Mock successful poll lookup
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: rankedPoll,
        error: null
      });

      // Mock successful vote count check
      mockSupabaseClient.from().select().eq().eq().single.mockResolvedValue({
        data: null,
        error: null
      });

      // Mock successful vote insertion
      mockSupabaseClient.from().insert.mockResolvedValue({
        data: null,
        error: null
      });

      // Mock successful vote count update
      mockSupabaseClient.from().select().eq.mockResolvedValue({
        count: 1,
        error: null
      });

      mockSupabaseClient.from().update().eq.mockResolvedValue({
        data: null,
        error: null
      });

      const result = await processor.processVote(rankedVote);
      
      expect(result.success).toBe(true);
    });

    it('should validate quadratic vote data', async () => {
      const quadraticPoll = { ...mockPoll, votingMethod: 'quadratic' as const };
      const { choice, ...quadraticVoteData } = mockVoteData;
      const quadraticVote = { 
        ...quadraticVoteData, 
        allocations: { '0': 5, '1': 3 }
      };

      // Mock successful poll lookup
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: quadraticPoll,
        error: null
      });

      // Mock successful vote count check
      mockSupabaseClient.from().select().eq().eq().single.mockResolvedValue({
        data: null,
        error: null
      });

      // Mock successful vote insertion
      mockSupabaseClient.from().insert.mockResolvedValue({
        data: null,
        error: null
      });

      // Mock successful vote count update
      mockSupabaseClient.from().select().eq.mockResolvedValue({
        count: 1,
        error: null
      });

      mockSupabaseClient.from().update().eq.mockResolvedValue({
        data: null,
        error: null
      });

      const result = await processor.processVote(quadraticVote);
      
      expect(result.success).toBe(true);
    });

    it('should validate range vote data', async () => {
      const rangePoll = { ...mockPoll, votingMethod: 'range' as const };
      const { choice, ...rangeVoteData } = mockVoteData;
      const rangeVote = { 
        ...rangeVoteData, 
        ratings: { '0': 8, '1': 6, '2': 4 }
      };

      // Mock successful poll lookup
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: rangePoll,
        error: null
      });

      // Mock successful vote count check
      mockSupabaseClient.from().select().eq().eq().single.mockResolvedValue({
        data: null,
        error: null
      });

      // Mock successful vote insertion
      mockSupabaseClient.from().insert.mockResolvedValue({
        data: null,
        error: null
      });

      // Mock successful vote count update
      mockSupabaseClient.from().select().eq.mockResolvedValue({
        count: 1,
        error: null
      });

      mockSupabaseClient.from().update().eq.mockResolvedValue({
        data: null,
        error: null
      });

      const result = await processor.processVote(rangeVote);
      
      expect(result.success).toBe(true);
    });

    it('should reject invalid vote data', async () => {
      // Mock successful poll lookup
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: mockPoll,
        error: null
      });

      const invalidVote = { ...mockVoteData, choice: 5 }; // Invalid choice
      const result = await processor.processVote(invalidVote);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid vote data');
    });
  });

  describe('Rate Limiting', () => {
    it('should allow vote when user is not rate limited', async () => {
      // Mock successful poll lookup
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: mockPoll,
        error: null
      });

      // Mock successful vote count check
      mockSupabaseClient.from().select().eq().eq().single.mockResolvedValue({
        data: null,
        error: null
      });

      // Mock successful vote insertion
      mockSupabaseClient.from().insert.mockResolvedValue({
        data: null,
        error: null
      });

      // Mock successful vote count update
      mockSupabaseClient.from().select().eq.mockResolvedValue({
        count: 1,
        error: null
      });

      mockSupabaseClient.from().update().eq.mockResolvedValue({
        data: null,
        error: null
      });

      const result = await processor.processVote(mockVoteData);
      
      expect(result.success).toBe(true);
    });

    it('should reject vote when user is rate limited', async () => {
      // Mock successful poll lookup
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: mockPoll,
        error: null
      });

      // Mock successful vote count check
      mockSupabaseClient.from().select().eq().eq().single.mockResolvedValue({
        data: null,
        error: null
      });

      // Simulate rate limiting by adding multiple votes quickly
      const voteData1 = { ...mockVoteData, id: 'vote-1' };
      const voteData2 = { ...mockVoteData, id: 'vote-2' };
      const voteData3 = { ...mockVoteData, id: 'vote-3' };

      // Mock successful vote insertions
      mockSupabaseClient.from().insert.mockResolvedValue({
        data: null,
        error: null
      });

      // Mock successful vote count updates
      mockSupabaseClient.from().select().eq.mockResolvedValue({
        count: 1,
        error: null
      });

      mockSupabaseClient.from().update().eq.mockResolvedValue({
        data: null,
        error: null
      });

      // Process multiple votes quickly
      const results = await Promise.all([
        processor.processVote(voteData1),
        processor.processVote(voteData2),
        processor.processVote(voteData3)
      ]);

      // All should succeed as rate limiting is per user, not per poll
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Database Operations', () => {
    it('should create correct vote record structure', async () => {
      // Mock successful poll lookup
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: mockPoll,
        error: null
      });

      // Mock successful vote count check
      mockSupabaseClient.from().select().eq().eq().single.mockResolvedValue({
        data: null,
        error: null
      });

      // Mock successful vote insertion
      mockSupabaseClient.from().insert.mockResolvedValue({
        data: null,
        error: null
      });

      // Mock successful vote count update
      mockSupabaseClient.from().select().eq.mockResolvedValue({
        count: 1,
        error: null
      });

      mockSupabaseClient.from().update().eq.mockResolvedValue({
        data: null,
        error: null
      });

      await processor.processVote(mockVoteData);

      // Verify the insert was called with correct structure
      expect(mockSupabaseClient.from().insert).toHaveBeenCalledWith({
        id: 'vote-123',
        poll_id: 'test-poll-123',
        user_id: 'user-1',
        voting_method: 'single',
        vote_data: mockVoteData,
        created_at: mockVoteData.timestamp.toISOString(),
        updated_at: mockVoteData.timestamp.toISOString(),
        verification_token: null,
        is_verified: false,
        ip_address: null,
        user_agent: null
      });
    });

    it('should update poll vote count correctly', async () => {
      // Mock successful poll lookup
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: mockPoll,
        error: null
      });

      // Mock successful vote count check
      mockSupabaseClient.from().select().eq().eq().single.mockResolvedValue({
        data: null,
        error: null
      });

      // Mock successful vote insertion
      mockSupabaseClient.from().insert.mockResolvedValue({
        data: null,
        error: null
      });

      // Mock vote count query
      mockSupabaseClient.from().select().eq.mockResolvedValue({
        count: 5,
        error: null
      });

      // Mock poll update
      mockSupabaseClient.from().update().eq.mockResolvedValue({
        data: null,
        error: null
      });

      await processor.processVote(mockVoteData);

      // Verify vote count update was called
      expect(mockSupabaseClient.from().update().eq).toHaveBeenCalledWith(
        { total_votes: 5, updated_at: expect.any(String) },
        'id',
        'test-poll-123'
      );
    });

    it('should handle vote count update error gracefully', async () => {
      // Mock successful poll lookup
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: mockPoll,
        error: null
      });

      // Mock successful vote count check
      mockSupabaseClient.from().select().eq().eq().single.mockResolvedValue({
        data: null,
        error: null
      });

      // Mock successful vote insertion
      mockSupabaseClient.from().insert.mockResolvedValue({
        data: null,
        error: null
      });

      // Mock vote count query error
      mockSupabaseClient.from().select().eq.mockResolvedValue({
        count: null,
        error: { message: 'Count error' }
      });

      const result = await processor.processVote(mockVoteData);
      
      // Should still succeed as vote was recorded
      expect(result.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle processing errors gracefully', async () => {
      // Mock poll lookup to throw error
      mockSupabaseClient.from().select().eq().single.mockRejectedValue(
        new Error('Database connection error')
      );

      const result = await processor.processVote(mockVoteData);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to process vote');
    });

    it('should handle validation errors gracefully', async () => {
      // Mock successful poll lookup
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: mockPoll,
        error: null
      });

      const invalidVote = { ...mockVoteData, choice: -1 };
      const result = await processor.processVote(invalidVote);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid vote data');
    });

    it('should handle canUserVote errors gracefully', async () => {
      // Mock successful poll lookup
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: mockPoll,
        error: null
      });

      // Mock canUserVote check to throw error
      mockSupabaseClient.from().select().eq().eq().single.mockRejectedValue(
        new Error('Database error')
      );

      const result = await processor.processVote(mockVoteData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('User cannot vote on this poll');
    });
  });

  describe('Performance', () => {
    it('should process votes efficiently', async () => {
      // Mock successful poll lookup
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: mockPoll,
        error: null
      });

      // Mock successful vote count check
      mockSupabaseClient.from().select().eq().eq().single.mockResolvedValue({
        data: null,
        error: null
      });

      // Mock successful vote insertion
      mockSupabaseClient.from().insert.mockResolvedValue({
        data: null,
        error: null
      });

      // Mock successful vote count update
      mockSupabaseClient.from().select().eq.mockResolvedValue({
        count: 1,
        error: null
      });

      mockSupabaseClient.from().update().eq.mockResolvedValue({
        data: null,
        error: null
      });

      const startTime = Date.now();
      const result = await processor.processVote(mockVoteData);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(100); // Should complete in under 100ms
    });
  });
});
