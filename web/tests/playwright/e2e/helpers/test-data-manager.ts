/**
 * Test Data Manager - Perfect Test Data Management
 * 
 * This module provides isolated, predictable test data for E2E tests.
 * It ensures test data consistency and prevents test interference.
 * 
 * Created: January 27, 2025
 * Updated: January 27, 2025
 */

import { Page } from '@playwright/test';

export interface TestUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  isAdmin: boolean;
  isActive: boolean;
  trustTier: 'unverified' | 'verified' | 'trusted';
  createdAt: string;
}

export interface TestPoll {
  id: string;
  title: string;
  description: string;
  options: string[];
  votingMethod: 'single' | 'approval' | 'ranked' | 'quadratic' | 'range';
  category: 'general' | 'politics' | 'civics' | 'local' | 'national' | 'international';
  privacyLevel: 'public' | 'private' | 'unlisted';
  requiresAuth: boolean;
  endTime?: string;
  createdBy: string;
  createdAt: string;
}

export interface TestVote {
  id: string;
  pollId: string;
  optionId: string;
  userId: string;
  createdAt: string;
}

export class TestDataManager {
  private static instance: TestDataManager;
  private testUsers: Map<string, TestUser> = new Map();
  private testPolls: Map<string, TestPoll> = new Map();
  private testVotes: Map<string, TestVote> = new Map();
  private cleanupQueue: string[] = [];

  private constructor() {}

  static getInstance(): TestDataManager {
    if (!TestDataManager.instance) {
      TestDataManager.instance = new TestDataManager();
    }
    return TestDataManager.instance;
  }

  /**
   * Create a test user with predictable data
   */
  createTestUser(overrides: Partial<TestUser> = {}): TestUser {
    const timestamp = Date.now();
    const user: TestUser = {
      id: `test-user-${timestamp}`,
      email: `test-${timestamp}@example.com`,
      username: `testuser${timestamp}`,
      displayName: `Test User ${timestamp}`,
      isAdmin: false,
      isActive: true,
      trustTier: 'verified',
      createdAt: new Date().toISOString(),
      ...overrides
    };

    this.testUsers.set(user.id, user);
    this.cleanupQueue.push(user.id);
    return user;
  }

  /**
   * Create a test poll with predictable data
   */
  createTestPoll(overrides: Partial<TestPoll> = {}): TestPoll {
    const timestamp = Date.now();
    const poll: TestPoll = {
      id: `test-poll-${timestamp}`,
      title: `Test Poll ${timestamp}`,
      description: `This is a test poll created at ${new Date().toISOString()}`,
      options: ['Option 1', 'Option 2', 'Option 3'],
      votingMethod: 'single',
      category: 'general',
      privacyLevel: 'public',
      requiresAuth: false,
      createdBy: 'test-user-1',
      createdAt: new Date().toISOString(),
      ...overrides
    };

    this.testPolls.set(poll.id, poll);
    this.cleanupQueue.push(poll.id);
    return poll;
  }

  /**
   * Create a test vote with predictable data
   */
  createTestVote(pollId: string, optionId: string, userId: string): TestVote {
    const timestamp = Date.now();
    const vote: TestVote = {
      id: `test-vote-${timestamp}`,
      pollId,
      optionId,
      userId,
      createdAt: new Date().toISOString()
    };

    this.testVotes.set(vote.id, vote);
    this.cleanupQueue.push(vote.id);
    return vote;
  }

  /**
   * Get a test user by ID
   */
  getTestUser(id: string): TestUser | undefined {
    return this.testUsers.get(id);
  }

  /**
   * Get a test poll by ID
   */
  getTestPoll(id: string): TestPoll | undefined {
    return this.testUsers.get(id);
  }

  /**
   * Get a test vote by ID
   */
  getTestVote(id: string): TestVote | undefined {
    return this.testVotes.get(id);
  }

  /**
   * Get all test users
   */
  getAllTestUsers(): TestUser[] {
    return Array.from(this.testUsers.values());
  }

  /**
   * Get all test polls
   */
  getAllTestPolls(): TestPoll[] {
    return Array.from(this.testPolls.values());
  }

  /**
   * Get all test votes
   */
  getAllTestVotes(): TestVote[] {
    return Array.from(this.testVotes.values());
  }

  /**
   * Create a complete test scenario
   */
  createTestScenario(): {
    user: TestUser;
    poll: TestPoll;
    vote: TestVote;
  } {
    const user = this.createTestUser();
    const poll = this.createTestPoll({ createdBy: user.id });
    const vote = this.createTestVote(poll.id, 'option-1', user.id);

    return { user, poll, vote };
  }

  /**
   * Create multiple test scenarios
   */
  createMultipleTestScenarios(count: number): Array<{
    user: TestUser;
    poll: TestPoll;
    vote: TestVote;
  }> {
    const scenarios = [];
    for (let i = 0; i < count; i++) {
      scenarios.push(this.createTestScenario());
    }
    return scenarios;
  }

  /**
   * Create test data for performance testing
   */
  createPerformanceTestData(): {
    users: TestUser[];
    polls: TestPoll[];
    votes: TestVote[];
  } {
    const users = [];
    const polls = [];
    const votes = [];

    // Create 10 test users
    for (let i = 0; i < 10; i++) {
      users.push(this.createTestUser({
        email: `perf-test-${i}@example.com`,
        username: `perfuser${i}`,
        displayName: `Performance Test User ${i}`
      }));
    }

    // Create 5 test polls
    for (let i = 0; i < 5; i++) {
      polls.push(this.createTestPoll({
        title: `Performance Test Poll ${i}`,
        description: `This is a performance test poll ${i}`,
        createdBy: users[i % users.length].id
      }));
    }

    // Create 20 test votes
    for (let i = 0; i < 20; i++) {
      const poll = polls[i % polls.length];
      const user = users[i % users.length];
      votes.push(this.createTestVote(poll.id, 'option-1', user.id));
    }

    return { users, polls, votes };
  }

  /**
   * Create test data for security testing
   */
  createSecurityTestData(): {
    maliciousUser: TestUser;
    maliciousPoll: TestPoll;
    xssPayload: string;
    sqlInjectionPayload: string;
  } {
    const maliciousUser = this.createTestUser({
      email: 'malicious@evil.com',
      username: 'malicious_user',
      displayName: 'Malicious User'
    });

    const maliciousPoll = this.createTestPoll({
      title: '<script>alert("XSS")</script>Malicious Poll',
      description: '<img src="x" onerror="alert(\'XSS\')">',
      createdBy: maliciousUser.id
    });

    const xssPayload = '<script>document.location="http://evil.com"</script>';
    const sqlInjectionPayload = "'; DROP TABLE users; --";

    return {
      maliciousUser,
      maliciousPoll,
      xssPayload,
      sqlInjectionPayload
    };
  }

  /**
   * Create test data for accessibility testing
   */
  createAccessibilityTestData(): {
    pollWithAriaLabels: TestPoll;
    pollWithKeyboardNavigation: TestPoll;
    pollWithScreenReaderSupport: TestPoll;
  } {
    const pollWithAriaLabels = this.createTestPoll({
      title: 'Poll with ARIA Labels',
      description: 'This poll has proper ARIA labels for accessibility'
    });

    const pollWithKeyboardNavigation = this.createTestPoll({
      title: 'Poll with Keyboard Navigation',
      description: 'This poll supports full keyboard navigation'
    });

    const pollWithScreenReaderSupport = this.createTestPoll({
      title: 'Poll with Screen Reader Support',
      description: 'This poll has screen reader support'
    });

    return {
      pollWithAriaLabels,
      pollWithKeyboardNavigation,
      pollWithScreenReaderSupport
    };
  }

  /**
   * Clean up all test data
   */
  async cleanup(): Promise<void> {
    // Clear all test data
    this.testUsers.clear();
    this.testPolls.clear();
    this.testVotes.clear();
    this.cleanupQueue = [];
  }

  /**
   * Clean up specific test data
   */
  async cleanupById(id: string): Promise<void> {
    this.testUsers.delete(id);
    this.testPolls.delete(id);
    this.testVotes.delete(id);
    
    const index = this.cleanupQueue.indexOf(id);
    if (index > -1) {
      this.cleanupQueue.splice(index, 1);
    }
  }

  /**
   * Get cleanup queue
   */
  getCleanupQueue(): string[] {
    return [...this.cleanupQueue];
  }

  /**
   * Reset the test data manager
   */
  reset(): void {
    this.cleanup();
  }
}

// Export singleton instance
export const testDataManager = TestDataManager.getInstance();
