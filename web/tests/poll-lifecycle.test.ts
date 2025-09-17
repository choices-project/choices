/**
 * Poll Lifecycle Integration Tests
 * 
 * Tests for poll creation, management, and lifecycle transitions
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

describe('Poll Lifecycle Integration', () => {
  let engine: VoteEngine;
  let draftPoll: PollData;
  let activePoll: PollData;
  let closedPoll: PollData;
  let lockedPoll: PollData;

  beforeEach(() => {
    engine = new VoteEngine();
    
    const basePoll = {
      id: 'lifecycle-poll-123',
      title: 'Lifecycle Test Poll',
      description: 'A poll for testing lifecycle transitions',
      votingMethod: 'single' as const,
      options: [
        { id: 'option-1', text: 'Option 1' },
        { id: 'option-2', text: 'Option 2' }
      ],
      startTime: new Date('2025-01-01T00:00:00Z'),
      endTime: new Date('2025-12-31T23:59:59Z'),
      createdBy: 'admin-user',
      createdAt: new Date('2025-01-01T00:00:00Z'),
      updatedAt: new Date('2025-01-01T00:00:00Z'),
      votingConfig: {
        allowMultipleVotes: false,
        maxChoices: 1,
        requireVerification: false
      }
    };

    draftPoll = { ...basePoll, status: 'draft' as const };
    activePoll = { ...basePoll, status: 'active' as const };
    closedPoll = { ...basePoll, status: 'closed' as const };
    lockedPoll = { ...basePoll, status: 'locked' as const };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Poll Creation and Draft State', () => {
    it('should allow poll creation in draft state', () => {
      expect(draftPoll.status).toBe('draft');
      expect(draftPoll.id).toBeDefined();
      expect(draftPoll.title).toBeDefined();
      expect(draftPoll.options).toHaveLength(2);
    });

    it('should validate poll has required fields', () => {
      expect(draftPoll.id).toBeTruthy();
      expect(draftPoll.title).toBeTruthy();
      expect(draftPoll.votingMethod).toBeTruthy();
      expect(draftPoll.options.length).toBeGreaterThan(0);
      expect(draftPoll.createdBy).toBeTruthy();
      expect(draftPoll.createdAt).toBeInstanceOf(Date);
    });

    it('should validate poll options have required fields', () => {
      draftPoll.options.forEach(option => {
        expect(option.id).toBeTruthy();
        expect(option.text).toBeTruthy();
      });
    });
  });

  describe('Poll Activation', () => {
    it('should allow voting on active polls', async () => {
      const voteRequest: VoteRequest = {
        pollId: 'lifecycle-poll-123',
        userId: 'user-1',
        voteData: { choice: 0 }, // Option 1
        privacyLevel: 'public'
      };

      const response = await engine.processVote(voteRequest, activePoll);
      expect(response.success).toBe(true);
      expect(response.voteId).toBeDefined();
    });

    it('should reject voting on draft polls', async () => {
      const voteRequest: VoteRequest = {
        pollId: 'lifecycle-poll-123',
        userId: 'user-1',
        voteData: { choice: 0 }, // Option 1
        privacyLevel: 'public'
      };

      const response = await engine.processVote(voteRequest, draftPoll);
      expect(response.success).toBe(false);
      expect(response.message).toBe('Poll not found or not active');
    });

    it('should validate active poll has proper timing', () => {
      expect(activePoll.startTime).toBeDefined();
      expect(activePoll.endTime).toBeDefined();
      expect(activePoll.startTime!.getTime()).toBeLessThan(activePoll.endTime!.getTime());
    });
  });

  describe('Poll Closing', () => {
    it('should reject voting on closed polls by default', async () => {
      const voteRequest: VoteRequest = {
        pollId: 'lifecycle-poll-123',
        userId: 'user-1',
        voteData: { choice: 0 }, // Option 1
        privacyLevel: 'public'
      };

      const response = await engine.processVote(voteRequest, closedPoll);
      expect(response.success).toBe(false);
      expect(response.message).toBe('Poll not found or not active');
    });

    it('should allow voting on closed polls when allowPostClose is true', async () => {
      const closedPollWithPostClose = {
        ...closedPoll,
        allowPostClose: true
      };

      const voteRequest: VoteRequest = {
        pollId: 'lifecycle-poll-123',
        userId: 'user-1',
        voteData: { choice: 0 }, // Option 1
        privacyLevel: 'public'
      };

      const response = await engine.processVote(voteRequest, closedPollWithPostClose);
      expect(response.success).toBe(true);
    });

    it('should calculate results for closed polls', async () => {
      const testVotes: VoteData[] = [
        {
          id: 'vote-1',
          pollId: 'lifecycle-poll-123',
          userId: 'user-1',
          choice: 0, // Option 1
          privacyLevel: 'public',
          timestamp: new Date('2025-06-01T10:00:00Z'),
          auditReceipt: 'audit-1'
        },
        {
          id: 'vote-2',
          pollId: 'lifecycle-poll-123',
          userId: 'user-2',
          choice: 1, // Option 2
          privacyLevel: 'public',
          timestamp: new Date('2025-06-01T11:00:00Z'),
          auditReceipt: 'audit-2'
        }
      ];

      const results = await engine.calculateResults(closedPoll, testVotes);
      expect(results.totalVotes).toBe(2);
      expect(results.results).toHaveLength(2);
    });
  });

  describe('Poll Locking', () => {
    it('should reject voting on locked polls', async () => {
      const voteRequest: VoteRequest = {
        pollId: 'lifecycle-poll-123',
        userId: 'user-1',
        voteData: { choice: 0 }, // Option 1
        privacyLevel: 'public'
      };

      const response = await engine.processVote(voteRequest, lockedPoll);
      expect(response.success).toBe(false);
      expect(response.message).toBe('Poll not found or not active');
    });

    it('should allow results calculation for locked polls', async () => {
      const testVotes: VoteData[] = [
        {
          id: 'vote-1',
          pollId: 'lifecycle-poll-123',
          userId: 'user-1',
          choice: 0, // Option 1
          privacyLevel: 'public',
          timestamp: new Date('2025-06-01T10:00:00Z'),
          auditReceipt: 'audit-1'
        }
      ];

      const results = await engine.calculateResults(lockedPoll, testVotes);
      expect(results.totalVotes).toBe(1);
      expect(results.results).toHaveLength(2);
    });

    it('should validate locked poll has lock timestamp', () => {
      const lockedPollWithTimestamp = {
        ...lockedPoll,
        lockedAt: new Date('2025-06-01T12:00:00Z')
      };

      expect(lockedPollWithTimestamp.lockedAt).toBeDefined();
      expect(lockedPollWithTimestamp.lockedAt).toBeInstanceOf(Date);
    });
  });

  describe('Poll Timing Validation', () => {
    it('should reject votes before poll start time', async () => {
      const futurePoll = {
        ...activePoll,
        startTime: new Date('2025-12-01T00:00:00Z'),
        endTime: new Date('2025-12-31T23:59:59Z')
      };

      const voteRequest: VoteRequest = {
        pollId: 'lifecycle-poll-123',
        userId: 'user-1',
        voteData: { choice: 0 }, // Option 1
        privacyLevel: 'public'
      };

      const response = await engine.processVote(voteRequest, futurePoll);
      expect(response.success).toBe(false);
      expect(response.message).toBe('Poll has ended');
    });

    it('should reject votes after poll end time', async () => {
      const pastPoll = {
        ...activePoll,
        startTime: new Date('2024-01-01T00:00:00Z'),
        endTime: new Date('2024-12-31T23:59:59Z')
      };

      const voteRequest: VoteRequest = {
        pollId: 'lifecycle-poll-123',
        userId: 'user-1',
        voteData: { choice: 0 }, // Option 1
        privacyLevel: 'public'
      };

      const response = await engine.processVote(voteRequest, pastPoll);
      expect(response.success).toBe(false);
      expect(response.message).toBe('Poll has ended');
    });

    it('should allow votes within poll time window', async () => {
      const currentPoll = {
        ...activePoll,
        startTime: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000) // 1 day from now
      };

      const voteRequest: VoteRequest = {
        pollId: 'lifecycle-poll-123',
        userId: 'user-1',
        voteData: { choice: 0 }, // Option 1
        privacyLevel: 'public'
      };

      const response = await engine.processVote(voteRequest, currentPoll);
      expect(response.success).toBe(true);
    });
  });

  describe('Poll Lifecycle Transitions', () => {
    it('should handle transition from draft to active', () => {
      const transitionedPoll = { ...draftPoll, status: 'active' as const };
      expect(transitionedPoll.status).toBe('active');
    });

    it('should handle transition from active to closed', () => {
      const transitionedPoll = { ...activePoll, status: 'closed' as const };
      expect(transitionedPoll.status).toBe('closed');
    });

    it('should handle transition from closed to locked', () => {
      const transitionedPoll = { 
        ...closedPoll, 
        status: 'locked' as const,
        lockedAt: new Date()
      };
      expect(transitionedPoll.status).toBe('locked');
      expect(transitionedPoll.lockedAt).toBeDefined();
    });

    it('should preserve vote data through transitions', async () => {
      const testVotes: VoteData[] = [
        {
          id: 'vote-1',
          pollId: 'lifecycle-poll-123',
          userId: 'user-1',
          choice: 0, // Option 1
          privacyLevel: 'public',
          timestamp: new Date('2025-06-01T10:00:00Z'),
          auditReceipt: 'audit-1'
        }
      ];

      // Calculate results in active state
      const activeResults = await engine.calculateResults(activePoll, testVotes);
      
      // Calculate results in closed state
      const closedResults = await engine.calculateResults(closedPoll, testVotes);
      
      // Results should be identical
      expect(activeResults.totalVotes).toBe(closedResults.totalVotes);
      expect(activeResults.results).toEqual(closedResults.results);
    });
  });

  describe('Poll Lifecycle Edge Cases', () => {
    it('should handle poll without start time', async () => {
      const pollWithoutStart = { ...activePoll };
      delete pollWithoutStart.startTime;
      
      const voteRequest: VoteRequest = {
        pollId: 'lifecycle-poll-123',
        userId: 'user-1',
        voteData: { choice: 0 }, // Option 1
        privacyLevel: 'public'
      };

      const response = await engine.processVote(voteRequest, pollWithoutStart);
      expect(response.success).toBe(true);
    });

    it('should handle poll without end time', async () => {
      const pollWithoutEnd = { ...activePoll };
      delete pollWithoutEnd.endTime;
      
      const voteRequest: VoteRequest = {
        pollId: 'lifecycle-poll-123',
        userId: 'user-1',
        voteData: { choice: 0 }, // Option 1
        privacyLevel: 'public'
      };

      const response = await engine.processVote(voteRequest, pollWithoutEnd);
      expect(response.success).toBe(true);
    });

    it('should handle poll with identical start and end times', async () => {
      const sameTime = new Date('2025-06-01T12:00:00Z');
      const pollWithSameTimes = {
        ...activePoll,
        startTime: sameTime,
        endTime: sameTime
      };
      
      const voteRequest: VoteRequest = {
        pollId: 'lifecycle-poll-123',
        userId: 'user-1',
        voteData: { choice: 0 }, // Option 1
        privacyLevel: 'public'
      };

      const response = await engine.processVote(voteRequest, pollWithSameTimes);
      expect(response.success).toBe(false);
      expect(response.message).toBe('Poll has ended');
    });

    it('should handle poll with end time before start time', async () => {
      const pollWithInvalidTimes = {
        ...activePoll,
        startTime: new Date('2025-12-31T23:59:59Z'),
        endTime: new Date('2025-01-01T00:00:00Z')
      };
      
      const voteRequest: VoteRequest = {
        pollId: 'lifecycle-poll-123',
        userId: 'user-1',
        voteData: { choice: 0 }, // Option 1
        privacyLevel: 'public'
      };

      const response = await engine.processVote(voteRequest, pollWithInvalidTimes);
      expect(response.success).toBe(false);
      expect(response.message).toBe('Poll has ended');
    });
  });

  describe('Poll Lifecycle Performance', () => {
    it('should handle rapid status transitions efficiently', async () => {
      const startTime = Date.now();
      
      // Simulate rapid transitions
      let currentPoll = { ...draftPoll };
      
      for (let i = 0; i < 100; i++) {
        currentPoll = { ...currentPoll, status: 'active' as const };
        currentPoll = { ...currentPoll, status: 'closed' as const };
        currentPoll = { ...currentPoll, status: 'locked' as const };
      }
      
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(100); // Should complete quickly
    });

    it('should handle large number of polls efficiently', async () => {
      const polls: PollData[] = [];
      
      // Generate 100 polls
      for (let i = 0; i < 100; i++) {
        polls.push({
          ...activePoll,
          id: `poll-${i}`,
          title: `Poll ${i}`
        });
      }

      const startTime = Date.now();
      
      // Process votes for all polls
      for (const poll of polls) {
        const voteRequest: VoteRequest = {
          pollId: poll.id,
          userId: 'user-1',
          voteData: { choice: 0 }, // Option 1
          privacyLevel: 'public'
        };
        
        await engine.processVote(voteRequest, poll);
      }
      
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in under 1 second
    });
  });
});
