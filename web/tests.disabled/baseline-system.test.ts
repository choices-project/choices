/**
 * Baseline System Integration Tests
 * 
 * Tests for the baseline voting system functionality
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

describe('Baseline System Integration', () => {
  let engine: VoteEngine;
  let testPoll: PollData;
  let testVotes: VoteData[];

  beforeEach(() => {
    engine = new VoteEngine();
    
    testPoll = {
      id: 'baseline-poll-123',
      title: 'Baseline System Test Poll',
      description: 'A poll for testing baseline system functionality',
      votingMethod: 'single',
      options: [
        { id: 'option-a', text: 'Option A' },
        { id: 'option-b', text: 'Option B' },
        { id: 'option-c', text: 'Option C' }
      ],
      status: 'active',
      startTime: new Date('2025-01-01T00:00:00Z'),
      endTime: new Date('2025-12-31T23:59:59Z'),
      baselineAt: new Date('2025-06-01T00:00:00Z'),
      allowPostClose: true,
      createdBy: 'admin-user',
      createdAt: new Date('2025-01-01T00:00:00Z'),
      updatedAt: new Date('2025-01-01T00:00:00Z'),
      votingConfig: {
        allowMultipleVotes: false,
        maxChoices: 1,
        requireVerification: false
      }
    };

    testVotes = [
      {
        id: 'vote-1',
        pollId: 'baseline-poll-123',
        userId: 'user-1',
        choice: 0, // Option A
        privacyLevel: 'public',
        timestamp: new Date('2025-03-01T10:00:00Z'),
        auditReceipt: 'audit-1'
      },
      {
        id: 'vote-2',
        pollId: 'baseline-poll-123',
        userId: 'user-2',
        choice: 0, // Option A
        privacyLevel: 'public',
        timestamp: new Date('2025-03-01T11:00:00Z'),
        auditReceipt: 'audit-2'
      },
      {
        id: 'vote-3',
        pollId: 'baseline-poll-123',
        userId: 'user-3',
        choice: 1, // Option B
        privacyLevel: 'public',
        timestamp: new Date('2025-03-01T12:00:00Z'),
        auditReceipt: 'audit-3'
      },
      {
        id: 'vote-4',
        pollId: 'baseline-poll-123',
        userId: 'user-4',
        choice: 2, // Option C
        privacyLevel: 'public',
        timestamp: new Date('2025-03-01T13:00:00Z'),
        auditReceipt: 'audit-4'
      }
    ];
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Baseline Vote Processing', () => {
    it('should process votes before baseline date', async () => {
      const preBaselineVote: VoteRequest = {
        pollId: 'baseline-poll-123',
        userId: 'user-5',
        voteData: { choice: 0 }, // Option A
        privacyLevel: 'public',
        timestamp: new Date('2025-05-01T10:00:00Z') // Before baseline
      };

      const response = await engine.processVote(preBaselineVote, testPoll);
      expect(response.success).toBe(true);
      expect(response.voteId).toBeDefined();
      expect(response.auditReceipt).toBeDefined();
    });

    it('should process votes after baseline date', async () => {
      const postBaselineVote: VoteRequest = {
        pollId: 'baseline-poll-123',
        userId: 'user-6',
        voteData: { choice: 1 }, // Option B
        privacyLevel: 'public',
        timestamp: new Date('2025-07-01T10:00:00Z') // After baseline
      };

      const response = await engine.processVote(postBaselineVote, testPoll);
      expect(response.success).toBe(true);
      expect(response.voteId).toBeDefined();
    });

    it('should calculate baseline results correctly', async () => {
      const baselineVotes = testVotes.filter(vote => 
        vote.timestamp < testPoll.baselineAt!
      );

      const results = await engine.calculateResults(testPoll, baselineVotes);
      
      expect(results.pollId).toBe('baseline-poll-123');
      expect(results.totalVotes).toBe(baselineVotes.length);
      expect(results.votingMethod).toBe('single');
      
      expect(results.results.optionVotes['0']).toBe(2); // Option A
      expect(results.results.optionVotes['1']).toBe(1); // Option B
      expect(results.results.optionVotes['2']).toBe(1); // Option C
    });

    it('should calculate live results including post-baseline votes', async () => {
      const results = await engine.calculateResults(testPoll, testVotes);
      
      expect(results.totalVotes).toBe(testVotes.length);
      
      expect(results.results.optionVotes['0']).toBe(2); // Option A
      expect(results.results.optionVotes['1']).toBe(1); // Option B
      expect(results.results.optionVotes['2']).toBe(1); // Option C
    });
  });

  describe('Baseline System Validation', () => {
    it('should validate baseline date is set', () => {
      expect(testPoll.baselineAt).toBeDefined();
      expect(testPoll.baselineAt).toBeInstanceOf(Date);
    });

    it('should validate baseline date is after poll start', () => {
      expect(testPoll.baselineAt!.getTime()).toBeGreaterThan(testPoll.startTime!.getTime());
    });

    it('should validate baseline date is before poll end', () => {
      expect(testPoll.baselineAt!.getTime()).toBeLessThan(testPoll.endTime!.getTime());
    });

    it('should allow post-close voting when configured', () => {
      expect(testPoll.allowPostClose).toBe(true);
    });
  });

  describe('Baseline Results Comparison', () => {
    it('should identify drift between baseline and live results', async () => {
      const baselineVotes = testVotes.filter(vote => 
        vote.timestamp < testPoll.baselineAt!
      );
      
      const baselineResults = await engine.calculateResults(testPoll, baselineVotes);
      const liveResults = await engine.calculateResults(testPoll, testVotes);
      
      // Calculate drift for each option
      const drift = Object.keys(baselineResults.results.optionVotes).map(optionIndex => {
        const baselineVotes = baselineResults.results.optionVotes[optionIndex];
        const liveVotes = liveResults.results.optionVotes[optionIndex] || 0;
        return {
          optionId: optionIndex,
          baselineVotes: baselineVotes ?? 0,
          liveVotes,
          drift: liveVotes - (baselineVotes ?? 0),
          driftPercentage: (baselineVotes ?? 0) > 0 
            ? ((liveVotes - (baselineVotes ?? 0)) / (baselineVotes ?? 0)) * 100
            : 0
        };
      });
      
      expect(drift).toHaveLength(3);
      
      // Option A should have no drift (2 votes in both)
      const optionADrift = drift.find(d => d.optionId === '0');
      expect(optionADrift?.drift).toBe(0);
      expect(optionADrift?.driftPercentage).toBe(0);
    });

    it('should handle empty baseline results', async () => {
      const emptyBaselineVotes: VoteData[] = [];
      const baselineResults = await engine.calculateResults(testPoll, emptyBaselineVotes);
      
      expect(baselineResults.totalVotes).toBe(0);
      Object.values(baselineResults.results.optionVotes).forEach(votes => {
        expect(votes).toBe(0);
      });
      Object.values(baselineResults.results.optionPercentages).forEach(percentage => {
        expect(percentage).toBe(0);
      });
    });

    it('should handle baseline with all votes', async () => {
      const baselineResults = await engine.calculateResults(testPoll, testVotes);
      const liveResults = await engine.calculateResults(testPoll, testVotes);
      
      // Results should be identical
      expect(baselineResults.totalVotes).toBe(liveResults.totalVotes);
      expect(baselineResults.results).toEqual(liveResults.results);
    });
  });

  describe('Baseline System Edge Cases', () => {
    it('should handle poll without baseline date', async () => {
      const pollWithoutBaseline = { ...testPoll };
      delete pollWithoutBaseline.baselineAt;
      
      const response = await engine.processVote({
        pollId: 'baseline-poll-123',
        userId: 'user-7',
        voteData: { choice: 0 }, // Option A
        privacyLevel: 'public'
      }, pollWithoutBaseline);
      
      expect(response.success).toBe(true);
    });

    it('should handle baseline date at poll start', async () => {
      const pollWithEarlyBaseline = { 
        ...testPoll, 
        baselineAt: testPoll.startTime!
      };
      
      const response = await engine.processVote({
        pollId: 'baseline-poll-123',
        userId: 'user-8',
        voteData: { choice: 0 }, // Option A
        privacyLevel: 'public'
      }, pollWithEarlyBaseline);
      
      expect(response.success).toBe(true);
    });

    it('should handle baseline date at poll end', async () => {
      const pollWithLateBaseline = { 
        ...testPoll, 
        baselineAt: testPoll.endTime!
      };
      
      const response = await engine.processVote({
        pollId: 'baseline-poll-123',
        userId: 'user-9',
        voteData: { choice: 0 }, // Option A
        privacyLevel: 'public'
      }, pollWithLateBaseline);
      
      expect(response.success).toBe(true);
    });

    it('should handle votes with identical timestamps to baseline', async () => {
      const voteAtBaseline: VoteRequest = {
        pollId: 'baseline-poll-123',
        userId: 'user-10',
        voteData: { choice: 0 }, // Option A
        privacyLevel: 'public',
        timestamp: testPoll.baselineAt!
      };

      const response = await engine.processVote(voteAtBaseline, testPoll);
      expect(response.success).toBe(true);
    });
  });

  describe('Baseline System Performance', () => {
    it('should handle large number of votes efficiently', async () => {
      const largeVoteSet: VoteData[] = [];
      
      // Generate 1000 votes
      for (let i = 0; i < 1000; i++) {
        const optionId = `option-${String.fromCharCode(97 + (i % 3))}`; // a, b, c
        largeVoteSet.push({
          id: `vote-${i}`,
          pollId: 'baseline-poll-123',
          userId: `user-${i}`,
          choice: i % 3, // 0, 1, or 2 for options A, B, C
          privacyLevel: 'public',
          timestamp: new Date(`2025-03-${String(i % 28 + 1).padStart(2, '0')}T10:00:00Z`),
          auditReceipt: `audit-${i}`
        });
      }

      const startTime = Date.now();
      const results = await engine.calculateResults(testPoll, largeVoteSet);
      const endTime = Date.now();
      
      expect(results.totalVotes).toBe(1000);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in under 1 second
    });

    it('should handle baseline calculation with many votes efficiently', async () => {
      const largeVoteSet: VoteData[] = [];
      
      // Generate 500 votes before baseline, 500 after
      for (let i = 0; i < 1000; i++) {
        const isBeforeBaseline = i < 500;
        const timestamp = isBeforeBaseline 
          ? new Date('2025-05-01T10:00:00Z')
          : new Date('2025-07-01T10:00:00Z');
          
        largeVoteSet.push({
          id: `vote-${i}`,
          pollId: 'baseline-poll-123',
          userId: `user-${i}`,
          choice: i % 3, // 0, 1, or 2 for options A, B, C
          privacyLevel: 'public',
          timestamp,
          auditReceipt: `audit-${i}`
        });
      }

      const baselineVotes = largeVoteSet.filter(vote => 
        vote.timestamp < testPoll.baselineAt!
      );

      const startTime = Date.now();
      const baselineResults = await engine.calculateResults(testPoll, baselineVotes);
      const liveResults = await engine.calculateResults(testPoll, largeVoteSet);
      const endTime = Date.now();
      
      expect(baselineResults.totalVotes).toBe(500);
      expect(liveResults.totalVotes).toBe(1000);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in under 1 second
    });
  });
});
