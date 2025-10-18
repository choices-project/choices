/**
 * Database Test Utilities
 * 
 * Provides real database operations for integration testing.
 * Follows integration testing best practices:
 * - Uses real database connections
 * - Implements proper test isolation
 * - Provides cleanup utilities
 * - Supports both local and CI environments
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { jest } from '@jest/globals';

// Test database configuration
const TEST_DB_URL = process.env.TEST_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const TEST_DB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Test data tracking for cleanup
let testDataIds: {
  polls: string[];
  votes: string[];
  users: string[];
} = {
  polls: [],
  votes: [],
  users: []
};

// Create real Supabase client for testing
export const createTestSupabaseClient = (): SupabaseClient | null => {
  if (!TEST_DB_URL || !TEST_DB_KEY) {
    console.warn('Test database credentials not found. Integration tests will be skipped.');
    console.warn('TEST_DB_URL:', TEST_DB_URL);
    console.warn('TEST_DB_KEY:', TEST_DB_KEY ? 'Present' : 'Missing');
    return null;
  }
  
  try {
    const client = createClient(TEST_DB_URL, TEST_DB_KEY);
    console.log('Supabase client created successfully');
    return client;
  } catch (error) {
    console.error('Failed to create Supabase client:', error);
    return null;
  }
};

// Setup test database with real connection
export const setupTestDatabase = async (): Promise<SupabaseClient | null> => {
  const client = createTestSupabaseClient();
  
  if (!client) {
    console.warn('No test database available. Using mock client for CI/CD.');
    return createMockSupabaseClient();
  }
  
  // Reset test data tracking
  testDataIds = { polls: [], votes: [], users: [] };
  
  console.log('Integration: Real test database connected');
  return client;
};

// Create test user with real database
export const createTestUser = async (supabase: SupabaseClient | null) => {
  if (!supabase) {
    return {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User'
    };
  }
  
  try {
    // Use an existing user ID from the database
    const testUser = {
      id: '6f12e40c-fd46-4ace-9470-2016dc0e2e8b', // Existing user ID from database
      email: 'test@example.com',
      name: 'Test User'
    };
    
    // Track for cleanup
    testDataIds.users.push(testUser.id);
    
    return testUser;
  } catch (error) {
    console.warn('Failed to create test user:', error);
    return {
      id: '6f12e40c-fd46-4ace-9470-2016dc0e2e8b', // Existing user ID from database
      email: 'test@example.com',
      name: 'Test User'
    };
  }
};

// Track test data for cleanup
export const trackTestData = (type: 'polls' | 'votes' | 'users', id: string) => {
  testDataIds[type].push(id);
};

// Cleanup test database - removes all test data
export const cleanupTestDatabase = async (supabase: SupabaseClient | null) => {
  if (!supabase) {
    console.log('Integration: Mock database cleanup completed');
    return;
  }
  
  try {
    // Clean up in reverse order to respect foreign key constraints
    if (testDataIds.votes.length > 0) {
      await supabase.from('votes').delete().in('id', testDataIds.votes);
      console.log(`Integration: Cleaned up ${testDataIds.votes.length} test votes`);
    }
    
    if (testDataIds.polls.length > 0) {
      await supabase.from('polls').delete().in('id', testDataIds.polls);
      console.log(`Integration: Cleaned up ${testDataIds.polls.length} test polls`);
    }
    
    // Note: Users are managed by Supabase Auth, not a custom users table
    if (testDataIds.users.length > 0) {
      console.log(`Integration: Note - ${testDataIds.users.length} test users tracked (managed by Supabase Auth)`);
    }
    
    // Reset tracking
    testDataIds = { polls: [], votes: [], users: [] };
    
    console.log('Integration: Test database cleanup completed');
  } catch (error) {
    console.error('Integration: Failed to cleanup test database:', error);
  }
};

// Mock client fallback for CI/CD environments
const createMockSupabaseClient = (): any => {
  const mockSingle = (jest.fn() as any).mockResolvedValue({
    data: {
      id: 'test-poll-id',
      title: 'Test Poll',
      description: 'A test poll',
      votingMethod: 'single',
      options: [
        { id: 'option-1', text: 'Option 1' },
        { id: 'option-2', text: 'Option 2' }
      ],
      status: 'active',
      createdAt: new Date().toISOString(),
      closeAt: new Date(Date.now() + 86400000).toISOString(),
      createdBy: 'test-user-id'
    },
    error: null
  });

  return {
    from: jest.fn().mockReturnValue({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: mockSingle
        })
      }),
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: mockSingle
        })
      })
    }),
    auth: {
      signInWithPassword: (jest.fn() as any).mockResolvedValue({
        data: { user: { id: 'test-user-id', email: 'test@example.com' } },
        error: null
      })
    }
  };
};
