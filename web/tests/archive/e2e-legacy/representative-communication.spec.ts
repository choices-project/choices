/**
 * Representative Communication E2E Tests
 * 
 * Comprehensive end-to-end tests for representative communication features
 * 
 * Created: January 26, 2025
 * Updated: November 3, 2025 - Added proper authentication setup
 */

import { test, expect } from '@playwright/test';

import { 
  setupE2ETestData, 
  cleanupE2ETestData, 
  createTestUser,
  waitForPageReady,
  setupExternalAPIMocks
} from './helpers/e2e-setup';

test.describe('Representative Communication Features', () => {
  let testData: {
    user: ReturnType<typeof createTestUser>;
  };

  test.beforeEach(async ({ page }) => {
    // Create unique test user for each test to ensure clean state
    const timestamp = Date.now();
    testData = {
      user: createTestUser({
        email: `rep-comm-${timestamp}@example.com`,
        username: `repcomm${timestamp}`,
        password: 'RepComm123!'
      })
    };

    // Set up external API mocks
    await setupExternalAPIMocks(page);

    // Set up test data
    await setupE2ETestData({ user: testData.user });

    // Register new user for clean test state
    await page.goto('/register?e2e=1&method=password', { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);

    // Wait for register form hydration
    try {
      await page.waitForSelector('[data-testid="register-hydrated"]', { state: 'attached', timeout: 10000 });
      await page.waitForTimeout(500); // Wait for hydration to complete
    } catch {
      console.warn('⚠️ Register hydration sentinel not found, continuing...');
    }

    // Select password registration method
    try {
      const passwordButton = page.locator('button:has-text("Password Account")');
      if (await passwordButton.isVisible({ timeout: 2000 })) {
        await passwordButton.click();
        await page.waitForTimeout(500);
      }
    } catch {
      console.warn('⚠️ Password Account button not found, form might already be showing password fields');
    }

    // Fill registration form (using correct testids from actual page)
    await page.fill('[data-testid="email"]', testData.user.email);
    await page.fill('[data-testid="username"]', testData.user.username);
    await page.fill('[data-testid="displayName"]', testData.user.username); // displayName is also required
    await page.fill('[data-testid="password"]', testData.user.password);
    await page.fill('[data-testid="confirmPassword"]', testData.user.password); // Note: camelCase, not kebab-case

    // Submit registration (correct testid)
    await page.click('[data-testid="register-submit"]');

    // Wait for registration to complete and redirect
    try {
      // Wait for redirect to onboarding or dashboard
      await page.waitForURL(/\/(onboarding|dashboard|representatives)/, { timeout: 15000 });
      await waitForPageReady(page);
    } catch (error) {
      console.warn('⚠️ Registration redirect timeout');
      
      // Check current URL and page state
      const currentUrl = page.url();
      console.log('Current URL:', currentUrl);
      
      // Check for error messages on the page
      const errorElement = await page.locator('[data-testid="register-error"]').textContent().catch(() => null);
      if (errorElement) {
        console.error('❌ Registration error:', errorElement);
        throw new Error(`Registration failed: ${errorElement}`);
      }
      
      // Check if we're on an authenticated page anyway
      if (!currentUrl.includes('/register') && !currentUrl.includes('/login')) {
        console.log('✅ User appears to be authenticated despite redirect timeout');
        await waitForPageReady(page);
      } else {
        // We're still on register/login page - registration might have failed silently
        console.error('❌ Still on registration page - registration may have failed');
        throw new Error(`Registration did not complete. Current URL: ${currentUrl}`);
      }
    }
  });

  test.afterEach(async () => {
    // Clean up test data
    await cleanupE2ETestData({ user: testData.user });
  });

  test.describe('Message Templates', () => {
    test('should display templates in contact modal', async ({ page }) => {
      // Navigate to representatives
      await page.goto('/representatives');
      
      // Open contact modal for a representative
      await page.click('button:has-text("Contact")');
      
      // Check for template button
      await expect(page.locator('button:has-text("Use a Template")')).toBeVisible();
    });

    test('should allow selecting a template', async ({ page }) => {
      await page.goto('/representatives');
      await page.click('button:has-text("Contact")');
      await page.click('button:has-text("Use a Template")');
      
      // Should show template categories
      await expect(page.locator('text=policy')).toBeVisible();
      await expect(page.locator('text=support')).toBeVisible();
    });

    test('should fill template with user values', async ({ page }) => {
      await page.goto('/representatives');
      await page.click('button:has-text("Contact")');
      await page.click('button:has-text("Use a Template")');
      
      // Select a template
      await page.click('button:has-text("Support for Legislation")');
      
      // Template form should appear
      await expect(page.locator('input[placeholder*="Bill Name"]')).toBeVisible();
    });
  });

  test.describe('Individual Contact', () => {
    test('should send message to representative', async ({ page }) => {
      await page.goto('/representatives');
      await page.click('button:has-text("Contact")');
      
      // Fill message form
      await page.fill('input[placeholder*="subject"]', 'Test Subject');
      await page.fill('textarea[placeholder*="message"]', 'Test message content');
      
      // Send message
      await page.click('button:has-text("Send Message")');
      
      // Should show success message
      await expect(page.locator('text=Message sent successfully')).toBeVisible({ timeout: 10000 });
    });

    test('should validate required fields', async ({ page }) => {
      await page.goto('/representatives');
      await page.click('button:has-text("Contact")');
      
      // Try to send without filling fields
      await page.click('button:has-text("Send Message")');
      
      // Should show validation error
      await expect(page.locator('text=Please fill')).toBeVisible();
    });
  });

  test.describe('Communication History', () => {
    test('should display communication history', async ({ page }) => {
      await page.goto('/contact/history');
      
      // Should show history page
      await expect(page.locator('h1:has-text("Communication History")')).toBeVisible();
    });

    test('should filter threads by status', async ({ page }) => {
      await page.goto('/contact/history');
      
      // Click filter buttons
      await page.click('button:has-text("Active")');
      await page.click('button:has-text("Closed")');
      await page.click('button:has-text("All")');
    });

    test('should sort threads by date', async ({ page }) => {
      await page.goto('/contact/history');
      
      // Change sort order
      await page.selectOption('select[name="sort"]', 'oldest');
      await page.selectOption('select[name="sort"]', 'recent');
    });
  });

  test.describe('Bulk Contact', () => {
    test('should open bulk contact modal', async ({ page }) => {
      await page.goto('/representatives/my');
      
      // Should show "Contact All" button if multiple representatives
      const contactAllButton = page.locator('button:has-text("Contact All")');
      if (await contactAllButton.isVisible()) {
        await contactAllButton.click();
        
        // Modal should open
        await expect(page.locator('text=Contact Multiple Representatives')).toBeVisible();
      }
    });

    test('should allow selecting representatives', async ({ page }) => {
      await page.goto('/representatives/my');
      
      const contactAllButton = page.locator('button:has-text("Contact All")');
      if (await contactAllButton.isVisible()) {
        await contactAllButton.click();
        
        // Should see representative checkboxes
        await expect(page.locator('input[type="checkbox"]').first()).toBeVisible();
      }
    });
  });

  test.describe('My Representatives Integration', () => {
    test('should show contact button on each card', async ({ page }) => {
      await page.goto('/representatives/my');
      
      // Each representative card should have a contact button
      const contactButtons = page.locator('button:has-text("Contact")');
      const count = await contactButtons.count();
      
      if (count > 0) {
        await expect(contactButtons.first()).toBeVisible();
      }
    });

    test('should navigate to message history from my representatives', async ({ page }) => {
      await page.goto('/representatives/my');
      
      // Click message history link
      await page.click('a:has-text("View Message History")');
      
      // Should navigate to history page
      await expect(page).toHaveURL(/.*contact\/history/);
    });
  });
});

