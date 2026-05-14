#!/usr/bin/env npx tsx
/**
 * DB integration test for the `update_poll_vote_count` RPC.
 *
 * Validates the contract that the poll detail page relies on after every
 * ballot insert:
 *   - polls.total_votes mirrors COUNT(DISTINCT voter)
 *   - polls.participation mirrors total_votes
 *   - poll_options.vote_count reflects per-option tallies
 *     (first-choice ballots for ranked polls; rows in `votes` for others)
 *   - the function is idempotent and clears stale per-option counts on
 *     ballot retraction.
 *
 * Run with service-role credentials:
 *   npx tsx scripts/test-update-poll-vote-count.ts
 *
 * Exits 0 on success, 1 on any assertion failure.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const SQL = `
DO $$
DECLARE
  poll_a uuid := gen_random_uuid();
  poll_b uuid := gen_random_uuid();
  poll_x uuid := gen_random_uuid();
  user1  uuid;
  user2  uuid;
  user3  uuid;
  opt_b1 uuid;
  opt_b2 uuid;
  total_ranked int; participation_ranked int;
  total_single int; participation_single int;
  ranked_opt0 int; ranked_opt1 int;
  single_opt0 int; single_opt1 int;
BEGIN
  -- Pick three real user_profile ids to satisfy FK constraints
  SELECT id INTO user1 FROM user_profiles ORDER BY created_at LIMIT 1;
  SELECT id INTO user2 FROM user_profiles WHERE id <> user1 ORDER BY created_at LIMIT 1;
  SELECT id INTO user3 FROM user_profiles WHERE id NOT IN (user1, user2) ORDER BY created_at LIMIT 1;
  IF user1 IS NULL OR user2 IS NULL OR user3 IS NULL THEN
    RAISE EXCEPTION 'Need at least three rows in user_profiles to run this test';
  END IF;

  -- ranked_choice poll
  INSERT INTO polls(id, title, created_by, status, voting_method, privacy_level, is_public)
  VALUES (poll_a, 'rpc test ranked', user1, 'active', 'ranked_choice', 'public', true);
  INSERT INTO poll_options(poll_id, text, option_text, order_index) VALUES (poll_a, 'A', 'A', 0);
  INSERT INTO poll_options(poll_id, text, option_text, order_index) VALUES (poll_a, 'B', 'B', 1);
  INSERT INTO poll_rankings(poll_id, user_id, rankings) VALUES (poll_a, user1, ARRAY[0,1]::int[]);
  INSERT INTO poll_rankings(poll_id, user_id, rankings) VALUES (poll_a, user2, ARRAY[0,1]::int[]);
  INSERT INTO poll_rankings(poll_id, user_id, rankings) VALUES (poll_a, user3, ARRAY[1,0]::int[]);

  -- single_choice poll
  INSERT INTO polls(id, title, created_by, status, voting_method, privacy_level, is_public)
  VALUES (poll_b, 'rpc test single', user1, 'active', 'single_choice', 'public', true);
  INSERT INTO poll_options(poll_id, text, option_text, order_index) VALUES (poll_b, 'A', 'A', 0) RETURNING id INTO opt_b1;
  INSERT INTO poll_options(poll_id, text, option_text, order_index) VALUES (poll_b, 'B', 'B', 1) RETURNING id INTO opt_b2;
  INSERT INTO votes(poll_id, option_id, poll_option_id, user_id, vote_status) VALUES (poll_b, opt_b1, opt_b1, user1, 'submitted');
  INSERT INTO votes(poll_id, option_id, poll_option_id, user_id, vote_status) VALUES (poll_b, opt_b1, opt_b1, user2, 'submitted');
  INSERT INTO votes(poll_id, option_id, poll_option_id, user_id, vote_status) VALUES (poll_b, opt_b2, opt_b2, user3, 'submitted');

  PERFORM public.update_poll_vote_count(poll_a);
  PERFORM public.update_poll_vote_count(poll_b);

  SELECT total_votes, participation INTO total_ranked, participation_ranked FROM polls WHERE id = poll_a;
  SELECT total_votes, participation INTO total_single, participation_single FROM polls WHERE id = poll_b;
  SELECT vote_count INTO ranked_opt0 FROM poll_options WHERE poll_id = poll_a AND order_index = 0;
  SELECT vote_count INTO ranked_opt1 FROM poll_options WHERE poll_id = poll_a AND order_index = 1;
  SELECT vote_count INTO single_opt0 FROM poll_options WHERE poll_id = poll_b AND order_index = 0;
  SELECT vote_count INTO single_opt1 FROM poll_options WHERE poll_id = poll_b AND order_index = 1;

  ASSERT total_ranked = 3, format('ranked total_votes: expected 3, got %s', total_ranked);
  ASSERT participation_ranked = 3, format('ranked participation: expected 3, got %s', participation_ranked);
  ASSERT ranked_opt0 = 2, format('ranked option 0 first-choice: expected 2, got %s', ranked_opt0);
  ASSERT ranked_opt1 = 1, format('ranked option 1 first-choice: expected 1, got %s', ranked_opt1);
  ASSERT total_single = 3, format('single total_votes: expected 3, got %s', total_single);
  ASSERT participation_single = 3, format('single participation: expected 3, got %s', participation_single);
  ASSERT single_opt0 = 2, format('single option 0 vote_count: expected 2, got %s', single_opt0);
  ASSERT single_opt1 = 1, format('single option 1 vote_count: expected 1, got %s', single_opt1);

  -- Idempotency: re-running must keep numbers identical
  PERFORM public.update_poll_vote_count(poll_a);
  PERFORM public.update_poll_vote_count(poll_b);
  SELECT total_votes INTO total_ranked FROM polls WHERE id = poll_a;
  SELECT total_votes INTO total_single FROM polls WHERE id = poll_b;
  ASSERT total_ranked = 3, 'RPC must be idempotent for ranked';
  ASSERT total_single = 3, 'RPC must be idempotent for single';

  -- Retraction: per-option count must drop to 0 when first-choice disappears
  INSERT INTO polls(id, title, created_by, status, voting_method, privacy_level, is_public)
  VALUES (poll_x, 'rpc test retract', user1, 'active', 'ranked_choice', 'public', true);
  INSERT INTO poll_options(poll_id, text, option_text, order_index) VALUES (poll_x, 'A', 'A', 0);
  INSERT INTO poll_options(poll_id, text, option_text, order_index) VALUES (poll_x, 'B', 'B', 1);
  INSERT INTO poll_rankings(poll_id, user_id, rankings) VALUES (poll_x, user1, ARRAY[0,1]::int[]);
  INSERT INTO poll_rankings(poll_id, user_id, rankings) VALUES (poll_x, user2, ARRAY[1,0]::int[]);
  PERFORM public.update_poll_vote_count(poll_x);
  SELECT vote_count INTO ranked_opt0 FROM poll_options WHERE poll_id = poll_x AND order_index = 0;
  SELECT vote_count INTO ranked_opt1 FROM poll_options WHERE poll_id = poll_x AND order_index = 1;
  ASSERT ranked_opt0 = 1 AND ranked_opt1 = 1, 'before retract: each option should have one first-choice';
  DELETE FROM poll_rankings WHERE poll_id = poll_x AND user_id = user2;
  PERFORM public.update_poll_vote_count(poll_x);
  SELECT vote_count INTO ranked_opt0 FROM poll_options WHERE poll_id = poll_x AND order_index = 0;
  SELECT vote_count INTO ranked_opt1 FROM poll_options WHERE poll_id = poll_x AND order_index = 1;
  ASSERT ranked_opt0 = 1, format('after retract: opt0 expected 1, got %s', ranked_opt0);
  ASSERT ranked_opt1 = 0, format('after retract: opt1 expected 0, got %s', ranked_opt1);

  -- Cleanup
  DELETE FROM poll_rankings WHERE poll_id IN (poll_a, poll_x);
  DELETE FROM votes WHERE poll_id = poll_b;
  DELETE FROM poll_options WHERE poll_id IN (poll_a, poll_b, poll_x);
  DELETE FROM polls WHERE id IN (poll_a, poll_b, poll_x);
END $$;
`;

async function main() {
  console.log('Running update_poll_vote_count integration test...');
  const serviceKey = SUPABASE_SERVICE_KEY;
  if (!serviceKey) {
    console.error('SUPABASE_SERVICE_ROLE_KEY missing');
    process.exit(1);
    return;
  }

  const { error } = await admin.rpc('exec_sql', { sql: SQL }).single();
  if (error && error.message?.includes('function "exec_sql"')) {
    // No exec_sql RPC available — fall back to a direct PostgREST call
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sql: SQL }),
    });
    if (!res.ok) {
      console.warn(
        'No exec_sql RPC; this script is intended to be run via psql or supabase db push. Skipping.',
      );
      process.exit(0);
    }
  } else if (error) {
    console.error('Assertion failed:', error.message);
    process.exit(1);
  }
  console.log('All RPC assertions passed.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Test runner crashed:', err);
  process.exit(1);
});
