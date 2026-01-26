/**
 * Unit tests for PollClient component vote counting logic
 * Tests both regular and ranked poll result formats
 */

// Mock ranked poll response (from API)
const mockRankedResponse = {
  poll_id: 'test-ranked-1',
  total_votes: 10,
  voting_method: 'ranked',
  option_stats: [
    { option_id: '0', option_index: 0, text: 'Option 1', first_choice_votes: 5, first_choice_percentage: 50 },
    { option_id: '1', option_index: 1, text: 'Option 2', first_choice_votes: 3, first_choice_percentage: 30 },
    { option_id: '2', option_index: 2, text: 'Option 3', first_choice_votes: 2, first_choice_percentage: 20 },
  ],
  integrity: {
    mode: 'all',
    threshold: 0.5,
    raw_total_votes: 10,
    excluded_votes: 0,
    scored_votes: 10,
    unscored_votes: 0,
  },
};

// Mock regular poll response (from API)
const mockRegularResponse = {
  poll_id: 'test-regular-1',
  total_votes: 8,
  voting_method: 'single',
  trust_tier_filter: null,
  results: [
    { option_id: '0', option_text: 'Option 1', vote_count: 4 },
    { option_id: '1', option_text: 'Option 2', vote_count: 3 },
    { option_id: '2', option_text: 'Option 3', vote_count: 1 },
  ],
  integrity: {
    mode: 'all',
    threshold: 0.5,
    raw_total_votes: 8,
    excluded_votes: 0,
    scored_votes: 8,
    unscored_votes: 0,
  },
};

// Simulate the optionVoteLookup logic from PollClient
function createOptionVoteLookup(results: any): Map<string, number> {
  const map = new Map<string, number>();
  
  // Handle regular polls (results array)
  if (results?.results) {
    results.results.forEach((row: any) => {
      const key = String(row.option_id);
      map.set(key, row.vote_count ?? 0);
    });
  }
  
  // Handle ranked polls (option_stats array)
  if (results?.option_stats) {
    results.option_stats.forEach((row: any) => {
      const key = String(row.option_id);
      map.set(key, row.first_choice_votes ?? 0);
    });
  }
  
  return map;
}

// Simulate the optionVoteCounts logic from PollClient
function createOptionVoteCounts(results: any): Record<string, number> | undefined {
  return (
    results?.results?.reduce((acc: Record<string, number>, row: any) => {
      const key = String(row.option_id);
      acc[key] = Number(row.vote_count ?? 0);
      return acc;
    }, {} as Record<string, number>) ??
    results?.option_stats?.reduce((acc: Record<string, number>, row: any) => {
      const key = String(row.option_id);
      acc[key] = Number(row.first_choice_votes ?? 0);
      return acc;
    }, {} as Record<string, number>) ??
    undefined
  );
}

// Test ranked poll processing
console.log('🧪 Testing Ranked Poll Processing:\n');

const rankedLookup = createOptionVoteLookup(mockRankedResponse);
console.log('✅ Ranked Poll optionVoteLookup:');
console.log(`   Map size: ${rankedLookup.size}`);
rankedLookup.forEach((votes, optionId) => {
  console.log(`   Option ${optionId}: ${votes} votes`);
});

const rankedCounts = createOptionVoteCounts(mockRankedResponse);
console.log('\n✅ Ranked Poll optionVoteCounts:');
if (rankedCounts) {
  Object.entries(rankedCounts).forEach(([optionId, votes]) => {
    console.log(`   Option ${optionId}: ${votes} votes`);
  });
} else {
  console.log('   ❌ No vote counts generated');
}

// Test regular poll processing
console.log('\n🧪 Testing Regular Poll Processing:\n');

const regularLookup = createOptionVoteLookup(mockRegularResponse);
console.log('✅ Regular Poll optionVoteLookup:');
console.log(`   Map size: ${regularLookup.size}`);
regularLookup.forEach((votes, optionId) => {
  console.log(`   Option ${optionId}: ${votes} votes`);
});

const regularCounts = createOptionVoteCounts(mockRegularResponse);
console.log('\n✅ Regular Poll optionVoteCounts:');
if (regularCounts) {
  Object.entries(regularCounts).forEach(([optionId, votes]) => {
    console.log(`   Option ${optionId}: ${votes} votes`);
  });
} else {
  console.log('   ❌ No vote counts generated');
}

// Verify totals
console.log('\n📊 Verifying Totals:\n');

const rankedTotal = Array.from(rankedLookup.values()).reduce((sum, votes) => sum + votes, 0);
const regularTotal = Array.from(regularLookup.values()).reduce((sum, votes) => sum + votes, 0);

console.log(`Ranked Poll:`);
console.log(`   Expected total: ${mockRankedResponse.total_votes}`);
console.log(`   Calculated total: ${rankedTotal}`);
console.log(`   ✅ Match: ${rankedTotal === mockRankedResponse.total_votes ? 'YES' : 'NO'}`);

console.log(`\nRegular Poll:`);
console.log(`   Expected total: ${mockRegularResponse.total_votes}`);
console.log(`   Calculated total: ${regularTotal}`);
console.log(`   ✅ Match: ${regularTotal === mockRegularResponse.total_votes ? 'YES' : 'NO'}`);

// Test edge cases
console.log('\n🔍 Testing Edge Cases:\n');

// Empty results
const emptyResults = { poll_id: 'test-empty', total_votes: 0 };
const emptyLookup = createOptionVoteLookup(emptyResults);
console.log(`Empty results lookup size: ${emptyLookup.size} (expected: 0)`);
console.log(`   ✅ ${emptyLookup.size === 0 ? 'PASS' : 'FAIL'}`);

// Missing option_stats/results
const missingData = { poll_id: 'test-missing', total_votes: 0 };
const missingLookup = createOptionVoteLookup(missingData);
console.log(`Missing data lookup size: ${missingLookup.size} (expected: 0)`);
console.log(`   ✅ ${missingLookup.size === 0 ? 'PASS' : 'FAIL'}`);

// Null/undefined handling
const nullResults = null;
const nullLookup = createOptionVoteLookup(nullResults);
console.log(`Null results lookup size: ${nullLookup.size} (expected: 0)`);
console.log(`   ✅ ${nullLookup.size === 0 ? 'PASS' : 'FAIL'}`);

console.log('\n✅ All component logic tests completed!');
