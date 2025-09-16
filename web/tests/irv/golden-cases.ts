// ============================================================================
// PHASE 1: GOLDEN TEST CASES FOR IRV CALCULATOR
// ============================================================================
// Agent A1 - Infrastructure Specialist
// 
// This module contains the 8 golden test cases for validating the IRV
// calculator implementation for the Ranked Choice Democracy Revolution platform.
// 
// Test Cases:
// 1. Simple majority winner
// 2. Tie-breaking scenario
// 3. Exhausted ballots
// 4. Write-in candidates
// 5. Fully exhausted ballots
// 6. Withdrawn candidates
// 7. Tie storm (3+ rounds)
// 8. All same first choice, divergent tails
// 
// Created: January 15, 2025
// Status: Phase 1 Implementation
// ============================================================================

import { IRVCalculator, Candidate, UserRanking, RankedChoiceResults } from '../../lib/vote/irv-calculator';

// ============================================================================
// TEST DATA SETUP
// ============================================================================

const mockCandidates: Candidate[] = [
  { id: 'A', name: 'Alice Johnson', party: 'Democrat' },
  { id: 'B', name: 'Bob Smith', party: 'Republican' },
  { id: 'C', name: 'Carol Davis', party: 'Independent' },
  { id: 'D', name: 'David Wilson', party: 'Green' },
  { id: 'E', name: 'Eve Brown', party: 'Libertarian' }
];

// ============================================================================
// GOLDEN TEST CASES
// ============================================================================

export const goldenTestCases = [
  {
    name: "Simple majority winner",
    description: "Candidate A wins with majority in first round",
    candidates: mockCandidates.slice(0, 3), // A, B, C
    ballots: [
      ["A", "B", "C"], ["A", "B", "C"], ["A", "B", "C"],
      ["B", "A", "C"], ["B", "A", "C"]
    ],
    expectedRounds: [
      { 
        round: 1, 
        eliminated: "C", 
        votes: { A: 3, B: 2, C: 0 },
        totalVotes: 5,
        activeCandidates: ["A", "B", "C"]
      },
      { 
        round: 2, 
        eliminated: "B", 
        votes: { A: 3, B: 2 },
        totalVotes: 5,
        activeCandidates: ["A", "B"]
      }
    ],
    expectedWinner: "A",
    expectedMetadata: {
      tieBreaksUsed: 0,
      edgeCasesHandled: []
    }
  },

  {
    name: "Tie-breaking scenario",
    description: "Tie between A and B, C wins after elimination",
    candidates: mockCandidates.slice(0, 3), // A, B, C
    ballots: [
      ["A", "B"], ["B", "A"], ["C", "A"], ["C", "B"]
    ],
    expectedRounds: [
      { 
        round: 1, 
        eliminated: "A", 
        votes: { A: 1, B: 1, C: 2 },
        totalVotes: 4,
        activeCandidates: ["A", "B", "C"]
      },
      { 
        round: 2, 
        eliminated: "B", 
        votes: { B: 1, C: 3 },
        totalVotes: 4,
        activeCandidates: ["B", "C"]
      }
    ],
    expectedWinner: "C",
    expectedMetadata: {
      tieBreaksUsed: 1,
      edgeCasesHandled: ["tie-breaking"]
    }
  },

  {
    name: "Exhausted ballots",
    description: "Some ballots become exhausted during elimination",
    candidates: mockCandidates.slice(0, 4), // A, B, C, D
    ballots: [
      ["A", "B"], ["B", "A"], ["C"], ["D"]
    ],
    expectedRounds: [
      { 
        round: 1, 
        eliminated: "C", 
        votes: { A: 1, B: 1, C: 1, D: 1 },
        totalVotes: 4,
        activeCandidates: ["A", "B", "C", "D"]
      },
      { 
        round: 2, 
        eliminated: "D", 
        votes: { A: 1, B: 1, D: 1 },
        totalVotes: 3,
        activeCandidates: ["A", "B", "D"]
      },
      { 
        round: 3, 
        eliminated: "A", 
        votes: { A: 1, B: 1 },
        totalVotes: 2,
        activeCandidates: ["A", "B"]
      }
    ],
    expectedWinner: "B",
    expectedMetadata: {
      tieBreaksUsed: 2,
      edgeCasesHandled: ["exhausted-ballots"]
    }
  },

  {
    name: "Write-in candidates",
    description: "Write-in candidate wins the election",
    candidates: mockCandidates.slice(0, 3), // A, B, C
    ballots: [
      ["A", "B", "WRITE_IN_1"], ["B", "A", "WRITE_IN_2"], 
      ["WRITE_IN_1", "A", "B"], ["C", "WRITE_IN_1", "A"]
    ],
    expectedRounds: [
      { 
        round: 1, 
        eliminated: "C", 
        votes: { A: 1, B: 1, WRITE_IN_1: 1, C: 1 },
        totalVotes: 4,
        activeCandidates: ["A", "B", "WRITE_IN_1", "WRITE_IN_2", "C"]
      },
      { 
        round: 2, 
        eliminated: "A", 
        votes: { A: 1, B: 1, WRITE_IN_1: 2 },
        totalVotes: 4,
        activeCandidates: ["A", "B", "WRITE_IN_1"]
      },
      { 
        round: 3, 
        eliminated: "B", 
        votes: { B: 1, WRITE_IN_1: 3 },
        totalVotes: 4,
        activeCandidates: ["B", "WRITE_IN_1"]
      }
    ],
    expectedWinner: "WRITE_IN_1",
    expectedMetadata: {
      tieBreaksUsed: 2,
      edgeCasesHandled: ["write-ins-processed"]
    }
  },

  {
    name: "Fully exhausted ballots",
    description: "All ballots become exhausted, no winner",
    candidates: mockCandidates.slice(0, 5), // A, B, C, D, E
    ballots: [
      ["A", "B"], ["B", "A"], ["C"], ["D"], ["E"]
    ],
    expectedRounds: [
      { 
        round: 1, 
        eliminated: "C", 
        votes: { A: 1, B: 1, C: 1, D: 1, E: 1 },
        totalVotes: 5,
        activeCandidates: ["A", "B", "C", "D", "E"]
      },
      { 
        round: 2, 
        eliminated: "D", 
        votes: { A: 1, B: 1, D: 1, E: 1 },
        totalVotes: 4,
        activeCandidates: ["A", "B", "D", "E"]
      },
      { 
        round: 3, 
        eliminated: "E", 
        votes: { A: 1, B: 1, E: 1 },
        totalVotes: 3,
        activeCandidates: ["A", "B", "E"]
      },
      { 
        round: 4, 
        eliminated: "A", 
        votes: { A: 1, B: 1 },
        totalVotes: 2,
        activeCandidates: ["A", "B"]
      }
    ],
    expectedWinner: "B",
    expectedMetadata: {
      tieBreaksUsed: 3,
      edgeCasesHandled: ["exhausted-ballots"]
    }
  },

  {
    name: "Withdrawn candidates",
    description: "Candidate C is withdrawn, treated as eliminated at round 0",
    candidates: [
      { id: 'A', name: 'Alice Johnson', party: 'Democrat' },
      { id: 'B', name: 'Bob Smith', party: 'Republican' },
      { id: 'C', name: 'Carol Davis', party: 'Independent', isWithdrawn: true }
    ],
    ballots: [
      ["A", "B", "C"], ["B", "A", "C"], ["C", "A", "B"],
      ["A", "C", "B"], ["B", "C", "A"]
    ],
    expectedRounds: [
      { 
        round: 1, 
        eliminated: "A", 
        votes: { A: 2, B: 3 },
        totalVotes: 5,
        activeCandidates: ["A", "B"]
      }
    ],
    expectedWinner: "B",
    expectedMetadata: {
      tieBreaksUsed: 0,
      edgeCasesHandled: ["withdrawn-candidates"]
    }
  },

  {
    name: "Tie storm (3+ rounds)",
    description: "Multiple rounds of ties requiring tie-breaking",
    candidates: mockCandidates.slice(0, 4), // A, B, C, D
    ballots: [
      ["A", "B", "C", "D"], ["B", "A", "C", "D"], ["C", "A", "B", "D"],
      ["D", "A", "B", "C"], ["A", "C", "B", "D"], ["B", "D", "A", "C"]
    ],
    expectedRounds: [
      { 
        round: 1, 
        eliminated: "A", 
        votes: { A: 2, B: 2, C: 1, D: 1 },
        totalVotes: 6,
        activeCandidates: ["A", "B", "C", "D"]
      },
      { 
        round: 2, 
        eliminated: "B", 
        votes: { B: 2, C: 2, D: 2 },
        totalVotes: 6,
        activeCandidates: ["B", "C", "D"]
      },
      { 
        round: 3, 
        eliminated: "C", 
        votes: { C: 2, D: 4 },
        totalVotes: 6,
        activeCandidates: ["C", "D"]
      }
    ],
    expectedWinner: "D",
    expectedMetadata: {
      tieBreaksUsed: 2,
      edgeCasesHandled: ["tie-breaking"]
    }
  },

  {
    name: "All same first choice, divergent tails",
    description: "All voters choose A first, but have different second choices",
    candidates: mockCandidates.slice(0, 3), // A, B, C
    ballots: [
      ["A", "B", "C"], ["A", "C", "B"], ["A", "B", "C"],
      ["A", "C", "B"], ["A", "B", "C"], ["A", "C", "B"]
    ],
    expectedRounds: [
      { 
        round: 1, 
        eliminated: "B", 
        votes: { A: 6, B: 0, C: 0 },
        totalVotes: 6,
        activeCandidates: ["A", "B", "C"]
      }
    ],
    expectedWinner: "A",
    expectedMetadata: {
      tieBreaksUsed: 0,
      edgeCasesHandled: []
    }
  }
];

// ============================================================================
// TEST RUNNER FUNCTIONS
// ============================================================================

export function createTestRankings(ballots: string[][], pollId: string = 'test-poll'): UserRanking[] {
  return ballots.map((ranking, index) => ({
    pollId,
    userId: `user_${index}`,
    ranking,
    createdAt: new Date()
  }));
}

export function runGoldenTestCase(testCase: any): {
  passed: boolean;
  actualResults: RankedChoiceResults;
  expectedResults: any;
  errors: string[];
} {
  const errors: string[] = [];
  
  try {
    // Create IRV calculator
    const calculator = new IRVCalculator(testCase.pollId || 'test-poll', testCase.candidates);
    
    // Create test rankings
    const rankings = createTestRankings(testCase.ballots, testCase.pollId || 'test-poll');
    
    // Calculate results
    const actualResults = calculator.calculateResults(rankings);
    
    // Validate results
    const validation = validateResults(actualResults, testCase);
    
    return {
      passed: validation.passed,
      actualResults,
      expectedResults: testCase,
      errors: validation.errors
    };
  } catch (error) {
    errors.push(`Test execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return {
      passed: false,
      actualResults: {} as RankedChoiceResults,
      expectedResults: testCase,
      errors
    };
  }
}

export function validateResults(actual: RankedChoiceResults, expected: any): {
  passed: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Check winner
  if (actual.winner !== expected.expectedWinner) {
    errors.push(`Winner mismatch: expected ${expected.expectedWinner}, got ${actual.winner}`);
  }
  
  // Check number of rounds
  if (actual.rounds.length !== expected.expectedRounds.length) {
    errors.push(`Round count mismatch: expected ${expected.expectedRounds.length}, got ${actual.rounds.length}`);
  }
  
  // Check each round
  expected.expectedRounds.forEach((expectedRound: any, index: number) => {
    const actualRound = actual.rounds[index];
    if (!actualRound) {
      errors.push(`Missing round ${index + 1}`);
      return;
    }
    
    if (actualRound.eliminated !== expectedRound.eliminated) {
      errors.push(`Round ${index + 1} elimination mismatch: expected ${expectedRound.eliminated}, got ${actualRound.eliminated}`);
    }
    
    // Check vote counts
    Object.keys(expectedRound.votes).forEach(candidate => {
      if (actualRound.votes[candidate] !== expectedRound.votes[candidate]) {
        errors.push(`Round ${index + 1} vote count mismatch for ${candidate}: expected ${expectedRound.votes[candidate]}, got ${actualRound.votes[candidate]}`);
      }
    });
  });
  
  // Check metadata
  if (actual.metadata.tieBreaksUsed !== expected.expectedMetadata.tieBreaksUsed) {
    errors.push(`Tie breaks used mismatch: expected ${expected.expectedMetadata.tieBreaksUsed}, got ${actual.metadata.tieBreaksUsed}`);
  }
  
  return {
    passed: errors.length === 0,
    errors
  };
}

export function runAllGoldenTests(): {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  results: Array<{
    name: string;
    passed: boolean;
    errors: string[];
  }>;
} {
  const results = goldenTestCases.map(testCase => {
    const result = runGoldenTestCase(testCase);
    return {
      name: testCase.name,
      passed: result.passed,
      errors: result.errors
    };
  });
  
  const passedTests = results.filter(r => r.passed).length;
  const failedTests = results.length - passedTests;
  
  return {
    totalTests: results.length,
    passedTests,
    failedTests,
    results
  };
}

// ============================================================================
// PERFORMANCE TEST CASES
// ============================================================================

export function generateLargeBallotSet(candidateCount: number, ballotCount: number): string[][] {
  const candidates = Array.from({ length: candidateCount }, (_, i) => `candidate_${i}`);
  const ballots: string[][] = [];
  
  for (let i = 0; i < ballotCount; i++) {
    // Generate random ranking
    const shuffled = [...candidates].sort(() => Math.random() - 0.5);
    ballots.push(shuffled);
  }
  
  return ballots;
}

export function runPerformanceTest(candidateCount: number = 10, ballotCount: number = 10000): {
  duration: number;
  success: boolean;
  error?: string;
} {
  const startTime = performance.now();
  
  try {
    const candidates = Array.from({ length: candidateCount }, (_, i) => ({
      id: `candidate_${i}`,
      name: `Candidate ${i}`,
      party: 'Independent'
    }));
    
    const ballots = generateLargeBallotSet(candidateCount, ballotCount);
    const rankings = createTestRankings(ballots);
    
    const calculator = new IRVCalculator('performance-test', candidates);
    const results = calculator.calculateResults(rankings);
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    return {
      duration,
      success: true
    };
  } catch (error) {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    return {
      duration,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// ============================================================================
// EXPORTED TEST SUITE
// ============================================================================

export const IRVTestSuite = {
  goldenTestCases,
  runGoldenTestCase,
  runAllGoldenTests,
  validateResults,
  runPerformanceTest,
  generateLargeBallotSet
};

export default IRVTestSuite;
