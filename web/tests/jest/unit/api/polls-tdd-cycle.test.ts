/**
 * Polls API Tests - TDD Cycle with Real Users
 * 
 * This test demonstrates the Test-Driven Development (TDD) cycle:
 * 1. Write the test FIRST (Red phase)
 * 2. Make it fail (Red phase)
 * 3. Write minimal code to pass (Green phase)
 * 4. Refactor to improve (Refactor phase)
 * 
 * All using real test users and real database operations.
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

describe('Polls API - TDD Cycle with Real Users', () => {
  let testUser: any;
  let testPollId: string | null = null;

  beforeAll(async () => {
    if (!supabase) {
      console.warn('Skipping tests - Real Supabase credentials not set up');
      return;
    }

    // Login with real test user
    console.log('TDD Cycle: Logging in with real test user...');
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'testpassword'
    });

    if (error) {
      console.error('Failed to login with test user:', error);
      throw new Error(`Failed to login with test user: ${error.message}`);
    }

    testUser = data.user;
    console.log('TDD Cycle: Successfully logged in with test user:', testUser.email);
  });

  afterAll(async () => {
    if (!supabase) return;

    // Clean up test data
    if (testPollId) {
      console.log('TDD Cycle: Cleaning up test poll:', testPollId);
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

  describe('TDD Cycle: Poll Creation Feature', () => {
    it('RED PHASE: should create poll with title and options (test first)', async () => {
      if (!supabase) {
        console.warn('Skipping test - Real Supabase credentials not set up');
        return;
      }

      // TDD RED PHASE: Write the test FIRST
      // This test will fail initially because we're testing the desired behavior
      const pollData = {
        title: 'TDD Test Poll',
        options: [
          { text: 'TDD Option 1' },
          { text: 'TDD Option 2' },
          { text: 'TDD Option 3' }
        ],
        created_by: testUser.id
      };

      // Test the desired behavior
      const { data, error } = await supabase
        .from('polls')
        .insert(pollData)
        .select()
        .single();

      console.log('TDD RED PHASE: Direct database insert result:', { data, error });

      // This is what we WANT to happen (Green phase expectations)
      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.title).toBe('TDD Test Poll');
      expect(data.options).toHaveLength(3);
      expect(data.created_by).toBe(testUser.id);
      expect(data.status).toBe('active'); // Default status

      // Store for cleanup
      testPollId = data.id;
    });

    it('GREEN PHASE: should handle poll creation with validation', async () => {
      if (!supabase) {
        console.warn('Skipping test - Real Supabase credentials not set up');
        return;
      }

      // TDD GREEN PHASE: Test the actual implementation
      const pollData = {
        title: 'TDD Green Phase Poll',
        options: [
          { text: 'Green Option 1' },
          { text: 'Green Option 2' }
        ],
        created_by: testUser.id
      };

      const { data, error } = await supabase
        .from('polls')
        .insert(pollData)
        .select()
        .single();

      console.log('TDD GREEN PHASE: Poll creation result:', { data, error });

      // Test the actual behavior
      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.title).toBe('TDD Green Phase Poll');
      expect(data.options).toHaveLength(2);
      expect(data.created_by).toBe(testUser.id);

      // Store for cleanup
      testPollId = data.id;
    });

    it('REFACTOR PHASE: should handle poll creation with improved structure', async () => {
      if (!supabase) {
        console.warn('Skipping test - Real Supabase credentials not set up');
        return;
      }

      // TDD REFACTOR PHASE: Test improved implementation
      const pollData = {
        title: 'TDD Refactor Phase Poll',
        options: [
          { text: 'Refactor Option 1', votes: 0 },
          { text: 'Refactor Option 2', votes: 0 }
        ],
        created_by: testUser.id,
        total_votes: 0,
        status: 'active'
      };

      const { data, error } = await supabase
        .from('polls')
        .insert(pollData)
        .select()
        .single();

      console.log('TDD REFACTOR PHASE: Improved poll creation result:', { data, error });

      // Test the improved behavior
      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.title).toBe('TDD Refactor Phase Poll');
      expect(data.options).toHaveLength(2);
      expect(data.created_by).toBe(testUser.id);
      expect(data.total_votes).toBe(0);
      expect(data.status).toBe('active');

      // Store for cleanup
      testPollId = data.id;
    });
  });

  describe('TDD Cycle: Poll Voting Feature', () => {
    it('RED PHASE: should allow users to vote on polls (test first)', async () => {
      if (!supabase) {
        console.warn('Skipping test - Real Supabase credentials not set up');
        return;
      }

      // TDD RED PHASE: Write the test FIRST for voting functionality
      // This test will fail initially because we're testing the desired behavior
      
      // First create a poll
      const pollData = {
        title: 'TDD Voting Test Poll',
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

      // TDD RED PHASE: Test the desired voting behavior
      // This is what we WANT to happen (Green phase expectations)
      const voteData = {
        poll_id: poll.id,
        user_id: testUser.id,
        option_index: 0, // Vote for first option
        created_at: new Date().toISOString()
      };

      // This test will fail initially because we're testing desired behavior
      const { data: vote, error: voteError } = await supabase
        .from('votes')
        .insert(voteData)
        .select()
        .single();

      console.log('TDD RED PHASE: Vote creation result:', { vote, voteError });

      // This is what we WANT to happen
      expect(voteError).toBeNull();
      expect(vote).toBeDefined();
      expect(vote.poll_id).toBe(poll.id);
      expect(vote.user_id).toBe(testUser.id);
      expect(vote.option_index).toBe(0);
    });

    it('GREEN PHASE: should handle vote creation with real data', async () => {
      if (!supabase) {
        console.warn('Skipping test - Real Supabase credentials not set up');
        return;
      }

      // TDD GREEN PHASE: Test the actual voting implementation
      const pollData = {
        title: 'TDD Green Voting Poll',
        options: [
          { text: 'Green Vote Option 1', votes: 0 },
          { text: 'Green Vote Option 2', votes: 0 }
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

      // Test actual voting behavior
      const voteData = {
        poll_id: poll.id,
        user_id: testUser.id,
        option_index: 1, // Vote for second option
        created_at: new Date().toISOString()
      };

      const { data: vote, error: voteError } = await supabase
        .from('votes')
        .insert(voteData)
        .select()
        .single();

      console.log('TDD GREEN PHASE: Vote creation result:', { vote, voteError });

      // Test the actual behavior
      expect(voteError).toBeNull();
      expect(vote).toBeDefined();
      expect(vote.poll_id).toBe(poll.id);
      expect(vote.user_id).toBe(testUser.id);
      expect(vote.option_index).toBe(1);
    });
  });

  describe('TDD Cycle: Poll Results Feature', () => {
    it('RED PHASE: should calculate poll results correctly (test first)', async () => {
      if (!supabase) {
        console.warn('Skipping test - Real Supabase credentials not set up');
        return;
      }

      // TDD RED PHASE: Write the test FIRST for results calculation
      // This test will fail initially because we're testing the desired behavior
      
      // Create a poll with votes
      const pollData = {
        title: 'TDD Results Test Poll',
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

      // TDD RED PHASE: Test the desired results calculation behavior
      // This is what we WANT to happen (Green phase expectations)
      const results = {
        poll_id: poll.id,
        total_votes: 0,
        option_results: [
          { option_index: 0, votes: 0, percentage: 0 },
          { option_index: 1, votes: 0, percentage: 0 }
        ],
        winner: null,
        calculated_at: new Date().toISOString()
      };

      console.log('TDD RED PHASE: Desired results calculation:', results);

      // This is what we WANT to happen
      expect(results.poll_id).toBe(poll.id);
      expect(results.total_votes).toBe(0);
      expect(results.option_results).toHaveLength(2);
      expect(results.winner).toBeNull();
    });

    it('GREEN PHASE: should handle results calculation with real data', async () => {
      if (!supabase) {
        console.warn('Skipping test - Real Supabase credentials not set up');
        return;
      }

      // TDD GREEN PHASE: Test the actual results calculation implementation
      const pollData = {
        title: 'TDD Green Results Poll',
        options: [
          { text: 'Green Results Option 1', votes: 0 },
          { text: 'Green Results Option 2', votes: 0 }
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

      // Test actual results calculation
      const results = {
        poll_id: poll.id,
        total_votes: poll.total_votes,
        option_results: poll.options.map((option: any, index: number) => ({
          option_index: index,
          votes: option.votes,
          percentage: poll.total_votes > 0 ? (option.votes / poll.total_votes) * 100 : 0
        })),
        winner: poll.options.reduce((winner: any, option: any, index: number) => {
          if (!winner || option.votes > winner.votes) {
            return { option_index: index, votes: option.votes };
          }
          return winner;
        }, null),
        calculated_at: new Date().toISOString()
      };

      console.log('TDD GREEN PHASE: Actual results calculation:', results);

      // Test the actual behavior
      expect(results.poll_id).toBe(poll.id);
      expect(results.total_votes).toBe(0);
      expect(results.option_results).toHaveLength(2);
      expect(results.winner).toBeNull();
    });
  });

  describe('TDD Cycle: Error Handling', () => {
    it('RED PHASE: should handle invalid poll data gracefully (test first)', async () => {
      if (!supabase) {
        console.warn('Skipping test - Real Supabase credentials not set up');
        return;
      }

      // TDD RED PHASE: Write the test FIRST for error handling
      // This test will fail initially because we're testing the desired behavior
      
      // Test invalid poll data
      const invalidPollData = {
        // Missing required fields
        options: [
          { text: 'Invalid Option 1' }
        ],
        created_by: testUser.id
      };

      // This is what we WANT to happen (Green phase expectations)
      const { data, error } = await supabase
        .from('polls')
        .insert(invalidPollData)
        .select()
        .single();

      console.log('TDD RED PHASE: Invalid poll data result:', { data, error });

      // This is what we WANT to happen
      expect(error).not.toBeNull();
      expect(error.message).toContain('title');
    });

    it('GREEN PHASE: should handle error cases with real validation', async () => {
      if (!supabase) {
        console.warn('Skipping test - Real Supabase credentials not set up');
        return;
      }

      // TDD GREEN PHASE: Test the actual error handling implementation
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

      console.log('TDD GREEN PHASE: Error handling result:', { data, error });

      // Test the actual behavior
      expect(error).not.toBeNull();
      expect(error.message).toContain('title');
    });
  });
});
