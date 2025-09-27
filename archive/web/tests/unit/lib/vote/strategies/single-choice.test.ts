/**
 * Single Choice Voting Strategy Unit Tests
 * 
 * Tests the single choice voting strategy including:
 * - Vote validation
 * - Vote processing
 * - Results calculation
 * - Error handling
 * 
 * Created: 2025-09-27
 */

import { SingleChoiceStrategy } from '@/lib/vote/strategies/single-choice';
import type { VoteRequest, PollData, VoteData, ResultsData } from '@/lib/vote/types';

describe('SingleChoiceStrategy', () => {
  let strategy: SingleChoiceStrategy;
  let mockPoll: PollData;
  let mockVoteRequest: VoteRequest;

  beforeEach(() => {
    strategy = new SingleChoiceStrategy();
    
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
      },
      privacyLevel: 'public',
      total_votes: 0,
      participation: 0,
      sponsors: [],
      is_mock: false
    };

    mockVoteRequest = {
      pollId: 'test-poll-123',
      userId: 'user-456',
      voteData: { choice: 0 },
      privacyLevel: 'public'
    };
  });

  describe('getVotingMethod', () => {
    it('should return single voting method', () => {
      expect(strategy.getVotingMethod()).toBe('single');
    });
  });

  describe('validateVote', () => {
    it('should validate a valid single choice vote', async () => {
      const validation = await strategy.validateVote(mockVoteRequest, mockPoll);
      
      expect(validation.isValid).toBe(true);
      expect(validation.error).toBeUndefined();
      expect(validation.requiresAuthentication).toBe(true);
      expect(validation.requiresTokens).toBe(false);
    });

    it('should reject vote with missing choice', async () => {
      const invalidRequest = { ...mockVoteRequest, voteData: {} };
      const validation = await strategy.validateVote(invalidRequest, mockPoll);
      
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('Choice is required for single-choice voting');
    });

    it('should reject vote with null choice', async () => {
      const invalidRequest = { ...mockVoteRequest, voteData: { choice: null } };
      const validation = await strategy.validateVote(invalidRequest, mockPoll);
      
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('Choice is required for single-choice voting');
    });

    it('should reject vote with undefined choice', async () => {
      const invalidRequest = { ...mockVoteRequest, voteData: { choice: undefined } };
      const validation = await strategy.validateVote(invalidRequest, mockPoll);
      
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('Choice is required for single-choice voting');
    });

    it('should reject vote with non-integer choice', async () => {
      const invalidRequest = { ...mockVoteRequest, voteData: { choice: 1.5 } };
      const validation = await strategy.validateVote(invalidRequest, mockPoll);
      
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('Choice must be a valid integer');
    });

    it('should reject vote with non-number choice', async () => {
      const invalidRequest = { ...mockVoteRequest, voteData: { choice: 'invalid' } };
      const validation = await strategy.validateVote(invalidRequest, mockPoll);
      
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('Choice must be a valid integer');
    });

    it('should reject vote with negative choice', async () => {
      const invalidRequest = { ...mockVoteRequest, voteData: { choice: -1 } };
      const validation = await strategy.validateVote(invalidRequest, mockPoll);
      
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('Choice must be a valid option index');
    });

    it('should reject vote with choice out of range', async () => {
      const invalidRequest = { ...mockVoteRequest, voteData: { choice: 10 } };
      const validation = await strategy.validateVote(invalidRequest, mockPoll);
      
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('Choice must be a valid option index');
    });

    it('should accept vote with valid choice', async () => {
      const validRequest = { ...mockVoteRequest, voteData: { choice: 1 } };
      const validation = await strategy.validateVote(validRequest, mockPoll);
      
      expect(validation.isValid).toBe(true);
      expect(validation.error).toBeUndefined();
    });

    it('should accept vote with last valid choice', async () => {
      const validRequest = { ...mockVoteRequest, voteData: { choice: 2 } };
      const validation = await strategy.validateVote(validRequest, mockPoll);
      
      expect(validation.isValid).toBe(true);
      expect(validation.error).toBeUndefined();
    });
  });

  describe('processVote', () => {
    it('should process a valid single choice vote', async () => {
      const result = await strategy.processVote(mockVoteRequest, mockPoll);
      
      expect(result.success).toBe(true);
      expect(result.voteId).toBeDefined();
      expect(result.voteData).toEqual({ choice: 0 });
      expect(result.timestamp).toBeDefined();
    });

    it('should generate unique vote IDs', async () => {
      const result1 = await strategy.processVote(mockVoteRequest, mockPoll);
      const result2 = await strategy.processVote(mockVoteRequest, mockPoll);
      
      expect(result1.voteId).toBeDefined();
      expect(result2.voteId).toBeDefined();
      expect(result1.voteId).not.toBe(result2.voteId);
    });

    it('should include timestamp in vote data', async () => {
      const beforeTime = Date.now();
      const result = await strategy.processVote(mockVoteRequest, mockPoll);
      const afterTime = Date.now();
      
      expect(result.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(result.timestamp).toBeLessThanOrEqual(afterTime);
    });
  });

  describe('calculateResults', () => {
    it('should calculate results for single choice votes', async () => {
      const votes: VoteData[] = [
        { id: 'vote-1', pollId: 'test-poll-123', userId: 'user-1', voteData: { choice: 0 }, privacyLevel: 'public', timestamp: new Date() },
        { id: 'vote-2', pollId: 'test-poll-123', userId: 'user-2', voteData: { choice: 1 }, privacyLevel: 'public', timestamp: new Date() },
        { id: 'vote-3', pollId: 'test-poll-123', userId: 'user-3', voteData: { choice: 0 }, privacyLevel: 'public', timestamp: new Date() },
        { id: 'vote-4', pollId: 'test-poll-123', userId: 'user-4', voteData: { choice: 2 }, privacyLevel: 'public', timestamp: new Date() }
      ];

      const results = await strategy.calculateResults(votes, mockPoll);
      
      expect(results.winner).toBe(0); // Option 0 has 2 votes
      expect(results.results).toHaveLength(3);
      expect(results.results[0].votes).toBe(2);
      expect(results.results[1].votes).toBe(1);
      expect(results.results[2].votes).toBe(1);
      expect(results.totalVotes).toBe(4);
    });

    it('should handle empty votes array', async () => {
      const results = await strategy.calculateResults([], mockPoll);
      
      expect(results.winner).toBeNull();
      expect(results.results).toHaveLength(3);
      expect(results.results.every(r => r.votes === 0)).toBe(true);
      expect(results.totalVotes).toBe(0);
    });

    it('should handle tie votes', async () => {
      const votes: VoteData[] = [
        { id: 'vote-1', pollId: 'test-poll-123', userId: 'user-1', voteData: { choice: 0 }, privacyLevel: 'public', timestamp: new Date() },
        { id: 'vote-2', pollId: 'test-poll-123', userId: 'user-2', voteData: { choice: 1 }, privacyLevel: 'public', timestamp: new Date() }
      ];

      const results = await strategy.calculateResults(votes, mockPoll);
      
      expect(results.winner).toBe(0); // First option wins in case of tie
      expect(results.results[0].votes).toBe(1);
      expect(results.results[1].votes).toBe(1);
      expect(results.results[2].votes).toBe(0);
      expect(results.totalVotes).toBe(2);
    });

    it('should handle single vote', async () => {
      const votes: VoteData[] = [
        { id: 'vote-1', pollId: 'test-poll-123', userId: 'user-1', voteData: { choice: 1 }, privacyLevel: 'public', timestamp: new Date() }
      ];

      const results = await strategy.calculateResults(votes, mockPoll);
      
      expect(results.winner).toBe(1);
      expect(results.results[0].votes).toBe(0);
      expect(results.results[1].votes).toBe(1);
      expect(results.results[2].votes).toBe(0);
      expect(results.totalVotes).toBe(1);
    });
  });

  describe('getResultsSummary', () => {
    it('should generate results summary', async () => {
      const votes: VoteData[] = [
        { id: 'vote-1', pollId: 'test-poll-123', userId: 'user-1', voteData: { choice: 0 }, privacyLevel: 'public', timestamp: new Date() },
        { id: 'vote-2', pollId: 'test-poll-123', userId: 'user-2', voteData: { choice: 1 }, privacyLevel: 'public', timestamp: new Date() },
        { id: 'vote-3', pollId: 'test-poll-123', userId: 'user-3', voteData: { choice: 0 }, privacyLevel: 'public', timestamp: new Date() }
      ];

      const summary = await strategy.getResultsSummary(votes, mockPoll);
      
      expect(summary).toHaveProperty('totalVotes');
      expect(summary).toHaveProperty('winner');
      expect(summary).toHaveProperty('participation');
      expect(summary.totalVotes).toBe(3);
      expect(summary.winner).toBe(0);
      expect(summary.participation).toBeGreaterThan(0);
    });

    it('should handle empty votes in summary', async () => {
      const summary = await strategy.getResultsSummary([], mockPoll);
      
      expect(summary.totalVotes).toBe(0);
      expect(summary.winner).toBeNull();
      expect(summary.participation).toBe(0);
    });
  });

  describe('error handling', () => {
    it('should handle validation errors gracefully', async () => {
      const invalidRequest = { ...mockVoteRequest, voteData: { choice: 'invalid' } };
      const validation = await strategy.validateVote(invalidRequest, mockPoll);
      
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBeDefined();
    });

    it('should handle processing errors gracefully', async () => {
      const invalidRequest = { ...mockVoteRequest, voteData: { choice: 10 } };
      
      try {
        await strategy.processVote(invalidRequest, mockPoll);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
});
