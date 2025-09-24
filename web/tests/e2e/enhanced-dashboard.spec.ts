/**
 * Enhanced Dashboard System E2E Tests - V2 Upgrade
 * 
 * Tests complete enhanced dashboard system including:
 * - User-centric metrics with V2 mock factory setup
 * - Navigation tabs and different views
 * - Performance and loading states
 * - Error handling and recovery
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

test.describe('Enhanced Dashboard System - V2', () => {
  let testData: {
    user: ReturnType<typeof createTestUser>;
    poll: ReturnType<typeof createTestPoll>;
  };

  test.beforeEach(async ({ page }) => {
    // Create test data using V2 patterns
    testData = {
      user: createTestUser({
        email: 'dashboard-test@example.com',
        username: 'dashboardtestuser',
        password: 'DashboardTest123!'
      }),
      poll: createTestPoll({
        title: 'V2 Dashboard Test Poll',
        description: 'Testing enhanced dashboard with V2 setup',
        options: ['Dashboard Option 1', 'Dashboard Option 2', 'Dashboard Option 3'],
        category: 'general'
      })
    };

    // Set up external API mocks
    await setupExternalAPIMocks(page);

    // Navigate to dashboard
    await page.goto('/dashboard');
    await waitForPageReady(page);
  });

  test.afterEach(async () => {
    // Clean up test data
    await cleanupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });
  });

  test('should display enhanced dashboard with user-centric metrics with V2 setup', async ({ page }) => {
    // Set up test data for dashboard metrics
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Check if enhanced dashboard is loaded
    await expect(page.locator('[data-testid="enhanced-dashboard"]')).toBeVisible();
    
    // Check for personal metrics
    await expect(page.locator('[data-testid="polls-created-metric"]')).toBeVisible();
    await expect(page.locator('[data-testid="active-polls-metric"]')).toBeVisible();
    await expect(page.locator('[data-testid="votes-cast-metric"]')).toBeVisible();
    await expect(page.locator('[data-testid="trust-score-metric"]')).toBeVisible();
    
    // Check for recent polls section
    await expect(page.locator('[data-testid="recent-polls-section"]')).toBeVisible();
  });

  test('should display navigation tabs for different views with V2 setup', async ({ page }) => {
    // Set up test data for navigation testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Check navigation tabs
    await expect(page.locator('text=My Activity')).toBeVisible();
    await expect(page.locator('text=My Trends')).toBeVisible();
    await expect(page.locator('text=My Insights')).toBeVisible();
    await expect(page.locator('text=My Engagement')).toBeVisible();
  });

  test('should switch between different dashboard views with V2 setup', async ({ page }) => {
    // Set up test data for view switching
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Click on My Trends tab
    await page.click('text=My Trends');
    await waitForPageReady(page);
    
    // Should show trends content
    await expect(page.locator('text=My Activity Trends')).toBeVisible();
    
    // Click on My Insights tab
    await page.click('text=My Insights');
    await waitForPageReady(page);
    
    // Should show insights content
    await expect(page.locator('text=Top Categories')).toBeVisible();
    await expect(page.locator('text=Achievements')).toBeVisible();
    
    // Click on My Engagement tab
    await page.click('text=My Engagement');
    await waitForPageReady(page);
    
    // Should show engagement content
    await expect(page.locator('text=Engagement Metrics')).toBeVisible();
  });

  test('should display dashboard refresh functionality with V2 setup', async ({ page }) => {
    // Set up test data for refresh testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Click refresh button
    await page.click('[data-testid="dashboard-refresh-button"]');
    
    // Wait for refresh to complete
    await waitForPageReady(page);
    
    // Verify dashboard is still visible
    await expect(page.locator('[data-testid="enhanced-dashboard"]')).toBeVisible();
  });

  test('should display loading states during dashboard operations with V2 setup', async ({ page }) => {
    // Set up test data for loading state testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Mock slow API response
    await page.route('**/api/v1/dashboard/**', route => {
      setTimeout(() => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({ data: 'test' })
        });
      }, 1000);
    });

    // Navigate to dashboard
    await page.goto('/dashboard');
    
    // Should show loading state
    await expect(page.locator('[data-testid="dashboard-loading"]')).toBeVisible();
    
    // Wait for loading to complete
    await waitForPageReady(page);
    
    // Should show dashboard content
    await expect(page.locator('[data-testid="enhanced-dashboard"]')).toBeVisible();
  });

  test('should display achievements section with V2 setup', async ({ page }) => {
    // Set up test data for achievements testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Navigate to My Insights tab
    await page.click('text=My Insights');
    await waitForPageReady(page);
    
    // Check for achievements section
    await expect(page.locator('[data-testid="achievements-section"]')).toBeVisible();
    
    // Check for specific achievements
    await expect(page.locator('[data-testid="first-poll-achievement"]')).toBeVisible();
    await expect(page.locator('[data-testid="active-voter-achievement"]')).toBeVisible();
  });

  test('should display favorite categories with V2 setup', async ({ page }) => {
    // Set up test data for favorite categories testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Navigate to My Insights tab
    await page.click('text=My Insights');
    await waitForPageReady(page);
    
    // Check for favorite categories section
    await expect(page.locator('[data-testid="favorite-categories-section"]')).toBeVisible();
    
    // Check for category items
    await expect(page.locator('[data-testid="category-item"]')).toHaveCount(3);
  });

  test('should handle dashboard API errors gracefully with V2 setup', async ({ page }) => {
    // Set up test data for error handling
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Mock API error
    await page.route('**/api/v1/dashboard/**', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });

    // Navigate to dashboard
    await page.goto('/dashboard');
    await waitForPageReady(page);
    
    // Should show error message
    await expect(page.locator('[data-testid="dashboard-error"]')).toBeVisible();
    
    // Should show retry button
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
  });

  test('should handle dashboard with different user types with V2 setup', async ({ page }) => {
    // Create different user types for testing
    const regularUser = createTestUser({
      email: 'regular-dashboard@example.com',
      username: 'regulardashboard'
    });

    const adminUser = createTestUser({
      email: 'admin-dashboard@example.com',
      username: 'admindashboard'
    });

    // Test regular user dashboard
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
    await waitForPageReady(page);

    await expect(page.locator('[data-testid="regular-user-dashboard"]')).toBeVisible();

    // Test admin user dashboard
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
    await waitForPageReady(page);

    await expect(page.locator('[data-testid="admin-user-dashboard"]')).toBeVisible();
  });

  test('should handle dashboard with mobile viewport with V2 setup', async ({ page }) => {
    // Set up test data for mobile dashboard testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Set mobile viewport
    await page.setViewportSize(E2E_CONFIG.BROWSER.MOBILE_VIEWPORT);

    // Navigate to dashboard
    await page.goto('/dashboard');
    await waitForPageReady(page);

    // Check mobile dashboard layout
    await expect(page.locator('[data-testid="mobile-dashboard"]')).toBeVisible();

    // Check mobile navigation
    await expect(page.locator('[data-testid="mobile-navigation"]')).toBeVisible();

    // Test mobile tab switching
    await page.click('text=My Trends');
    await waitForPageReady(page);

    await expect(page.locator('text=My Activity Trends')).toBeVisible();
  });

  test('should handle dashboard with poll management integration with V2 setup', async ({ page }) => {
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

    // Check dashboard shows poll management options
    await expect(page.locator('[data-testid="poll-management-section"]')).toBeVisible();

    // Click create poll button
    await page.click('[data-testid="create-poll-button"]');
    await page.waitForURL('/polls/create');

    // Create a poll
    await page.fill('input[id="title"]', testData.poll.title);
    await page.fill('textarea[id="description"]', testData.poll.description);
    await page.click('button:has-text("Next")');

    await page.fill('input[placeholder*="Option 1"]', testData.poll.options[0] || '');
    await page.fill('input[placeholder*="Option 2"]', testData.poll.options[1] || '');
    await page.click('button:has-text("Next")');

    await page.selectOption('select', testData.poll.category || 'general');
    await page.click('button:has-text("Next")');

    await page.click('button:has-text("Create Poll")');
    await page.waitForURL(/\/polls\/[a-f0-9-]+/);

    // Return to dashboard
    await page.goto('/dashboard');
    await waitForPageReady(page);

    // Check that poll appears in dashboard
    await expect(page.locator('[data-testid="recent-polls-section"]')).toBeVisible();
    await expect(page.locator(`text=${testData.poll.title}`)).toBeVisible();
  });

  test('should handle dashboard with civics integration with V2 setup', async ({ page }) => {
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

    // Navigate to dashboard
    await page.goto('/dashboard');
    await waitForPageReady(page);

    // Check civics integration in dashboard
    await expect(page.locator('[data-testid="civics-dashboard-section"]')).toBeVisible();
    await expect(page.locator('text=State IL Poll')).toBeVisible();
    await expect(page.locator('text=district 13')).toBeVisible();
  });

  test('should handle dashboard with real-time updates with V2 setup', async ({ page }) => {
    // Set up test data for real-time updates
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

    // Check for real-time update indicators
    await expect(page.locator('[data-testid="real-time-indicator"]')).toBeVisible();

    // Simulate real-time update
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('dashboard-update', {
        detail: { type: 'poll-created', data: { title: 'New Poll' } }
      }));
    });

    // Check that update is reflected
    await expect(page.locator('[data-testid="recent-polls-section"]')).toBeVisible();
  });
});
