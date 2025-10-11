/**
 * E2E Test Setup Utilities - V2
 * 
 * This file provides comprehensive setup utilities for E2E tests,
 * including test data creation, cleanup, and common test patterns.
 * 
 * Created: January 21, 2025
 * Status: Active - Core E2E testing infrastructure
 * Version: V2 - Modernized for current testing patterns
 */

import { Page } from '@playwright/test';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface TestUser {
  email: string;
  username: string;
  password: string;
  id?: string;
}

export interface TestPoll {
  title: string;
  description: string;
  options: string[];
  category: string;
  privacy: 'public' | 'private';
  votingMethod: 'single' | 'multiple' | 'ranked';
  id?: string;
}

export interface TestVote {
  pollId: string;
  optionId: string;
  userId: string;
}

export interface TestData {
  user: TestUser;
  poll: TestPoll;
  votes?: TestVote[];
}

export interface E2EConfig {
  baseURL: string;
  timeout: number;
  retries: number;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

export const E2E_CONFIG: E2EConfig = {
  baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
  timeout: 30000,
  retries: 2,
};

// ============================================================================
// TEST DATA CREATION
// ============================================================================

/**
 * Create a realistic test user
 */
export function createTestUser(overrides: Partial<TestUser> = {}): TestUser {
  const timestamp = Date.now();
  return {
    email: `test-${timestamp}@example.com`,
    username: `testuser${timestamp}`,
    password: 'TestPassword123!',
    id: `user-${timestamp}`,
    ...overrides,
  };
}

/**
 * Create a realistic test poll
 */
export function createTestPoll(overrides: Partial<TestPoll> = {}): TestPoll {
  const timestamp = Date.now();
  return {
    title: `Test Poll ${timestamp}`,
    description: 'This is a test poll for E2E testing.',
    options: ['Option A', 'Option B', 'Option C'],
    category: 'politics',
    privacy: 'public',
    votingMethod: 'single',
    id: `poll-${timestamp}`,
    ...overrides,
  };
}

/**
 * Create test vote data
 */
export function createTestVote(pollId: string, optionId: string, userId: string): TestVote {
  return {
    pollId,
    optionId,
    userId,
  };
}

// ============================================================================
// TEST DATA MANAGEMENT
// ============================================================================

/**
 * Set up complete test data for E2E tests
 */
export async function setupE2ETestData(data: TestData): Promise<void> {
  // In a real implementation, this would:
  // 1. Create user in database
  // 2. Create poll in database
  // 3. Create any votes if provided
  // 4. Set up any necessary authentication state
  
  console.log('Setting up E2E test data:', {
    user: data.user.email,
    poll: data.poll.title,
    votes: data.votes?.length || 0,
  });
  
  // For now, just log the setup
  // TODO: Implement actual database setup
}

/**
 * Clean up test data after E2E tests
 */
export async function cleanupE2ETestData(data: TestData): Promise<void> {
  // In a real implementation, this would:
  // 1. Delete votes from database
  // 2. Delete poll from database
  // 3. Delete user from database
  // 4. Clean up any authentication state
  
  console.log('Cleaning up E2E test data:', {
    user: data.user.email,
    poll: data.poll.title,
  });
  
  // For now, just log the cleanup
  // TODO: Implement actual database cleanup
}

// ============================================================================
// PAGE UTILITIES
// ============================================================================

/**
 * Wait for page to be ready for E2E testing
 */
export async function waitForPageReady(page: Page): Promise<void> {
  // Wait for network to be idle
  await page.waitForLoadState('networkidle');
  
  // Wait for any loading spinners to disappear
  await page.waitForFunction(() => {
    const spinners = document.querySelectorAll('[data-testid="loading"], .loading, .spinner');
    return spinners.length === 0;
  });
  
  // Wait for main content to be visible
  await page.waitForSelector('main, [data-testid="main-content"]', { timeout: 10000 });
  
  // Additional wait for any async operations
  await page.waitForTimeout(1000);
}

/**
 * Set up external API mocks for E2E tests
 */
export async function setupExternalAPIMocks(page: Page): Promise<void> {
  // Mock Google Civic Information API
  await page.route('**/civicinfo/v2/**', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        offices: [],
        officials: [],
        normalizedInput: {},
      }),
    });
  });
  
  // Mock Analytics API
  await page.route('**/api/analytics/**', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });
  
  // Mock Notification API
  await page.route('**/api/notifications/**', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });
}

// ============================================================================
// AUTHENTICATION UTILITIES
// ============================================================================

/**
 * Login user for E2E tests
 */
export async function loginUser(page: Page, user: TestUser): Promise<void> {
  await page.goto('/auth');
  
  // Fill in login form
  await page.fill('[data-testid="email-input"]', user.email);
  await page.fill('[data-testid="password-input"]', user.password);
  
  // Submit login form
  await page.click('[data-testid="login-button"]');
  
  // Wait for redirect to dashboard
  await page.waitForURL('/dashboard', { timeout: 10000 });
}

/**
 * Logout user for E2E tests
 */
export async function logoutUser(page: Page): Promise<void> {
  // Click logout button
  await page.click('[data-testid="logout-button"]');
  
  // Wait for redirect to auth page
  await page.waitForURL('/auth', { timeout: 10000 });
}

// ============================================================================
// POLL UTILITIES
// ============================================================================

/**
 * Create a poll for E2E tests
 */
export async function createPoll(page: Page, poll: TestPoll): Promise<void> {
  await page.goto('/polls/create');
  
  // Fill in poll form
  await page.fill('[data-testid="poll-title"]', poll.title);
  await page.fill('[data-testid="poll-description"]', poll.description);
  
  // Add options
  for (let i = 0; i < poll.options.length; i++) {
    await page.fill(`[data-testid="poll-option-${i}"]`, poll.options[i]);
  }
  
  // Set category
  await page.selectOption('[data-testid="poll-category"]', poll.category);
  
  // Set privacy
  await page.selectOption('[data-testid="poll-privacy"]', poll.privacy);
  
  // Set voting method
  await page.selectOption('[data-testid="poll-voting-method"]', poll.votingMethod);
  
  // Submit poll
  await page.click('[data-testid="create-poll-button"]');
  
  // Wait for redirect to poll page
  await page.waitForURL(/\/polls\/[^\/]+/, { timeout: 10000 });
}

/**
 * Vote on a poll for E2E tests
 */
export async function voteOnPoll(page: Page, optionId: string): Promise<void> {
  // Click on the option
  await page.click(`[data-testid="vote-option-${optionId}"]`);
  
  // Submit vote
  await page.click('[data-testid="submit-vote-button"]');
  
  // Wait for vote confirmation
  await page.waitForSelector('[data-testid="vote-confirmation"]', { timeout: 10000 });
}

// ============================================================================
// NAVIGATION UTILITIES
// ============================================================================

/**
 * Navigate to a page and wait for it to be ready
 */
export async function navigateToPage(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await waitForPageReady(page);
}

/**
 * Navigate to dashboard
 */
export async function navigateToDashboard(page: Page): Promise<void> {
  await navigateToPage(page, '/dashboard');
}

/**
 * Navigate to polls page
 */
export async function navigateToPolls(page: Page): Promise<void> {
  await navigateToPage(page, '/polls');
}

/**
 * Navigate to profile page
 */
export async function navigateToProfile(page: Page): Promise<void> {
  await navigateToPage(page, '/profile');
}

// ============================================================================
// ASSERTION UTILITIES
// ============================================================================

/**
 * Assert that user is logged in
 */
export async function assertUserLoggedIn(page: Page): Promise<void> {
  await page.waitForSelector('[data-testid="user-menu"]', { timeout: 5000 });
}

/**
 * Assert that user is logged out
 */
export async function assertUserLoggedOut(page: Page): Promise<void> {
  await page.waitForSelector('[data-testid="login-button"]', { timeout: 5000 });
}

/**
 * Assert that poll exists on page
 */
export async function assertPollExists(page: Page, pollTitle: string): Promise<void> {
  await page.waitForSelector(`text=${pollTitle}`, { timeout: 5000 });
}

/**
 * Assert that vote was recorded
 */
export async function assertVoteRecorded(page: Page): Promise<void> {
  await page.waitForSelector('[data-testid="vote-confirmation"]', { timeout: 5000 });
}
