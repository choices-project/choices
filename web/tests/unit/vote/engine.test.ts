/**
 * Vote Engine Unit Tests
 * 
 * Comprehensive tests for the voting engine and all voting strategies
 * 
 * Created: September 15, 2025
 * Updated: September 15, 2025
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { VoteEngine, type VoteEngineConfig } from '@/lib/vote/engine';
import type { VoteRequest, PollData, VoteData, VotingMethod } from '@/lib/vote/types';

// Import V2 test setup
import { when, expectQueryState } from '../../helpers/supabase-when';

// Mock the logger
jest.mock('@/lib/logger', () => ({
  devLog: jest.fn()
}));

describe('VoteEngine', () => {
  let engine: VoteEngine;
  let mockPoll: PollData;
  let mockVoteRequest: VoteRequest;

  beforeEach(() => {
    engine = new VoteEngine();
    
    mockPoll = {
      id: 'poll-123',
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
      createdBy: 'user-123',
      createdAt: new Date('2025-01-01T00:00:00Z'),
      updatedAt: new Date('2025-01-01T00:00:00Z'),
      votingConfig: {
        allowMultipleVotes: false,
        maxChoices: 1,
        quadraticCredits: 100,
        rangeMin: 0,
        rangeMax: 10
      }
    };

    mockVoteRequest = {
      pollId: 'poll-123',
      userId: 'user-456',
      voteData: { choice: 0 },
      privacyLevel: 'public'
    };
  });

  describe('Configuration', () => {
    it('should initialize with default configuration', () => {
      const config = engine.getConfig();
      expect(config.maxVotesPerPoll).toBe(10000);
      expect(config.allowMultipleVotes).toBe(false);
      expect(config.requireAuthentication).toBe(true);
      expect(config.minTrustTier).toBe('T0');
      expect(config.rateLimitPerUser).toBe(10);
      expect(config.rateLimitWindowMs).toBe(60000);
    });

    it('should accept custom configuration', () => {
      const customConfig: Partial<VoteEngineConfig> = {
        maxVotesPerPoll: 5000,
        allowMultipleVotes: true,
        requireAuthentication: false
      };
      
      const customEngine = new VoteEngine(customConfig);
      const config = customEngine.getConfig();
      
      expect(config.maxVotesPerPoll).toBe(5000);
      expect(config.allowMultipleVotes).toBe(true);
      expect(config.requireAuthentication).toBe(false);
    });

    it('should update configuration', () => {
      engine.updateConfig({ maxVotesPerPoll: 2000 });
      const config = engine.getConfig();
      expect(config.maxVotesPerPoll).toBe(2000);
    });
  });

  describe('Vote Validation', () => {
    it('should validate a valid single-choice vote', async () => {
      const validation = await engine.validateVote(mockVoteRequest, mockPoll);
      expect(validation.isValid).toBe(true);
      expect(validation.requiresAuthentication).toBe(true);
      expect(validation.requiresTokens).toBe(false);
    });

    it('should reject vote with missing poll ID', async () => {
      const invalidRequest = Object.assign({}, mockVoteRequest, { pollId: '' });
      const validation = await engine.validateVote(invalidRequest, mockPoll);
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('Missing required vote data');
    });

    it('should reject vote with missing vote data', async () => {
      const invalidRequest = Object.assign({}, mockVoteRequest, { voteData: {} });
      const validation = await engine.validateVote(invalidRequest, mockPoll);
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('Choice is required for single-choice voting');
    });

    it('should reject vote for inactive poll', async () => {
      const inactivePoll = Object.assign({}, mockPoll, { status: 'closed' as const });
      const validation = await engine.validateVote(mockVoteRequest, inactivePoll);
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('Poll not found or not active');
    });

    it('should reject vote for ended poll', async () => {
      const endedPoll = Object.assign({}, mockPoll, { 
        endTime: new Date('2024-12-31T23:59:59Z') 
      });
      const validation = await engine.validateVote(mockVoteRequest, endedPoll);
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('Poll has ended');
    });

    it('should reject vote without authentication when required', async () => {
      const unauthenticatedRequest = { ...mockVoteRequest };
      delete unauthenticatedRequest.userId;
      const validation = await engine.validateVote(unauthenticatedRequest, mockPoll);
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('Authentication required to vote');
      expect(validation.requiresAuthentication).toBe(true);
    });

    it('should allow vote without authentication when not required', async () => {
      engine.updateConfig({ requireAuthentication: false });
      const unauthenticatedRequest = Object.assign({}, mockVoteRequest);
      delete unauthenticatedRequest.userId;
      const validation = await engine.validateVote(unauthenticatedRequest, mockPoll);
      expect(validation.isValid).toBe(true);
    });

    it('should reject vote with invalid option', async () => {
      const invalidRequest = { 
        ...mockVoteRequest, 
        voteData: { choice: 999 } 
      };
      const validation = await engine.validateVote(invalidRequest, mockPoll);
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('Choice must be between 0 and 2');
    });
  });

  describe('Vote Processing', () => {
    it('should process a valid vote successfully', async () => {
      const response = await engine.processVote(mockVoteRequest, mockPoll);
      expect(response.success).toBe(true);
      expect(response.pollId).toBe('poll-123');
      expect(response.voteId).toBeDefined();
      expect(response.auditReceipt).toBeDefined();
      expect(response.privacyLevel).toBe('public');
      expect(response.responseTime).toBeGreaterThanOrEqual(0);
    });

    it('should reject invalid vote during processing', async () => {
      const invalidRequest = Object.assign({}, mockVoteRequest, { voteData: {} });
      const response = await engine.processVote(invalidRequest, mockPoll);
      expect(response.success).toBe(false);
      expect(response.message).toBe('Choice is required for single-choice voting');
      expect(response.voteId).toBeUndefined();
    });

    it('should handle processing errors gracefully', async () => {
      // Test error handling with invalid data
      const invalidRequest = Object.assign({}, mockVoteRequest, { voteData: {} });
      const response = await engine.processVote(invalidRequest, mockPoll);
      expect(response.success).toBe(false);
      expect(response.message).toBeDefined();
    });
  });

  describe('Results Calculation', () => {
    it('should calculate results for single-choice voting', async () => {
      const mockVotes: VoteData[] = [
        {
          id: 'vote-1',
          pollId: 'poll-123',
          userId: 'user-1',
          choice: 0,
          privacyLevel: 'public',
          timestamp: new Date(),
          auditReceipt: 'receipt-1'
        },
        {
          id: 'vote-2',
          pollId: 'poll-123',
          userId: 'user-2',
          choice: 0,
          privacyLevel: 'public',
          timestamp: new Date(),
          auditReceipt: 'receipt-2'
        },
        {
          id: 'vote-3',
          pollId: 'poll-123',
          userId: 'user-3',
          choice: 1,
          privacyLevel: 'public',
          timestamp: new Date(),
          auditReceipt: 'receipt-3'
        }
      ];

      const results = await engine.calculateResults(mockPoll, mockVotes);
      expect(results.pollId).toBe('poll-123');
      expect(results.totalVotes).toBe(3);
      expect(results.votingMethod).toBe('single');
      expect(results.results).toBeDefined();
      expect(typeof results.results).toBe('object');
      
      // Check option votes using the correct structure
      expect(results.results.optionVotes['0']).toBe(2); // Option 1 (index 0)
      expect(results.results.optionVotes['1']).toBe(1); // Option 2 (index 1)
      expect(results.results.optionVotes['2']).toBe(0); // Option 3 (index 2)
      
      expect(results.results.optionPercentages['0']).toBeCloseTo(66.67, 1);
      expect(results.results.optionPercentages['1']).toBeCloseTo(33.33, 1);
      expect(results.results.optionPercentages['2']).toBe(0);
    });

    it('should handle empty votes array', async () => {
      const results = await engine.calculateResults(mockPoll, []);
      expect(results.totalVotes).toBe(0);
      expect(Object.keys(results.results.optionVotes)).toHaveLength(3);
      Object.values(results.results.optionVotes).forEach(votes => {
        expect(votes).toBe(0);
      });
      Object.values(results.results.optionPercentages).forEach(percentage => {
        expect(percentage).toBe(0);
      });
    });
  });

  describe('Voting Method Configuration', () => {
    it('should get configuration for single-choice voting', () => {
      const config = engine.getVotingMethodConfig('single');
      expect(config.name).toBe('Single Choice Voting');
      expect(config.allowsMultipleSelections).toBe(false);
      expect(config.minOptions).toBe(2);
    });

    it('should get configuration for approval voting', () => {
      const config = engine.getVotingMethodConfig('approval');
      expect(config.name).toBe('Approval Voting');
      expect(config.allowsMultipleSelections).toBe(true);
      expect(config.minOptions).toBe(2);
    });

    it('should get configuration for ranked voting', () => {
      const config = engine.getVotingMethodConfig('ranked');
      expect(config.name).toBe('Ranked Choice Voting');
      expect(config.resultType).toBe('instant_runoff');
    });

    it('should get configuration for quadratic voting', () => {
      const config = engine.getVotingMethodConfig('quadratic');
      expect(config.name).toBe('Quadratic Voting');
      expect(config.allowsMultipleSelections).toBe(true);
      expect(config.resultType).toBe('highest_score');
    });

    it('should get configuration for range voting', () => {
      const config = engine.getVotingMethodConfig('range');
      expect(config.name).toBe('Range Voting');
      expect(config.allowsMultipleSelections).toBe(true);
      expect(config.resultType).toBe('highest_average');
    });

    it('should throw error for unsupported voting method', () => {
      expect(() => {
        engine.getVotingMethodConfig('unsupported' as VotingMethod);
      }).toThrow('Unsupported voting method: unsupported');
    });
  });

  describe('Error Handling', () => {
    it('should handle validation errors gracefully', async () => {
      const invalidRequest = Object.assign({}, mockVoteRequest, { pollId: '' });
      const validation = await engine.validateVote(invalidRequest, mockPoll);
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBeDefined();
    });

    it('should handle processing errors gracefully', async () => {
      const invalidRequest = Object.assign({}, mockVoteRequest, { voteData: {} });
      const response = await engine.processVote(invalidRequest, mockPoll);
      expect(response.success).toBe(false);
      expect(response.message).toBeDefined();
    });

    it('should handle results calculation errors gracefully', async () => {
      // Test with malformed vote data
      const malformedVotes: VoteData[] = [
        {
          id: 'vote-1',
          pollId: 'poll-123',
          userId: 'user-1',
          choice: 999,
          privacyLevel: 'public',
          timestamp: new Date(),
          auditReceipt: 'receipt-1'
        }
      ];

      const results = await engine.calculateResults(mockPoll, malformedVotes);
      expect(results.totalVotes).toBe(0);
      expect(results.results).toBeDefined();
      expect(typeof results.results).toBe('object');
    });
  });
});
