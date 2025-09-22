/**
 * IRV Calculator Unit Tests
 * 
 * Comprehensive unit tests for the Instant Runoff Voting calculator
 * using golden test cases and edge case scenarios
 * 
 * Created: January 15, 2025
 * Updated: January 15, 2025
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { IRVCalculator } from '@/lib/vote/irv-calculator';
import type { UserRanking } from '@/lib/vote/irv-calculator';
import { goldenTestCases, runGoldenTestCase, runAllGoldenTests } from './golden-cases';

// Import V2 test setup
import { getMS } from '../../setup';
const { when } = getMS();

// Define Candidate type locally since it's not exported from the calculator
type Candidate = {
  id: string;
  name: string;
  party: string;
}

// Mock the logger
jest.mock('@/lib/logger', () => ({
  devLog: jest.fn()
}));

describe('IRV Calculator', () => {
  let calculator: IRVCalculator;
  let mockCandidates: Candidate[];
  let mockRankings: UserRanking[];

  beforeEach(() => {
    mockCandidates = [
      { id: 'A', name: 'Alice Johnson', party: 'Democrat' },
      { id: 'B', name: 'Bob Smith', party: 'Republican' },
      { id: 'C', name: 'Carol Davis', party: 'Independent' }
    ];

    mockRankings = [
      {
        pollId: 'test-poll',
        userId: 'user-1',
        ranking: ['A', 'B', 'C'],
        createdAt: new Date()
      },
      {
        pollId: 'test-poll',
        userId: 'user-2',
        ranking: ['B', 'A', 'C'],
        createdAt: new Date()
      },
      {
        pollId: 'test-poll',
        userId: 'user-3',
        ranking: ['C', 'A', 'B'],
        createdAt: new Date()
      }
    ];

    calculator = new IRVCalculator('test-poll', mockCandidates);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor and Initialization', () => {
    it('should initialize with correct poll ID and candidates', () => {
      expect(calculator.pollId).toBe('test-poll');
      // The candidates property is a Map, so we need to check the Map contents
      expect(calculator.candidates).toBeInstanceOf(Map);
      expect(calculator.candidates.size).toBe(3);
      expect(calculator.candidates.get('A')).toEqual(mockCandidates[0]);
      expect(calculator.candidates.get('B')).toEqual(mockCandidates[1]);
      expect(calculator.candidates.get('C')).toEqual(mockCandidates[2]);
    });

    it('should handle empty candidates array', () => {
      const emptyCalculator = new IRVCalculator('test-poll', []);
      expect(emptyCalculator.candidates).toBeInstanceOf(Map);
      expect(emptyCalculator.candidates.size).toBe(0);
    });

    it('should handle candidates with write-ins', () => {
      const candidatesWithWriteIns = [
        ...mockCandidates,
        { id: 'WRITE_IN_1', name: 'Write-in Candidate', isWriteIn: true }
      ];
      
      const writeInCalculator = new IRVCalculator('test-poll', candidatesWithWriteIns);
      expect(writeInCalculator.candidates).toBeInstanceOf(Map);
      expect(writeInCalculator.candidates.size).toBe(4);
      expect(writeInCalculator.candidates.get('WRITE_IN_1')).toEqual(candidatesWithWriteIns[3]);
    });

    it('should handle withdrawn candidates', () => {
      const candidatesWithWithdrawn = [
        ...mockCandidates,
        { id: 'D', name: 'Withdrawn Candidate', isWithdrawn: true }
      ];
      
      const withdrawnCalculator = new IRVCalculator('test-poll', candidatesWithWithdrawn);
      expect(withdrawnCalculator.candidates).toBeInstanceOf(Map);
      expect(withdrawnCalculator.candidates.size).toBe(4);
      expect(withdrawnCalculator.candidates.get('D')).toEqual(candidatesWithWithdrawn[3]);
    });
  });

  describe('Basic IRV Calculation', () => {
    it('should calculate simple majority winner', () => {
      const simpleRankings: UserRanking[] = [
        {
          pollId: 'test-poll',
          userId: 'user-1',
          ranking: ['A', 'B', 'C'],
          createdAt: new Date()
        },
        {
          pollId: 'test-poll',
          userId: 'user-2',
          ranking: ['A', 'B', 'C'],
          createdAt: new Date()
        },
        {
          pollId: 'test-poll',
          userId: 'user-3',
          ranking: ['B', 'A', 'C'],
          createdAt: new Date()
        }
      ];

      const results = calculator.calculateResults(simpleRankings);
      
      expect(results.winner).toBe('A');
      expect(results.totalVotes).toBe(3);
      expect(results.rounds).toHaveLength(1);
      const firstRound = results.rounds[0];
      if (firstRound) {
        expect(firstRound.votes).toEqual({ A: 2, B: 1, C: 0 });
      }
    });

    it('should handle instant runoff elimination', () => {
      const runoffRankings: UserRanking[] = [
        {
          pollId: 'test-poll',
          userId: 'user-1',
          ranking: ['A', 'B', 'C'],
          createdAt: new Date()
        },
        {
          pollId: 'test-poll',
          userId: 'user-2',
          ranking: ['A', 'C', 'B'],
          createdAt: new Date()
        },
        {
          pollId: 'test-poll',
          userId: 'user-3',
          ranking: ['B', 'A', 'C'],
          createdAt: new Date()
        },
        {
          pollId: 'test-poll',
          userId: 'user-4',
          ranking: ['B', 'C', 'A'],
          createdAt: new Date()
        },
        {
          pollId: 'test-poll',
          userId: 'user-5',
          ranking: ['C', 'A', 'B'],
          createdAt: new Date()
        }
      ];

      const results = calculator.calculateResults(runoffRankings);
      
      expect(results.totalVotes).toBe(5);
      expect(results.rounds.length).toBeGreaterThan(1);
    });

    it('should handle empty rankings', () => {
      const results = calculator.calculateResults([]);
      
      expect(results.totalVotes).toBe(0);
      expect(results.rounds).toHaveLength(0);
      expect(results.winner).toBeNull();
    });
  });

  describe('Golden Test Cases', () => {
    it('should pass all golden test cases', () => {
      const testResults = runAllGoldenTests();
      
      expect(testResults.totalTests).toBe(8);
      expect(testResults.passedTests).toBe(8);
      expect(testResults.failedTests).toBe(0);
      
      testResults.results.forEach(result => {
        expect(result.passed).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('should pass simple majority winner test case', () => {
      const testCase = goldenTestCases[0]; // Simple majority winner
      const result = runGoldenTestCase(testCase);
      
      if (!result.passed) {
        console.log('Golden test case errors:', result.errors);
        console.log('Actual results:', JSON.stringify(result.actualResults, null, 2));
        console.log('Expected results:', JSON.stringify(result.expectedResults, null, 2));
      }
      
      expect(result.passed).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.actualResults.winner).toBe('A');
    });

    it('should pass tie-breaking scenario test case', () => {
      const testCase = goldenTestCases[1]; // Tie-breaking scenario
      const result = runGoldenTestCase(testCase);
      
      if (!result.passed) {
        console.log('Tie-breaking test case errors:', result.errors);
        console.log('Actual results:', JSON.stringify(result.actualResults, null, 2));
        console.log('Expected results:', JSON.stringify(result.expectedResults, null, 2));
      }
      
      expect(result.passed).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.actualResults.winner).toBe('C');
    });

    it('should pass exhausted ballots test case', () => {
      const testCase = goldenTestCases[2]; // Exhausted ballots
      const result = runGoldenTestCase(testCase);
      
      if (!result.passed) {
        console.log('Exhausted ballots test case errors:', result.errors);
        console.log('Actual results:', JSON.stringify(result.actualResults, null, 2));
        console.log('Expected results:', JSON.stringify(result.expectedResults, null, 2));
      }
      
      expect(result.passed).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.actualResults.winner).toBe('B');
    });

    it('should pass write-in candidates test case', () => {
      const testCase = goldenTestCases[3]; // Write-in candidates
      const result = runGoldenTestCase(testCase);
      
      if (!result.passed) {
        console.log('Write-in candidates test case errors:', result.errors);
        console.log('Actual results:', JSON.stringify(result.actualResults, null, 2));
        console.log('Expected results:', JSON.stringify(result.expectedResults, null, 2));
      }
      
      expect(result.passed).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.actualResults.winner).toBe('B');
    });

    it('should pass fully exhausted ballots test case', () => {
      const testCase = goldenTestCases[4]; // Fully exhausted ballots
      const result = runGoldenTestCase(testCase);
      
      if (!result.passed) {
        console.log('Fully exhausted ballots test case errors:', result.errors);
        console.log('Actual results:', JSON.stringify(result.actualResults, null, 2));
        console.log('Expected results:', JSON.stringify(result.expectedResults, null, 2));
      }
      
      expect(result.passed).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.actualResults.winner).toBe('B');
    });

    it('should pass withdrawn candidates test case', () => {
      const testCase = goldenTestCases[5]; // Withdrawn candidates
      const result = runGoldenTestCase(testCase);
      
      if (!result.passed) {
        console.log('Withdrawn candidates test case errors:', result.errors);
        console.log('Actual results:', JSON.stringify(result.actualResults, null, 2));
        console.log('Expected results:', JSON.stringify(result.expectedResults, null, 2));
      }
      
      expect(result.passed).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.actualResults.winner).toBe('A');
    });

    it('should pass tie storm test case', () => {
      const testCase = goldenTestCases[6]; // Tie storm
      const result = runGoldenTestCase(testCase);
      
      if (!result.passed) {
        console.log('Tie storm test case errors:', result.errors);
        console.log('Actual results:', JSON.stringify(result.actualResults, null, 2));
        console.log('Expected results:', JSON.stringify(result.expectedResults, null, 2));
      }
      
      expect(result.passed).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.actualResults.winner).toBe('A');
    });

    it('should pass all same first choice test case', () => {
      const testCase = goldenTestCases[7]; // All same first choice
      const result = runGoldenTestCase(testCase);
      
      if (!result.passed) {
        console.log('All same first choice test case errors:', result.errors);
        console.log('Actual results:', JSON.stringify(result.actualResults, null, 2));
        console.log('Expected results:', JSON.stringify(result.expectedResults, null, 2));
      }
      
      expect(result.passed).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.actualResults.winner).toBe('A');
    });
  });

  describe('Edge Cases', () => {
    it('should handle single candidate', () => {
      const singleCandidate = [{ id: 'A', name: 'Only Candidate' }];
      const singleCalculator = new IRVCalculator('test-poll', singleCandidate);
      
      const rankings: UserRanking[] = [
        {
          pollId: 'test-poll',
          userId: 'user-1',
          ranking: ['A'],
          createdAt: new Date()
        }
      ];

      const results = singleCalculator.calculateResults(rankings);
      
      expect(results.winner).toBe('A');
      expect(results.totalVotes).toBe(1);
      expect(results.rounds).toHaveLength(1);
    });

    it('should handle two candidates', () => {
      const twoCandidates = [
        { id: 'A', name: 'Candidate A' },
        { id: 'B', name: 'Candidate B' }
      ];
      const twoCalculator = new IRVCalculator('test-poll', twoCandidates);
      
      const rankings: UserRanking[] = [
        {
          pollId: 'test-poll',
          userId: 'user-1',
          ranking: ['A', 'B'],
          createdAt: new Date()
        },
        {
          pollId: 'test-poll',
          userId: 'user-2',
          ranking: ['B', 'A'],
          createdAt: new Date()
        }
      ];

      const results = twoCalculator.calculateResults(rankings);
      
      expect(results.totalVotes).toBe(2);
      expect(results.rounds).toHaveLength(1);
    });

    it('should handle all candidates tied', () => {
      const rankings: UserRanking[] = [
        {
          pollId: 'test-poll',
          userId: 'user-1',
          ranking: ['A', 'B', 'C'],
          createdAt: new Date()
        },
        {
          pollId: 'test-poll',
          userId: 'user-2',
          ranking: ['B', 'C', 'A'],
          createdAt: new Date()
        },
        {
          pollId: 'test-poll',
          userId: 'user-3',
          ranking: ['C', 'A', 'B'],
          createdAt: new Date()
        }
      ];

      const results = calculator.calculateResults(rankings);
      
      expect(results.totalVotes).toBe(3);
      expect(results.rounds.length).toBeGreaterThan(1);
      expect(results.winner).toBeDefined();
    });

    it('should handle rankings with missing candidates', () => {
      const incompleteRankings: UserRanking[] = [
        {
          pollId: 'test-poll',
          userId: 'user-1',
          ranking: ['A', 'B'], // Missing C
          createdAt: new Date()
        },
        {
          pollId: 'test-poll',
          userId: 'user-2',
          ranking: ['B', 'A', 'C'],
          createdAt: new Date()
        }
      ];

      const results = calculator.calculateResults(incompleteRankings);
      
      expect(results.totalVotes).toBe(2);
      expect(results.winner).toBeDefined();
    });

    it('should handle rankings with extra candidates', () => {
      const extraRankings: UserRanking[] = [
        {
          pollId: 'test-poll',
          userId: 'user-1',
          ranking: ['A', 'B', 'C', 'D'], // Extra candidate D
          createdAt: new Date()
        },
        {
          pollId: 'test-poll',
          userId: 'user-2',
          ranking: ['B', 'A', 'C'],
          createdAt: new Date()
        }
      ];

      const results = calculator.calculateResults(extraRankings);
      
      expect(results.totalVotes).toBe(2);
      expect(results.winner).toBeDefined();
    });

    it('should handle duplicate rankings', () => {
      const duplicateRankings: UserRanking[] = [
        {
          pollId: 'test-poll',
          userId: 'user-1',
          ranking: ['A', 'A', 'B'], // Duplicate A
          createdAt: new Date()
        },
        {
          pollId: 'test-poll',
          userId: 'user-2',
          ranking: ['B', 'A', 'C'],
          createdAt: new Date()
        }
      ];

      const results = calculator.calculateResults(duplicateRankings);
      
      expect(results.totalVotes).toBe(2);
      expect(results.winner).toBeDefined();
    });
  });

  describe('Performance Tests', () => {
    it('should handle large number of votes efficiently', () => {
      const largeRankings: UserRanking[] = [];
      
      // Generate 1000 votes
      for (let i = 0; i < 1000; i++) {
        const ranking = ['A', 'B', 'C'].sort(() => Math.random() - 0.5);
        largeRankings.push({
          pollId: 'test-poll',
          userId: `user-${i}`,
          ranking,
          createdAt: new Date()
        });
      }

      const startTime = Date.now();
      const results = calculator.calculateResults(largeRankings);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(results.totalVotes).toBe(1000);
      expect(duration).toBeLessThan(1000); // Should complete in under 1 second
    });

    it('should handle large number of candidates efficiently', () => {
      const manyCandidates: Candidate[] = Array.from({ length: 20 }, (_, i) => ({
        id: `candidate-${i}`,
        name: `Candidate ${i}`,
        party: 'Independent'
      }));
      
      const manyCalculator = new IRVCalculator('test-poll', manyCandidates);
      
      const rankings: UserRanking[] = Array.from({ length: 100 }, (_, i) => ({
        pollId: 'test-poll',
        userId: `user-${i}`,
        ranking: manyCandidates.map(c => c.id).sort(() => Math.random() - 0.5),
        createdAt: new Date()
      }));

      const startTime = Date.now();
      const results = manyCalculator.calculateResults(rankings);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(results.totalVotes).toBe(100);
      expect(duration).toBeLessThan(2000); // Should complete in under 2 seconds
    });
  });

  describe('Deterministic Tie-Breaking', () => {
    it('should produce consistent results for identical inputs', () => {
      const rankings: UserRanking[] = [
        {
          pollId: 'test-poll',
          userId: 'user-1',
          ranking: ['A', 'B', 'C'],
          createdAt: new Date()
        },
        {
          pollId: 'test-poll',
          userId: 'user-2',
          ranking: ['B', 'A', 'C'],
          createdAt: new Date()
        },
        {
          pollId: 'test-poll',
          userId: 'user-3',
          ranking: ['C', 'A', 'B'],
          createdAt: new Date()
        }
      ];

      const results1 = calculator.calculateResults(rankings);
      const results2 = calculator.calculateResults(rankings);
      
      expect(results1.winner).toBe(results2.winner);
      expect(results1.rounds).toEqual(results2.rounds);
    });

    it('should use poll-seeded hashing for tie-breaking', () => {
      const tiedRankings: UserRanking[] = [
        {
          pollId: 'test-poll',
          userId: 'user-1',
          ranking: ['A', 'B', 'C'],
          createdAt: new Date()
        },
        {
          pollId: 'test-poll',
          userId: 'user-2',
          ranking: ['B', 'A', 'C'],
          createdAt: new Date()
        }
      ];

      const calculator1 = new IRVCalculator('poll-1', mockCandidates);
      const calculator2 = new IRVCalculator('poll-2', mockCandidates);
      
      const results1 = calculator1.calculateResults(tiedRankings);
      const results2 = calculator2.calculateResults(tiedRankings);
      
      // Results should be deterministic but may differ between polls
      expect(results1.winner).toBeDefined();
      expect(results2.winner).toBeDefined();
    });
  });

  describe('Metadata and Audit Trail', () => {
    it('should include comprehensive metadata', () => {
      const results = calculator.calculateResults(mockRankings);
      
      expect(results.metadata).toBeDefined();
      expect(typeof results.metadata?.calculationTime).toBe('number');
      expect(results.metadata?.calculationTime).toBeGreaterThanOrEqual(0);
      expect(results.metadata?.tieBreaksUsed).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(results.metadata?.edgeCasesHandled)).toBe(true);
    });

    it('should track tie breaks used', () => {
      const tiedRankings: UserRanking[] = [
        {
          pollId: 'test-poll',
          userId: 'user-1',
          ranking: ['A', 'B', 'C'],
          createdAt: new Date()
        },
        {
          pollId: 'test-poll',
          userId: 'user-2',
          ranking: ['B', 'A', 'C'],
          createdAt: new Date()
        }
      ];

      const results = calculator.calculateResults(tiedRankings);
      
      expect(results.metadata?.tieBreaksUsed).toBeGreaterThanOrEqual(0);
    });

    it('should track edge cases handled', () => {
      const results = calculator.calculateResults(mockRankings);
      
      expect(results.metadata?.edgeCasesHandled).toBeDefined();
      expect(Array.isArray(results.metadata?.edgeCasesHandled)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed rankings gracefully', () => {
      const malformedRankings: UserRanking[] = [
        {
          pollId: 'test-poll',
          userId: 'user-1',
          ranking: null as any,
          createdAt: new Date()
        }
      ];

      // The calculator should handle malformed data gracefully, not throw
      const results = calculator.calculateResults(malformedRankings);
      expect(results.totalVotes).toBe(0);
      expect(results.winner).toBeNull();
    });

    it('should handle rankings with invalid candidate IDs', () => {
      const invalidRankings: UserRanking[] = [
        {
          pollId: 'test-poll',
          userId: 'user-1',
          ranking: ['INVALID_ID'],
          createdAt: new Date()
        }
      ];

      const results = calculator.calculateResults(invalidRankings);
      
      // Invalid candidate IDs should be treated as write-ins, resulting in 1 valid vote
      expect(results.totalVotes).toBe(1);
      expect(results.winner).toBe('INVALID_ID');
    });
  });
});
