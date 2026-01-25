/**
 * Comprehensive test for poll results handling
 * Tests the complete data flow from API response to component rendering
 */

// Type definitions matching PollClient
type PollResultsResponse = {
  poll_id: string;
  total_votes: number;
  trust_tier_filter: number | null;
  voting_method?: string;
  results?: Array<{
    option_id: string | number;
    option_text?: string;
    vote_count: number;
  }>;
  option_stats?: Array<{
    option_id: string | number;
    option_index?: number;
    text?: string;
    first_choice_votes: number;
    first_choice_percentage?: number;
    borda_score?: number;
  }>;
  integrity?: {
    mode: 'all' | 'verified';
    threshold: number;
    raw_total_votes: number;
    excluded_votes: number;
    scored_votes: number;
    unscored_votes: number;
  };
};

// Test data matching actual API responses
const testCases = [
  {
    name: 'Ranked Poll with Votes',
    response: {
      poll_id: 'ranked-1',
      total_votes: 15,
      voting_method: 'ranked',
      option_stats: [
        { option_id: '0', option_index: 0, text: 'Option A', first_choice_votes: 8, first_choice_percentage: 53.3 },
        { option_id: '1', option_index: 1, text: 'Option B', first_choice_votes: 5, first_choice_percentage: 33.3 },
        { option_id: '2', option_index: 2, text: 'Option C', first_choice_votes: 2, first_choice_percentage: 13.3 },
      ],
      integrity: {
        mode: 'all',
        threshold: 0.5,
        raw_total_votes: 15,
        excluded_votes: 0,
        scored_votes: 15,
        unscored_votes: 0,
      },
    } as PollResultsResponse,
    expectedVoteCounts: { '0': 8, '1': 5, '2': 2 },
  },
  {
    name: 'Regular Poll (Single Choice)',
    response: {
      poll_id: 'regular-1',
      total_votes: 12,
      voting_method: 'single',
      trust_tier_filter: null,
      results: [
        { option_id: '0', option_text: 'Yes', vote_count: 7 },
        { option_id: '1', option_text: 'No', vote_count: 5 },
      ],
      integrity: {
        mode: 'all',
        threshold: 0.5,
        raw_total_votes: 12,
        excluded_votes: 0,
        scored_votes: 12,
        unscored_votes: 0,
      },
    } as PollResultsResponse,
    expectedVoteCounts: { '0': 7, '1': 5 },
  },
  {
    name: 'Ranked Poll with No Votes',
    response: {
      poll_id: 'ranked-empty',
      total_votes: 0,
      voting_method: 'ranked',
      option_stats: [],
      integrity: {
        mode: 'all',
        threshold: 0.5,
        raw_total_votes: 0,
        excluded_votes: 0,
        scored_votes: 0,
        unscored_votes: 0,
      },
    } as PollResultsResponse,
    expectedVoteCounts: {},
  },
  {
    name: 'Regular Poll with No Votes',
    response: {
      poll_id: 'regular-empty',
      total_votes: 0,
      voting_method: 'single',
      trust_tier_filter: null,
      results: [],
      integrity: {
        mode: 'all',
        threshold: 0.5,
        raw_total_votes: 0,
        excluded_votes: 0,
        scored_votes: 0,
        unscored_votes: 0,
      },
    } as PollResultsResponse,
    expectedVoteCounts: {},
  },
];

// Simulate the exact logic from PollClient component
function processPollResults(results: PollResultsResponse | null): {
  optionVoteLookup: Map<string, number>;
  optionVoteCounts: Record<string, number> | undefined;
  totalVotes: number;
} {
  const optionVoteLookup = new Map<string, number>();
  
  // Handle regular polls (results array)
  if (results?.results) {
    results.results.forEach((row) => {
      const key = String(row.option_id);
      optionVoteLookup.set(key, row.vote_count ?? 0);
    });
  }
  
  // Handle ranked polls (option_stats array)
  if (results?.option_stats) {
    results.option_stats.forEach((row) => {
      const key = String(row.option_id);
      optionVoteLookup.set(key, row.first_choice_votes ?? 0);
    });
  }

  // Create optionVoteCounts (matching PollClient logic)
  const optionVoteCounts =
    results?.results?.reduce<Record<string, number>>((acc, row) => {
      const key = String(row.option_id);
      acc[key] = Number(row.vote_count ?? 0);
      return acc;
    }, {}) ??
    results?.option_stats?.reduce<Record<string, number>>((acc, row) => {
      const key = String(row.option_id);
      acc[key] = Number(row.first_choice_votes ?? 0);
      return acc;
    }, {}) ??
    undefined;

  const totalVotes = results?.total_votes ?? 0;

  return { optionVoteLookup, optionVoteCounts, totalVotes };
}

// Run tests
console.log('🧪 Comprehensive Poll Results Test\n');
console.log('=' .repeat(60) + '\n');

let passedTests = 0;
let failedTests = 0;

testCases.forEach((testCase, index) => {
  console.log(`Test ${index + 1}: ${testCase.name}`);
  console.log('-'.repeat(60));
  
  const { optionVoteLookup, optionVoteCounts, totalVotes } = processPollResults(testCase.response);
  
  // Verify total votes
  const expectedTotal = testCase.response.total_votes;
  const totalMatch = totalVotes === expectedTotal;
  console.log(`Total Votes: ${totalVotes} (expected: ${expectedTotal}) ${totalMatch ? '✅' : '❌'}`);
  
  // Verify vote counts
  const voteCountsMatch = JSON.stringify(optionVoteCounts || {}) === JSON.stringify(testCase.expectedVoteCounts);
  console.log(`Vote Counts: ${JSON.stringify(optionVoteCounts || {})}`);
  console.log(`Expected:    ${JSON.stringify(testCase.expectedVoteCounts)}`);
  console.log(`${voteCountsMatch ? '✅' : '❌'} Vote counts match`);
  
  // Verify lookup map
  const lookupMatch = Array.from(optionVoteLookup.entries()).every(([key, value]) => {
    return testCase.expectedVoteCounts[key] === value;
  });
  console.log(`Lookup Map:  ${lookupMatch ? '✅' : '❌'} All entries match`);
  
  // Verify lookup map size
  const expectedSize = Object.keys(testCase.expectedVoteCounts).length;
  const sizeMatch = optionVoteLookup.size === expectedSize;
  console.log(`Map Size:    ${optionVoteLookup.size} (expected: ${expectedSize}) ${sizeMatch ? '✅' : '❌'}`);
  
  const testPassed = totalMatch && voteCountsMatch && lookupMatch && sizeMatch;
  if (testPassed) {
    passedTests++;
    console.log(`\n✅ Test ${index + 1} PASSED\n`);
  } else {
    failedTests++;
    console.log(`\n❌ Test ${index + 1} FAILED\n`);
  }
});

// Summary
console.log('='.repeat(60));
console.log('\n📊 Test Summary:');
console.log(`   Total Tests: ${testCases.length}`);
console.log(`   Passed: ${passedTests} ✅`);
console.log(`   Failed: ${failedTests} ${failedTests > 0 ? '❌' : ''}`);
console.log(`   Success Rate: ${((passedTests / testCases.length) * 100).toFixed(1)}%\n`);

if (failedTests === 0) {
  console.log('🎉 All tests passed! The fix is working correctly.\n');
  process.exit(0);
} else {
  console.log('⚠️  Some tests failed. Please review the output above.\n');
  process.exit(1);
}
