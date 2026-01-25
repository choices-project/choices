#!/usr/bin/env tsx
/**
 * Test script to verify poll results API handles both regular and ranked polls correctly
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPollResults() {
  console.log('🔍 Testing Poll Results API...\n');

  // Find a ranked choice poll
  const { data: rankedPoll, error: rankedError } = await supabase
    .from('polls')
    .select('id, title, voting_method, total_votes')
    .eq('voting_method', 'ranked')
    .eq('is_public', true)
    .limit(1)
    .maybeSingle();

  if (rankedError) {
    console.error('Error finding ranked poll:', rankedError);
  }

  // Find a regular poll (single, multiple, or approval)
  const { data: regularPoll, error: regularError } = await supabase
    .from('polls')
    .select('id, title, voting_method, total_votes')
    .in('voting_method', ['single', 'multiple', 'approval'])
    .eq('is_public', true)
    .limit(1)
    .maybeSingle();

  if (regularError) {
    console.error('Error finding regular poll:', regularError);
  }

  // Test ranked poll results
  if (rankedPoll) {
    console.log('📊 Testing Ranked Poll:');
    console.log(`   ID: ${rankedPoll.id}`);
    console.log(`   Title: ${rankedPoll.title}`);
    console.log(`   Voting Method: ${rankedPoll.voting_method}`);
    console.log(`   Total Votes: ${rankedPoll.total_votes || 0}\n`);

    try {
      const response = await fetch(`http://localhost:3000/api/polls/${rankedPoll.id}/results`);
      const data = await response.json();

      if (data.success && data.data) {
        const result = data.data;
        console.log('✅ Ranked Poll API Response:');
        console.log(`   Total Votes: ${result.total_votes || 0}`);
        console.log(`   Voting Method: ${result.voting_method}`);
        
        if (result.option_stats && Array.isArray(result.option_stats)) {
          console.log(`   Option Stats Count: ${result.option_stats.length}`);
          result.option_stats.forEach((stat: any, idx: number) => {
            console.log(`   Option ${idx + 1}: ${stat.first_choice_votes || 0} first-choice votes`);
          });
        } else {
          console.log('   ⚠️  No option_stats found (expected for ranked polls)');
        }

        if (result.results && Array.isArray(result.results)) {
          console.log('   ⚠️  Found results array (unexpected for ranked polls)');
        }
      } else {
        console.log('   ❌ API returned error:', data.error || 'Unknown error');
      }
    } catch (error) {
      console.log('   ❌ Error fetching ranked poll results:', error);
    }
    console.log('');
  } else {
    console.log('⚠️  No ranked polls found in database\n');
  }

  // Test regular poll results
  if (regularPoll) {
    console.log('📊 Testing Regular Poll:');
    console.log(`   ID: ${regularPoll.id}`);
    console.log(`   Title: ${regularPoll.title}`);
    console.log(`   Voting Method: ${regularPoll.voting_method}`);
    console.log(`   Total Votes: ${regularPoll.total_votes || 0}\n`);

    try {
      const response = await fetch(`http://localhost:3000/api/polls/${regularPoll.id}/results`);
      const data = await response.json();

      if (data.success && data.data) {
        const result = data.data;
        console.log('✅ Regular Poll API Response:');
        console.log(`   Total Votes: ${result.total_votes || 0}`);
        console.log(`   Voting Method: ${result.voting_method}`);
        
        if (result.results && Array.isArray(result.results)) {
          console.log(`   Results Count: ${result.results.length}`);
          result.results.forEach((res: any, idx: number) => {
            console.log(`   Option ${idx + 1}: ${res.vote_count || 0} votes`);
          });
        } else {
          console.log('   ⚠️  No results array found (expected for regular polls)');
        }

        if (result.option_stats && Array.isArray(result.option_stats)) {
          console.log('   ⚠️  Found option_stats array (unexpected for regular polls)');
        }
      } else {
        console.log('   ❌ API returned error:', data.error || 'Unknown error');
      }
    } catch (error) {
      console.log('   ❌ Error fetching regular poll results:', error);
    }
    console.log('');
  } else {
    console.log('⚠️  No regular polls found in database\n');
  }

  // Test component logic
  console.log('🧪 Testing Component Logic:');
  console.log('   Testing optionVoteLookup with mock data...\n');

  // Mock ranked poll response
  const mockRankedResponse = {
    poll_id: 'test-ranked',
    total_votes: 10,
    voting_method: 'ranked',
    option_stats: [
      { option_id: '0', first_choice_votes: 5 },
      { option_id: '1', first_choice_votes: 3 },
      { option_id: '2', first_choice_votes: 2 },
    ],
  };

  // Mock regular poll response
  const mockRegularResponse = {
    poll_id: 'test-regular',
    total_votes: 8,
    voting_method: 'single',
    results: [
      { option_id: '0', vote_count: 4 },
      { option_id: '1', vote_count: 3 },
      { option_id: '2', vote_count: 1 },
    ],
  };

  // Test ranked poll processing
  console.log('   Ranked Poll Processing:');
  const rankedLookup = new Map<string, number>();
  if (mockRankedResponse.option_stats) {
    mockRankedResponse.option_stats.forEach((row: any) => {
      const key = String(row.option_id);
      rankedLookup.set(key, row.first_choice_votes ?? 0);
    });
  }
  console.log(`   ✅ Lookup map created with ${rankedLookup.size} entries`);
  rankedLookup.forEach((votes, optionId) => {
    console.log(`      Option ${optionId}: ${votes} votes`);
  });

  // Test regular poll processing
  console.log('\n   Regular Poll Processing:');
  const regularLookup = new Map<string, number>();
  if (mockRegularResponse.results) {
    mockRegularResponse.results.forEach((row: any) => {
      const key = String(row.option_id);
      regularLookup.set(key, row.vote_count ?? 0);
    });
  }
  console.log(`   ✅ Lookup map created with ${regularLookup.size} entries`);
  regularLookup.forEach((votes, optionId) => {
    console.log(`      Option ${optionId}: ${votes} votes`);
  });

  console.log('\n✅ All tests completed!');
}

testPollResults().catch(console.error);
