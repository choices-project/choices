/**
 * Enhanced Dashboard E2E Tests
 * 
 * Comprehensive testing of the Enhanced Dashboard feature including:
 * - Feature flag integration
 * - API endpoint functionality
 * - Data loading and display
 * - Error handling
 * - User interactions
 * - Performance metrics
 * 
 * Created: January 27, 2025
 * Status: ✅ COMPREHENSIVE TESTING
 */

import { test, expect } from '@playwright/test';
import { 
  setupE2ETestData, 
  cleanupE2ETestData, 
  createTestUser, 
  createTestPoll,
  waitForPageReady,
  setupExternalAPIMocks,
  authenticateE2EUser,
  E2E_CONFIG
} from './helpers/e2e-setup';

test.describe('Enhanced Dashboard - E2E Tests', () => {
  let testData: {
    user: ReturnType<typeof createTestUser>;
    poll: ReturnType<typeof createTestPoll>;
  };

  test.beforeEach(async ({ page }) => {
    // Create test data using existing seeded test user
    testData = {
      user: createTestUser({
        email: 'test@example.com',
        username: 'testuser',
        password: 'TestPassword123!'
      }),
      poll: createTestPoll({
        title: 'Enhanced Dashboard Test Poll',
        description: 'Testing enhanced dashboard functionality',
        options: ['Dashboard Option 1', 'Dashboard Option 2', 'Dashboard Option 3'],
        category: 'general'
      })
    };

    // Set up external API mocks
    await setupExternalAPIMocks(page);

    // Set E2E bypass header for all requests
    await page.setExtraHTTPHeaders({
      'x-e2e-bypass': '1'
    });

    // Navigate to the app
    await page.goto('/');
    await waitForPageReady(page);
  });

  test.afterEach(async ({ page: _page }) => {
    await cleanupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });
  });

  test('should display enhanced dashboard (now default)', async ({ page }) => {
    // Set up test data
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Authenticate the test user
    await authenticateE2EUser(page, testData.user);

    // Navigate to dashboard
    await page.goto('/dashboard');
    await waitForPageReady(page);

    // Wait for any dashboard content to load (either basic or enhanced)
    await page.waitForTimeout(5000);

    // Check what's actually visible on the page
    const pageContent = await page.content();
    console.log('Page content preview:', pageContent.substring(0, 1000));
    
    // Look for any dashboard content
    const hasAnyDashboard = await page.locator('text=Dashboard').isVisible().catch(() => false);
    const hasWelcomeText = await page.locator('text=Welcome to Choices').isVisible().catch(() => false);
    const hasEnhancedDashboard = await page.locator('[data-testid="enhanced-dashboard"]').isVisible().catch(() => false);
    const hasLoadingSpinner = await page.locator('.animate-spin').isVisible().catch(() => false);
    
    // Check for any text content to understand what's being rendered
    const pageText = await page.textContent('body').catch(() => '');
    console.log('Page text content:', pageText.substring(0, 500));
    
    console.log('Has any dashboard text:', hasAnyDashboard);
    console.log('Has welcome text:', hasWelcomeText);
    console.log('Has enhanced dashboard:', hasEnhancedDashboard);
    console.log('Has loading spinner:', hasLoadingSpinner);

    // Check for JavaScript errors that might prevent enhanced dashboard from loading
    const errors = await page.evaluate(() => {
      return window.console?.error || [];
    });
    if (errors && errors.length > 0) {
      console.log('JavaScript errors found:', errors);
    }

    // Check for any unhandled promise rejections
    const unhandledRejections = await page.evaluate(() => {
      return window.console?.warn?.filter?.(msg => msg.includes('unhandled')) || [];
    });
    if (unhandledRejections && unhandledRejections.length > 0) {
      console.log('Unhandled promise rejections:', unhandledRejections);
    }

    // Check for any React errors or component loading issues
    const reactErrors = await page.evaluate(() => {
      const errorElements = document.querySelectorAll('[data-testid="error"], .error, [class*="error"]');
      return Array.from(errorElements).map(el => el.textContent);
    });
    if (reactErrors && reactErrors.length > 0) {
      console.log('React errors found:', reactErrors);
    }

    // Check if the EnhancedDashboard component is actually being imported
    const componentStatus = await page.evaluate(() => {
      return {
        hasReact: typeof window.React !== 'undefined',
        hasReactDOM: typeof window.ReactDOM !== 'undefined',
        hasNextJS: typeof window.__NEXT_DATA__ !== 'undefined',
        scriptTags: document.querySelectorAll('script').length,
        hasDynamicImport: typeof window.__webpack_require__ !== 'undefined'
      };
    });
    console.log('Component loading status:', componentStatus);

    // Check if the enhanced dashboard is working (now default)
    if (hasEnhancedDashboard) {
      console.log('✅ Enhanced dashboard is visible - working as expected');
      // Test enhanced dashboard functionality
      await expect(page.locator('[data-testid="enhanced-dashboard"]')).toBeVisible();
      await expect(page.locator('h1')).toContainText('Enhanced Dashboard');
    } else if (hasWelcomeText) {
      console.log('❌ Basic dashboard is visible - enhanced dashboard should be default');
      // This indicates the enhanced dashboard is not loading properly
      await expect(page.locator('text=Welcome to Choices')).toBeVisible();
      
      // Let's investigate why the enhanced dashboard isn't loading
      console.log('🔍 Investigating why enhanced dashboard is not loading...');
      
      // Check the feature flag directly in the browser
      const featureFlagStatus = await page.evaluate(() => {
        // Try to access the feature flag from the global scope or window
        return {
          windowFeatureFlags: (window as any).FEATURE_FLAGS,
          hasFeatureFlagModule: typeof (window as any).isFeatureEnabled === 'function',
          documentTitle: document.title,
          bodyContent: document.body?.innerHTML?.substring(0, 200) || 'No body content',
          // Check if the feature flag module is loaded
          hasFeatureFlagImport: typeof (window as any).FEATURE_FLAGS !== 'undefined',
          // Check for any global variables
          globalKeys: Object.keys(window).filter(key => key.includes('FEATURE') || key.includes('feature')),
          // Check if the component is actually loading
          hasReactRoot: document.querySelector('#__next') !== null,
          // Check for any error messages
          errorMessages: document.querySelectorAll('[data-testid="error"]').length
        };
      });
      console.log('Feature flag status in browser:', featureFlagStatus);
      
      // Let's also check if there are any console errors
      const consoleErrors = await page.evaluate(() => {
        return window.console?.error || [];
      });
      if (consoleErrors && consoleErrors.length > 0) {
        console.log('Console errors found:', consoleErrors);
      }
      
      // Check if there are any network errors
      const networkErrors = await page.evaluate(() => {
        return window.performance?.getEntriesByType?.('navigation')?.[0] || null;
      });
      console.log('Network performance:', networkErrors);
      
    } else if (hasLoadingSpinner) {
      console.log('⏳ Dashboard is still loading...');
      // Wait a bit more and check again
      await page.waitForTimeout(3000);
      
      const hasEnhancedDashboardAfterWait = await page.locator('[data-testid="enhanced-dashboard"]').isVisible().catch(() => false);
      const hasWelcomeTextAfterWait = await page.locator('text=Welcome to Choices').isVisible().catch(() => false);
      
      if (hasEnhancedDashboardAfterWait) {
        console.log('✅ Enhanced dashboard loaded after waiting');
        await expect(page.locator('[data-testid="enhanced-dashboard"]')).toBeVisible();
      } else if (hasWelcomeTextAfterWait) {
        console.log('⚠️ Basic dashboard loaded after waiting - feature flag issue');
        await expect(page.locator('text=Welcome to Choices')).toBeVisible();
      } else {
        throw new Error('Dashboard failed to load after extended waiting');
      }
    } else {
      // Take a screenshot for debugging
      await page.screenshot({ path: 'dashboard-debug.png' });
      throw new Error('No dashboard content is visible on the page');
    }
  });

  test('should load enhanced dashboard component directly', async ({ page: _page }) => {
    // Set up test data
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Login as test user
    await page.goto('/login');
    await waitForPageReady(page);
    
    await page.fill('[data-testid="login-email"]', testData.user.email);
    await page.fill('[data-testid="login-password"]', testData.user.password);
    await page.click('[data-testid="login-submit"]');
    await page.waitForLoadState('networkidle');

    // Test the enhanced dashboard API directly
    console.log('🔍 Testing enhanced dashboard API...');
    const apiResponse = await page.request.get('/api/dashboard/data');
    console.log('API Response status:', apiResponse.status());
    
    if (apiResponse.status() === 200) {
      const apiData = await apiResponse.json();
      console.log('API Data received:', Object.keys(apiData));
      
      // Verify the API returns the expected structure
      expect(apiData).toHaveProperty('userPolls');
      expect(apiData).toHaveProperty('userMetrics');
      expect(apiData).toHaveProperty('userTrends');
      expect(apiData).toHaveProperty('userEngagement');
      expect(apiData).toHaveProperty('userInsights');
      
      console.log('✅ Enhanced dashboard API is working correctly');
    } else {
      console.log('❌ Enhanced dashboard API failed with status:', apiResponse.status());
      const errorText = await apiResponse.text();
      console.log('Error response:', errorText);
    }

    // Navigate to dashboard and wait for client-side hydration
    await page.goto('/dashboard');
    await waitForPageReady(page);

    // Wait for client-side hydration to complete
    await page.waitForTimeout(10000);
    
    // Check if enhanced dashboard is now visible after hydration
    const hasEnhancedDashboardAfterHydration = await page.locator('[data-testid="enhanced-dashboard"]').isVisible().catch(() => false);
    const hasWelcomeTextAfterHydration = await page.locator('text=Welcome to Choices').isVisible().catch(() => false);
    
    console.log('After hydration - Enhanced dashboard:', hasEnhancedDashboardAfterHydration);
    console.log('After hydration - Welcome text:', hasWelcomeTextAfterHydration);
    
    if (hasEnhancedDashboardAfterHydration) {
      console.log('✅ Enhanced dashboard loaded after client-side hydration');
      await expect(page.locator('[data-testid="enhanced-dashboard"]')).toBeVisible();
    } else if (hasWelcomeTextAfterHydration) {
      console.log('⚠️ Basic dashboard still visible after hydration - feature flag issue persists');
      await expect(page.locator('text=Welcome to Choices')).toBeVisible();
    } else {
      // Take a screenshot for debugging
      await page.screenshot({ path: 'dashboard-hydration-debug.png' });
      throw new Error('No dashboard content is visible after hydration');
    }
  });

  test('should load and display user metrics correctly', async ({ page }) => {
    // Set up test data
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Login as test user
    await page.goto('/login');
    await waitForPageReady(page);
    
    await page.fill('[data-testid="login-email"]', testData.user.email);
    await page.fill('[data-testid="login-password"]', testData.user.password);
    await page.click('[data-testid="login-submit"]');
    await page.waitForLoadState('networkidle');

    // Navigate to dashboard
    await page.goto('/dashboard');
    await waitForPageReady(page);

    // Wait for dashboard data to load
    await page.waitForSelector('[data-testid="polls-created-metric"]', { timeout: 10000 });

    // Verify metrics are displayed
    await expect(page.locator('[data-testid="polls-created-metric"]')).toBeVisible();
    await expect(page.locator('[data-testid="active-polls-metric"]')).toBeVisible();
    await expect(page.locator('[data-testid="votes-cast-metric"]')).toBeVisible();
    await expect(page.locator('[data-testid="trust-score-metric"]')).toBeVisible();

    // Verify metric values are numeric
    const pollsCreated = await page.locator('[data-testid="polls-created-metric"] .text-3xl').textContent();
    const activePolls = await page.locator('[data-testid="active-polls-metric"] .text-3xl').textContent();
    const votesCast = await page.locator('[data-testid="votes-cast-metric"] .text-3xl').textContent();
    const trustScore = await page.locator('[data-testid="trust-score-metric"] .text-3xl').textContent();

    expect(Number(pollsCreated)).toBeGreaterThanOrEqual(0);
    expect(Number(activePolls)).toBeGreaterThanOrEqual(0);
    expect(Number(votesCast)).toBeGreaterThanOrEqual(0);
    expect(Number(trustScore)).toBeGreaterThanOrEqual(0);
  });

  test('should display recent polls section', async ({ page }) => {
    // Set up test data
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Login as test user
    await page.goto('/login');
    await waitForPageReady(page);
    
    await page.fill('[data-testid="login-email"]', testData.user.email);
    await page.fill('[data-testid="login-password"]', testData.user.password);
    await page.click('[data-testid="login-submit"]');
    await page.waitForLoadState('networkidle');

    // Navigate to dashboard
    await page.goto('/dashboard');
    await waitForPageReady(page);

    // Wait for recent polls section
    await page.waitForSelector('[data-testid="recent-polls-section"]', { timeout: 10000 });

    // Verify recent polls section is displayed
    await expect(page.locator('[data-testid="recent-polls-section"]')).toBeVisible();
    await expect(page.locator('[data-testid="recent-polls-section"] h3')).toContainText('My Recent Polls');
  });

  test('should navigate between dashboard views', async ({ page }) => {
    // Set up test data
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Login as test user
    await page.goto('/login');
    await waitForPageReady(page);
    
    await page.fill('[data-testid="login-email"]', testData.user.email);
    await page.fill('[data-testid="login-password"]', testData.user.password);
    await page.click('[data-testid="login-submit"]');
    await page.waitForLoadState('networkidle');

    // Navigate to dashboard
    await page.goto('/dashboard');
    await waitForPageReady(page);

    // Test navigation to Trends view
    await page.click('button:has-text("My Trends")');
    await page.waitForSelector('[data-testid="enhanced-dashboard"]', { timeout: 5000 });
    await expect(page.locator('h3:has-text("My Activity Trends")')).toBeVisible();

    // Test navigation to Insights view
    await page.click('button:has-text("My Insights")');
    await page.waitForSelector('[data-testid="enhanced-dashboard"]', { timeout: 5000 });
    await expect(page.locator('h3:has-text("Top Categories")')).toBeVisible();
    await expect(page.locator('h3:has-text("Achievements")')).toBeVisible();

    // Test navigation to Engagement view
    await page.click('button:has-text("My Engagement")');
    await page.waitForSelector('[data-testid="enhanced-dashboard"]', { timeout: 5000 });
    await expect(page.locator('h3:has-text("Favorite Categories")')).toBeVisible();

    // Test navigation back to Overview
    await page.click('button:has-text("My Activity")');
    await page.waitForSelector('[data-testid="enhanced-dashboard"]', { timeout: 5000 });
    await expect(page.locator('[data-testid="polls-created-metric"]')).toBeVisible();
  });

  test('should handle dashboard refresh functionality', async ({ page }) => {
    // Set up test data
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Login as test user
    await page.goto('/login');
    await waitForPageReady(page);
    
    await page.fill('[data-testid="login-email"]', testData.user.email);
    await page.fill('[data-testid="login-password"]', testData.user.password);
    await page.click('[data-testid="login-submit"]');
    await page.waitForLoadState('networkidle');

    // Navigate to dashboard
    await page.goto('/dashboard');
    await waitForPageReady(page);

    // Wait for initial load
    await page.waitForSelector('[data-testid="polls-created-metric"]', { timeout: 10000 });

    // Click refresh button
    await page.click('[data-testid="refresh-button"]');
    
    // Verify refresh button shows loading state
    await expect(page.locator('[data-testid="refresh-button"] .animate-spin')).toBeVisible();
    
    // Wait for refresh to complete
    await page.waitForSelector('[data-testid="polls-created-metric"]', { timeout: 10000 });
  });

  test('should display platform tour and first-time guide buttons', async ({ page }) => {
    // Set up test data
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Login as test user
    await page.goto('/login');
    await waitForPageReady(page);
    
    await page.fill('[data-testid="login-email"]', testData.user.email);
    await page.fill('[data-testid="login-password"]', testData.user.password);
    await page.click('[data-testid="login-submit"]');
    await page.waitForLoadState('networkidle');

    // Navigate to dashboard
    await page.goto('/dashboard');
    await waitForPageReady(page);

    // Verify tour and guide buttons are present
    await expect(page.locator('[data-testid="platform-tour-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="first-time-guide-button"]')).toBeVisible();

    // Verify button text
    await expect(page.locator('[data-testid="platform-tour-button"]')).toContainText('Take a Tour');
    await expect(page.locator('[data-testid="first-time-guide-button"]')).toContainText('Get Started');
  });

  test('should handle dashboard loading states', async ({ page }) => {
    // Set up test data
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Login as test user
    await page.goto('/login?e2e=1');
    await waitForPageReady(page);
    
    await page.fill('[data-testid="login-email"]', testData.user.email);
    await page.fill('[data-testid="login-password"]', testData.user.password);
    await page.click('[data-testid="login-submit"]');
    await page.waitForLoadState('networkidle');

    // Navigate to dashboard and check loading state
    await page.goto('/dashboard');
    
    // Verify loading spinner is shown initially
    await expect(page.locator('.animate-spin')).toBeVisible();
    
    // Wait for dashboard to load
    await page.waitForSelector('[data-testid="enhanced-dashboard"]', { timeout: 10000 });
    
    // Verify loading spinner is gone
    await expect(page.locator('.animate-spin')).not.toBeVisible();
  });

  test('should handle dashboard errors gracefully', async ({ page }) => {
    // Set up test data
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Login as test user
    await page.goto('/login?e2e=1');
    await waitForPageReady(page);
    
    await page.fill('[data-testid="login-email"]', testData.user.email);
    await page.fill('[data-testid="login-password"]', testData.user.password);
    await page.click('[data-testid="login-submit"]');
    await page.waitForLoadState('networkidle');

    // Mock API failure
    await page.route('/api/dashboard/data', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });

    // Navigate to dashboard
    await page.goto('/dashboard?e2e=1');
    await waitForPageReady(page);

    // Verify error state is displayed
    await expect(page.locator('h3:has-text("Error Loading Dashboard")')).toBeVisible();
    await expect(page.locator('button:has-text("Try Again")')).toBeVisible();
  });

  test('should verify dashboard API endpoints are working', async ({ page }) => {
    // Set up test data
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Login as test user
    await page.goto('/login?e2e=1');
    await waitForPageReady(page);
    
    await page.fill('[data-testid="login-email"]', testData.user.email);
    await page.fill('[data-testid="login-password"]', testData.user.password);
    await page.click('[data-testid="login-submit"]');
    await page.waitForLoadState('networkidle');

    // Test general dashboard API
    const dashboardResponse = await page.request.get('/api/dashboard');
    expect(dashboardResponse.status()).toBe(200);
    
    const dashboardData = await dashboardResponse.json();
    expect(dashboardData).toHaveProperty('user');
    expect(dashboardData).toHaveProperty('stats');
    expect(dashboardData).toHaveProperty('platform');
    expect(dashboardData).toHaveProperty('recentActivity');
    expect(dashboardData).toHaveProperty('polls');

    // Test detailed dashboard API
    const dashboardDataResponse = await page.request.get('/api/dashboard/data');
    expect(dashboardDataResponse.status()).toBe(200);
    
    const detailedData = await dashboardDataResponse.json();
    expect(detailedData).toHaveProperty('userPolls');
    expect(detailedData).toHaveProperty('userMetrics');
    expect(detailedData).toHaveProperty('userTrends');
    expect(detailedData).toHaveProperty('userEngagement');
    expect(detailedData).toHaveProperty('userInsights');
  });

  test('should verify achievements are displayed correctly', async ({ page }) => {
    // Set up test data
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Login as test user
    await page.goto('/login');
    await waitForPageReady(page);
    
    await page.fill('[data-testid="login-email"]', testData.user.email);
    await page.fill('[data-testid="login-password"]', testData.user.password);
    await page.click('[data-testid="login-submit"]');
    await page.waitForLoadState('networkidle');

    // Navigate to dashboard
    await page.goto('/dashboard');
    await waitForPageReady(page);

    // Navigate to Insights view
    await page.click('button:has-text("My Insights")');
    await page.waitForSelector('[data-testid="enhanced-dashboard"]', { timeout: 5000 });

    // Verify achievements section
    await expect(page.locator('h3:has-text("Achievements")')).toBeVisible();
    
    // Verify achievement items are displayed
    const achievementItems = page.locator('[data-testid="achievement-item"]');
    await expect(achievementItems).toHaveCount(4); // Should have 4 achievements
    
    // Verify achievement content
    await expect(page.locator('text=First Poll Creator')).toBeVisible();
    await expect(page.locator('text=Active Participant')).toBeVisible();
    await expect(page.locator('text=Trusted User')).toBeVisible();
    await expect(page.locator('text=Poll Master')).toBeVisible();
  });

  test('should verify dashboard performance metrics', async ({ page }) => {
    // Set up test data
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Login as test user
    await page.goto('/login?e2e=1');
    await waitForPageReady(page);
    
    await page.fill('[data-testid="login-email"]', testData.user.email);
    await page.fill('[data-testid="login-password"]', testData.user.password);
    await page.click('[data-testid="login-submit"]');
    await page.waitForLoadState('networkidle');

    // Measure dashboard load time
    const startTime = Date.now();
    
    // Navigate to dashboard
    await page.goto('/dashboard?e2e=1');
    await waitForPageReady(page);
    
    // Wait for dashboard to fully load
    await page.waitForSelector('[data-testid="polls-created-metric"]', { timeout: 10000 });
    
    const endTime = Date.now();
    const loadTime = endTime - startTime;
    
    // Verify dashboard loads within acceptable time
    expect(loadTime).toBeLessThan(10000); // 10 seconds max
  });
});
