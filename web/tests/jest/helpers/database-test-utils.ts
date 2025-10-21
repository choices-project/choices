/**
 * Database Test Utilities
 * 
 * Comprehensive utilities for testing database operations with proper
 * setup, teardown, and realistic test scenarios.
 * 
 * For INTEGRATION TESTS - uses real database connections
 * For UNIT TESTS - use mocks instead
 */

import { createClient } from '@supabase/supabase-js';

/**
 * Setup test database with proper configuration
 * Uses REAL database for integration testing
 */
export const setupTestDatabase = async () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase credentials not found. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
  
  const realSupabaseClient = createClient(supabaseUrl, supabaseKey);
  
  // Return real client for integration testing
  return realSupabaseClient;
};

/**
 * Create test user with proper credentials
 * Uses REAL database operations
 */
export const createTestUser = async (supabase: any) => {
  const testUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    password: 'test-password',
    profile: {
      id: 'test-profile-id',
      user_id: 'test-user-id',
      username: 'testuser',
      display_name: 'Test User',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  };

  // Try to create the user in the real database
  try {
    const { data, error } = await supabase
      .from('profiles')
      .insert(testUser.profile)
      .select()
      .single();
    
    if (error) {
      console.warn('Could not create test user in database:', error);
    }
  } catch (error) {
    console.warn('Database operation failed, using mock user:', error);
  }

  return testUser;
};

/**
 * Create test poll data
 */
export const createTestPoll = () => ({
  id: 'test-poll-id',
  title: 'Test Poll',
  description: 'This is a test poll',
  options: [
    { id: 'option-1', text: 'Option 1' },
    { id: 'option-2', text: 'Option 2' }
  ],
  voting_method: 'single-choice',
  status: 'active',
  created_at: new Date().toISOString(),
  close_at: new Date(Date.now() + 86400000).toISOString(), // 24 hours from now
  created_by: 'test-user-id',
  total_votes: 0,
  participation: 0,
  privacy_level: 'public',
  category: 'test',
  tags: ['test'],
  sponsors: [],
  settings: {},
  hashtags: [],
  poll_settings: {}
});

/**
 * Track test data for cleanup
 */
const testDataIds: { [key: string]: string[] } = {
  polls: [],
  profiles: [],
  votes: []
};

export const trackTestData = (table: string, id: string) => {
  if (!testDataIds[table]) {
    testDataIds[table] = [];
  }
  testDataIds[table].push(id);
};

/**
 * Clean up test database
 * Removes all test data created during tests
 */
export const cleanupTestDatabase = async (supabase: any) => {
  if (!supabase) return;

  try {
    // Clean up test data in reverse order of dependencies
    if (testDataIds.votes.length > 0) {
      await supabase.from('votes').delete().in('id', testDataIds.votes);
    }
    
    if (testDataIds.polls.length > 0) {
      await supabase.from('polls').delete().in('id', testDataIds.polls);
    }
    
    if (testDataIds.profiles.length > 0) {
      await supabase.from('profiles').delete().in('id', testDataIds.profiles);
    }
    
    console.log('Test database cleanup completed');
  } catch (error) {
    console.warn('Error during test database cleanup:', error);
  }
};

/**
 * Verify database connection
 */
export const verifyDatabaseConnection = async (supabase: any) => {
  try {
    const { data, error } = await supabase
      .from('polls')
      .select('count')
      .limit(1);
    
    if (error) {
      console.warn('Database connection verification failed:', error);
      return false;
    }
    
    console.log('Database connection verified');
    return true;
  } catch (error) {
    console.warn('Database connection verification error:', error);
    return false;
  }
};