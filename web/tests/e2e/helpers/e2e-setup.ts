/**
 * E2E Test Setup and Cleanup Utilities
 * 
 * Provides centralized test data management and database operations
 * for end-to-end testing scenarios.
 * 
 * Created: January 27, 2025
 * Status: ✅ ACTIVE
 */

import { test as base } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

// Test environment configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-key';

// Supabase client for test operations
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Test data interfaces
export interface TestUser {
  id: string;
  email: string;
  username: string;
  display_name: string;
  created_at: string;
}

export interface TestPoll {
  id: string;
  title: string;
  description: string;
  options: string[];
  created_by: string;
  status: 'draft' | 'active' | 'closed';
  created_at: string;
}

export interface TestVote {
  id: string;
  poll_id: string;
  user_id: string;
  option: string;
  created_at: string;
}

// Test data management
export class E2ETestDataManager {
  private testUsers: TestUser[] = [];
  private testPolls: TestPoll[] = [];
  private testVotes: TestVote[] = [];

  /**
   * Create test user data
   */
  async createTestUser(userData: Partial<TestUser> = {}): Promise<TestUser> {
    const testUser: TestUser = {
      id: `test-user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      email: `test-${Date.now()}@example.com`,
      username: `testuser${Date.now()}`,
      display_name: `Test User ${Date.now()}`,
      created_at: new Date().toISOString(),
      ...userData
    };

    this.testUsers.push(testUser);
    return testUser;
  }

  /**
   * Create test poll data
   */
  async createTestPoll(pollData: Partial<TestPoll> = {}): Promise<TestPoll> {
    const testPoll: TestPoll = {
      id: `test-poll-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: `Test Poll ${Date.now()}`,
      description: `Test poll description ${Date.now()}`,
      options: ['Option A', 'Option B', 'Option C'],
      created_by: this.testUsers[0]?.id || 'test-user',
      status: 'active',
      created_at: new Date().toISOString(),
      ...pollData
    };

    this.testPolls.push(testPoll);
    return testPoll;
  }

  /**
   * Create test vote data
   */
  async createTestVote(voteData: Partial<TestVote> = {}): Promise<TestVote> {
    const testVote: TestVote = {
      id: `test-vote-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      poll_id: this.testPolls[0]?.id || 'test-poll',
      user_id: this.testUsers[0]?.id || 'test-user',
      option: 'Option A',
      created_at: new Date().toISOString(),
      ...voteData
    };

    this.testVotes.push(testVote);
    return testVote;
  }

  /**
   * Get all test data
   */
  getAllTestData() {
    return {
      users: this.testUsers,
      polls: this.testPolls,
      votes: this.testVotes
    };
  }

  /**
   * Clear all test data
   */
  clearAllTestData() {
    this.testUsers = [];
    this.testPolls = [];
    this.testVotes = [];
  }
}

// Global test data manager instance
export const testDataManager = new E2ETestDataManager();

/**
 * Setup E2E test data
 */
export async function setupE2ETestData() {
  try {
    // Create test users
    await testDataManager.createTestUser({
      email: 'admin@test.com',
      username: 'admin',
      display_name: 'Test Admin'
    });

    await testDataManager.createTestUser({
      email: 'user@test.com',
      username: 'testuser',
      display_name: 'Test User'
    });

    // Create test polls
    await testDataManager.createTestPoll({
      title: 'Test Poll 1',
      description: 'First test poll',
      options: ['Yes', 'No', 'Maybe']
    });

    await testDataManager.createTestPoll({
      title: 'Test Poll 2',
      description: 'Second test poll',
      options: ['Option 1', 'Option 2']
    });

    // Create test votes
    await testDataManager.createTestVote({
      option: 'Yes'
    });

    console.log('E2E test data setup complete');
  } catch (error) {
    console.error('Failed to setup E2E test data:', error);
    throw error;
  }
}

/**
 * Cleanup E2E test data
 */
export async function cleanupE2ETestData() {
  try {
    // Clear test data from memory
    testDataManager.clearAllTestData();
    
    // Note: In a real implementation, you would also clean up the database
    // For now, we're just clearing the in-memory test data
    
    console.log('E2E test data cleanup complete');
  } catch (error) {
    console.error('Failed to cleanup E2E test data:', error);
    throw error;
  }
}

/**
 * Create test user for authentication
 */
export async function createTestUser(userData: Partial<TestUser> = {}): Promise<TestUser> {
  return await testDataManager.createTestUser(userData);
}

/**
 * Get test data for use in tests
 */
export function getTestData() {
  return testDataManager.getAllTestData();
}

/**
 * E2E test fixture with setup/cleanup
 */
export const test = base.extend<{
  testData: TestData;
}>({
  testData: async ({}, use) => {
    // Setup
    await setupE2ETestData();
    const data = getTestData();
    
    // Use test data
    await use(data);
    
    // Cleanup
    await cleanupE2ETestData();
  }
});

export default test;