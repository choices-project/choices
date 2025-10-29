/**
 * Voting System Integration Tests
 *
 * Tests the complete voting system with real business logic
 * Focuses on actual functionality rather than heavy mocking
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { VoteEngine } from '@/lib/vote/engine'
import { IRVCalculator } from '@/lib/vote/irv-calculator'
import type { VoteRequest, PollData, VotingMethod, Candidate } from '@/lib/vote/types'

// Mock only the logger - everything else should be real
jest.mock('@/lib/utils/logger', () => ({
  devLog: jest.fn()
}))

describe('Voting System Integration', () => {
  let engine: VoteEngine
  let poll: PollData
  let candidates: Candidate[]

  beforeEach(() => {
    engine = new VoteEngine({
      maxVotesPerPoll: 1,
      allowMultipleVotes: false,
      requireAuthentication: true,
      minTrustTier: 'basic',
      rateLimitPerUser: 10,
      rateLimitWindowMs: 60000
    })

    candidates = [
      { id: 'candidate-1', name: 'Alice', description: 'Alice for Mayor' },
      { id: 'candidate-2', name: 'Bob', description: 'Bob for Mayor' },
      { id: 'candidate-3', name: 'Charlie', description: 'Charlie for Mayor' }
    ]

    poll = {
      id: 'test-poll-id',
      title: 'Mayor Election',
      description: 'Choose your next mayor',
      votingMethod: 'single-choice' as VotingMethod,
      options: candidates,
      status: 'active',
      createdAt: new Date(),
      closeAt: new Date(Date.now() + 86400000), // 24 hours from now
      createdBy: 'user-1',
      votingConfig: {
        allowMultipleVotes: false,
        requireAuthentication: true,
        anonymousVoting: false
      }
    }
  })

  describe('Single Choice Voting', () => {
    it('should process single choice votes correctly', async () => {
      const voteRequest: VoteRequest = {
        pollId: 'test-poll-id',
        userId: 'user-1',
        voteData: {
          choice: 0, // First candidate
          ranking: null,
          weights: null
        },
        metadata: {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          timestamp: new Date()
        }
      }

      // Test validation
      const validation = await engine.validateVote(voteRequest, poll)
      expect(validation.valid).toBe(true)

      // Test processing
      const response = await engine.processVote(voteRequest, poll)
      expect(response.success).toBe(true)
      expect(response.voteId).toBeDefined()
    })

    it('should reject votes for closed polls', async () => {
      const closedPoll = { ...poll, status: 'closed' as const }

      const voteRequest: VoteRequest = {
        pollId: 'test-poll-id',
        userId: 'user-1',
        voteData: {
          ranking: null,
          weights: null
        },
        metadata: {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          timestamp: new Date()
        }
      }

      const validation = await engine.validateVote(voteRequest, closedPoll)
      expect(validation.valid).toBe(false)
      expect(validation.errors).toContain('Poll is not active')
    })

    it('should reject votes with invalid options', async () => {
      const voteRequest: VoteRequest = {
        pollId: 'test-poll-id',
        userId: 'user-1',
        voteData: {
          choice: 999, // Invalid choice
          ranking: null,
          weights: null
        },
        metadata: {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          timestamp: new Date()
        }
      }

      const validation = await engine.validateVote(voteRequest, poll)
      expect(validation.valid).toBe(false)
      expect(validation.errors).toContain('Invalid option selected')
    })
  })

  describe('Ranked Choice Voting', () => {
    it('should process ranked choice votes correctly', async () => {
      const rankedPoll = { ...poll, votingMethod: 'ranked-choice' as VotingMethod }

      const voteRequest: VoteRequest = {
        pollId: 'test-poll-id',
        userId: 'user-1',
        voteData: {
          rankings: [0, 1, 2], // Indices of candidates in order of preference
          weights: null
        },
        metadata: {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          timestamp: new Date()
        }
      }

      const validation = await engine.validateVote(voteRequest, rankedPoll)
      expect(validation.valid).toBe(true)

      const response = await engine.processVote(voteRequest, rankedPoll)
      expect(response.success).toBe(true)
    })

    it('should calculate IRV results correctly', () => {
      const calculator = new IRVCalculator('test-poll', candidates)

      const userRankings = [
        { userId: 'user-1', pollId: 'test-poll-id', ranking: ['candidate-1', 'candidate-2', 'candidate-3'], createdAt: new Date() },
        { userId: 'user-2', pollId: 'test-poll-id', ranking: ['candidate-1', 'candidate-2', 'candidate-3'], createdAt: new Date() },
        { userId: 'user-3', pollId: 'test-poll-id', ranking: ['candidate-2', 'candidate-1', 'candidate-3'], createdAt: new Date() },
        { userId: 'user-4', pollId: 'test-poll-id', ranking: ['candidate-2', 'candidate-1', 'candidate-3'], createdAt: new Date() }
      ]

      const results = calculator.calculateResults(userRankings)

      expect(results.totalVotes).toBe(4)
      expect(results.winner).toBe('candidate-1')
      expect(results.rounds).toHaveLength(2) // IRV correctly takes 2 rounds to determine winner
    })

    it('should handle tie scenarios in IRV', () => {
      const calculator = new IRVCalculator('test-poll', candidates)

      const userRankings = [
        { userId: 'user-1', pollId: 'test-poll-id', ranking: ['candidate-1', 'candidate-2', 'candidate-3'], createdAt: new Date() },
        { userId: 'user-2', pollId: 'test-poll-id', ranking: ['candidate-2', 'candidate-1', 'candidate-3'], createdAt: new Date() }
      ]

      const results = calculator.calculateResults(userRankings)

      expect(results.totalVotes).toBe(2)
      expect(results.rounds.length).toBeGreaterThan(1)
    })
  })

  describe('Approval Voting', () => {
    it('should process approval votes correctly', async () => {
      const approvalPoll = { ...poll, votingMethod: 'approval' as VotingMethod }

      const voteRequest: VoteRequest = {
        pollId: 'test-poll-id',
        userId: 'user-1',
        voteData: {
          approvals: [0, 1], // Approve first two candidates
          ranking: null,
          weights: null
        },
        metadata: {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          timestamp: new Date()
        }
      }

      const validation = await engine.validateVote(voteRequest, approvalPoll)
      expect(validation.valid).toBe(true)

      const response = await engine.processVote(voteRequest, approvalPoll)
      expect(response.success).toBe(true)
    })
  })

  describe('Quadratic Voting', () => {
    it('should process quadratic votes correctly', async () => {
      const quadraticPoll = { ...poll, votingMethod: 'quadratic' as VotingMethod }

      const voteRequest: VoteRequest = {
        pollId: 'test-poll-id',
        userId: 'user-1',
        voteData: {
          ranking: null,
          allocations: { '0': 2, '1': 1 } // Allocate credits to first two candidates
        },
        metadata: {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          timestamp: new Date()
        }
      }

      const validation = await engine.validateVote(voteRequest, quadraticPoll)
      if (!validation.valid) {
        console.log('Quadratic validation failed:', validation.errors)
      }
      expect(validation.valid).toBe(true)

      const response = await engine.processVote(voteRequest, quadraticPoll)
      expect(response.success).toBe(true)
    })
  })

  describe('Rate Limiting', () => {
    it('should enforce rate limits', async () => {
      const voteRequest: VoteRequest = {
        pollId: 'test-poll-id',
        userId: 'user-1',
        voteData: {
          choice: 0, // First candidate
          ranking: null,
          weights: null
        },
        metadata: {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          timestamp: new Date()
        }
      }

      // Make multiple requests to test rate limiting
      const responses = []
      for (let i = 0; i < 15; i++) {
        const response = await engine.processVote(voteRequest, poll)
        responses.push(response)
      }

      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(r => !r.success && r.error?.includes('Rate limit exceeded'))
      expect(rateLimitedResponses.length).toBeGreaterThan(0)
    })
  })

  describe('Results Calculation', () => {
    it('should calculate results for single choice votes', async () => {
      const votes = [
        {
          id: 'vote-1',
          pollId: 'test-poll-id',
          userId: 'user-1',
          choice: 0, // First candidate
          privacyLevel: 'public',
          timestamp: new Date(),
          auditReceipt: 'receipt-1'
        },
        {
          id: 'vote-2',
          pollId: 'test-poll-id',
          userId: 'user-2',
          choice: 0, // First candidate
          privacyLevel: 'public',
          timestamp: new Date(),
          auditReceipt: 'receipt-2'
        },
        {
          id: 'vote-3',
          pollId: 'test-poll-id',
          userId: 'user-3',
          choice: 1, // Second candidate
          privacyLevel: 'public',
          timestamp: new Date(),
          auditReceipt: 'receipt-3'
        }
      ]

      const results = await engine.calculateResults(poll, votes)

      expect(results.totalVotes).toBe(3)
      expect(results.results.winner).toBe('candidate-1') // Winner is the candidate ID
    })

    it('should handle empty vote sets', async () => {
      const results = await engine.calculateResults(poll, [])

      expect(results.totalVotes).toBe(0)
      expect(results.results.winner).toBeNull()
    })
  })

  describe('Error Handling', () => {
    it('should handle malformed vote data', async () => {
      const malformedRequest = {
        pollId: 'test-poll-id',
        userId: 'user-1',
        voteData: null,
        metadata: {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          timestamp: new Date()
        }
      } as any

      const response = await engine.processVote(malformedRequest, poll)

      expect(response.success).toBe(false)
      expect(response.error).toBeDefined()
    })

    it('should handle missing poll data', async () => {
      const voteRequest: VoteRequest = {
        pollId: 'test-poll-id',
        userId: 'user-1',
        voteData: {
          ranking: null,
          weights: null
        },
        metadata: {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          timestamp: new Date()
        }
      }

      const response = await engine.processVote(voteRequest, null as any)

      expect(response.success).toBe(false)
      expect(response.error).toBeDefined()
    })
  })

  describe('Performance', () => {
    it('should process votes within reasonable time', async () => {
      const voteRequest: VoteRequest = {
        pollId: 'test-poll-id',
        userId: 'user-1',
        voteData: {
          ranking: null,
          weights: null
        },
        metadata: {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          timestamp: new Date()
        }
      }

      const startTime = performance.now()
      await engine.processVote(voteRequest, poll)
      const endTime = performance.now()

      const processingTime = endTime - startTime
      expect(processingTime).toBeLessThan(100) // Should process within 100ms
    })

    it('should handle large vote sets efficiently', async () => {
      const largeVoteSet = Array.from({ length: 1000 }, (_, i) => ({
        id: `vote-${i}`,
        pollId: 'test-poll-id',
        userId: `user-${i}`,
        choice: 0, // First candidate
        privacyLevel: 'public',
        timestamp: new Date(),
        auditReceipt: `receipt-${i}`
      }))

      const startTime = performance.now()
      const results = await engine.calculateResults(poll, largeVoteSet)
      const endTime = performance.now()

      expect(results).toBeDefined()
      expect(results.totalVotes).toBe(1000)
      expect(endTime - startTime).toBeLessThan(1000) // Should process within 1 second
    })
  })
})





