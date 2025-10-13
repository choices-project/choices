/**
 * Integration Tests - API + Database (20% of tests)
 * 
 * These tests focus on how components work together.
 * Test API endpoints with real database operations.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/polls/route';

// Set real Supabase credentials directly for testing
process.env.NEXT_PUBLIC_SUPABASE_URL = 'REDACTED';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'REDACTED';

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

describe('Integration Tests - API + Database', () => {
  let testUser: any;
  let testPollId: string | null = null;

  beforeAll(async () => {
    if (!supabase) {
      console.warn('Skipping tests - Real Supabase credentials not set up');
      return;
    }

    // Login with real test user
    console.log('Integration: Logging in with real test user...');
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'testpassword'
    });

    if (error) {
      console.error('Failed to login with test user:', error);
      throw new Error(`Failed to login with test user: ${error.message}`);
    }

    testUser = data.user;
    console.log('Integration: Successfully logged in with test user:', testUser.email);
  });

  afterAll(async () => {
    if (!supabase) return;

    // Clean up test data
    if (testPollId) {
      console.log('Integration: Cleaning up test poll:', testPollId);
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

  describe('API + Database Integration', () => {
    it('should create poll and retrieve it via API', async () => {
      if (!supabase) {
        console.warn('Skipping test - Real Supabase credentials not set up');
        return;
      }

      // Integration test: API + Database
      // 1. Create poll via database
      const pollData = {
        title: 'Integration Test Poll',
        options: [
          { text: 'Integration Option 1', votes: 0 },
          { text: 'Integration Option 2', votes: 0 }
        ],
        created_by: testUser.id,
        total_votes: 0,
        status: 'active'
      };

      const { data: createdPoll, error: createError } = await supabase
        .from('polls')
        .insert(pollData)
        .select()
        .single();

      expect(createError).toBeNull();
      expect(createdPoll).toBeDefined();
      expect(createdPoll.title).toBe('Integration Test Poll');

      // Store for cleanup
      testPollId = createdPoll.id;

      // 2. Retrieve poll via API
      const request = new NextRequest('http://localhost:3000/api/polls');
      const response = await GET(request);
      const responseData = await response.json();

      console.log('Integration: API response:', responseData);

      // 3. Verify integration
      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(Array.isArray(responseData.polls)).toBe(true);
      
      // Check if our created poll is in the results
      const foundPoll = responseData.polls.find((poll: any) => poll.poll_id === createdPoll.id);
      expect(foundPoll).toBeDefined();
    });

    it('should handle poll creation with voting integration', async () => {
      if (!supabase) {
        console.warn('Skipping test - Real Supabase credentials not set up');
        return;
      }

      // Integration test: Poll creation + Voting
      // 1. Create poll
      const pollData = {
        title: 'Voting Integration Poll',
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

      // 2. Add votes
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

      // 3. Update poll vote count
      const { data: updatedPoll, error: updateError } = await supabase
        .from('polls')
        .update({ total_votes: 1 })
        .eq('id', poll.id)
        .select()
        .single();

      expect(updateError).toBeNull();
      expect(updatedPoll.total_votes).toBe(1);

      // 4. Verify integration
      const { data: finalPoll, error: finalError } = await supabase
        .from('polls')
        .select('*')
        .eq('id', poll.id)
        .single();

      expect(finalError).toBeNull();
      expect(finalPoll.total_votes).toBe(1);
    });

    it('should handle poll results calculation integration', async () => {
      if (!supabase) {
        console.warn('Skipping test - Real Supabase credentials not set up');
        return;
      }

      // Integration test: Poll + Votes + Results
      // 1. Create poll
      const pollData = {
        title: 'Results Integration Poll',
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

      // 4. Verify integration
      const option1Votes = allVotes.filter((vote: any) => vote.option_index === 0).length;
      const option2Votes = allVotes.filter((vote: any) => vote.option_index === 1).length;

      expect(option1Votes).toBe(2);
      expect(option2Votes).toBe(1);
    });
  });

  describe('API Error Handling Integration', () => {
    it('should handle database errors gracefully', async () => {
      if (!supabase) {
        console.warn('Skipping test - Real Supabase credentials not set up');
        return;
      }

      // Integration test: API error handling
      // 1. Test invalid poll data
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

      // 3. Test API error response
      const request = new NextRequest('http://localhost:3000/api/polls');
      const response = await GET(request);
      const responseData = await response.json();

      // API should still work despite database error
      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
    });

    it('should handle authentication errors integration', async () => {
      if (!supabase) {
        console.warn('Skipping test - Real Supabase credentials not set up');
        return;
      }

      // Integration test: Authentication + API
      // 1. Test with invalid user
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'invalid@example.com',
        password: 'invalidpassword'
      });

      // 2. Verify authentication error
      expect(error).not.toBeNull();
      expect(error.message).toContain('Invalid login credentials');

      // 3. Test API with invalid authentication
      const request = new NextRequest('http://localhost:3000/api/polls');
      const response = await GET(request);
      const responseData = await response.json();

      // API should still work (public endpoint)
      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
    });
  });
});
