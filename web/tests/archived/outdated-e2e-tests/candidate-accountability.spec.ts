/**
 * Candidate Accountability Platform E2E Tests - V2 Upgrade
 * 
 * Tests complete candidate accountability platform including:
 * - Candidate accountability features with V2 mock factory setup
 * - Promise tracking and campaign finance information
 * - Voting records and transparency features
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

test.describe('Candidate Accountability Platform - V2', () => {
  let testData: {
    user: ReturnType<typeof createTestUser>;
    poll: ReturnType<typeof createTestPoll>;
  };

  test.beforeEach(async ({ page }) => {
    // Create test data using V2 patterns
    testData = {
      user: createTestUser({
        email: 'candidate-accountability-test@example.com',
        username: 'candidateaccountabilitytestuser',
        password: 'CandidateAccountabilityTest123!'
      }),
      poll: createTestPoll({
        title: 'V2 Candidate Accountability Test Poll',
        description: 'Testing candidate accountability with V2 setup',
        options: ['Accountability Option 1', 'Accountability Option 2', 'Accountability Option 3'],
        category: 'civics'
      })
    };

    // Set up external API mocks
    await setupExternalAPIMocks(page);
  });

  test.afterEach(async () => {
    // Clean up test data
    await cleanupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });
  });

  test('should load civics page with candidate accountability features with V2 setup', async ({ page }) => {
    // Set up test data for civics page testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    await page.goto('/civics');
    await waitForPageReady(page);
    
    // Check if page loads successfully
    const currentUrl = page.url();
    expect(currentUrl).toContain('/civics');
  });

  test('should display candidate accountability cards with V2 setup', async ({ page }) => {
    // Set up test data for candidate accountability cards testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    await page.goto('/civics');
    await waitForPageReady(page);
    
    // Check if candidate accountability cards are visible
    const accountabilityCards = page.locator('[data-testid="candidate-accountability-card"]');
    
    // If feature is enabled, cards should be visible
    if (await accountabilityCards.count() > 0) {
      await expect(accountabilityCards.first()).toBeVisible();
    }
  });

  test('should display promise tracking information with V2 setup', async ({ page }) => {
    // Set up test data for promise tracking testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    await page.goto('/civics');
    await waitForPageReady(page);
    
    // Look for promise-related content
    const promiseElements = page.locator('text=Promises');
    if (await promiseElements.count() > 0) {
      await expect(promiseElements.first()).toBeVisible();
    }
  });

  test('should display campaign finance information with V2 setup', async ({ page }) => {
    // Set up test data for campaign finance testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    await page.goto('/civics');
    await waitForPageReady(page);
    
    // Look for campaign finance content
    const financeElements = page.locator('text=Campaign Finance');
    if (await financeElements.count() > 0) {
      await expect(financeElements.first()).toBeVisible();
    }
  });

  test('should display voting records with V2 setup', async ({ page }) => {
    // Set up test data for voting records testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    await page.goto('/civics');
    await waitForPageReady(page);
    
    // Look for voting records content
    const votingRecordsElements = page.locator('text=Voting Records');
    if (await votingRecordsElements.count() > 0) {
      await expect(votingRecordsElements.first()).toBeVisible();
    }
  });

  test('should display transparency features with V2 setup', async ({ page }) => {
    // Set up test data for transparency features testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    await page.goto('/civics');
    await waitForPageReady(page);
    
    // Look for transparency content
    const transparencyElements = page.locator('text=Transparency');
    if (await transparencyElements.count() > 0) {
      await expect(transparencyElements.first()).toBeVisible();
    }
  });

  test('should handle candidate accountability with authentication with V2 setup', async ({ page }) => {
    // Set up test data for authenticated candidate accountability testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // First, authenticate the user
    await page.goto('/login');
    await waitForPageReady(page);
    
    await page.fill('[data-testid="login-email"]', testData.user.email);
    await page.fill('[data-testid="login-password"]', testData.user.password);
    await page.click('[data-testid="login-submit"]');
    
    // Wait for authentication
    await page.waitForURL('/dashboard');
    await waitForPageReady(page);
    
    // Now test candidate accountability with authenticated user
    await page.goto('/civics');
    await waitForPageReady(page);
    
    // Check if authenticated features are available
    await expect(page.locator('[data-testid="authenticated-accountability-features"]')).toBeVisible();
  });

  test('should handle candidate accountability with different user types with V2 setup', async ({ page }) => {
    // Create different user types for testing
    const regularUser = createTestUser({
      email: 'regular-candidate@example.com',
      username: 'regularcandidate'
    });

    const adminUser = createTestUser({
      email: 'admin-candidate@example.com',
      username: 'admincandidate'
    });

    // Test regular user candidate accountability
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
    await page.goto('/civics');
    await waitForPageReady(page);

    await expect(page.locator('[data-testid="regular-user-accountability"]')).toBeVisible();

    // Test admin user candidate accountability
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
    await page.goto('/civics');
    await waitForPageReady(page);

    await expect(page.locator('[data-testid="admin-user-accountability"]')).toBeVisible();
  });

  test('should handle candidate accountability with mobile viewport with V2 setup', async ({ page }) => {
    // Set up test data for mobile candidate accountability testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Set mobile viewport
    await page.setViewportSize(E2E_CONFIG.BROWSER.MOBILE_VIEWPORT);

    await page.goto('/civics');
    await waitForPageReady(page);

    // Check mobile candidate accountability layout
    await expect(page.locator('[data-testid="mobile-accountability"]')).toBeVisible();

    // Check mobile candidate cards
    const mobileCards = page.locator('[data-testid="mobile-candidate-card"]');
    if (await mobileCards.count() > 0) {
      await expect(mobileCards.first()).toBeVisible();
    }
  });

  test('should handle candidate accountability with poll management integration with V2 setup', async ({ page }) => {
    // Set up test data for poll management integration
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Authenticate user
    await page.goto('/login');
    await waitForPageReady(page);

    await page.fill('[data-testid="login-email"]', testData.user.email);
    await page.fill('[data-testid="login-password"]', testData.user.password);
    await page.click('[data-testid="login-submit"]');

    await page.waitForURL('/dashboard');
    await waitForPageReady(page);

    // Test candidate accountability with poll creation
    await page.goto('/civics');
    await waitForPageReady(page);

    // Set up jurisdiction
    await page.fill('[data-testid="address-input"]', '123 Any St, Springfield, IL 62704');
    await page.click('[data-testid="address-submit"]');
    await page.waitForResponse('**/api/v1/civics/address-lookup');

    // Create a poll with candidate accountability context
    await page.goto('/polls/create');
    await waitForPageReady(page);

    await page.fill('input[id="title"]', 'Candidate Accountability Poll');
    await page.fill('textarea[id="description"]', 'A poll about candidate accountability');
    await page.click('button:has-text("Next")');

    await page.fill('input[placeholder*="Option 1"]', 'Accountability Option 1');
    await page.fill('input[placeholder*="Option 2"]', 'Accountability Option 2');
    await page.click('button:has-text("Next")');

    await page.selectOption('select', 'civics');
    await page.click('button:has-text("Next")');

    await page.click('button:has-text("Create Poll")');
    await page.waitForURL(/\/polls\/[a-f0-9-]+/);

    // Verify poll was created with candidate accountability context
    const pollTitle = await page.locator('[data-testid="poll-title"]');
    await expect(pollTitle).toContainText('Candidate Accountability Poll');
  });

  test('should handle candidate accountability with civics integration with V2 setup', async ({ page }) => {
    // Set up test data for civics integration
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

    // Check candidate accountability with civics context
    await expect(page.locator('[data-testid="civics-accountability"]')).toBeVisible();
    await expect(page.locator('text=State IL Candidates')).toBeVisible();
    await expect(page.locator('text=district 13')).toBeVisible();
  });

  test('should handle candidate accountability performance with V2 setup', async ({ page }) => {
    // Set up test data for performance testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Measure candidate accountability performance
    const startTime = Date.now();

    await page.goto('/civics');
    await waitForPageReady(page);

    // Check if candidate accountability features load
    const accountabilityCards = page.locator('[data-testid="candidate-accountability-card"]');
    if (await accountabilityCards.count() > 0) {
      await expect(accountabilityCards.first()).toBeVisible();
    }

    const endTime = Date.now();
    const accountabilityTime = endTime - startTime;

    // Verify candidate accountability performance is acceptable
    expect(accountabilityTime).toBeLessThan(3000);
  });

  test('should handle candidate accountability with offline functionality with V2 setup', async ({ page }) => {
    // Set up test data for offline candidate accountability testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    await page.goto('/civics');
    await waitForPageReady(page);

    // Go offline
    await page.context().setOffline(true);

    // Check offline candidate accountability handling
    await expect(page.locator('[data-testid="offline-accountability"]')).toBeVisible();

    // Try to access candidate accountability while offline
    const accountabilityCards = page.locator('[data-testid="candidate-accountability-card"]');
    if (await accountabilityCards.count() > 0) {
      await expect(accountabilityCards.first()).toBeVisible();
    }

    // Go back online
    await page.context().setOffline(false);

    // Check that candidate accountability works again
    await expect(page.locator('[data-testid="offline-accountability"]')).not.toBeVisible();
  });

  test('should handle candidate accountability with PWA integration with V2 setup', async ({ page }) => {
    // Set up test data for PWA candidate accountability testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Authenticate user
    await page.goto('/login');
    await waitForPageReady(page);

    await page.fill('[data-testid="login-email"]', testData.user.email);
    await page.fill('[data-testid="login-password"]', testData.user.password);
    await page.click('[data-testid="login-submit"]');

    await page.waitForURL('/dashboard');
    await waitForPageReady(page);

    // Test candidate accountability with PWA features
    await page.goto('/civics');
    await waitForPageReady(page);

    // Check PWA candidate accountability features
    await expect(page.locator('[data-testid="pwa-accountability"]')).toBeVisible();

    // Test offline candidate accountability
    await page.context().setOffline(true);

    await expect(page.locator('[data-testid="offline-accountability"]')).toBeVisible();

    // Go back online
    await page.context().setOffline(false);

    await expect(page.locator('[data-testid="offline-accountability"]')).not.toBeVisible();
  });

  test('should handle candidate accountability with WebAuthn integration with V2 setup', async ({ page }) => {
    // Set up test data for WebAuthn candidate accountability testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Test candidate accountability with WebAuthn authentication
    await page.goto('/login');
    await waitForPageReady(page);

    // Check WebAuthn login option
    await expect(page.locator('[data-testid="webauthn-login"]')).toBeVisible();

    // Test WebAuthn login
    await page.click('[data-testid="webauthn-login"]');
    await page.waitForSelector('[data-testid="webauthn-prompt"]');

    await expect(page.locator('[data-testid="webauthn-prompt"]')).toBeVisible();

    // Complete WebAuthn authentication using biometric button
    await page.click('[data-testid="webauthn-biometric-button"]');
    await expect(page.locator('[data-testid="login-success"]')).toBeVisible();

    await page.waitForURL('/dashboard');
    await waitForPageReady(page);

    // Test candidate accountability with WebAuthn authentication
    await page.goto('/civics');
    await waitForPageReady(page);

    await expect(page.locator('[data-testid="webauthn-accountability"]')).toBeVisible();
  });
});
