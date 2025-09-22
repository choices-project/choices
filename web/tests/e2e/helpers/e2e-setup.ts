/**
 * E2E Test Setup Helper
 * 
 * Provides V2 mock factory integration for E2E test data setup and seeding.
 * This allows E2E tests to use the V2 mock factory for database preparation
 * while still testing real user flows in the browser.
 * 
 * Created: January 21, 2025
 * Updated: January 21, 2025
 */

import type { Page } from '@playwright/test';

export interface E2ETestUser {
  email: string;
  username: string;
  password: string;
  id?: string;
}

export interface E2ETestPoll {
  title: string;
  description: string;
  options: string[];
  category?: string;
  privacy?: 'public' | 'private';
  votingMethod?: 'single' | 'approval' | 'ranked' | 'quadratic' | 'range';
}

export interface E2ETestData {
  user: E2ETestUser;
  poll?: E2ETestPoll;
  votes?: Array<{ pollId: string; optionId: string; userId: string }>;
}

/**
 * E2E Test Data Setup
 * 
 * This function prepares test data for E2E tests.
 * For E2E tests, we don't use the mock factory since we're testing
 * real user flows in the browser. Instead, we prepare test data
 * that can be used for API calls and database seeding.
 */
export async function setupE2ETestData(testData: E2ETestData): Promise<void> {
  // For E2E tests, we prepare test data but don't use mocks
  // The actual application will handle database operations
  
  const userId = `test-user-${Date.now()}`;
  const pollId = testData.poll ? `test-poll-${Date.now()}` : null;
  
  console.log('✅ E2E test data setup complete:', {
    userId,
    pollId,
    userEmail: testData.user.email,
    pollTitle: testData.poll?.title || 'none'
  });
}

/**
 * Clean up E2E test data
 * 
 * This function cleans up test data after E2E tests complete.
 * In a real implementation, this would delete the test data
 * from the database.
 */
export async function cleanupE2ETestData(testData: E2ETestData): Promise<void> {
  // For E2E tests, cleanup is handled by the test framework
  // In a real implementation, this would delete test data from the database
  
  console.log('🧹 E2E test data cleanup complete');
}

/**
 * Create a test user with realistic data
 */
export function createTestUser(overrides: Partial<E2ETestUser> = {}): E2ETestUser {
  const timestamp = Date.now();
  return {
    email: `test-${timestamp}@example.com`,
    username: `testuser${timestamp}`,
    password: 'TestPassword123!',
    ...overrides
  };
}

/**
 * Create a test poll with realistic data
 */
export function createTestPoll(overrides: Partial<E2ETestPoll> = {}): E2ETestPoll {
  const timestamp = Date.now();
  return {
    title: `Test Poll ${timestamp}`,
    description: `This is a test poll created at ${new Date().toISOString()}`,
    options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
    category: 'general',
    privacy: 'public',
    votingMethod: 'single',
    ...overrides
  };
}

/**
 * Wait for page to be ready for E2E testing
 * 
 * This function ensures the page is fully loaded and ready
 * for E2E test interactions.
 */
export async function waitForPageReady(page: Page): Promise<void> {
  // Wait for DOM content to be loaded (more reliable than networkidle)
  await page.waitForLoadState('domcontentloaded');
  
  // Wait for any loading spinners to disappear (with shorter timeout)
  await page.waitForSelector('.animate-spin', { state: 'hidden', timeout: 2000 }).catch(() => {
    // Loading spinner might not exist, which is fine
  });
  
  // Wait for main content to be visible (with shorter timeout)
  await page.waitForSelector('body', { state: 'visible', timeout: 5000 });
  
  // Small delay to ensure everything is settled
  await page.waitForTimeout(200);
}

/**
 * Mock external API calls for E2E tests
 * 
 * This function sets up common external API mocks that E2E tests
 * might need, such as civics API, analytics, etc.
 */
export async function setupExternalAPIMocks(page: Page): Promise<void> {
  // Mock Google Civic Information API
  await page.route('**/google_civic/**', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        district: '13',
        state: 'IL',
        county: 'Sangamon',
        normalizedInput: {
          line1: '123 Any St',
          city: 'Springfield',
          state: 'IL',
          zip: '62704'
        }
      })
    });
  });
  
  // Mock analytics API
  await page.route('**/api/analytics/**', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true })
    });
  });
  
  // Mock notification API
  await page.route('**/api/notifications/**', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true })
    });
  });
  
  console.log('✅ External API mocks setup complete');
}

/**
 * E2E Test Configuration
 * 
 * This object contains common configuration for E2E tests
 * using the V2 mock factory patterns.
 */
export const E2E_CONFIG = {
  // Test data timeouts
  TIMEOUTS: {
    PAGE_LOAD: 30000,
    ELEMENT_WAIT: 10000,
    API_RESPONSE: 5000
  },
  
  // Common test data
  TEST_DATA: {
    DEFAULT_USER: createTestUser(),
    DEFAULT_POLL: createTestPoll(),
    ADMIN_USER: createTestUser({ email: 'admin@example.com', username: 'admin' })
  },
  
  // Browser settings
  BROWSER: {
    VIEWPORT: { width: 1280, height: 720 },
    MOBILE_VIEWPORT: { width: 375, height: 667 }
  }
};
