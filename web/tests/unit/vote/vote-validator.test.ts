/**
 * VoteValidator Unit Tests
 * 
 * Comprehensive unit tests for vote validation functionality
 * 
 * Created: January 15, 2025
 * Updated: January 15, 2025
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

import type { 
  VoteData, 
  PollData 
} from '@/lib/vote/types';
import { VoteValidator } from '@/lib/vote/validator';

// Import V2 test setup
import { getMS } from '../../setup';

// Mock the logger
jest.mock('@/lib/logger', () => ({
  devLog: jest.fn()
}));
const mockSetup = getMS();
const { when, client: mockSupabaseClient } = mockSetup;

jest.mock('@/utils/supabase/server', () => ({
  getSupabaseServerClient: jest.fn(() => Promise.resolve(mockSupabaseClient))
}));

describe('VoteValidator', () => {
  let validator: VoteValidator;
  let mockPoll: PollData;
  let mockVoteData: VoteData;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    // Reset mock routes to ensure clean state
    mockSetup.resetAllMocks();
    validator = new VoteValidator();
    
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
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Validation', () => {
    it('should validate valid vote data', async () => {
      const validation = await validator.validateVote(mockVoteData, mockPoll, 'user-1');
      
      expect(validation.isValid).toBe(true);
      expect(validation.requiresAuthentication).toBe(true);
      expect(validation.requiresTokens).toBe(false);
    });

    it('should reject null vote data', async () => {
      const validation = await validator.validateVote(null as any, mockPoll, 'user-1');
      
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('Vote data must be an object');
    });

    it('should reject undefined vote data', async () => {
      const validation = await validator.validateVote(undefined as any, mockPoll, 'user-1');
      
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('Vote data must be an object');
    });

    it('should reject non-object vote data', async () => {
      const validation = await validator.validateVote('invalid' as any, mockPoll, 'user-1');
      
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('Vote data must be an object');
    });

    it('should reject null poll data', async () => {
      const validation = await validator.validateVote(mockVoteData, null as any, 'user-1');
      
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('Poll data is required');
    });

    it('should reject poll data without id', async () => {
      const invalidPoll = Object.assign({}, mockPoll, { id: '' });
      const validation = await validator.validateVote(mockVoteData, invalidPoll, 'user-1');
      
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('Invalid poll data');
    });

    it('should reject poll data without voting method', async () => {
      const invalidPoll = Object.assign({}, mockPoll, { votingMethod: undefined as any });
      const validation = await validator.validateVote(mockVoteData, invalidPoll, 'user-1');
      
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('Invalid poll data');
    });
  });

  describe('Business Rules Validation', () => {
    it('should reject vote for inactive poll', async () => {
      const inactivePoll = Object.assign({}, mockPoll, { status: 'closed' as const });
      const validation = await validator.validateVote(mockVoteData, inactivePoll, 'user-1');
      
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('Poll is not active');
    });

    it('should reject vote for draft poll', async () => {
      const draftPoll = Object.assign({}, mockPoll, { status: 'draft' as const });
      const validation = await validator.validateVote(mockVoteData, draftPoll, 'user-1');
      
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('Poll is not active');
    });

    it('should reject vote for expired poll', async () => {
      const expiredPoll = Object.assign({}, mockPoll, { 
        endTime: new Date('2024-12-31T23:59:59Z') // Past date
      });
      const validation = await validator.validateVote(mockVoteData, expiredPoll, 'user-1');
      
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('Poll has ended');
    });

    it('should accept vote for poll without end time', async () => {
      const { endTime: _endTime, ...noEndTimePoll } = mockPoll;
      const validation = await validator.validateVote(mockVoteData, noEndTimePoll, 'user-1');
      
      expect(validation.isValid).toBe(true);
    });

    it('should reject vote for locked poll', async () => {
      const lockedPoll = Object.assign({}, mockPoll, { 
        lockedAt: new Date('2025-01-01T12:00:00Z') 
      });
      const validation = await validator.validateVote(mockVoteData, lockedPoll, 'user-1');
      
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('Poll is locked');
    });
  });

  describe('Single Choice Validation', () => {
    it('should validate valid single choice vote', async () => {
      const validation = await validator.validateVote(mockVoteData, mockPoll, 'user-1');
      
      expect(validation.isValid).toBe(true);
    });

    it('should reject vote with missing choice', async () => {
      const { choice: _choice, ...invalidVote } = mockVoteData;
      const validation = await validator.validateVote(invalidVote, mockPoll, 'user-1');
      
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('Choice is required for single choice voting');
    });

    it('should reject vote with null choice', async () => {
      const invalidVote = Object.assign({}, mockVoteData, { choice: null as any });
      const validation = await validator.validateVote(invalidVote, mockPoll, 'user-1');
      
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('Choice is required for single choice voting');
    });

    it('should reject vote with non-integer choice', async () => {
      const invalidVote = Object.assign({}, mockVoteData, { choice: 1.5 as any });
      const validation = await validator.validateVote(invalidVote, mockPoll, 'user-1');
      
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('Choice must be a valid integer');
    });

    it('should reject vote with negative choice', async () => {
      const invalidVote = Object.assign({}, mockVoteData, { choice: -1 });
      const validation = await validator.validateVote(invalidVote, mockPoll, 'user-1');
      
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('Choice must be between 0 and 2');
    });

    it('should reject vote with choice exceeding options', async () => {
      const invalidVote = Object.assign({}, mockVoteData, { choice: 5 });
      const validation = await validator.validateVote(invalidVote, mockPoll, 'user-1');
      
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('Choice must be between 0 and 2');
    });
  });

  describe('Approval Voting Validation', () => {
    beforeEach(() => {
      mockPoll.votingMethod = 'approval';
      mockPoll.votingConfig = {
        ...mockPoll.votingConfig,
        maxChoices: 3, // Allow multiple approvals
        allowMultipleVotes: true
      };
      const { choice: _choice, ...approvalVoteData } = mockVoteData;
      mockVoteData = Object.assign({}, approvalVoteData, {
        approvals: [0, 1]
      });
    });

    it('should validate valid approval vote', async () => {
      const validation = await validator.validateVote(mockVoteData, mockPoll, 'user-1');
      
      expect(validation.isValid).toBe(true);
    });

    it('should reject vote with missing approvals', async () => {
      const { approvals: _approvals, ...invalidVote } = mockVoteData;
      const validation = await validator.validateVote(invalidVote, mockPoll, 'user-1');
      
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('Approvals array is required for approval voting');
    });

    it('should reject vote with empty approvals', async () => {
      const invalidVote = Object.assign({}, mockVoteData, { approvals: [] });
      const validation = await validator.validateVote(invalidVote, mockPoll, 'user-1');
      
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('At least one option must be approved');
    });

    it('should reject vote with non-array approvals', async () => {
      const invalidVote = Object.assign({}, mockVoteData, { approvals: 'invalid' as any });
      const validation = await validator.validateVote(invalidVote, mockPoll, 'user-1');
      
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('Approvals array is required for approval voting');
    });

    it('should reject vote with invalid approval indices', async () => {
      const invalidVote = Object.assign({}, mockVoteData, { approvals: [0, 5] });
      const validation = await validator.validateVote(invalidVote, mockPoll, 'user-1');
      
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('Approval index must be between 0 and 2');
    });

    it('should reject vote with duplicate approvals', async () => {
      const invalidVote = Object.assign({}, mockVoteData, { approvals: [0, 0] });
      const validation = await validator.validateVote(invalidVote, mockPoll, 'user-1');
      
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('Duplicate approvals are not allowed');
    });

    it('should respect max choices limit', async () => {
      const limitedPoll = Object.assign({}, mockPoll, { votingConfig: Object.assign({}, mockPoll.votingConfig, { maxChoices: 1 }) });
      const invalidVote = Object.assign({}, mockVoteData, { approvals: [0, 1] });
      const validation = await validator.validateVote(invalidVote, limitedPoll, 'user-1');
      
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('Maximum 1 approvals allowed');
    });
  });

  describe('Ranked Choice Validation', () => {
    beforeEach(() => {
      mockPoll.votingMethod = 'ranked';
      const { choice: _choice, approvals: _approvals, ...rankedVoteData } = mockVoteData;
      mockVoteData = Object.assign({}, rankedVoteData, {
        rankings: [0, 1, 2]
      });
    });

    it('should validate valid ranked vote', async () => {
      const validation = await validator.validateVote(mockVoteData, mockPoll, 'user-1');
      
      expect(validation.isValid).toBe(true);
    });

    it('should reject vote with missing rankings', async () => {
      const { rankings: _rankings, ...invalidVote } = mockVoteData;
      const validation = await validator.validateVote(invalidVote, mockPoll, 'user-1');
      
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('Rankings array is required for ranked choice voting');
    });

    it('should reject vote with incomplete rankings', async () => {
      const invalidVote = Object.assign({}, mockVoteData, { rankings: [0, 1] });
      const validation = await validator.validateVote(invalidVote, mockPoll, 'user-1');
      
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('All options must be ranked');
    });

    it('should reject vote with invalid ranking indices', async () => {
      const invalidVote = Object.assign({}, mockVoteData, { rankings: [0, 1, 5] });
      const validation = await validator.validateVote(invalidVote, mockPoll, 'user-1');
      
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('Ranking index must be between 0 and 2');
    });

    it('should reject vote with duplicate rankings', async () => {
      const invalidVote = Object.assign({}, mockVoteData, { rankings: [0, 0, 1] });
      const validation = await validator.validateVote(invalidVote, mockPoll, 'user-1');
      
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('Duplicate rankings are not allowed');
    });
  });

  describe('Quadratic Voting Validation', () => {
    beforeEach(() => {
      mockPoll.votingMethod = 'quadratic';
      const { choice: _choice, approvals: _approvals, rankings: _rankings, ...quadraticVoteData } = mockVoteData;
      mockVoteData = Object.assign({}, quadraticVoteData, {
        allocations: {
          '0': 5,
          '1': 3
        }
      });
    });

    it('should validate valid quadratic vote', async () => {
      const validation = await validator.validateVote(mockVoteData, mockPoll, 'user-1');
      
      expect(validation.isValid).toBe(true);
    });

    it('should reject vote with missing allocations', async () => {
      const { allocations: _allocations, ...invalidVote } = mockVoteData;
      const validation = await validator.validateVote(invalidVote, mockPoll, 'user-1');
      
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('Allocations object is required for quadratic voting');
    });

    it('should reject vote with negative allocations', async () => {
      const invalidVote = Object.assign({}, mockVoteData, { 
        allocations: { '0': -5 } 
      });
      const validation = await validator.validateVote(invalidVote, mockPoll, 'user-1');
      
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('All allocations must be non-negative integers');
    });

    it('should reject vote with non-integer allocations', async () => {
      const invalidVote = Object.assign({}, mockVoteData, { 
        allocations: { '0': 5.5 } 
      });
      const validation = await validator.validateVote(invalidVote, mockPoll, 'user-1');
      
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('All allocations must be non-negative integers');
    });

    it('should reject vote exceeding credit limit', async () => {
      const invalidVote = Object.assign({}, mockVoteData, { 
        allocations: { '0': 11 } // 11^2 = 121 > 100
      });
      const validation = await validator.validateVote(invalidVote, mockPoll, 'user-1');
      
      expect(validation.isValid).toBe(false);
      expect(validation.error).toContain('exceeds available credits');
    });

    it('should reject vote with no allocations', async () => {
      const invalidVote = Object.assign({}, mockVoteData, { 
        allocations: { '0': 0, '1': 0, '2': 0 } 
      });
      const validation = await validator.validateVote(invalidVote, mockPoll, 'user-1');
      
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('At least one option must receive votes');
    });
  });

  describe('Range Voting Validation', () => {
    beforeEach(() => {
      mockPoll.votingMethod = 'range';
      const { choice: _choice, approvals: _approvals, rankings: _rankings, allocations: _allocations, ratings: _ratings, ...rangeVoteData } = mockVoteData;
      mockVoteData = Object.assign({}, rangeVoteData, {
        ratings: {
          '0': 8,
          '1': 6,
          '2': 4
        }
      });
    });

    it('should validate valid range vote', async () => {
      const validation = await validator.validateVote(mockVoteData, mockPoll, 'user-1');
      
      expect(validation.isValid).toBe(true);
    });

    it('should reject vote with missing ratings', async () => {
      const { ratings: _ratings, ...invalidVote } = mockVoteData;
      const validation = await validator.validateVote(invalidVote, mockPoll, 'user-1');
      
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('Ratings object is required for range voting');
    });

    it('should reject vote with ratings outside range', async () => {
      const invalidVote = Object.assign({}, mockVoteData, { 
        ratings: { '0': 15 } 
      });
      const validation = await validator.validateVote(invalidVote, mockPoll, 'user-1');
      
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('Rating must be between 0 and 10');
    });

    it('should reject vote with incomplete ratings', async () => {
      const invalidVote = Object.assign({}, mockVoteData, { 
        ratings: { '0': 8, '1': 6 } 
      });
      const validation = await validator.validateVote(invalidVote, mockPoll, 'user-1');
      
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('All options must be rated');
    });

    it('should reject vote with all minimum ratings', async () => {
      const invalidVote = Object.assign({}, mockVoteData, { 
        ratings: { '0': 0, '1': 0, '2': 0 } 
      });
      const validation = await validator.validateVote(invalidVote, mockPoll, 'user-1');
      
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('At least one option must have a rating above the minimum');
    });
  });

  describe('Security Validation', () => {
    it('should require authentication when verification is required', async () => {
      const verifiedPoll = Object.assign({}, mockPoll, { 
        votingConfig: Object.assign({}, mockPoll.votingConfig, { requireVerification: true }) 
      });
      const validation = await validator.validateVote(mockVoteData, verifiedPoll);
      
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('Authentication required for this poll');
    });

    it('should accept vote when verification is not required', async () => {
      const validation = await validator.validateVote(mockVoteData, mockPoll);
      
      expect(validation.isValid).toBe(true);
    });

    it('should check trust tier requirements', async () => {
      const highTrustPoll = Object.assign({}, mockPoll, { 
        votingConfig: Object.assign({}, mockPoll.votingConfig, { 
          minTrustTier: 'T2',
          allowMultipleVotes: true // Allow multiple votes to avoid existing vote check
        })
      });
      
      // Mock no existing vote (user can vote)
      when().table('votes').op('select').eq('poll_id', 'test-poll-123').eq('user_id', 'user-1').returnsList([]);
      
      // Mock getUserTrustTier to return T1 (insufficient)
      when().table('user_profiles').op('select').select('trust_tier').eq('user_id', 'user-1').returnsSingle({ trust_tier: 'T1' });
      
      const validation = await validator.validateVote(mockVoteData, highTrustPoll, 'user-1');
      
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('Insufficient trust tier for this poll');
    });

    it('should accept vote with sufficient trust tier', async () => {
      const highTrustPoll = Object.assign({}, mockPoll, { 
        votingConfig: Object.assign({}, mockPoll.votingConfig, { 
          minTrustTier: 'T1',
          allowMultipleVotes: true // Allow multiple votes to avoid existing vote check
        })
      });
      
      // Mock getUserTrustTier to return T2 (sufficient)
      when().table('user_profiles').op('select').select('trust_tier').eq('user_id', 'user-1').returnsSingle({ trust_tier: 'T2' });
      
      const validation = await validator.validateVote(mockVoteData, highTrustPoll, 'user-1');
      
      // The validation should pass since T2 >= T1
      expect(validation.isValid).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle validation errors gracefully', async () => {
      // Mock a method to throw an error
      const originalValidateBasicVoteData = (validator as any).validateBasicVoteData;
      (validator as any).validateBasicVoteData = jest.fn().mockImplementation(() => {
        throw new Error('Validation error');
      });

      const validation = await validator.validateVote(mockVoteData, mockPoll, 'user-1');
      
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('Validation error');

      // Restore original method
      (validator as any).validateBasicVoteData = originalValidateBasicVoteData;
    });

    it('should handle database errors gracefully', async () => {
      // Create a new validator instance to avoid interference with other tests
      const testValidator = new VoteValidator();
      
      // Mock the getUserTrustTier method to return T0 (default fallback)
      const originalGetUserTrustTier = (testValidator as any).getUserTrustTier;
      const mockGetUserTrustTier = jest.fn() as jest.MockedFunction<() => Promise<string>>;
      mockGetUserTrustTier.mockResolvedValue('T0');
      (testValidator as any).getUserTrustTier = mockGetUserTrustTier;

      const highTrustPoll = Object.assign({}, mockPoll, { 
        votingConfig: Object.assign({}, mockPoll.votingConfig, { 
          minTrustTier: 'T1',
          allowMultipleVotes: true // Allow multiple votes to avoid existing vote check
        })
      });
      
      const validation = await testValidator.validateVote(mockVoteData, highTrustPoll, 'user-1');
      
      // Should fall back to default trust tier (T0) and fail
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('Insufficient trust tier for this poll');
      
      // Restore original method
      (testValidator as any).getUserTrustTier = originalGetUserTrustTier;
    });
  });
});
