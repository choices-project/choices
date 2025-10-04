/**
 * Enhanced Voting System E2E Tests - V2 Upgrade
 * 
 * Tests complete enhanced voting system including:
 * - All voting methods with V2 mock factory setup
 * - Offline voting with PWA
 * - Error handling and validation
 * - Performance and user experience
 * 
 * Created: January 21, 2025
 * Updated: January 21, 2025
 */

import { test, expect } from '@playwright/test';
import { 
  setupE2ETestData, 
  cleanupE2ETestData, 
  createTestUser, 
  createTestPoll,
  waitForPageReady,
  setupExternalAPIMocks,
  E2E_CONFIG
} from './helpers/e2e-setup';

test.describe('Enhanced Voting System - V2', () => {
  let testData: {
    user: ReturnType<typeof createTestUser>;
    poll: ReturnType<typeof createTestPoll>;
  };

  // Helper function to authenticate user
  async function authenticateUser(page: any, user: any) {
    await page.goto('/login');
    await waitForPageReady(page);
    
    await page.fill('[data-testid="login-email"]', user.email);
    await page.fill('[data-testid="login-password"]', user.password);
    await page.click('[data-testid="login-submit"]');
    
    // Wait for successful login
    await page.waitForURL('/dashboard', { timeout: 10000 });
  }

  test.beforeEach(async ({ page }) => {
    // Create test data using V2 patterns
    testData = {
      user: createTestUser({
        email: 'voting-test@example.com',
        username: 'votingtestuser',
        password: 'VotingTest123!'
      }),
      poll: createTestPoll({
        title: 'V2 Enhanced Voting Test Poll',
        description: 'Testing enhanced voting system with V2 setup',
        options: ['Voting Option 1', 'Voting Option 2', 'Voting Option 3', 'Voting Option 4'],
        category: 'general',
        votingMethod: 'single'
      })
    };

    // Set up external API mocks
    await setupExternalAPIMocks(page);

    // Navigate to polls page first
    await page.goto('/polls');
    await waitForPageReady(page);
  });

  test.afterEach(async () => {
    // Clean up test data
    await cleanupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });
  });

  test('should display enhanced voting interface with all methods with V2 setup', async ({ page }) => {
    // Set up test data for voting interface testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // First authenticate the user
    await authenticateUser(page, testData.user);

    // Navigate to specific poll page
    await page.goto(`/polls/${testData.poll.id}`);
    await waitForPageReady(page);

    // Check if voting interface is visible
    await expect(page.locator('[data-testid="voting-form"]')).toBeVisible();
    
    // Check for voting method indicators
    await expect(page.locator('text=Cast Your Vote')).toBeVisible();
    
    // Check for verification tier badge
    await expect(page.locator('text=Tier')).toBeVisible();
  });

  test('should support single choice voting with V2 setup', async ({ page }) => {
    // Set up test data for single choice voting
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // First authenticate the user
    await authenticateUser(page, testData.user);

    // Navigate to specific poll page
    await page.goto(`/polls/${testData.poll.id}`);
    await waitForPageReady(page);

    // Start voting
    await page.click('[data-testid="start-voting-button"]');
    
    // Check if single choice voting interface is displayed
    await expect(page.locator('[data-testid="voting-form"]')).toBeVisible();
    
    // Select an option (assuming single choice is the default)
    const firstOption = page.locator('input[type="radio"]').first();
    await firstOption.click();
    
    // Submit vote
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    
    // Check for success message or redirect
    await expect(page.locator('text=Vote submitted')).toBeVisible();
  });

  test('should support approval voting with V2 setup', async ({ page }) => {
    // Create poll with approval voting method
    const approvalPoll = createTestPoll({
      title: 'V2 Approval Voting Test Poll',
      description: 'Testing approval voting with V2 setup',
      options: ['Approval Option 1', 'Approval Option 2', 'Approval Option 3'],
      votingMethod: 'approval'
    });

    // Set up test data for approval voting
    await setupE2ETestData({
      user: testData.user,
      poll: approvalPoll
    });

    // Navigate to specific poll page
    await page.goto(`/polls/${approvalPoll.id}`);
    await waitForPageReady(page);

    // Start voting
    await page.click('[data-testid="start-voting-button"]');
    
    // Check if voting interface is displayed
    await expect(page.locator('[data-testid="voting-form"]')).toBeVisible();
    
    // For approval voting, select multiple options
    const checkboxes = page.locator('input[type="checkbox"]');
    if (await checkboxes.count() > 0) {
      await checkboxes.first().click();
      await checkboxes.nth(1).click();
    }
    
    // Submit vote
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    
    // Check for success message
    await expect(page.locator('text=Vote submitted')).toBeVisible();
  });

  test('should support ranked choice voting with V2 setup', async ({ page }) => {
    // Create poll with ranked choice voting method
    const rankedPoll = createTestPoll({
      title: 'V2 Ranked Choice Voting Test Poll',
      description: 'Testing ranked choice voting with V2 setup',
      options: ['Ranked Option 1', 'Ranked Option 2', 'Ranked Option 3'],
      votingMethod: 'ranked'
    });

    // Set up test data for ranked choice voting
    await setupE2ETestData({
      user: testData.user,
      poll: rankedPoll
    });

    // Navigate to specific poll page
    await page.goto(`/polls/${rankedPoll.id}`);
    await waitForPageReady(page);

    // Start voting
    await page.click('[data-testid="start-voting-button"]');
    
    // Check if ranked choice interface is displayed
    await expect(page.locator('[data-testid="ranked-choice-form"]')).toBeVisible();
    
    // Rank options (drag and drop or select from dropdowns)
    const rankSelects = page.locator('select[data-testid="rank-select"]');
    if (await rankSelects.count() > 0) {
      await rankSelects.first().selectOption('1');
      await rankSelects.nth(1).selectOption('2');
      await rankSelects.nth(2).selectOption('3');
    }
    
    // Submit vote
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    
    // Check for success message
    await expect(page.locator('text=Vote submitted')).toBeVisible();
  });

  test('should support quadratic voting with V2 setup', async ({ page }) => {
    // Create poll with quadratic voting method
    const quadraticPoll = createTestPoll({
      title: 'V2 Quadratic Voting Test Poll',
      description: 'Testing quadratic voting with V2 setup',
      options: ['Quadratic Option 1', 'Quadratic Option 2', 'Quadratic Option 3'],
      votingMethod: 'quadratic'
    });

    // Set up test data for quadratic voting
    await setupE2ETestData({
      user: testData.user,
      poll: quadraticPoll
    });

    // Navigate to specific poll page
    await page.goto(`/polls/${quadraticPoll.id}`);
    await waitForPageReady(page);

    // Start voting
    await page.click('[data-testid="start-voting-button"]');
    
    // Check if quadratic voting interface is displayed
    await expect(page.locator('[data-testid="quadratic-voting-form"]')).toBeVisible();
    
    // Allocate votes using quadratic voting interface
    const voteInputs = page.locator('input[data-testid="quadratic-vote-input"]');
    if (await voteInputs.count() > 0) {
      await voteInputs.first().fill('4'); // 2^2 = 4 points
      await voteInputs.nth(1).fill('1'); // 1^2 = 1 point
    }
    
    // Submit vote
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    
    // Check for success message
    await expect(page.locator('text=Vote submitted')).toBeVisible();
  });

  test('should support range voting with V2 setup', async ({ page }) => {
    // Create poll with range voting method
    const rangePoll = createTestPoll({
      title: 'V2 Range Voting Test Poll',
      description: 'Testing range voting with V2 setup',
      options: ['Range Option 1', 'Range Option 2', 'Range Option 3'],
      votingMethod: 'range'
    });

    // Set up test data for range voting
    await setupE2ETestData({
      user: testData.user,
      poll: rangePoll
    });

    // Navigate to specific poll page
    await page.goto(`/polls/${rangePoll.id}`);
    await waitForPageReady(page);

    // Start voting
    await page.click('[data-testid="start-voting-button"]');
    
    // Check if range voting interface is displayed
    await expect(page.locator('[data-testid="range-voting-form"]')).toBeVisible();
    
    // Set range values using sliders or inputs
    const rangeInputs = page.locator('input[type="range"]');
    if (await rangeInputs.count() > 0) {
      await rangeInputs.first().fill('8');
      await rangeInputs.nth(1).fill('6');
      await rangeInputs.nth(2).fill('4');
    }
    
    // Submit vote
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    
    // Check for success message
    await expect(page.locator('text=Vote submitted')).toBeVisible();
  });

  test('should handle offline voting with PWA with V2 setup', async ({ page }) => {
    // Set up test data for offline voting
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Navigate to specific poll page
    await page.goto(`/polls/${testData.poll.id}`);
    await waitForPageReady(page);

    // Go offline
    await page.context().setOffline(true);
    
    // Start voting
    await page.click('[data-testid="start-voting-button"]');
    
    // Check if offline voting interface is displayed
    await expect(page.locator('[data-testid="offline-voting-form"]')).toBeVisible();
    
    // Select an option
    const firstOption = page.locator('input[type="radio"]').first();
    await firstOption.click();
    
    // Submit vote (should be queued for later)
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    
    // Check for offline queue message
    await expect(page.locator('text=Vote queued for later')).toBeVisible();
    
    // Go back online
    await page.context().setOffline(false);
    
    // Wait for sync
    await page.waitForTimeout(2000);
    
    // Check that vote was submitted
    await expect(page.locator('text=Vote submitted')).toBeVisible();
  });

  test('should handle voting validation errors with V2 setup', async ({ page }) => {
    // Set up test data for validation testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Navigate to specific poll page
    await page.goto(`/polls/${testData.poll.id}`);
    await waitForPageReady(page);

    // Start voting
    await page.click('[data-testid="start-voting-button"]');
    
    // Try to submit without selecting an option
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    
    // Check for validation error
    await expect(page.locator('[data-testid="voting-error"]')).toBeVisible();
    await expect(page.locator('text=Please select an option')).toBeVisible();
  });

  test('should handle voting with different user types with V2 setup', async ({ page }) => {
    // Create different user types for testing
    const regularUser = createTestUser({
      email: 'regular-voting@example.com',
      username: 'regularvoting'
    });

    const adminUser = createTestUser({
      email: 'admin-voting@example.com',
      username: 'adminvoting'
    });

    // Test regular user voting
    await setupE2ETestData({
      user: regularUser,
      poll: testData.poll
    });

    await page.goto('/login');
    await waitForPageReady(page);

    await page.fill('[data-testid="login-email"]', regularUser.email);
    await page.fill('[data-testid="login-password"]', regularUser.password);
    await page.click('[data-testid="login-submit"]');

    await page.waitForURL('/dashboard');
    await page.goto(`/polls/${testData.poll.id}`);
    await waitForPageReady(page);

    await page.click('[data-testid="start-voting-button"]');
    const firstOption = page.locator('input[type="radio"]').first();
    await firstOption.click();
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    await expect(page.locator('text=Vote submitted')).toBeVisible();

    // Test admin user voting
    await setupE2ETestData({
      user: adminUser,
      poll: testData.poll
    });

    await page.click('[data-testid="logout-button"]');
    await page.waitForURL('/');

    await page.goto('/login');
    await waitForPageReady(page);

    await page.fill('[data-testid="login-email"]', adminUser.email);
    await page.fill('[data-testid="login-password"]', adminUser.password);
    await page.click('[data-testid="login-submit"]');

    await page.waitForURL('/dashboard');
    await page.goto(`/polls/${testData.poll.id}`);
    await waitForPageReady(page);

    await page.click('[data-testid="start-voting-button"]');
    const firstOptionAdmin = page.locator('input[type="radio"]').first();
    await firstOptionAdmin.click();
    const submitButtonAdmin = page.locator('button[type="submit"]');
    await submitButtonAdmin.click();

    await expect(page.locator('text=Vote submitted')).toBeVisible();
  });

  test('should handle voting with mobile viewport with V2 setup', async ({ page }) => {
    // Set up test data for mobile voting testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Set mobile viewport
    await page.setViewportSize(E2E_CONFIG.BROWSER.MOBILE_VIEWPORT);

    // Navigate to specific poll page
    await page.goto(`/polls/${testData.poll.id}`);
    await waitForPageReady(page);

    // Check mobile voting interface
    await expect(page.locator('[data-testid="mobile-voting-form"]')).toBeVisible();

    // Start voting
    await page.click('[data-testid="start-voting-button"]');
    
    // Select an option
    const firstOption = page.locator('input[type="radio"]').first();
    await firstOption.click();
    
    // Submit vote
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    
    // Check for success message
    await expect(page.locator('text=Vote submitted')).toBeVisible();
  });

  test('should handle voting with civics integration with V2 setup', async ({ page }) => {
    // Set up test data for civics voting integration
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Set up civics context
    await page.goto('/civics');
    await waitForPageReady(page);

    await page.fill('[data-testid="address-input"]', '123 Any St, Springfield, IL 62704');
    await page.click('[data-testid="address-submit"]');
    await page.waitForResponse('**/api/v1/civics/address-lookup');

    // Navigate to specific poll page
    await page.goto(`/polls/${testData.poll.id}`);
    await waitForPageReady(page);

    // Check civics integration in voting
    await expect(page.locator('[data-testid="civics-voting-context"]')).toBeVisible();
    await expect(page.locator('text=State IL Poll')).toBeVisible();

    // Start voting
    await page.click('[data-testid="start-voting-button"]');
    
    // Select an option
    const firstOption = page.locator('input[type="radio"]').first();
    await firstOption.click();
    
    // Submit vote
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    
    // Check for success message
    await expect(page.locator('text=Vote submitted')).toBeVisible();
  });

  test('should handle voting performance with V2 setup', async ({ page }) => {
    // Set up test data for performance testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Navigate to specific poll page
    await page.goto(`/polls/${testData.poll.id}`);
    await waitForPageReady(page);

    // Measure voting performance
    const startTime = Date.now();

    // Start voting
    await page.click('[data-testid="start-voting-button"]');
    
    // Select an option
    const firstOption = page.locator('input[type="radio"]').first();
    await firstOption.click();
    
    // Submit vote
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    
    // Wait for success message
    await expect(page.locator('text=Vote submitted')).toBeVisible();

    const endTime = Date.now();
    const votingTime = endTime - startTime;

    // Verify voting performance is acceptable
    expect(votingTime).toBeLessThan(3000);
  });
});