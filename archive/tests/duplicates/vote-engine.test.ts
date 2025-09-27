/**
 * VoteEngine Unit Tests
 * 
 * Comprehensive unit tests for the core voting engine functionality
 * 
 * Created: January 15, 2025
 * Updated: January 15, 2025
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { VoteEngine } from '@/lib/vote/engine';
import type { 
  VoteRequest, 
  VoteResponse, 
  VoteValidation, 
  Poll,
  PollData, 
  VoteData, 
  ResultsData,
  VotingMethod 
} from '@/lib/vote/types';

type EngineStrategy = {
  getVotingMethod(): VotingMethod;
  validateVote(): Promise<void>;
  processVote(): Promise<void>;
  calculateResults(): Promise<unknown>;
  getConfiguration(): unknown;
};

// Mock the logger
jest.mock('@/lib/logger', () => ({
  devLog: jest.fn()
}));

describe('VoteEngine', () => {
  let engine: VoteEngine;
  let mockPoll: PollData;

  beforeEach(() => {
    engine = new VoteEngine();
    
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

  describe('Constructor and Configuration', () => {
    it('should initialize with default configuration', () => {
      const defaultEngine = new VoteEngine();
      const config = defaultEngine.getConfig();
      
      expect(config.maxVotesPerPoll).toBe(10000);
      expect(config.allowMultipleVotes).toBe(false);
      expect(config.requireAuthentication).toBe(true);
      expect(config.minTrustTier).toBe('T0');
      expect(config.rateLimitPerUser).toBe(10);
      expect(config.rateLimitWindowMs).toBe(60000);
    });

    it('should initialize with custom configuration', () => {
      const customConfig = {
        maxVotesPerPoll: 5000,
        allowMultipleVotes: true,
        requireAuthentication: false,
        minTrustTier: 'T1',
        rateLimitPerUser: 20,
        rateLimitWindowMs: 30000
      };
      
      const customEngine = new VoteEngine(customConfig);
      const config = customEngine.getConfig();
      
      expect(config.maxVotesPerPoll).toBe(5000);
      expect(config.allowMultipleVotes).toBe(true);
      expect(config.requireAuthentication).toBe(false);
      expect(config.minTrustTier).toBe('T1');
      expect(config.rateLimitPerUser).toBe(20);
      expect(config.rateLimitWindowMs).toBe(30000);
    });

    it('should update configuration', () => {
      const newConfig = {
        maxVotesPerPoll: 15000,
        allowMultipleVotes: true
      };
      
      engine.updateConfig(newConfig);
      const config = engine.getConfig();
      
      expect(config.maxVotesPerPoll).toBe(15000);
      expect(config.allowMultipleVotes).toBe(true);
      // Other configs should remain unchanged
      expect(config.requireAuthentication).toBe(true);
    });
  });

  describe('Vote Validation', () => {
    it('should validate valid single choice vote', async () => {
      const request: VoteRequest = {
        pollId: 'test-poll-123',
        userId: 'user-1',
        voteData: { choice: 0 },
        privacyLevel: 'public'
      };

      const validation = await engine.validateVote(request, mockPoll);
      
      expect(validation.isValid).toBe(true);
      expect(validation.requiresAuthentication).toBe(true);
      expect(validation.requiresTokens).toBe(false);
    });

    it('should reject vote with missing pollId', async () => {
      const request: VoteRequest = {
        pollId: '',
        userId: 'user-1',
        voteData: { choice: 0 },
        privacyLevel: 'public'
      };

      const validation = await engine.validateVote(request, mockPoll);
      
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('Missing required vote data');
    });

    it('should reject vote with missing voteData', async () => {
      const request: VoteRequest = {
        pollId: 'test-poll-123',
        userId: 'user-1',
        voteData: {},
        privacyLevel: 'public'
      };

      const validation = await engine.validateVote(request, mockPoll);
      
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('Choice is required for single-choice voting');
    });

    it('should reject vote for inactive poll', async () => {
      const inactivePoll = Object.assign({}, mockPoll, { status: 'closed' as const });
      const request: VoteRequest = {
        pollId: 'test-poll-123',
        userId: 'user-1',
        voteData: { choice: 0 },
        privacyLevel: 'public'
      };

      const validation = await engine.validateVote(request, inactivePoll);
      
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('Poll not found or not active');
    });

    it('should reject vote for expired poll', async () => {
      const expiredPoll = Object.assign({}, mockPoll, { 
        endTime: new Date('2024-12-31T23:59:59Z') // Past date
      });
      const request: VoteRequest = {
        pollId: 'test-poll-123',
        userId: 'user-1',
        voteData: { choice: 0 },
        privacyLevel: 'public'
      };

      const validation = await engine.validateVote(request, expiredPoll);
      
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('Poll has ended');
    });

    it('should reject vote without authentication when required', async () => {
      const request: VoteRequest = {
        pollId: 'test-poll-123',
        voteData: { choice: 0 },
        privacyLevel: 'public'
      };

      const validation = await engine.validateVote(request, mockPoll);
      
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('Authentication required to vote');
    });

    it('should accept vote without authentication when not required', async () => {
      const noAuthEngine = new VoteEngine({ requireAuthentication: false });
      const request: VoteRequest = {
        pollId: 'test-poll-123',
        voteData: { choice: 0 },
        privacyLevel: 'public'
      };

      const validation = await noAuthEngine.validateVote(request, mockPoll);
      
      expect(validation.isValid).toBe(true);
    });
  });

  describe('Vote Processing', () => {
    it('should process valid single choice vote', async () => {
      const request: VoteRequest = {
        pollId: 'test-poll-123',
        userId: 'user-1',
        voteData: { choice: 0 },
        privacyLevel: 'public'
      };

      const response = await engine.processVote(request, mockPoll);
      
      expect(response.success).toBe(true);
      expect(response.pollId).toBe('test-poll-123');
      expect(response.voteId).toBeDefined();
      expect(response.auditReceipt).toBeDefined();
      expect(response.privacyLevel).toBe('public');
      expect(typeof response.responseTime).toBe('number');
      expect(response.responseTime).toBeGreaterThanOrEqual(0);
    });

    it('should reject invalid vote during processing', async () => {
      const request: VoteRequest = {
        pollId: 'test-poll-123',
        userId: 'user-1',
        voteData: { choice: -1 }, // Invalid choice
        privacyLevel: 'public'
      };

      const response = await engine.processVote(request, mockPoll);
      
      expect(response.success).toBe(false);
      expect(response.message).toBeDefined();
      expect(response.voteId).toBeUndefined();
      expect(response.auditReceipt).toBeUndefined();
    });

    it('should handle processing errors gracefully', async () => {
      // Mock a strategy to throw an error
      const mockStrategy: jest.Mocked<EngineStrategy> = {
        getVotingMethod: jest.fn(() => 'single' as VotingMethod),
        validateVote:     jest.fn(async () => { throw new Error('Strategy error'); }),
        processVote:      jest.fn(),
        calculateResults: jest.fn(),
        getConfiguration: jest.fn(),
      };

      // Replace the strategy in the engine
      (engine as any).strategies.set('single', mockStrategy);

      const request: VoteRequest = {
        pollId: 'test-poll-123',
        userId: 'user-1',
        voteData: { choice: 0 },
        privacyLevel: 'public'
      };

      const response = await engine.processVote(request, mockPoll);
      
      expect(response.success).toBe(false);
      expect(response.message).toBe('Strategy error');
    });
  });

  describe('Results Calculation', () => {
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

      const results = await engine.calculateResults(mockPoll, votes);
      
      expect(results.pollId).toBe('test-poll-123');
      expect(results.votingMethod).toBe('single');
      expect(results.totalVotes).toBe(3);
      expect(results.participationRate).toBeGreaterThan(0);
      expect(results.results).toBeDefined();
      expect(results.calculatedAt).toBeDefined();
    });

    it('should handle empty votes array', async () => {
      const results = await engine.calculateResults(mockPoll, []);
      
      expect(results.totalVotes).toBe(0);
      expect(results.participationRate).toBe(0);
      expect(results.results).toBeDefined();
    });

    it('should handle calculation errors gracefully', async () => {
      // Mock a strategy to throw an error during calculation
      const mockStrategy2: jest.Mocked<EngineStrategy> = {
        getVotingMethod: jest.fn(() => 'single' as VotingMethod),
        validateVote:     jest.fn(),
        processVote:      jest.fn(),
        calculateResults: jest.fn(async () => { throw new Error('Calculation error'); }),
        getConfiguration: jest.fn(),
      };

      (engine as unknown as { strategies: Map<string, unknown> }).strategies.set('single', mockStrategy2);

      const votes: VoteData[] = [{
        id: 'vote-1',
        pollId: 'test-poll-123',
        userId: 'user-1',
        choice: 0,
        privacyLevel: 'public',
        timestamp: new Date(),
        auditReceipt: 'audit-1'
      }];

      await expect(engine.calculateResults(mockPoll, votes))
        .rejects.toThrow('Failed to calculate results: Calculation error');
    });
  });

  describe('Voting Method Configuration', () => {
    it('should get configuration for single choice voting', () => {
      const config = engine.getVotingMethodConfig('single');
      
      expect(config).toBeDefined();
      expect(typeof config).toBe('object');
    });

    it('should get configuration for approval voting', () => {
      const config = engine.getVotingMethodConfig('approval');
      
      expect(config).toBeDefined();
      expect(typeof config).toBe('object');
    });

    it('should get configuration for ranked choice voting', () => {
      const config = engine.getVotingMethodConfig('ranked');
      
      expect(config).toBeDefined();
      expect(typeof config).toBe('object');
    });

    it('should get configuration for quadratic voting', () => {
      const config = engine.getVotingMethodConfig('quadratic');
      
      expect(config).toBeDefined();
      expect(typeof config).toBe('object');
    });

    it('should get configuration for range voting', () => {
      const config = engine.getVotingMethodConfig('range');
      
      expect(config).toBeDefined();
      expect(typeof config).toBe('object');
    });

    it('should throw error for unsupported voting method', () => {
      expect(() => engine.getVotingMethodConfig('unsupported' as VotingMethod))
        .toThrow('Unsupported voting method: unsupported');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle null poll data', async () => {
      const request: VoteRequest = {
        pollId: 'test-poll-123',
        userId: 'user-1',
        voteData: { choice: 0 },
        privacyLevel: 'public'
      };

      const validation = await engine.validateVote(request, null as any);
      
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('Poll not found or not active');
    });

    it('should handle undefined vote data', async () => {
      const request: VoteRequest = {
        pollId: 'test-poll-123',
        userId: 'user-1',
        voteData: undefined as unknown as VoteData,
        privacyLevel: 'public'
      };

      const validation = await engine.validateVote(request, mockPoll);
      
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('Missing required vote data');
    });

    it('should handle malformed poll data', async () => {
      const malformedPoll = Object.assign({}, mockPoll, {
        votingMethod: 'invalid' as unknown as VotingMethod
      });
      
      const request: VoteRequest = {
        pollId: 'test-poll-123',
        userId: 'user-1',
        voteData: { choice: 0 },
        privacyLevel: 'public'
      };

      const validation = await engine.validateVote(request, malformedPoll);
      
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBeDefined();
    });

    it('should handle concurrent vote processing', async () => {
      const requests: VoteRequest[] = Array.from({ length: 10 }, (_, i) => ({
        pollId: 'test-poll-123',
        userId: `user-${i}`,
        voteData: { choice: i % 3 },
        privacyLevel: 'public' as const
      }));

      const responses = await Promise.all(
        requests.map(request => engine.processVote(request, mockPoll))
      );

      expect(responses).toHaveLength(10);
      responses.forEach(response => {
        expect(response.success).toBe(true);
        expect(response.pollId).toBe('test-poll-123');
      });
    });
  });

  describe('Performance Tests', () => {
    it('should process votes efficiently', async () => {
      const startTime = Date.now();
      
      const request: VoteRequest = {
        pollId: 'test-poll-123',
        userId: 'user-1',
        voteData: { choice: 0 },
        privacyLevel: 'public'
      };

      const response = await engine.processVote(request, mockPoll);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(response.success).toBe(true);
      expect(duration).toBeLessThan(100); // Should complete in under 100ms
    });

    it('should calculate results efficiently for large vote sets', async () => {
      const votes: VoteData[] = Array.from({ length: 1000 }, (_, i) => ({
        id: `vote-${i}`,
        pollId: 'test-poll-123',
        userId: `user-${i}`,
        choice: i % 3,
        privacyLevel: 'public' as const,
        timestamp: new Date(),
        auditReceipt: `audit-${i}`
      }));

      const startTime = Date.now();
      const results = await engine.calculateResults(mockPoll, votes);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(results.totalVotes).toBe(1000);
      expect(duration).toBeLessThan(1000); // Should complete in under 1 second
    });
  });
});
