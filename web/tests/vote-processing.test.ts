/**
 * Vote Processing Integration Tests
 * 
 * Tests for vote validation, processing, and results calculation
 * 
 * Created: September 15, 2025
 * Updated: September 15, 2025
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { VoteEngine } from '@/lib/vote/engine';
import type { PollData, VoteData, VoteRequest } from '@/lib/vote/types';

// Mock the logger
jest.mock('@/lib/logger', () => ({
  devLog: jest.fn()
}));

describe('Vote Processing Integration', () => {
  let engine: VoteEngine;
  let singleChoicePoll: PollData;
  let approvalPoll: PollData;
  let rankedPoll: PollData;
  let quadraticPoll: PollData;
  let rangePoll: PollData;

  beforeEach(() => {
    engine = new VoteEngine();
    
    const basePoll = {
      id: 'processing-poll-123',
      title: 'Vote Processing Test Poll',
      description: 'A poll for testing vote processing',
      options: [
        { id: 'option-1', text: 'Option 1' },
        { id: 'option-2', text: 'Option 2' },
        { id: 'option-3', text: 'Option 3' }
      ],
      status: 'active' as const,
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

    singleChoicePoll = { ...basePoll, votingMethod: 'single' as const };
    approvalPoll = { ...basePoll, votingMethod: 'approval' as const };
    rankedPoll = { ...basePoll, votingMethod: 'ranked' as const };
    quadraticPoll = { ...basePoll, votingMethod: 'quadratic' as const };
    rangePoll = { ...basePoll, votingMethod: 'range' as const };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Single Choice Voting', () => {
    it('should process valid single choice vote', async () => {
      const voteRequest: VoteRequest = {
        pollId: 'processing-poll-123',
        userId: 'user-1',
        voteData: { choice: 0 },
        privacyLevel: 'public'
      };

      const response = await engine.processVote(voteRequest, singleChoicePoll);
      expect(response.success).toBe(true);
      expect(response.voteId).toBeDefined();
      expect(response.auditReceipt).toBeDefined();
    });

    it('should reject invalid single choice vote', async () => {
      const voteRequest: VoteRequest = {
        pollId: 'processing-poll-123',
        userId: 'user-1',
        voteData: { choice: -1 }, // Invalid choice
        privacyLevel: 'public'
      };

      const response = await engine.processVote(voteRequest, singleChoicePoll);
      expect(response.success).toBe(false);
      expect(response.message).toBe('Selected option does not exist in this poll');
    });

    it('should calculate single choice results correctly', async () => {
      const votes: VoteData[] = [
        {
          id: 'vote-1',
          pollId: 'processing-poll-123',
          userId: 'user-1',
          choice: 0,
          privacyLevel: 'public',
          timestamp: new Date(),
          auditReceipt: 'audit-1'
        },
        {
          id: 'vote-2',
          pollId: 'processing-poll-123',
          userId: 'user-2',
          choice: 0,
          privacyLevel: 'public',
          timestamp: new Date(),
          auditReceipt: 'audit-2'
        },
        {
          id: 'vote-3',
          pollId: 'processing-poll-123',
          userId: 'user-3',
          choice: 1,
          privacyLevel: 'public',
          timestamp: new Date(),
          auditReceipt: 'audit-3'
        }
      ];

      const results = await engine.calculateResults(singleChoicePoll, votes);
      expect(results.totalVotes).toBe(3);
      expect(results.votingMethod).toBe('single');
      
      expect(results.results.optionVotes['0']).toBe(2); // Option 1
      expect(results.results.optionPercentages['0']).toBeCloseTo(66.67, 1);
      expect(results.results.optionVotes['1']).toBe(1); // Option 2
      expect(results.results.optionPercentages['1']).toBeCloseTo(33.33, 1);
      expect(results.results.optionVotes['2']).toBe(0); // Option 3
      expect(results.results.optionPercentages['2']).toBe(0);
    });
  });

  describe('Approval Voting', () => {
    it('should process valid approval vote', async () => {
      const voteRequest: VoteRequest = {
        pollId: 'processing-poll-123',
        userId: 'user-1',
        voteData: { approvals: [0, 1] }, // Option 1 and Option 2
        privacyLevel: 'public'
      };

      const response = await engine.processVote(voteRequest, approvalPoll);
      expect(response.success).toBe(true);
    });

    it('should reject approval vote with no options', async () => {
      const voteRequest: VoteRequest = {
        pollId: 'processing-poll-123',
        userId: 'user-1',
        voteData: { approvals: [] },
        privacyLevel: 'public'
      };

      const response = await engine.processVote(voteRequest, approvalPoll);
      expect(response.success).toBe(false);
      expect(response.message).toBe('At least one option must be approved');
    });

    it('should calculate approval results correctly', async () => {
      const votes: VoteData[] = [
        {
          id: 'vote-1',
          pollId: 'processing-poll-123',
          userId: 'user-1',
          approvals: [0, 1],
          privacyLevel: 'public',
          timestamp: new Date(),
          auditReceipt: 'audit-1'
        },
        {
          id: 'vote-2',
          pollId: 'processing-poll-123',
          userId: 'user-2',
          approvals: [0],
          privacyLevel: 'public',
          timestamp: new Date(),
          auditReceipt: 'audit-2'
        },
        {
          id: 'vote-3',
          pollId: 'processing-poll-123',
          userId: 'user-3',
          approvals: [1, 2],
          privacyLevel: 'public',
          timestamp: new Date(),
          auditReceipt: 'audit-3'
        }
      ];

      const results = await engine.calculateResults(approvalPoll, votes);
      expect(results.totalVotes).toBe(3);
      expect(results.votingMethod).toBe('approval');
      
      expect(results.results.optionVotes['0']).toBe(2); // Option 1
      expect(results.results.optionVotes['1']).toBe(2); // Option 2
      expect(results.results.optionVotes['2']).toBe(1); // Option 3
    });
  });

  describe('Ranked Choice Voting', () => {
    it('should process valid ranked vote', async () => {
      const voteRequest: VoteRequest = {
        pollId: 'processing-poll-123',
        userId: 'user-1',
        voteData: {
          rankings: [0, 1, 2] // Option 1, Option 2, Option 3 in order
        },
        privacyLevel: 'public'
      };

      const response = await engine.processVote(voteRequest, rankedPoll);
      expect(response.success).toBe(true);
    });

    it('should reject ranked vote with duplicate rankings', async () => {
      const voteRequest: VoteRequest = {
        pollId: 'processing-poll-123',
        userId: 'user-1',
        voteData: {
          rankings: [0, 0] // Duplicate rank (invalid)
        },
        privacyLevel: 'public'
      };

      const response = await engine.processVote(voteRequest, rankedPoll);
      expect(response.success).toBe(false);
      expect(response.message).toBe('Rankings must be consecutive integers starting from 1');
    });

    it('should calculate ranked choice results with instant runoff', async () => {
      const votes: VoteData[] = [
        {
          id: 'vote-1',
          pollId: 'processing-poll-123',
          userId: 'user-1',
          rankings: [0, 1, 2], // Option 1, Option 2, Option 3 in order
          privacyLevel: 'public',
          timestamp: new Date(),
          auditReceipt: 'audit-1'
        },
        {
          id: 'vote-2',
          pollId: 'processing-poll-123',
          userId: 'user-2',
          rankings: [1, 0, 2], // Option 2, Option 1, Option 3 in order
          privacyLevel: 'public',
          timestamp: new Date(),
          auditReceipt: 'audit-2'
        },
        {
          id: 'vote-3',
          pollId: 'processing-poll-123',
          userId: 'user-3',
          rankings: [2, 0, 1], // Option 3, Option 1, Option 2 in order
          privacyLevel: 'public',
          timestamp: new Date(),
          auditReceipt: 'audit-3'
        }
      ];

      const results = await engine.calculateResults(rankedPoll, votes);
      expect(results.totalVotes).toBe(3);
      expect(results.votingMethod).toBe('ranked');
      expect(results.metadata?.winner).toBeDefined();
      expect(results.metadata?.roundsToWin).toBeDefined();
    });
  });

  describe('Quadratic Voting', () => {
    it('should process valid quadratic vote', async () => {
      const voteRequest: VoteRequest = {
        pollId: 'processing-poll-123',
        userId: 'user-1',
        voteData: {
          allocations: {
            '0': 5, // Option 1: 5 credits
            '1': 3  // Option 2: 3 credits
          }
        },
        privacyLevel: 'public'
      };

      const response = await engine.processVote(voteRequest, quadraticPoll);
      expect(response.success).toBe(true);
    });

    it('should reject quadratic vote exceeding credit limit', async () => {
      const voteRequest: VoteRequest = {
        pollId: 'processing-poll-123',
        userId: 'user-1',
        voteData: {
          allocations: {
            '0': 10 // Option 1: 10 credits (10^2 = 100 credits)
          }
        },
        privacyLevel: 'public'
      };

      const response = await engine.processVote(voteRequest, quadraticPoll);
      expect(response.success).toBe(false);
      expect(response.message).toContain('exceeds maximum credits');
    });

    it('should calculate quadratic results correctly', async () => {
      const votes: VoteData[] = [
        {
          id: 'vote-1',
          pollId: 'processing-poll-123',
          userId: 'user-1',
          allocations: {
            '0': 5, // Option 1: 5 credits
            '1': 3  // Option 2: 3 credits
          },
          privacyLevel: 'public',
          timestamp: new Date(),
          auditReceipt: 'audit-1'
        },
        {
          id: 'vote-2',
          pollId: 'processing-poll-123',
          userId: 'user-2',
          allocations: {
            '0': 2, // Option 1: 2 credits
            '2': 4  // Option 3: 4 credits
          },
          privacyLevel: 'public',
          timestamp: new Date(),
          auditReceipt: 'audit-2'
        }
      ];

      const results = await engine.calculateResults(quadraticPoll, votes);
      expect(results.totalVotes).toBe(2);
      expect(results.votingMethod).toBe('quadratic');
      
      expect(results.results.optionVotes['0']).toBe(7); // Option 1: 5 + 2 = 7
      expect(results.results.optionVotes['1']).toBe(3); // Option 2: 3
      expect(results.results.optionVotes['2']).toBe(4); // Option 3: 4
    });
  });

  describe('Range Voting', () => {
    it('should process valid range vote', async () => {
      const voteRequest: VoteRequest = {
        pollId: 'processing-poll-123',
        userId: 'user-1',
        voteData: {
          ratings: {
            '0': 8, // Option 1: score 8
            '1': 6, // Option 2: score 6
            '2': 4  // Option 3: score 4
          }
        },
        privacyLevel: 'public'
      };

      const response = await engine.processVote(voteRequest, rangePoll);
      expect(response.success).toBe(true);
    });

    it('should reject range vote with invalid scores', async () => {
      const voteRequest: VoteRequest = {
        pollId: 'processing-poll-123',
        userId: 'user-1',
        voteData: {
          ratings: {
            '0': 15 // Option 1: invalid score > 10
          }
        },
        privacyLevel: 'public'
      };

      const response = await engine.processVote(voteRequest, rangePoll);
      expect(response.success).toBe(false);
      expect(response.message).toContain('between 0 and 10');
    });

    it('should calculate range results correctly', async () => {
      const votes: VoteData[] = [
        {
          id: 'vote-1',
          pollId: 'processing-poll-123',
          userId: 'user-1',
          ratings: {
            '0': 8, // Option 1: score 8
            '1': 6, // Option 2: score 6
            '2': 4  // Option 3: score 4
          },
          privacyLevel: 'public',
          timestamp: new Date(),
          auditReceipt: 'audit-1'
        },
        {
          id: 'vote-2',
          pollId: 'processing-poll-123',
          userId: 'user-2',
          ratings: {
            '0': 7, // Option 1: score 7
            '1': 9, // Option 2: score 9
            '2': 5  // Option 3: score 5
          },
          privacyLevel: 'public',
          timestamp: new Date(),
          auditReceipt: 'audit-2'
        }
      ];

      const results = await engine.calculateResults(rangePoll, votes);
      expect(results.totalVotes).toBe(2);
      expect(results.votingMethod).toBe('range');
      
      expect(results.results.optionVotes['0']).toBe(7.5); // Option 1: (8 + 7) / 2 = 7.5
      expect(results.results.optionVotes['1']).toBe(7.5); // Option 2: (6 + 9) / 2 = 7.5
      expect(results.results.optionVotes['2']).toBe(4.5); // Option 3: (4 + 5) / 2 = 4.5
    });
  });

  describe('Vote Processing Edge Cases', () => {
    it('should handle malformed vote data gracefully', async () => {
      const voteRequest: VoteRequest = {
        pollId: 'processing-poll-123',
        userId: 'user-1',
        voteData: {},
        privacyLevel: 'public'
      };

      const response = await engine.processVote(voteRequest, singleChoicePoll);
      expect(response.success).toBe(false);
      expect(response.message).toBeDefined();
    });

    it('should handle missing vote data gracefully', async () => {
      const voteRequest: VoteRequest = {
        pollId: 'processing-poll-123',
        userId: 'user-1',
        voteData: {},
        privacyLevel: 'public'
      };

      const response = await engine.processVote(voteRequest, singleChoicePoll);
      expect(response.success).toBe(false);
      expect(response.message).toBeDefined();
    });

    it('should handle empty votes array in results calculation', async () => {
      const results = await engine.calculateResults(singleChoicePoll, []);
      expect(results.totalVotes).toBe(0);
      expect(Object.keys(results.results.optionVotes)).toHaveLength(3);
      Object.values(results.results.optionVotes).forEach(votes => {
        expect(votes).toBe(0);
      });
      Object.values(results.results.optionPercentages).forEach(percentage => {
        expect(percentage).toBe(0);
      });
    });

    it('should handle votes with missing vote data in results calculation', async () => {
      const votes: VoteData[] = [
        {
          id: 'vote-1',
          pollId: 'processing-poll-123',
          userId: 'user-1',
          choice: 0,
          privacyLevel: 'public',
          timestamp: new Date(),
          auditReceipt: 'audit-1'
        }
      ];

      const results = await engine.calculateResults(singleChoicePoll, votes);
      expect(results.totalVotes).toBe(1);
      expect(Object.keys(results.results.optionVotes)).toHaveLength(3);
      Object.values(results.results.optionVotes).forEach(votes => {
        expect(votes).toBe(0);
      });
      Object.values(results.results.optionPercentages).forEach(percentage => {
        expect(percentage).toBe(0);
      });
    });
  });

  describe('Vote Processing Performance', () => {
    it('should handle large number of votes efficiently', async () => {
      const votes: VoteData[] = [];
      
      // Generate 1000 votes
      for (let i = 0; i < 1000; i++) {
        const optionId = `option-${(i % 3) + 1}`;
        votes.push({
          id: `vote-${i}`,
          pollId: 'processing-poll-123',
          userId: `user-${i}`,
          choice: i % 3, // 0, 1, or 2 for options
          privacyLevel: 'public',
          timestamp: new Date(),
          auditReceipt: `audit-${i}`
        });
      }

      const startTime = Date.now();
      const results = await engine.calculateResults(singleChoicePoll, votes);
      const endTime = Date.now();
      
      expect(results.totalVotes).toBe(1000);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in under 1 second
    });

    it('should handle complex ranked choice voting efficiently', async () => {
      const votes: VoteData[] = [];
      
      // Generate 100 ranked votes
      for (let i = 0; i < 100; i++) {
        votes.push({
          id: `vote-${i}`,
          pollId: 'processing-poll-123',
          userId: `user-${i}`,
          rankings: [0, 1, 2], // Option 1, Option 2, Option 3 in order
          privacyLevel: 'public',
          timestamp: new Date(),
          auditReceipt: `audit-${i}`
        });
      }

      const startTime = Date.now();
      const results = await engine.calculateResults(rankedPoll, votes);
      const endTime = Date.now();
      
      expect(results.totalVotes).toBe(100);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in under 1 second
    });
  });
});
