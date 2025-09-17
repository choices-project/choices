/**
 * Voting Strategies Unit Tests
 * 
 * Comprehensive unit tests for all voting strategy implementations
 * 
 * Created: January 15, 2025
 * Updated: January 15, 2025
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { SingleChoiceStrategy } from '@/lib/vote/strategies/single-choice';
import { ApprovalStrategy } from '@/lib/vote/strategies/approval';
import { RankedStrategy } from '@/lib/vote/strategies/ranked';
import { QuadraticStrategy } from '@/lib/vote/strategies/quadratic';
import { RangeStrategy } from '@/lib/vote/strategies/range';
import type { 
  VoteRequest, 
  VoteResponse, 
  VoteValidation, 
  PollData, 
  VoteData, 
  ResultsData 
} from '@/lib/vote/types';

// Mock the logger
jest.mock('@/lib/logger', () => ({
  devLog: jest.fn()
}));

describe('Voting Strategies', () => {
  let mockPoll: PollData;

  beforeEach(() => {
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
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Single Choice Strategy', () => {
    let strategy: SingleChoiceStrategy;

    beforeEach(() => {
      strategy = new SingleChoiceStrategy();
    });

    it('should return correct voting method', () => {
      expect(strategy.getVotingMethod()).toBe('single');
    });

    it('should validate valid single choice vote', async () => {
      const request: VoteRequest = {
        pollId: 'test-poll-123',
        userId: 'user-1',
        voteData: { choice: 0 },
        privacyLevel: 'public'
      };

      const validation = await strategy.validateVote(request, mockPoll);
      
      expect(validation.isValid).toBe(true);
      expect(validation.requiresAuthentication).toBe(true);
      expect(validation.requiresTokens).toBe(false);
    });

    it('should reject vote with missing choice', async () => {
      const request: VoteRequest = {
        pollId: 'test-poll-123',
        userId: 'user-1',
        voteData: {},
        privacyLevel: 'public'
      };

      const validation = await strategy.validateVote(request, mockPoll);
      
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('Choice is required for single-choice voting');
    });

    it('should reject vote with invalid choice index', async () => {
      const request: VoteRequest = {
        pollId: 'test-poll-123',
        userId: 'user-1',
        voteData: { choice: 5 }, // Invalid index
        privacyLevel: 'public'
      };

      const validation = await strategy.validateVote(request, mockPoll);
      
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('Choice must be between 0 and 2');
    });

    it('should reject vote with negative choice index', async () => {
      const request: VoteRequest = {
        pollId: 'test-poll-123',
        userId: 'user-1',
        voteData: { choice: -1 },
        privacyLevel: 'public'
      };

      const validation = await strategy.validateVote(request, mockPoll);
      
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('Choice must be between 0 and 2');
    });

    it('should process valid single choice vote', async () => {
      const request: VoteRequest = {
        pollId: 'test-poll-123',
        userId: 'user-1',
        voteData: { choice: 0 },
        privacyLevel: 'public'
      };

      const response = await strategy.processVote(request, mockPoll);
      
      expect(response.success).toBe(true);
      expect(response.pollId).toBe('test-poll-123');
      expect(response.voteId).toBeDefined();
      expect(response.auditReceipt).toBeDefined();
    });

    it('should calculate single choice results correctly', async () => {
      const votes: VoteData[] = [
        {
          id: 'vote-1',
          pollId: 'test-poll-123',
          userId: 'user-1',
          choice: 0,
          privacyLevel: 'public',
          timestamp: new Date(),
          auditReceipt: 'audit-1'
        },
        {
          id: 'vote-2',
          pollId: 'test-poll-123',
          userId: 'user-2',
          choice: 0,
          privacyLevel: 'public',
          timestamp: new Date(),
          auditReceipt: 'audit-2'
        },
        {
          id: 'vote-3',
          pollId: 'test-poll-123',
          userId: 'user-3',
          choice: 1,
          privacyLevel: 'public',
          timestamp: new Date(),
          auditReceipt: 'audit-3'
        }
      ];

      const results = await strategy.calculateResults(mockPoll, votes);
      
      expect(results.totalVotes).toBe(3);
      expect(results.votingMethod).toBe('single');
      expect(results.results.optionVotes['0']).toBe(2);
      expect(results.results.optionVotes['1']).toBe(1);
      expect(results.results.optionVotes['2']).toBe(0);
      expect(results.results.optionPercentages['0']).toBeCloseTo(66.67, 1);
      expect(results.results.optionPercentages['1']).toBeCloseTo(33.33, 1);
      expect(results.results.optionPercentages['2']).toBe(0);
    });

    it('should return configuration', () => {
      const config = strategy.getConfiguration();
      
      expect(config).toBeDefined();
      expect(typeof config).toBe('object');
    });
  });

  describe('Approval Strategy', () => {
    let strategy: ApprovalStrategy;

    beforeEach(() => {
      strategy = new ApprovalStrategy();
      // Update mock poll for approval voting
      mockPoll.votingMethod = 'approval';
      mockPoll.votingConfig.maxChoices = 3; // Allow multiple approvals
    });

    it('should return correct voting method', () => {
      expect(strategy.getVotingMethod()).toBe('approval');
    });

    it('should validate valid approval vote', async () => {
      const request: VoteRequest = {
        pollId: 'test-poll-123',
        userId: 'user-1',
        voteData: { approvals: [0, 1] },
        privacyLevel: 'public'
      };

      const validation = await strategy.validateVote(request, mockPoll);
      
      expect(validation.isValid).toBe(true);
    });

    it('should reject vote with no approvals', async () => {
      const request: VoteRequest = {
        pollId: 'test-poll-123',
        userId: 'user-1',
        voteData: { approvals: [] },
        privacyLevel: 'public'
      };

      const validation = await strategy.validateVote(request, mockPoll);
      
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('At least one option must be approved');
    });

    it('should reject vote with invalid approval indices', async () => {
      const request: VoteRequest = {
        pollId: 'test-poll-123',
        userId: 'user-1',
        voteData: { approvals: [0, 5] }, // 5 is invalid
        privacyLevel: 'public'
      };

      const validation = await strategy.validateVote(request, mockPoll);
      
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('Approval index must be between 0 and 2');
    });

    it('should reject vote with duplicate approvals', async () => {
      const request: VoteRequest = {
        pollId: 'test-poll-123',
        userId: 'user-1',
        voteData: { approvals: [0, 0] }, // Duplicate
        privacyLevel: 'public'
      };

      const validation = await strategy.validateVote(request, mockPoll);
      
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('Duplicate approvals are not allowed');
    });

    it('should calculate approval results correctly', async () => {
      const votes: VoteData[] = [
        {
          id: 'vote-1',
          pollId: 'test-poll-123',
          userId: 'user-1',
          approvals: [0, 1],
          privacyLevel: 'public',
          timestamp: new Date(),
          auditReceipt: 'audit-1'
        },
        {
          id: 'vote-2',
          pollId: 'test-poll-123',
          userId: 'user-2',
          approvals: [0],
          privacyLevel: 'public',
          timestamp: new Date(),
          auditReceipt: 'audit-2'
        },
        {
          id: 'vote-3',
          pollId: 'test-poll-123',
          userId: 'user-3',
          approvals: [1, 2],
          privacyLevel: 'public',
          timestamp: new Date(),
          auditReceipt: 'audit-3'
        }
      ];

      const results = await strategy.calculateResults(mockPoll, votes);
      
      expect(results.totalVotes).toBe(3);
      expect(results.votingMethod).toBe('approval');
      expect(results.results.optionVotes['0']).toBe(2);
      expect(results.results.optionVotes['1']).toBe(2);
      expect(results.results.optionVotes['2']).toBe(1);
    });
  });

  describe('Ranked Strategy', () => {
    let strategy: RankedStrategy;

    beforeEach(() => {
      strategy = new RankedStrategy();
    });

    it('should return correct voting method', () => {
      expect(strategy.getVotingMethod()).toBe('ranked');
    });

    it('should validate valid ranked vote', async () => {
      const request: VoteRequest = {
        pollId: 'test-poll-123',
        userId: 'user-1',
        voteData: { rankings: [0, 1, 2] },
        privacyLevel: 'public'
      };

      const validation = await strategy.validateVote(request, mockPoll);
      
      expect(validation.isValid).toBe(true);
    });

    it('should reject vote with incomplete rankings', async () => {
      const request: VoteRequest = {
        pollId: 'test-poll-123',
        userId: 'user-1',
        voteData: { rankings: [0, 1] }, // Missing option 2
        privacyLevel: 'public'
      };

      const validation = await strategy.validateVote(request, mockPoll);
      
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('All options must be ranked');
    });

    it('should reject vote with duplicate rankings', async () => {
      const request: VoteRequest = {
        pollId: 'test-poll-123',
        userId: 'user-1',
        voteData: { rankings: [0, 0, 1] }, // Duplicate rank 0
        privacyLevel: 'public'
      };

      const validation = await strategy.validateVote(request, mockPoll);
      
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('Duplicate rankings are not allowed');
    });

    it('should calculate ranked choice results correctly', async () => {
      const votes: VoteData[] = [
        {
          id: 'vote-1',
          pollId: 'test-poll-123',
          userId: 'user-1',
          rankings: [0, 1, 2],
          privacyLevel: 'public',
          timestamp: new Date(),
          auditReceipt: 'audit-1'
        },
        {
          id: 'vote-2',
          pollId: 'test-poll-123',
          userId: 'user-2',
          rankings: [1, 0, 2],
          privacyLevel: 'public',
          timestamp: new Date(),
          auditReceipt: 'audit-2'
        },
        {
          id: 'vote-3',
          pollId: 'test-poll-123',
          userId: 'user-3',
          rankings: [2, 0, 1],
          privacyLevel: 'public',
          timestamp: new Date(),
          auditReceipt: 'audit-3'
        }
      ];

      const results = await strategy.calculateResults(mockPoll, votes);
      
      expect(results.totalVotes).toBe(3);
      expect(results.votingMethod).toBe('ranked');
      expect(results.results).toBeDefined();
    });
  });

  describe('Quadratic Strategy', () => {
    let strategy: QuadraticStrategy;

    beforeEach(() => {
      strategy = new QuadraticStrategy();
    });

    it('should return correct voting method', () => {
      expect(strategy.getVotingMethod()).toBe('quadratic');
    });

    it('should validate valid quadratic vote', async () => {
      const request: VoteRequest = {
        pollId: 'test-poll-123',
        userId: 'user-1',
        voteData: {
          allocations: {
            '0': 5,
            '1': 3
          }
        },
        privacyLevel: 'public'
      };

      const validation = await strategy.validateVote(request, mockPoll);
      
      expect(validation.isValid).toBe(true);
    });

    it('should reject vote exceeding credit limit', async () => {
      const request: VoteRequest = {
        pollId: 'test-poll-123',
        userId: 'user-1',
        voteData: {
          allocations: {
            '0': 10 // 10^2 = 100 credits, exactly at limit
          }
        },
        privacyLevel: 'public'
      };

      const validation = await strategy.validateVote(request, mockPoll);
      
      expect(validation.isValid).toBe(true); // Should be valid at limit
    });

    it('should reject vote exceeding credit limit', async () => {
      const request: VoteRequest = {
        pollId: 'test-poll-123',
        userId: 'user-1',
        voteData: {
          allocations: {
            '0': 11 // 11^2 = 121 credits, exceeds limit
          }
        },
        privacyLevel: 'public'
      };

      const validation = await strategy.validateVote(request, mockPoll);
      
      expect(validation.isValid).toBe(false);
      expect(validation.error).toContain('exceeds available credits');
    });

    it('should reject vote with negative allocations', async () => {
      const request: VoteRequest = {
        pollId: 'test-poll-123',
        userId: 'user-1',
        voteData: {
          allocations: {
            '0': -5 // Negative allocation
          }
        },
        privacyLevel: 'public'
      };

      const validation = await strategy.validateVote(request, mockPoll);
      
      expect(validation.isValid).toBe(false);
      expect(validation.error).toContain('non-negative integers');
    });

    it('should calculate quadratic results correctly', async () => {
      const votes: VoteData[] = [
        {
          id: 'vote-1',
          pollId: 'test-poll-123',
          userId: 'user-1',
          allocations: {
            '0': 5,
            '1': 3
          },
          privacyLevel: 'public',
          timestamp: new Date(),
          auditReceipt: 'audit-1'
        },
        {
          id: 'vote-2',
          pollId: 'test-poll-123',
          userId: 'user-2',
          allocations: {
            '0': 2,
            '2': 4
          },
          privacyLevel: 'public',
          timestamp: new Date(),
          auditReceipt: 'audit-2'
        }
      ];

      const results = await strategy.calculateResults(mockPoll, votes);
      
      expect(results.totalVotes).toBe(2);
      expect(results.votingMethod).toBe('quadratic');
      expect(results.results.quadraticScores?.['0']).toBe(7); // 5 + 2
      expect(results.results.quadraticScores?.['1']).toBe(3);
      expect(results.results.quadraticScores?.['2']).toBe(4);
    });
  });

  describe('Range Strategy', () => {
    let strategy: RangeStrategy;

    beforeEach(() => {
      strategy = new RangeStrategy();
    });

    it('should return correct voting method', () => {
      expect(strategy.getVotingMethod()).toBe('range');
    });

    it('should validate valid range vote', async () => {
      const request: VoteRequest = {
        pollId: 'test-poll-123',
        userId: 'user-1',
        voteData: {
          ratings: {
            '0': 8,
            '1': 6,
            '2': 4
          }
        },
        privacyLevel: 'public'
      };

      const validation = await strategy.validateVote(request, mockPoll);
      
      expect(validation.isValid).toBe(true);
    });

    it('should reject vote with ratings outside range', async () => {
      const request: VoteRequest = {
        pollId: 'test-poll-123',
        userId: 'user-1',
        voteData: {
          ratings: {
            '0': 15 // Outside 0-10 range
          }
        },
        privacyLevel: 'public'
      };

      const validation = await strategy.validateVote(request, mockPoll);
      
      expect(validation.isValid).toBe(false);
      expect(validation.error).toContain('between 0 and 10');
    });

    it('should reject vote with incomplete ratings', async () => {
      const request: VoteRequest = {
        pollId: 'test-poll-123',
        userId: 'user-1',
        voteData: {
          ratings: {
            '0': 8,
            '1': 6
            // Missing option 2
          }
        },
        privacyLevel: 'public'
      };

      const validation = await strategy.validateVote(request, mockPoll);
      
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('All options must be rated');
    });

    it('should reject vote with all minimum ratings', async () => {
      const request: VoteRequest = {
        pollId: 'test-poll-123',
        userId: 'user-1',
        voteData: {
          ratings: {
            '0': 0,
            '1': 0,
            '2': 0
          }
        },
        privacyLevel: 'public'
      };

      const validation = await strategy.validateVote(request, mockPoll);
      
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('At least one option must have a rating above the minimum');
    });

    it('should calculate range results correctly', async () => {
      const votes: VoteData[] = [
        {
          id: 'vote-1',
          pollId: 'test-poll-123',
          userId: 'user-1',
          ratings: {
            '0': 8,
            '1': 6,
            '2': 4
          },
          privacyLevel: 'public',
          timestamp: new Date(),
          auditReceipt: 'audit-1'
        },
        {
          id: 'vote-2',
          pollId: 'test-poll-123',
          userId: 'user-2',
          ratings: {
            '0': 7,
            '1': 9,
            '2': 5
          },
          privacyLevel: 'public',
          timestamp: new Date(),
          auditReceipt: 'audit-2'
        }
      ];

      const results = await strategy.calculateResults(mockPoll, votes);
      
      expect(results.totalVotes).toBe(2);
      expect(results.votingMethod).toBe('range');
      expect(results.results.rangeAverages?.['0']).toBe(7.5); // (8 + 7) / 2
      expect(results.results.rangeAverages?.['1']).toBe(7.5); // (6 + 9) / 2
      expect(results.results.rangeAverages?.['2']).toBe(4.5); // (4 + 5) / 2
    });
  });

  describe('Strategy Configuration', () => {
    it('should return configuration for all strategies', () => {
      const strategies = [
        new SingleChoiceStrategy(),
        new ApprovalStrategy(),
        new RankedStrategy(),
        new QuadraticStrategy(),
        new RangeStrategy()
      ];

      strategies.forEach(strategy => {
        const config = strategy.getConfiguration();
        expect(config).toBeDefined();
        expect(typeof config).toBe('object');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty votes array in all strategies', async () => {
      const strategies = [
        new SingleChoiceStrategy(),
        new ApprovalStrategy(),
        new RankedStrategy(),
        new QuadraticStrategy(),
        new RangeStrategy()
      ];

      for (const strategy of strategies) {
        const results = await strategy.calculateResults(mockPoll, []);
        expect(results.totalVotes).toBe(0);
        expect(results.votingMethod).toBe(strategy.getVotingMethod());
      }
    });

    it('should handle malformed vote data gracefully', async () => {
      const strategies = [
        new SingleChoiceStrategy(),
        new ApprovalStrategy(),
        new RankedStrategy(),
        new QuadraticStrategy(),
        new RangeStrategy()
      ];

      const malformedRequest: VoteRequest = {
        pollId: 'test-poll-123',
        userId: 'user-1',
        voteData: {} as any,
        privacyLevel: 'public'
      };

      for (const strategy of strategies) {
        const validation = await strategy.validateVote(malformedRequest, mockPoll);
        expect(validation.isValid).toBe(false);
        expect(validation.error).toBeDefined();
      }
    });
  });
});
