/**
 * End-to-End Tests - User Workflows (10% of tests)
 * 
 * These tests focus on complete user journeys.
 * Test full user workflows from start to finish.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/polls/route';

// Use real Supabase client with real credentials
let supabase: any;

try {
  supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
} catch (error) {
  console.warn('Real Supabase credentials not set up. This test requires real credentials.');
  console.warn('Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.');
}

describe('E2E Tests - User Workflows', () => {
  let testUser: any;
  let testPollId: string | null = null;

  beforeAll(async () => {
    if (!supabase) {
      console.warn('Skipping tests - Real Supabase credentials not set up');
      return;
    }

    // Login with real test user
    console.log('E2E: Logging in with real test user...');
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'testpassword'
    });

    if (error) {
      console.error('Failed to login with test user:', error);
      throw new Error(`Failed to login with test user: ${error.message}`);
    }

    testUser = data.user;
    console.log('E2E: Successfully logged in with test user:', testUser.email);
  });

  afterAll(async () => {
    if (!supabase) return;

    // Clean up test data
    if (testPollId) {
      console.log('E2E: Cleaning up test poll:', testPollId);
      await supabase.from('polls').delete().eq('id', testPollId);
    }

    // Sign out
    await supabase.auth.signOut();
  });

  beforeEach(() => {
    // Reset test poll ID
    testPollId = null;
  });

  afterEach(async () => {
    if (!supabase) return;

    // Clean up any test data created during the test
    if (testPollId) {
      await supabase.from('polls').delete().eq('id', testPollId);
      testPollId = null;
    }
  });

  describe('Complete User Workflow: Create Poll', () => {
    it('should complete full poll creation workflow', async () => {
      if (!supabase) {
        console.warn('Skipping test - Real Supabase credentials not set up');
        return;
      }

      // E2E Test: Complete poll creation workflow
      // 1. User logs in (already done in beforeAll)
      expect(testUser).toBeDefined();
      expect(testUser.email).toBe('test@example.com');

      // 2. User creates a poll
      const pollData = {
        title: 'E2E Test Poll',
        options: [
          { text: 'E2E Option 1', votes: 0 },
          { text: 'E2E Option 2', votes: 0 },
          { text: 'E2E Option 3', votes: 0 }
        ],
        created_by: testUser.id,
        total_votes: 0,
        status: 'active'
      };

      const { data: poll, error: pollError } = await supabase
        .from('polls')
        .insert(pollData)
        .select()
        .single();

      expect(pollError).toBeNull();
      expect(poll).toBeDefined();
      expect(poll.title).toBe('E2E Test Poll');
      expect(poll.options).toHaveLength(3);

      // Store for cleanup
      testPollId = poll.id;

      // 3. User views the poll via API
      const request = new NextRequest('http://localhost:3000/api/polls');
      const response = await GET(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(Array.isArray(responseData.polls)).toBe(true);

      // 4. Verify poll appears in results
      const foundPoll = responseData.polls.find((p: any) => p.poll_id === poll.id);
      expect(foundPoll).toBeDefined();

      console.log('E2E: Complete poll creation workflow successful');
    });
  });

  describe('Complete User Workflow: Vote on Poll', () => {
    it('should complete full voting workflow', async () => {
      if (!supabase) {
        console.warn('Skipping test - Real Supabase credentials not set up');
        return;
      }

      // E2E Test: Complete voting workflow
      // 1. Create a poll
      const pollData = {
        title: 'E2E Voting Poll',
        options: [
          { text: 'Vote Option 1', votes: 0 },
          { text: 'Vote Option 2', votes: 0 }
        ],
        created_by: testUser.id,
        total_votes: 0,
        status: 'active'
      };

      const { data: poll, error: pollError } = await supabase
        .from('polls')
        .insert(pollData)
        .select()
        .single();

      expect(pollError).toBeNull();
      expect(poll).toBeDefined();

      // Store for cleanup
      testPollId = poll.id;

      // 2. User votes on the poll
      const voteData = {
        poll_id: poll.id,
        user_id: testUser.id,
        option_index: 0,
        created_at: new Date().toISOString()
      };

      const { data: vote, error: voteError } = await supabase
        .from('votes')
        .insert(voteData)
        .select()
        .single();

      expect(voteError).toBeNull();
      expect(vote).toBeDefined();
      expect(vote.poll_id).toBe(poll.id);
      expect(vote.user_id).toBe(testUser.id);
      expect(vote.option_index).toBe(0);

      // 3. Update poll vote count
      const { data: updatedPoll, error: updateError } = await supabase
        .from('polls')
        .update({ total_votes: 1 })
        .eq('id', poll.id)
        .select()
        .single();

      expect(updateError).toBeNull();
      expect(updatedPoll.total_votes).toBe(1);

      // 4. Verify vote is recorded
      const { data: allVotes, error: votesError } = await supabase
        .from('votes')
        .select('*')
        .eq('poll_id', poll.id);

      expect(votesError).toBeNull();
      expect(allVotes).toHaveLength(1);
      expect(allVotes[0].option_index).toBe(0);

      console.log('E2E: Complete voting workflow successful');
    });
  });

  describe('Complete User Workflow: Poll Results', () => {
    it('should complete full poll results workflow', async () => {
      if (!supabase) {
        console.warn('Skipping test - Real Supabase credentials not set up');
        return;
      }

      // E2E Test: Complete poll results workflow
      // 1. Create a poll
      const pollData = {
        title: 'E2E Results Poll',
        options: [
          { text: 'Results Option 1', votes: 0 },
          { text: 'Results Option 2', votes: 0 }
        ],
        created_by: testUser.id,
        total_votes: 0,
        status: 'active'
      };

      const { data: poll, error: pollError } = await supabase
        .from('polls')
        .insert(pollData)
        .select()
        .single();

      expect(pollError).toBeNull();
      expect(poll).toBeDefined();

      // Store for cleanup
      testPollId = poll.id;

      // 2. Add multiple votes
      const votes = [
        { poll_id: poll.id, user_id: testUser.id, option_index: 0 },
        { poll_id: poll.id, user_id: 'user2', option_index: 0 },
        { poll_id: poll.id, user_id: 'user3', option_index: 1 }
      ];

      for (const vote of votes) {
        const { error: voteError } = await supabase
          .from('votes')
          .insert(vote);

        expect(voteError).toBeNull();
      }

      // 3. Calculate results
      const { data: allVotes, error: votesError } = await supabase
        .from('votes')
        .select('*')
        .eq('poll_id', poll.id);

      expect(votesError).toBeNull();
      expect(allVotes).toHaveLength(3);

      // 4. Calculate final results
      const option1Votes = allVotes.filter((vote: any) => vote.option_index === 0).length;
      const option2Votes = allVotes.filter((vote: any) => vote.option_index === 1).length;

      expect(option1Votes).toBe(2);
      expect(option2Votes).toBe(1);

      // 5. Update poll with final results
      const { data: finalPoll, error: finalError } = await supabase
        .from('polls')
        .update({ 
          total_votes: 3,
          options: [
            { text: 'Results Option 1', votes: 2 },
            { text: 'Results Option 2', votes: 1 }
          ]
        })
        .eq('id', poll.id)
        .select()
        .single();

      expect(finalError).toBeNull();
      expect(finalPoll.total_votes).toBe(3);
      expect(finalPoll.options[0].votes).toBe(2);
      expect(finalPoll.options[1].votes).toBe(1);

      console.log('E2E: Complete poll results workflow successful');
    });
  });

  describe('Complete User Workflow: Error Handling', () => {
    it('should handle errors gracefully in complete workflow', async () => {
      if (!supabase) {
        console.warn('Skipping test - Real Supabase credentials not set up');
        return;
      }

      // E2E Test: Error handling in complete workflow
      // 1. Test invalid poll creation
      const invalidPollData = {
        // Missing required fields
        options: [
          { text: 'Invalid Option 1' }
        ],
        created_by: testUser.id
      };

      const { data, error } = await supabase
        .from('polls')
        .insert(invalidPollData)
        .select()
        .single();

      // 2. Verify error handling
      expect(error).not.toBeNull();
      expect(error.message).toContain('title');

      // 3. Test API still works despite error
      const request = new NextRequest('http://localhost:3000/api/polls');
      const response = await GET(request);
      const responseData = await response.json();

      // API should still work
      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);

      console.log('E2E: Error handling workflow successful');
    });
  });
});
