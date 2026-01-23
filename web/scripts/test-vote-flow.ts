#!/usr/bin/env tsx
/**
 * Test script for vote flow
 * Run with: npx tsx scripts/test-vote-flow.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testVoteCountUpdate() {
  console.log('Testing vote count update...\n');

  // Find an active poll
  const { data: polls, error: pollsError } = await supabase
    .from('polls')
    .select('id, title, voting_method, total_votes, status')
    .eq('status', 'active')
    .limit(1);

  if (pollsError || !polls || polls.length === 0) {
    console.error('No active polls found');
    return;
  }

  const poll = polls[0];
  console.log(`Testing with poll: ${poll.title} (${poll.id})`);
  console.log(`Current total_votes: ${poll.total_votes}`);
  console.log(`Voting method: ${poll.voting_method}\n`);

  // Count actual votes
  if (poll.voting_method === 'ranked') {
    const { data: rankings, error: rankingsError } = await supabase
      .from('poll_rankings')
      .select('user_id')
      .eq('poll_id', poll.id);

    if (rankingsError) {
      console.error('Error counting rankings:', rankingsError);
      return;
    }

    const uniqueVoters = new Set(rankings?.map(r => r.user_id) || []).size;
    console.log(`Actual unique voters (from poll_rankings): ${uniqueVoters}`);
    console.log(`Poll total_votes field: ${poll.total_votes}`);
    console.log(`Match: ${uniqueVoters === poll.total_votes ? '✅' : '❌'}`);
  } else {
    const { data: votes, error: votesError } = await supabase
      .from('votes')
      .select('user_id')
      .eq('poll_id', poll.id);

    if (votesError) {
      console.error('Error counting votes:', votesError);
      return;
    }

    const uniqueVoters = new Set(votes?.map(v => v.user_id) || []).size;
    console.log(`Actual unique voters (from votes): ${uniqueVoters}`);
    console.log(`Poll total_votes field: ${poll.total_votes}`);
    console.log(`Match: ${uniqueVoters === poll.total_votes ? '✅' : '❌'}`);
  }
}

async function testCloseButtonLogic() {
  console.log('\n\nTesting close button logic...\n');

  // Find a poll with a creator
  const { data: polls, error: pollsError } = await supabase
    .from('polls')
    .select('id, title, created_by, status')
    .eq('status', 'active')
    .not('created_by', 'is', null)
    .limit(1);

  if (pollsError || !polls || polls.length === 0) {
    console.error('No active polls with creators found');
    return;
  }

  const poll = polls[0];
  console.log(`Poll: ${poll.title} (${poll.id})`);
  console.log(`Created by: ${poll.created_by}`);
  console.log(`Status: ${poll.status}`);
  console.log(`Should show close button: ${poll.status === 'active' ? '✅' : '❌'}`);
}

async function main() {
  console.log('=== Vote Flow Test ===\n');
  await testVoteCountUpdate();
  await testCloseButtonLogic();
  console.log('\n=== Test Complete ===');
}

main().catch(console.error);
