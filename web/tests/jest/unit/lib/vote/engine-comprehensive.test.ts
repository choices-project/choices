/**
 * Comprehensive Vote Engine Tests
 * 
 * Tests the core voting engine with all voting strategies
 * Tests validation, processing, and results calculation
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { VoteEngine, type VoteEngineConfig } from '@/lib/vote/engine'
import type { VoteRequest, VoteResponse, PollData, VotingMethod } from '@/lib/vote/types'

// Mock the logger
jest.mock('@/lib/utils/logger', () => ({
  devLog: jest.fn()
}))

describe('VoteEngine', () => {
  let engine: VoteEngine
  let config: VoteEngineConfig
  let mockPoll: PollData
  let mockVoteRequest: VoteRequest

  beforeEach(() => {
    config = {
      maxVotesPerPoll: 1,
      allowMultipleVotes: false,
      requireAuthentication: true,
      minTrustTier: 'basic',
      rateLimitPerUser: 10,
      rateLimitWindowMs: 60000
    }

    engine = new VoteEngine(config)

    mockPoll = {
      id: 'test-poll-id',
      title: 'Test Poll',
      description: 'A test poll',
      votingMethod: 'single' as VotingMethod,
      options: [
        { id: 'option-1', text: 'Option 1' },
        { id: 'option-2', text: 'Option 2' }
      ],
      status: 'active',
      createdAt: new Date(),
      closeAt: new Date(Date.now() + 86400000), // 24 hours from now
      createdBy: 'user-1',
      settings: {
        allowMultipleVotes: false,
        requireAuthentication: true,
        anonymousVoting: false
      }
    }

    mockVoteRequest = {
      pollId: 'test-poll-id',
      userId: 'user-1',
      voteData: {
        choice: 0, // Index of option-1
        approvals: null,
        rankings: null,
        allocations: null,
        ratings: null
      },
      metadata: {
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        timestamp: new Date()
      }
    }
  })

  describe('Initialization', () => {
    it('should initialize with provided configuration', () => {
      expect(engine).toBeDefined()
    })

    it('should use default configuration when none provided', () => {
      const defaultEngine = new VoteEngine()
      expect(defaultEngine).toBeDefined()
    })
  })

  describe('Vote Validation', () => {
    it('should validate single-choice votes correctly', async () => {
      const validation = await engine.validateVote(mockVoteRequest, mockPoll)
      
      expect(validation.valid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    it('should reject votes with invalid poll ID', async () => {
      const invalidRequest = { ...mockVoteRequest, pollId: 'invalid-poll' }
      
      const validation = await engine.validateVote(invalidRequest, mockPoll)
      
      expect(validation.valid).toBe(false)
      expect(validation.errors).toContain('Poll ID mismatch')
    })

    it('should reject votes for closed polls', async () => {
      const closedPoll = { ...mockPoll, status: 'closed' as const }
      
      const validation = await engine.validateVote(mockVoteRequest, closedPoll)
      
      expect(validation.valid).toBe(false)
      expect(validation.errors).toContain('Poll is not active')
    })

    it('should reject votes with invalid options', async () => {
      const invalidRequest = {
        ...mockVoteRequest,
        voteData: {
          choice: 999, // Invalid option index
          approvals: null,
          rankings: null,
          allocations: null,
          ratings: null
        }
      }
      
      const validation = await engine.validateVote(invalidRequest, mockPoll)
      
      expect(validation.valid).toBe(false)
      expect(validation.errors).toContain('Invalid option selected')
    })

    it('should validate ranked-choice votes', async () => {
      const rankedPoll = { ...mockPoll, votingMethod: 'ranked' as VotingMethod }
      const rankedRequest = {
        ...mockVoteRequest,
        voteData: {
          choice: null,
          approvals: null,
          rankings: [0, 1], // Rankings for option-1 and option-2
          allocations: null,
          ratings: null
        }
      }
      
      const validation = await engine.validateVote(rankedRequest, rankedPoll)
      
      expect(validation.valid).toBe(true)
    })

    it('should validate approval votes', async () => {
      const approvalPoll = { ...mockPoll, votingMethod: 'approval' as VotingMethod }
      const approvalRequest = {
        ...mockVoteRequest,
        voteData: {
          choice: null,
          approvals: [0, 1], // Approve option-1 and option-2
          rankings: null,
          allocations: null,
          ratings: null
        }
      }
      
      const validation = await engine.validateVote(approvalRequest, approvalPoll)
      
      expect(validation.valid).toBe(true)
    })

    it('should validate quadratic votes', async () => {
      const quadraticPoll = { ...mockPoll, votingMethod: 'quadratic' as VotingMethod }
      const quadraticRequest = {
        ...mockVoteRequest,
        voteData: {
          choice: null,
          approvals: null,
          rankings: null,
          allocations: { 'option-1': 2, 'option-2': 1 },
          ratings: null
        }
      }
      
      const validation = await engine.validateVote(quadraticRequest, quadraticPoll)
      
      expect(validation.valid).toBe(true)
    })
  })

  describe('Vote Processing', () => {
    it('should process single-choice votes successfully', async () => {
      const response = await engine.processVote(mockVoteRequest, mockPoll)
      
      expect(response.success).toBe(true)
      expect(response.voteId).toBeDefined()
      expect(response.auditReceipt).toBeDefined()
    })

    it('should process ranked-choice votes successfully', async () => {
      const rankedPoll = { ...mockPoll, votingMethod: 'ranked-choice' as VotingMethod }
      const rankedRequest = {
        ...mockVoteRequest,
        voteData: {
          choice: null,
          approvals: null,
          rankings: [0, 1], // Rank option-1 first, option-2 second
          allocations: null,
          ratings: null
        }
      }
      
      const response = await engine.processVote(rankedRequest, rankedPoll)
      
      expect(response.success).toBe(true)
      expect(response.voteId).toBeDefined()
    })

    it('should handle vote processing errors gracefully', async () => {
      // Mock a processing error by creating a poll with invalid voting method
      const invalidPoll = { ...mockPoll, votingMethod: 'invalid-method' as any }
      
      const response = await engine.processVote(mockVoteRequest, invalidPoll)
      
      expect(response.success).toBe(false)
      expect(response.error).toBeDefined()
    })
  })

  describe('Results Calculation', () => {
    it('should calculate single-choice results', async () => {
      const votes = [
        { choice: 0, approvals: null, rankings: null, allocations: null, ratings: null },
        { choice: 0, approvals: null, rankings: null, allocations: null, ratings: null },
        { choice: 1, approvals: null, rankings: null, allocations: null, ratings: null }
      ]
      
      const results = await engine.calculateResults(mockPoll, votes)
      
      expect(results).toBeDefined()
      expect(results.totalVotes).toBe(3)
      expect(results.results.winner).toBe('option-1')
    })

    it('should calculate ranked-choice results', async () => {
      const rankedPoll = { ...mockPoll, votingMethod: 'ranked-choice' as VotingMethod }
      const votes = [
        { choice: null, approvals: null, rankings: [0, 1], allocations: null, ratings: null },
        { choice: null, approvals: null, rankings: [1, 0], allocations: null, ratings: null }
      ]
      
      const results = await engine.calculateResults(rankedPoll, votes)
      
      expect(results).toBeDefined()
      expect(results.totalVotes).toBe(2)
    })

    it('should handle empty vote sets', async () => {
      const results = await engine.calculateResults(mockPoll, [])
      
      expect(results).toBeDefined()
      expect(results.totalVotes).toBe(0)
      expect(results.results.winner).toBeNull()
    })

    it('should handle tie scenarios', async () => {
      const votes = [
        { choice: 0, approvals: null, rankings: null, allocations: null, ratings: null },
        { choice: 1, approvals: null, rankings: null, allocations: null, ratings: null }
      ]
      
      const results = await engine.calculateResults(mockPoll, votes)
      
      expect(results).toBeDefined()
      expect(results.totalVotes).toBe(2)
      // In a tie, the result should indicate no clear winner
    })
  })

  describe('Rate Limiting', () => {
    it('should enforce rate limits', async () => {
      // Create multiple requests from the same user
      const requests = Array.from({ length: 15 }, (_, i) => ({
        ...mockVoteRequest,
        userId: 'user-1',
        metadata: {
          ...mockVoteRequest.metadata,
          timestamp: new Date(Date.now() + i * 1000)
        }
      }))
      
      // Process requests and check rate limiting
      const responses = await Promise.all(
        requests.map(request => engine.processVote(request, mockPoll))
      )
      
      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(r => !r.success && r.error?.includes('Rate limit exceeded'))
      expect(rateLimitedResponses.length).toBeGreaterThan(0)
    })

    it('should allow requests within rate limit', async () => {
      const requests = Array.from({ length: 5 }, (_, i) => ({
        ...mockVoteRequest,
        userId: 'user-1',
        metadata: {
          ...mockVoteRequest.metadata,
          timestamp: new Date(Date.now() + i * 1000)
        }
      }))
      
      const responses = await Promise.all(
        requests.map(request => engine.processVote(request, mockPoll))
      )
      
      // All requests should succeed within rate limit
      const successfulResponses = responses.filter(r => r.success)
      expect(successfulResponses.length).toBe(5)
    })
  })

  describe('Authentication', () => {
    it('should require authentication when configured', async () => {
      const unauthenticatedRequest = { ...mockVoteRequest, userId: null }
      
      const validation = await engine.validateVote(unauthenticatedRequest, mockPoll)
      
      expect(validation.valid).toBe(false)
      expect(validation.errors).toContain('Authentication required to vote')
    })

    it('should allow anonymous voting when configured', async () => {
      const anonymousPoll = {
        ...mockPoll,
        settings: { ...mockPoll.settings, anonymousVoting: true }
      }
      
      const anonymousRequest = { ...mockVoteRequest, userId: null }
      
      const validation = await engine.validateVote(anonymousRequest, anonymousPoll)
      
      expect(validation.valid).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('should handle malformed vote data', async () => {
      const malformedRequest = {
        ...mockVoteRequest,
        voteData: null
      }
      
      const response = await engine.processVote(malformedRequest, mockPoll)
      
      expect(response.success).toBe(false)
      expect(response.error).toBeDefined()
    })

    it('should handle missing poll data', async () => {
      const response = await engine.processVote(mockVoteRequest, null as any)
      
      expect(response.success).toBe(false)
      expect(response.error).toBeDefined()
    })

    it('should handle network errors gracefully', async () => {
      // Create a scenario that would cause a processing error
      const invalidRequest = {
        ...mockVoteRequest,
        voteData: null as any // This should cause a validation error
      }
      
      const response = await engine.processVote(invalidRequest, mockPoll)
      
      expect(response.success).toBe(false)
      expect(response.error).toBeDefined()
    })
  })

  describe('Performance', () => {
    it('should process votes within reasonable time', async () => {
      const startTime = performance.now()
      
      await engine.processVote(mockVoteRequest, mockPoll)
      
      const endTime = performance.now()
      const processingTime = endTime - startTime
      
      // Should process within 100ms
      expect(processingTime).toBeLessThan(100)
    })

    it('should handle large vote sets efficiently', async () => {
      const largeVoteSet = Array.from({ length: 1000 }, (_, i) => ({
        ...mockVoteRequest,
        userId: `user-${i}`,
        voteData: {
          selectedOptions: ['option-1'],
          ranking: null,
          weights: null
        }
      }))
      
      const startTime = performance.now()
      
      const results = await engine.calculateResults(mockPoll, largeVoteSet)
      
      const endTime = performance.now()
      const processingTime = endTime - startTime
      
      expect(results).toBeDefined()
      expect(processingTime).toBeLessThan(1000) // Should process within 1 second
    })
  })
})



 * 
 * Tests the core voting engine with all voting strategies
 * Tests validation, processing, and results calculation
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { VoteEngine, type VoteEngineConfig } from '@/lib/vote/engine'
import type { VoteRequest, VoteResponse, PollData, VotingMethod } from '@/lib/vote/types'

// Mock the logger
jest.mock('@/lib/utils/logger', () => ({
  devLog: jest.fn()
}))

describe('VoteEngine', () => {
  let engine: VoteEngine
  let config: VoteEngineConfig
  let mockPoll: PollData
  let mockVoteRequest: VoteRequest

  beforeEach(() => {
    config = {
      maxVotesPerPoll: 1,
      allowMultipleVotes: false,
      requireAuthentication: true,
      minTrustTier: 'basic',
      rateLimitPerUser: 10,
      rateLimitWindowMs: 60000
    }

    engine = new VoteEngine(config)

    mockPoll = {
      id: 'test-poll-id',
      title: 'Test Poll',
      description: 'A test poll',
      votingMethod: 'single' as VotingMethod,
      options: [
        { id: 'option-1', text: 'Option 1' },
        { id: 'option-2', text: 'Option 2' }
      ],
      status: 'active',
      createdAt: new Date(),
      closeAt: new Date(Date.now() + 86400000), // 24 hours from now
      createdBy: 'user-1',
      settings: {
        allowMultipleVotes: false,
        requireAuthentication: true,
        anonymousVoting: false
      }
    }

    mockVoteRequest = {
      pollId: 'test-poll-id',
      userId: 'user-1',
      voteData: {
        choice: 0, // Index of option-1
        approvals: null,
        rankings: null,
        allocations: null,
        ratings: null
      },
      metadata: {
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        timestamp: new Date()
      }
    }
  })

  describe('Initialization', () => {
    it('should initialize with provided configuration', () => {
      expect(engine).toBeDefined()
    })

    it('should use default configuration when none provided', () => {
      const defaultEngine = new VoteEngine()
      expect(defaultEngine).toBeDefined()
    })
  })

  describe('Vote Validation', () => {
    it('should validate single-choice votes correctly', async () => {
      const validation = await engine.validateVote(mockVoteRequest, mockPoll)
      
      expect(validation.valid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    it('should reject votes with invalid poll ID', async () => {
      const invalidRequest = { ...mockVoteRequest, pollId: 'invalid-poll' }
      
      const validation = await engine.validateVote(invalidRequest, mockPoll)
      
      expect(validation.valid).toBe(false)
      expect(validation.errors).toContain('Poll ID mismatch')
    })

    it('should reject votes for closed polls', async () => {
      const closedPoll = { ...mockPoll, status: 'closed' as const }
      
      const validation = await engine.validateVote(mockVoteRequest, closedPoll)
      
      expect(validation.valid).toBe(false)
      expect(validation.errors).toContain('Poll is not active')
    })

    it('should reject votes with invalid options', async () => {
      const invalidRequest = {
        ...mockVoteRequest,
        voteData: {
          choice: 999, // Invalid option index
          approvals: null,
          rankings: null,
          allocations: null,
          ratings: null
        }
      }
      
      const validation = await engine.validateVote(invalidRequest, mockPoll)
      
      expect(validation.valid).toBe(false)
      expect(validation.errors).toContain('Invalid option selected')
    })

    it('should validate ranked-choice votes', async () => {
      const rankedPoll = { ...mockPoll, votingMethod: 'ranked' as VotingMethod }
      const rankedRequest = {
        ...mockVoteRequest,
        voteData: {
          choice: null,
          approvals: null,
          rankings: [0, 1], // Rankings for option-1 and option-2
          allocations: null,
          ratings: null
        }
      }
      
      const validation = await engine.validateVote(rankedRequest, rankedPoll)
      
      expect(validation.valid).toBe(true)
    })

    it('should validate approval votes', async () => {
      const approvalPoll = { ...mockPoll, votingMethod: 'approval' as VotingMethod }
      const approvalRequest = {
        ...mockVoteRequest,
        voteData: {
          choice: null,
          approvals: [0, 1], // Approve option-1 and option-2
          rankings: null,
          allocations: null,
          ratings: null
        }
      }
      
      const validation = await engine.validateVote(approvalRequest, approvalPoll)
      
      expect(validation.valid).toBe(true)
    })

    it('should validate quadratic votes', async () => {
      const quadraticPoll = { ...mockPoll, votingMethod: 'quadratic' as VotingMethod }
      const quadraticRequest = {
        ...mockVoteRequest,
        voteData: {
          choice: null,
          approvals: null,
          rankings: null,
          allocations: { 'option-1': 2, 'option-2': 1 },
          ratings: null
        }
      }
      
      const validation = await engine.validateVote(quadraticRequest, quadraticPoll)
      
      expect(validation.valid).toBe(true)
    })
  })

  describe('Vote Processing', () => {
    it('should process single-choice votes successfully', async () => {
      const response = await engine.processVote(mockVoteRequest, mockPoll)
      
      expect(response.success).toBe(true)
      expect(response.voteId).toBeDefined()
      expect(response.auditReceipt).toBeDefined()
    })

    it('should process ranked-choice votes successfully', async () => {
      const rankedPoll = { ...mockPoll, votingMethod: 'ranked-choice' as VotingMethod }
      const rankedRequest = {
        ...mockVoteRequest,
        voteData: {
          choice: null,
          approvals: null,
          rankings: [0, 1], // Rank option-1 first, option-2 second
          allocations: null,
          ratings: null
        }
      }
      
      const response = await engine.processVote(rankedRequest, rankedPoll)
      
      expect(response.success).toBe(true)
      expect(response.voteId).toBeDefined()
    })

    it('should handle vote processing errors gracefully', async () => {
      // Mock a processing error by creating a poll with invalid voting method
      const invalidPoll = { ...mockPoll, votingMethod: 'invalid-method' as any }
      
      const response = await engine.processVote(mockVoteRequest, invalidPoll)
      
      expect(response.success).toBe(false)
      expect(response.error).toBeDefined()
    })
  })

  describe('Results Calculation', () => {
    it('should calculate single-choice results', async () => {
      const votes = [
        { choice: 0, approvals: null, rankings: null, allocations: null, ratings: null },
        { choice: 0, approvals: null, rankings: null, allocations: null, ratings: null },
        { choice: 1, approvals: null, rankings: null, allocations: null, ratings: null }
      ]
      
      const results = await engine.calculateResults(mockPoll, votes)
      
      expect(results).toBeDefined()
      expect(results.totalVotes).toBe(3)
      expect(results.results.winner).toBe('option-1')
    })

    it('should calculate ranked-choice results', async () => {
      const rankedPoll = { ...mockPoll, votingMethod: 'ranked-choice' as VotingMethod }
      const votes = [
        { choice: null, approvals: null, rankings: [0, 1], allocations: null, ratings: null },
        { choice: null, approvals: null, rankings: [1, 0], allocations: null, ratings: null }
      ]
      
      const results = await engine.calculateResults(rankedPoll, votes)
      
      expect(results).toBeDefined()
      expect(results.totalVotes).toBe(2)
    })

    it('should handle empty vote sets', async () => {
      const results = await engine.calculateResults(mockPoll, [])
      
      expect(results).toBeDefined()
      expect(results.totalVotes).toBe(0)
      expect(results.results.winner).toBeNull()
    })

    it('should handle tie scenarios', async () => {
      const votes = [
        { choice: 0, approvals: null, rankings: null, allocations: null, ratings: null },
        { choice: 1, approvals: null, rankings: null, allocations: null, ratings: null }
      ]
      
      const results = await engine.calculateResults(mockPoll, votes)
      
      expect(results).toBeDefined()
      expect(results.totalVotes).toBe(2)
      // In a tie, the result should indicate no clear winner
    })
  })

  describe('Rate Limiting', () => {
    it('should enforce rate limits', async () => {
      // Create multiple requests from the same user
      const requests = Array.from({ length: 15 }, (_, i) => ({
        ...mockVoteRequest,
        userId: 'user-1',
        metadata: {
          ...mockVoteRequest.metadata,
          timestamp: new Date(Date.now() + i * 1000)
        }
      }))
      
      // Process requests and check rate limiting
      const responses = await Promise.all(
        requests.map(request => engine.processVote(request, mockPoll))
      )
      
      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(r => !r.success && r.error?.includes('Rate limit exceeded'))
      expect(rateLimitedResponses.length).toBeGreaterThan(0)
    })

    it('should allow requests within rate limit', async () => {
      const requests = Array.from({ length: 5 }, (_, i) => ({
        ...mockVoteRequest,
        userId: 'user-1',
        metadata: {
          ...mockVoteRequest.metadata,
          timestamp: new Date(Date.now() + i * 1000)
        }
      }))
      
      const responses = await Promise.all(
        requests.map(request => engine.processVote(request, mockPoll))
      )
      
      // All requests should succeed within rate limit
      const successfulResponses = responses.filter(r => r.success)
      expect(successfulResponses.length).toBe(5)
    })
  })

  describe('Authentication', () => {
    it('should require authentication when configured', async () => {
      const unauthenticatedRequest = { ...mockVoteRequest, userId: null }
      
      const validation = await engine.validateVote(unauthenticatedRequest, mockPoll)
      
      expect(validation.valid).toBe(false)
      expect(validation.errors).toContain('Authentication required to vote')
    })

    it('should allow anonymous voting when configured', async () => {
      const anonymousPoll = {
        ...mockPoll,
        settings: { ...mockPoll.settings, anonymousVoting: true }
      }
      
      const anonymousRequest = { ...mockVoteRequest, userId: null }
      
      const validation = await engine.validateVote(anonymousRequest, anonymousPoll)
      
      expect(validation.valid).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('should handle malformed vote data', async () => {
      const malformedRequest = {
        ...mockVoteRequest,
        voteData: null
      }
      
      const response = await engine.processVote(malformedRequest, mockPoll)
      
      expect(response.success).toBe(false)
      expect(response.error).toBeDefined()
    })

    it('should handle missing poll data', async () => {
      const response = await engine.processVote(mockVoteRequest, null as any)
      
      expect(response.success).toBe(false)
      expect(response.error).toBeDefined()
    })

    it('should handle network errors gracefully', async () => {
      // Create a scenario that would cause a processing error
      const invalidRequest = {
        ...mockVoteRequest,
        voteData: null as any // This should cause a validation error
      }
      
      const response = await engine.processVote(invalidRequest, mockPoll)
      
      expect(response.success).toBe(false)
      expect(response.error).toBeDefined()
    })
  })

  describe('Performance', () => {
    it('should process votes within reasonable time', async () => {
      const startTime = performance.now()
      
      await engine.processVote(mockVoteRequest, mockPoll)
      
      const endTime = performance.now()
      const processingTime = endTime - startTime
      
      // Should process within 100ms
      expect(processingTime).toBeLessThan(100)
    })

    it('should handle large vote sets efficiently', async () => {
      const largeVoteSet = Array.from({ length: 1000 }, (_, i) => ({
        ...mockVoteRequest,
        userId: `user-${i}`,
        voteData: {
          selectedOptions: ['option-1'],
          ranking: null,
          weights: null
        }
      }))
      
      const startTime = performance.now()
      
      const results = await engine.calculateResults(mockPoll, largeVoteSet)
      
      const endTime = performance.now()
      const processingTime = endTime - startTime
      
      expect(results).toBeDefined()
      expect(processingTime).toBeLessThan(1000) // Should process within 1 second
    })
  })
})
