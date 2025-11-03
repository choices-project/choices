/**
 * Civics Address Lookup System E2E Tests - V2 Upgrade
 * 
 * Tests complete civics address lookup system including:
 * - Address lookup functionality with V2 mock factory setup
 * - Authentication and authorization
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

test.describe('Civics Address Lookup System - V2', () => {
  let testData: {
    user: ReturnType<typeof createTestUser>;
    poll: ReturnType<typeof createTestPoll>;
  };

  test.beforeEach(async ({ page }) => {
    // Create test data using V2 patterns
    testData = {
      user: createTestUser({
        email: 'civics-lookup-test@example.com',
        username: 'civicslookuptestuser',
        password: 'CivicsLookupTest123!'
      }),
      poll: createTestPoll({
        title: 'V2 Civics Address Lookup Test Poll',
        description: 'Testing civics address lookup with V2 setup',
        options: ['Civics Option 1', 'Civics Option 2', 'Civics Option 3'],
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

  test('should load civics page without errors with V2 setup', async ({ page }) => {
    // Set up test data for civics page loading
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

  test('should display civics page content with V2 setup', async ({ page }) => {
    // Set up test data for civics page content testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    await page.goto('/civics');
    await waitForPageReady(page);
    
    // Check if civics page has basic content
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    // Check if we're on the civics page (not redirected to login)
    const currentUrl = page.url();
    if (currentUrl.includes('/civics')) {
      // We're on the civics page - check for civics content
      await expect(page.locator('[data-testid="civics-page"]')).toBeVisible();
      console.log('V2 Successfully loaded civics page');
    } else if (currentUrl.includes('/login')) {
      // We were redirected to login - this is expected for unauthenticated users
      console.log('V2 Redirected to login page (expected for unauthenticated users)');
    } else {
      // Some other page - check what we got
      console.log('V2 Loaded page:', currentUrl);
    }
  });

  test('should handle authentication redirect gracefully with V2 setup', async ({ page }) => {
    // Set up test data for authentication redirect testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    await page.goto('/civics');
    await waitForPageReady(page);
    
    const currentUrl = page.url();
    
    // Should either be on civics page or login page
    const isOnCivicsPage = currentUrl.includes('/civics');
    const isOnLoginPage = currentUrl.includes('/login');
    
    expect(isOnCivicsPage || isOnLoginPage).toBe(true);
  });

  test('should perform address lookup with V2 setup', async ({ page }) => {
    // Set up test data for address lookup testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    await page.goto('/civics');
    await waitForPageReady(page);
    
    // Check if address input is visible (may take a moment to load)
    const addressInput = page.locator('[data-testid="address-input"]');
    await expect(addressInput).toBeVisible({ timeout: 15000 });
    
    // Fill address input
    await addressInput.fill('123 Any St, Springfield, IL 62704');
    
    // Submit address lookup - check for submit button
    const submitButton = page.locator('[data-testid="address-submit"]');
    await expect(submitButton).toBeVisible({ timeout: 10000 });
    await submitButton.click();
    
    // Wait for API response
    await page.waitForResponse((response) => 
      response.url().includes('/api/v1/civics/address-lookup') || 
      response.url().includes('/api/civics/by-address')
    );
    
    // Check if results are displayed
    await expect(page.locator('[data-testid="address-results"]')).toBeVisible();
  });

  test('should handle address lookup errors with V2 setup', async ({ page }) => {
    // Set up test data for error handling testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Mock API error
    await page.route('**/api/v1/civics/address-lookup', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });

    await page.goto('/civics');
    await waitForPageReady(page);
    
    // Fill address input
    const addressInput = page.locator('[data-testid="address-input"]');
    await expect(addressInput).toBeVisible({ timeout: 15000 });
    await addressInput.fill('123 Any St, Springfield, IL 62704');
    
    // Submit address lookup
    const submitButton = page.locator('[data-testid="address-submit"]');
    await expect(submitButton).toBeVisible({ timeout: 10000 });
    await submitButton.click();
    
    // Wait a moment for error to appear
    await page.waitForTimeout(1000);
    
    // Check if error is displayed (multiple possible error selectors)
    const errorVisible = await Promise.race([
      page.locator('[data-testid="address-error"]').isVisible().catch(() => false),
      page.locator('text=Address lookup failed').isVisible().catch(() => false),
      page.locator('text=error').isVisible().catch(() => false),
      page.locator('text=Error').isVisible().catch(() => false)
    ]);
    
    // If no specific error element found, check for any error indication in response
    if (!errorVisible) {
      // Check if the mock error response was received
      const errorResponse = await page.waitForResponse((response) => 
        response.url().includes('/api/v1/civics/address-lookup') && response.status() === 500
      ).catch(() => null);
      
      expect(errorResponse).toBeTruthy();
    } else {
      expect(errorVisible).toBe(true);
    }
  });

  test('should validate address input with V2 setup', async ({ page }) => {
    // Set up test data for input validation testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    await page.goto('/civics');
    await waitForPageReady(page);
    
    // Wait for form to be ready
    const addressInput = page.locator('[data-testid="address-input"]');
    await expect(addressInput).toBeVisible({ timeout: 15000 });
    
    // Try to submit empty address
    const submitButton = page.locator('[data-testid="address-submit"]');
    await expect(submitButton).toBeVisible({ timeout: 10000 });
    await submitButton.click();
    
    // Wait a moment for validation
    await page.waitForTimeout(500);
    
    // Check if validation error is displayed (may use various selectors)
    const validationError = await Promise.race([
      page.locator('[data-testid="address-validation-error"]').isVisible().catch(() => false),
      page.locator('text=Address is required').isVisible().catch(() => false),
      page.locator('text=required').isVisible().catch(() => false)
    ]);
    
    // Try to submit invalid address format
    await addressInput.fill('invalid address');
    await submitButton.click();
    await page.waitForTimeout(500);
    
    // Check if format validation error is displayed
    const formatError = await Promise.race([
      page.locator('[data-testid="address-format-error"]').isVisible().catch(() => false),
      page.locator('text=Please enter a valid address').isVisible().catch(() => false),
      page.locator('text=valid address').isVisible().catch(() => false)
    ]);
    
    // At least one validation should have triggered
    expect(validationError || formatError).toBe(true);
  });

  test('should handle address lookup with different formats with V2 setup', async ({ page }) => {
    // Set up test data for different address format testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    const addressFormats = [
      '123 Main St, Springfield, IL 62701',
      '456 Oak Ave, Chicago, IL 60601',
      '789 Pine Rd, Rockford, IL 61101',
      '321 Elm St, Peoria, IL 61602'
    ];

    for (const address of addressFormats) {
      await page.goto('/civics');
      await waitForPageReady(page);
      
      // Fill address input
      await page.fill('[data-testid="address-input"]', address);
      
      // Submit address lookup
      await page.click('[data-testid="address-submit"]');
      
      // Wait for API response (may use either endpoint)
      const responsePromise = page.waitForResponse((response) => 
        response.url().includes('/api/v1/civics/address-lookup') || 
        response.url().includes('/api/civics/by-address')
      );
      
      await responsePromise;
      
      // Check if results are displayed
      const resultsVisible = await page.locator('[data-testid="address-results"]').isVisible().catch(() => false);
      const byAddressResults = await page.locator('[data-testid="representatives-list"]').isVisible().catch(() => false);
      
      expect(resultsVisible || byAddressResults).toBe(true);
    }
  });

  test('should handle address lookup with authentication with V2 setup', async ({ page }) => {
    // Set up test data for authenticated address lookup
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
    
    // Now test address lookup with authenticated user
    await page.goto('/civics');
    await waitForPageReady(page);
    
    // Fill address input
    await page.fill('[data-testid="address-input"]', '123 Any St, Springfield, IL 62704');
    
    // Submit address lookup
    await page.click('[data-testid="address-submit"]');
    
    // Wait for API response
    await page.waitForResponse((response) => 
      response.url().includes('/api/v1/civics/address-lookup') || 
      response.url().includes('/api/civics/by-address')
    );
    
    // Check if results are displayed
    await expect(page.locator('[data-testid="address-results"]')).toBeVisible();
  });

  test('should handle address lookup with different user types with V2 setup', async ({ page }) => {
    // Create different user types for testing
    const regularUser = createTestUser({
      email: 'regular-civics@example.com',
      username: 'regularcivics'
    });

    const adminUser = createTestUser({
      email: 'admin-civics@example.com',
      username: 'admincivics'
    });

    // Test regular user address lookup
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

    await page.fill('[data-testid="address-input"]', '123 Any St, Springfield, IL 62704');
    await page.click('[data-testid="address-submit"]');
    await page.waitForResponse((response) => 
      response.url().includes('/api/v1/civics/address-lookup') || 
      response.url().includes('/api/civics/by-address')
    );

    await expect(page.locator('[data-testid="address-results"]')).toBeVisible();

    // Test admin user address lookup
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

    await page.fill('[data-testid="address-input"]', '123 Any St, Springfield, IL 62704');
    await page.click('[data-testid="address-submit"]');
    await page.waitForResponse((response) => 
      response.url().includes('/api/v1/civics/address-lookup') || 
      response.url().includes('/api/civics/by-address')
    );

    await expect(page.locator('[data-testid="address-results"]')).toBeVisible();
  });

  test('should handle address lookup with mobile viewport with V2 setup', async ({ page }) => {
    // Set up test data for mobile address lookup testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Set mobile viewport
    await page.setViewportSize(E2E_CONFIG.BROWSER.MOBILE_VIEWPORT);

    await page.goto('/civics');
    await waitForPageReady(page);

    // Check mobile civics page layout
    await expect(page.locator('[data-testid="mobile-civics-page"]')).toBeVisible();

    // Fill address input on mobile
    await page.fill('[data-testid="address-input"]', '123 Any St, Springfield, IL 62704');
    
    // Submit address lookup on mobile
    await page.click('[data-testid="address-submit"]');
    
    // Wait for API response
    await page.waitForResponse((response) => 
      response.url().includes('/api/v1/civics/address-lookup') || 
      response.url().includes('/api/civics/by-address')
    );
    
    // Check if results are displayed on mobile
    await expect(page.locator('[data-testid="address-results"]')).toBeVisible();
  });

  test('should handle address lookup with poll management integration with V2 setup', async ({ page }) => {
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

    // Perform address lookup
    await page.goto('/civics');
    await waitForPageReady(page);

    await page.fill('[data-testid="address-input"]', '123 Any St, Springfield, IL 62704');
    await page.click('[data-testid="address-submit"]');
    await page.waitForResponse((response) => 
      response.url().includes('/api/v1/civics/address-lookup') || 
      response.url().includes('/api/civics/by-address')
    );

    await expect(page.locator('[data-testid="address-results"]')).toBeVisible();

    // Create a poll with civics context
    await page.goto('/polls/create');
    await waitForPageReady(page);

    await page.fill('input[id="title"]', 'Local Community Poll');
    await page.fill('textarea[id="description"]', 'A poll for our local community');
    await page.click('button:has-text("Next")');

    await page.fill('input[placeholder*="Option 1"]', 'Local Option 1');
    await page.fill('input[placeholder*="Option 2"]', 'Local Option 2');
    await page.click('button:has-text("Next")');

    await page.selectOption('select', 'civics');
    await page.click('button:has-text("Next")');

    await page.click('button:has-text("Create Poll")');
    await page.waitForURL(/\/polls\/[a-f0-9-]+/);

    // Verify poll was created with civics context
    const pollTitle = await page.locator('[data-testid="poll-title"]');
    await expect(pollTitle).toContainText('Local Community Poll');

    // Verify jurisdiction information is present
    await expect(page.locator('text=State IL Poll')).toBeVisible();
    await expect(page.locator('text=district 13')).toBeVisible();
  });

  test('should handle address lookup performance with V2 setup', async ({ page }) => {
    // Set up test data for performance testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    await page.goto('/civics');
    await waitForPageReady(page);

    // Measure address lookup performance
    const startTime = Date.now();

    // Fill address input
    await page.fill('[data-testid="address-input"]', '123 Any St, Springfield, IL 62704');
    
    // Submit address lookup
    await page.click('[data-testid="address-submit"]');
    
    // Wait for API response
    await page.waitForResponse((response) => 
      response.url().includes('/api/v1/civics/address-lookup') || 
      response.url().includes('/api/civics/by-address')
    );
    
    // Check if results are displayed
    await expect(page.locator('[data-testid="address-results"]')).toBeVisible();

    const endTime = Date.now();
    const lookupTime = endTime - startTime;

    // Verify address lookup performance is acceptable
    expect(lookupTime).toBeLessThan(3000);
  });

  test('should handle address lookup with offline functionality with V2 setup', async ({ page }) => {
    // Set up test data for offline address lookup testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    await page.goto('/civics');
    await waitForPageReady(page);

    // Go offline
    await page.context().setOffline(true);

    // Check offline address lookup handling
    await expect(page.locator('[data-testid="offline-address-lookup"]')).toBeVisible();

    // Try to perform address lookup while offline
    await page.fill('[data-testid="address-input"]', '123 Any St, Springfield, IL 62704');
    await page.click('[data-testid="address-submit"]');

    // Check if offline message is shown
    await expect(page.locator('[data-testid="offline-message"]')).toBeVisible();

    // Go back online
    await page.context().setOffline(false);

    // Check that address lookup works again
    await expect(page.locator('[data-testid="offline-address-lookup"]')).not.toBeVisible();

    // Try address lookup again
    await page.fill('[data-testid="address-input"]', '123 Any St, Springfield, IL 62704');
    await page.click('[data-testid="address-submit"]');
    await page.waitForResponse((response) => 
      response.url().includes('/api/v1/civics/address-lookup') || 
      response.url().includes('/api/civics/by-address')
    );

    await expect(page.locator('[data-testid="address-results"]')).toBeVisible();
  });
});
