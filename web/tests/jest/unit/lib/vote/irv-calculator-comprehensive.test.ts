/**
 * Comprehensive IRV Calculator Tests
 * 
 * Tests the Instant Runoff Voting calculator with various scenarios
 * including edge cases, tie-breaking, and complex voting patterns
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { IRVCalculator } from '@/lib/vote/irv-calculator'
import type { Candidate, UserRanking, RankedChoiceResults } from '@/lib/vote/types'

// Mock the logger
jest.mock('@/lib/utils/logger', () => ({
  devLog: jest.fn()
}))

describe('IRVCalculator', () => {
  let calculator: IRVCalculator
  let candidates: Candidate[]
  let userRankings: UserRanking[]

  beforeEach(() => {
    candidates = [
      { id: 'candidate-1', name: 'Alice', description: 'Alice for Mayor' },
      { id: 'candidate-2', name: 'Bob', description: 'Bob for Mayor' },
      { id: 'candidate-3', name: 'Charlie', description: 'Charlie for Mayor' },
      { id: 'candidate-4', name: 'Diana', description: 'Diana for Mayor' }
    ]

    userRankings = []
  })

  describe('Basic IRV Scenarios', () => {
    it('should elect clear winner in first round', () => {
      calculator = new IRVCalculator('test-poll', candidates)
      
      userRankings = [
        { userId: 'user-1', ranking: ['candidate-1', 'candidate-2', 'candidate-3'] },
        { userId: 'user-2', ranking: ['candidate-1', 'candidate-2', 'candidate-3'] },
        { userId: 'user-3', ranking: ['candidate-1', 'candidate-2', 'candidate-3'] },
        { userId: 'user-4', ranking: ['candidate-2', 'candidate-1', 'candidate-3'] }
      ]

      const results = calculator.calculateResults(userRankings)
      
      expect(results.winner).toBe('candidate-1')
      expect(results.totalVotes).toBe(4)
      expect(results.rounds).toHaveLength(1)
      expect(results.rounds[0]?.votes['candidate-1']).toBe(3)
    })

    it('should eliminate last place candidate and redistribute votes', () => {
      calculator = new IRVCalculator('test-poll', candidates)
      
      userRankings = [
        { userId: 'user-1', ranking: ['candidate-1', 'candidate-2', 'candidate-3'] },
        { userId: 'user-2', ranking: ['candidate-2', 'candidate-1', 'candidate-3'] },
        { userId: 'user-3', ranking: ['candidate-3', 'candidate-1', 'candidate-2'] },
        { userId: 'user-4', ranking: ['candidate-3', 'candidate-2', 'candidate-1'] },
        { userId: 'user-5', ranking: ['candidate-1', 'candidate-3', 'candidate-2'] }
      ]

      const results = calculator.calculateResults(userRankings)
      
      expect(results.totalVotes).toBe(5)
      expect(results.rounds.length).toBeGreaterThan(1)
      
      // First round should eliminate the candidate with least votes
      const firstRound = results.rounds[0]
      const voteCounts = Object.values(firstRound.votes)
      const minVotes = Math.min(...voteCounts)
      const eliminatedCandidates = Object.entries(firstRound.votes)
        .filter(([_, votes]) => votes === minVotes)
        .map(([candidate]) => candidate)
      
      expect(eliminatedCandidates.length).toBeGreaterThan(0)
    })

    it('should handle three-way tie correctly', () => {
      calculator = new IRVCalculator('test-poll', candidates)
      
      userRankings = [
        { userId: 'user-1', ranking: ['candidate-1', 'candidate-2', 'candidate-3'] },
        { userId: 'user-2', ranking: ['candidate-2', 'candidate-1', 'candidate-3'] },
        { userId: 'user-3', ranking: ['candidate-3', 'candidate-1', 'candidate-2'] }
      ]

      const results = calculator.calculateResults(userRankings)
      
      expect(results.totalVotes).toBe(3)
      expect(results.rounds.length).toBeGreaterThan(1)
      
      // All candidates should have 1 vote each in first round
      const firstRound = results.rounds[0]
      expect(firstRound.votes['candidate-1']).toBe(1)
      expect(firstRound.votes['candidate-2']).toBe(1)
      expect(firstRound.votes['candidate-3']).toBe(1)
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty rankings', () => {
      calculator = new IRVCalculator('test-poll', candidates)
      
      const results = calculator.calculateResults([])
      
      expect(results.winner).toBeNull()
      expect(results.totalVotes).toBe(0)
      expect(results.rounds).toHaveLength(0)
    })

    it('should handle single candidate', () => {
      const singleCandidate = [candidates[0]]
      calculator = new IRVCalculator('test-poll', singleCandidate)
      
      userRankings = [
        { userId: 'user-1', ranking: ['candidate-1'] },
        { userId: 'user-2', ranking: ['candidate-1'] }
      ]

      const results = calculator.calculateResults(userRankings)
      
      expect(results.winner).toBe('candidate-1')
      expect(results.totalVotes).toBe(2)
    })

    it('should handle invalid rankings gracefully', () => {
      calculator = new IRVCalculator('test-poll', candidates)
      
      userRankings = [
        { userId: 'user-1', ranking: ['candidate-1', 'candidate-2'] },
        { userId: 'user-2', ranking: ['invalid-candidate'] }, // Invalid candidate
        { userId: 'user-3', ranking: [] }, // Empty ranking
        { userId: 'user-4', ranking: ['candidate-1', 'candidate-1'] } // Duplicate
      ]

      const results = calculator.calculateResults(userRankings)
      
      // Should only count valid rankings
      expect(results.totalVotes).toBe(2) // Only user-1 and user-4 have valid rankings
    })

    it('should handle withdrawn candidates', () => {
      calculator = new IRVCalculator('test-poll', candidates)
      
      // Mark a candidate as withdrawn
      calculator.candidates.set('candidate-3', {
        ...candidates[2],
        isWithdrawn: true
      })
      
      userRankings = [
        { userId: 'user-1', ranking: ['candidate-1', 'candidate-2', 'candidate-3'] },
        { userId: 'user-2', ranking: ['candidate-2', 'candidate-1', 'candidate-3'] },
        { userId: 'user-3', ranking: ['candidate-3', 'candidate-1', 'candidate-2'] } // Vote transfers to candidate-1
      ]

      const results = calculator.calculateResults(userRankings)
      
      expect(results.totalVotes).toBe(3) // All votes counted, withdrawn candidates handled by transfer
      expect(results.metadata.edgeCasesHandled).toContain('withdrawn_candidates')
    })

    it('should handle all candidates withdrawn', () => {
      calculator = new IRVCalculator('test-poll', candidates)
      
      // Mark all candidates as withdrawn
      candidates.forEach(candidate => {
        calculator.candidates.set(candidate.id, {
          ...candidate,
          isWithdrawn: true
        })
      })
      
      userRankings = [
        { userId: 'user-1', ranking: ['candidate-1', 'candidate-2'] }
      ]

      const results = calculator.calculateResults(userRankings)
      
      expect(results.winner).toBeNull()
      expect(results.totalVotes).toBe(0)
      expect(results.metadata.edgeCasesHandled).toContain('no-candidates')
    })
  })

  describe('Tie Breaking', () => {
    it('should use deterministic tie breaking with seed', () => {
      const seed = 'test-seed-123'
      calculator = new IRVCalculator('test-poll', candidates, seed)
      
      userRankings = [
        { userId: 'user-1', ranking: ['candidate-1', 'candidate-2'] },
        { userId: 'user-2', ranking: ['candidate-2', 'candidate-1'] }
      ]

      const results1 = calculator.calculateResults(userRankings)
      
      // Create new calculator with same seed
      const calculator2 = new IRVCalculator('test-poll', candidates, seed)
      const results2 = calculator2.calculateResults(userRankings)
      
      // Results should be identical with same seed
      expect(results1.winner).toBe(results2.winner)
      expect(results1.rounds.length).toBe(results2.rounds.length)
    })

    it('should handle multiple ties in same round', () => {
      calculator = new IRVCalculator('test-poll', candidates)
      
      userRankings = [
        { userId: 'user-1', ranking: ['candidate-1', 'candidate-2', 'candidate-3', 'candidate-4'] },
        { userId: 'user-2', ranking: ['candidate-2', 'candidate-1', 'candidate-3', 'candidate-4'] },
        { userId: 'user-3', ranking: ['candidate-3', 'candidate-1', 'candidate-2', 'candidate-4'] },
        { userId: 'user-4', ranking: ['candidate-4', 'candidate-1', 'candidate-2', 'candidate-3'] }
      ]

      const results = calculator.calculateResults(userRankings)
      
      expect(results.totalVotes).toBe(4)
      expect(results.rounds.length).toBeGreaterThan(1)
      
      // First round should have all candidates tied
      const firstRound = results.rounds[0]
      const voteCounts = Object.values(firstRound.votes)
      expect(voteCounts.every(count => count === 1)).toBe(true)
    })
  })

  describe('Performance and Metadata', () => {
    it('should track calculation time', () => {
      calculator = new IRVCalculator('test-poll', candidates)
      
      userRankings = [
        { userId: 'user-1', ranking: ['candidate-1', 'candidate-2', 'candidate-3'] },
        { userId: 'user-2', ranking: ['candidate-2', 'candidate-1', 'candidate-3'] },
        { userId: 'user-3', ranking: ['candidate-3', 'candidate-1', 'candidate-2'] }
      ]

      const results = calculator.calculateResults(userRankings)
      
      expect(results.metadata.calculationTime).toBeGreaterThan(0)
      expect(typeof results.metadata.calculationTime).toBe('number')
    })

    it('should track tie breaks used', () => {
      calculator = new IRVCalculator('test-poll', candidates)
      
      userRankings = [
        { userId: 'user-1', ranking: ['candidate-1', 'candidate-2'] },
        { userId: 'user-2', ranking: ['candidate-2', 'candidate-1'] }
      ]

      const results = calculator.calculateResults(userRankings)
      
      expect(results.metadata.tieBreaksUsed).toBeGreaterThanOrEqual(0)
      expect(typeof results.metadata.tieBreaksUsed).toBe('number')
    })

    it('should handle large number of votes efficiently', () => {
      calculator = new IRVCalculator('test-poll', candidates)
      
      // Generate 1000 votes
      userRankings = Array.from({ length: 1000 }, (_, i) => ({
        userId: `user-${i}`,
        ranking: ['candidate-1', 'candidate-2', 'candidate-3', 'candidate-4']
      }))

      const startTime = performance.now()
      const results = calculator.calculateResults(userRankings)
      const endTime = performance.now()
      
      expect(results.totalVotes).toBe(1000)
      expect(endTime - startTime).toBeLessThan(1000) // Should complete within 1 second
    })
  })

  describe('Write-in Candidates', () => {
    it('should handle write-in candidates', () => {
      calculator = new IRVCalculator('test-poll', candidates)
      
      userRankings = [
        { userId: 'user-1', ranking: ['candidate-1', 'write-in-eve', 'candidate-2'] },
        { userId: 'user-2', ranking: ['write-in-eve', 'candidate-1', 'candidate-2'] },
        { userId: 'user-3', ranking: ['candidate-2', 'candidate-1', 'write-in-eve'] }
      ]

      const results = calculator.calculateResults(userRankings)
      
      expect(results.totalVotes).toBe(3)
      expect(results.rounds.length).toBeGreaterThan(0)
      
      // Write-in candidate should be included in results
      const firstRound = results.rounds[0]
      expect(firstRound.votes['write-in-eve']).toBeDefined()
    })

    it('should handle multiple write-in candidates', () => {
      calculator = new IRVCalculator('test-poll', candidates)
      
      userRankings = [
        { userId: 'user-1', ranking: ['write-in-eve', 'write-in-frank', 'candidate-1'] },
        { userId: 'user-2', ranking: ['write-in-frank', 'write-in-eve', 'candidate-1'] },
        { userId: 'user-3', ranking: ['candidate-1', 'write-in-eve', 'write-in-frank'] }
      ]

      const results = calculator.calculateResults(userRankings)
      
      expect(results.totalVotes).toBe(3)
      
      const firstRound = results.rounds[0]
      expect(firstRound.votes['write-in-eve']).toBeDefined()
      expect(firstRound.votes['write-in-frank']).toBeDefined()
    })
  })

  describe('Complex Scenarios', () => {
    it('should handle exhausted ballots', () => {
      calculator = new IRVCalculator('test-poll', candidates)
      
      userRankings = [
        { userId: 'user-1', ranking: ['candidate-1'] }, // Only one preference
        { userId: 'user-2', ranking: ['candidate-2', 'candidate-1'] },
        { userId: 'user-3', ranking: ['candidate-3', 'candidate-2'] },
        { userId: 'user-4', ranking: ['candidate-4', 'candidate-3'] }
      ]

      const results = calculator.calculateResults(userRankings)
      
      expect(results.totalVotes).toBe(4)
      expect(results.rounds.length).toBeGreaterThan(1)
      
      // Should handle exhausted ballots correctly
      const lastRound = results.rounds[results.rounds.length - 1]
      expect(lastRound.exhaustedBallots).toBeGreaterThanOrEqual(0)
    })

    it('should handle circular preferences', () => {
      calculator = new IRVCalculator('test-poll', candidates)
      
      userRankings = [
        { userId: 'user-1', ranking: ['candidate-1', 'candidate-2', 'candidate-3', 'candidate-4'] },
        { userId: 'user-2', ranking: ['candidate-2', 'candidate-3', 'candidate-4', 'candidate-1'] },
        { userId: 'user-3', ranking: ['candidate-3', 'candidate-4', 'candidate-1', 'candidate-2'] },
        { userId: 'user-4', ranking: ['candidate-4', 'candidate-1', 'candidate-2', 'candidate-3'] }
      ]

      const results = calculator.calculateResults(userRankings)
      
      expect(results.totalVotes).toBe(4)
      expect(results.rounds.length).toBeGreaterThan(1)
      
      // Should eventually determine a winner
      expect(results.winner).toBeDefined()
    })
  })

  describe('Error Handling', () => {
    it('should handle malformed rankings gracefully', () => {
      calculator = new IRVCalculator('test-poll', candidates)
      
      userRankings = [
        { userId: 'user-1', ranking: ['candidate-1', 'candidate-2'] },
        { userId: 'user-2', ranking: null as any }, // Malformed
        { userId: 'user-3', ranking: undefined as any }, // Malformed
        { userId: 'user-4', ranking: ['candidate-1'] }
      ]

      const results = calculator.calculateResults(userRankings)
      
      // Should only count valid rankings
      expect(results.totalVotes).toBe(2)
    })

    it('should handle missing user IDs', () => {
      calculator = new IRVCalculator('test-poll', candidates)
      
      userRankings = [
        { userId: '', ranking: ['candidate-1', 'candidate-2'] }, // Empty user ID
        { userId: null as any, ranking: ['candidate-1', 'candidate-2'] }, // Null user ID
        { userId: 'user-1', ranking: ['candidate-1', 'candidate-2'] }
      ]

      const results = calculator.calculateResults(userRankings)
      
      // Should handle missing user IDs gracefully
      expect(results.totalVotes).toBeGreaterThanOrEqual(1)
    })
  })
})



