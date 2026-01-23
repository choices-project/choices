#!/usr/bin/env npx tsx
/**
 * Test Script: RLS Vote Count Updates
 * 
 * This script tests that vote count updates work correctly with the new RLS policies.
 * Run this after applying the migration: fix_polls_rls_for_vote_counts.sql
 * 
 * Usage:
 *   npx tsx scripts/test-rls-vote-counts.ts [poll-id]
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL');
  console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

// Create clients
const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const serviceClient = SUPABASE_SERVICE_KEY 
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : null;

async function testRPCFunction(pollId: string) {
  console.log('\n📋 Testing RPC Function: update_poll_vote_count');
  console.log('─'.repeat(60));
  
  try {
    // Get current vote count
    const { data: pollBefore, error: pollError } = await anonClient
      .from('polls')
      .select('total_votes, voting_method')
      .eq('id', pollId)
      .single();
    
    if (pollError || !pollBefore) {
      console.error('❌ Failed to fetch poll:', pollError);
      return false;
    }
    
    console.log(`   Poll ID: ${pollId}`);
    console.log(`   Voting Method: ${pollBefore.voting_method}`);
    console.log(`   Current total_votes: ${pollBefore.total_votes}`);
    
    // Count actual votes
    let actualVoteCount = 0;
    if (pollBefore.voting_method === 'ranked' || pollBefore.voting_method === 'ranked_choice') {
      const { data: rankings, error: rankError } = await serviceClient
        ?.from('poll_rankings')
        .select('user_id')
        .eq('poll_id', pollId) || { data: null, error: null };
      
      if (rankError) {
        console.error('❌ Failed to count ranked votes:', rankError);
        return false;
      }
      
      actualVoteCount = new Set(rankings?.map(r => r.user_id) || []).size;
    } else {
      const { data: votes, error: voteError } = await serviceClient
        ?.from('votes')
        .select('user_id')
        .eq('poll_id', pollId) || { data: null, error: null };
      
      if (voteError) {
        console.error('❌ Failed to count votes:', voteError);
        return false;
      }
      
      actualVoteCount = new Set(votes?.map(v => v.user_id) || []).size;
    }
    
    console.log(`   Actual distinct voters: ${actualVoteCount}`);
    
    // Call RPC function
    console.log('\n   Calling update_poll_vote_count()...');
    const { error: rpcError } = await (anonClient as any)
      .rpc('update_poll_vote_count', { poll_id_param: pollId });
    
    if (rpcError) {
      console.error('❌ RPC function failed:', rpcError);
      if (rpcError.message?.includes('does not exist')) {
        console.error('   ⚠️  Migration not run! Run: fix_polls_rls_for_vote_counts.sql');
      }
      return false;
    }
    
    // Check updated count
    const { data: pollAfter, error: afterError } = await anonClient
      .from('polls')
      .select('total_votes')
      .eq('id', pollId)
      .single();
    
    if (afterError || !pollAfter) {
      console.error('❌ Failed to fetch poll after update:', afterError);
      return false;
    }
    
    console.log(`   Updated total_votes: ${pollAfter.total_votes}`);
    
    // Verify
    const matches = pollAfter.total_votes === actualVoteCount;
    if (matches) {
      console.log('✅ Vote count matches actual votes!');
      return true;
    } else {
      console.error(`❌ Mismatch! Expected ${actualVoteCount}, got ${pollAfter.total_votes}`);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Exception:', error);
    return false;
  }
}

async function testRLSPolicies(pollId: string) {
  console.log('\n🔒 Testing RLS Policies');
  console.log('─'.repeat(60));
  
  // Test 1: Can anonymous user read polls?
  console.log('\n1. Testing anonymous read access...');
  const { data: poll, error: readError } = await anonClient
    .from('polls')
    .select('id, title, total_votes')
    .eq('id', pollId)
    .single();
  
  if (readError) {
    console.error('❌ Anonymous user cannot read polls:', readError);
    return false;
  }
  console.log('✅ Anonymous user can read polls');
  
  // Test 2: Can anonymous user update polls? (Should fail)
  console.log('\n2. Testing anonymous update access (should fail)...');
  const { error: updateError } = await anonClient
    .from('polls')
    .update({ total_votes: 999 })
    .eq('id', pollId);
  
  if (updateError) {
    console.log('✅ Anonymous user cannot update polls (correct!)');
    console.log(`   Error: ${updateError.message}`);
  } else {
    console.error('❌ Anonymous user CAN update polls (security issue!)');
    return false;
  }
  
  // Test 3: Can service role update polls? (Should succeed)
  if (serviceClient) {
    console.log('\n3. Testing service role update access (should succeed)...');
    const { error: serviceError } = await serviceClient
      .from('polls')
      .update({ total_votes: poll?.total_votes || 0 })
      .eq('id', pollId);
    
    if (serviceError) {
      console.error('❌ Service role cannot update polls:', serviceError);
      return false;
    }
    console.log('✅ Service role can update polls');
  }
  
  return true;
}

async function main() {
  const pollId = process.argv[2];
  
  if (!pollId) {
    console.error('❌ Usage: npx tsx scripts/test-rls-vote-counts.ts <poll-id>');
    console.error('\nExample:');
    console.error('  npx tsx scripts/test-rls-vote-counts.ts e68b8bb6-91ad-4fb1-9cad-40e8da66c797');
    process.exit(1);
  }
  
  console.log('🧪 RLS Vote Count Test Suite');
  console.log('='.repeat(60));
  console.log(`Poll ID: ${pollId}`);
  console.log(`Supabase URL: ${SUPABASE_URL}`);
  console.log(`Service Client: ${serviceClient ? 'Available' : 'Not available (set SUPABASE_SERVICE_ROLE_KEY)'}`);
  
  const results = {
    rpcFunction: false,
    rlsPolicies: false,
  };
  
  // Test RPC function
  results.rpcFunction = await testRPCFunction(pollId);
  
  // Test RLS policies
  results.rlsPolicies = await testRLSPolicies(pollId);
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary');
  console.log('='.repeat(60));
  console.log(`RPC Function:     ${results.rpcFunction ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`RLS Policies:     ${results.rlsPolicies ? '✅ PASS' : '❌ FAIL'}`);
  
  const allPassed = results.rpcFunction && results.rlsPolicies;
  console.log(`\nOverall: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  
  if (!allPassed) {
    console.log('\n⚠️  Next steps:');
    if (!results.rpcFunction) {
      console.log('   1. Run migration: fix_polls_rls_for_vote_counts.sql');
    }
    if (!results.rlsPolicies) {
      console.log('   2. Check RLS policies on polls table');
    }
  }
  
  process.exit(allPassed ? 0 : 1);
}

main().catch(console.error);
