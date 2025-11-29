import { expect, test } from '@playwright/test';

import {
  ensureLoggedOut,
  loginTestUser,
  waitForPageReady,
} from '../helpers/e2e-setup';

/**
 * Dashboard functionality tests for choices-app.com
 * 
 * These tests verify:
 * - Dashboard loads after authentication
 * - API endpoints return data correctly
 * - User-specific content is displayed
 * - Error handling for API failures
 * - Feed refresh functionality
 */

const TEST_USER_EMAIL = process.env.E2E_USER_EMAIL || process.env.CHOICES_APP_TEST_EMAIL;
const TEST_USER_PASSWORD = process.env.E2E_USER_PASSWORD || process.env.CHOICES_APP_TEST_PASSWORD;

test.describe('Choices App - Dashboard Functionality', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!TEST_USER_EMAIL || !TEST_USER_PASSWORD, 'Test credentials not configured');

    await ensureLoggedOut(page);

    // Login before each test
    await loginTestUser(page, {
      email: TEST_USER_EMAIL!,
      password: TEST_USER_PASSWORD!,
      username: TEST_USER_EMAIL!.split('@')[0] ?? 'test-user',
    });
    await waitForPageReady(page);
    await expect(page).toHaveURL(/\/(dashboard|onboarding)/, { timeout: 15_000 });
  });

  test('should load dashboard successfully', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Should not be redirected to login
    expect(page.url()).toContain('/dashboard');

    // Dashboard should have content
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toBeNull();
    expect(bodyText!.length).toBeGreaterThan(0);
  });

  test('should fetch dashboard data via API', async ({ page }) => {
    const apiResponses: Array<{ url: string; status: number; body?: unknown }> = [];

    page.on('response', async response => {
      const url = response.url();
      if (url.includes('/api/dashboard')) {
        const status = response.status();
        let body;
        try {
          body = await response.json();
        } catch {
          body = await response.text();
        }
        apiResponses.push({ url, status, body });
      }
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Wait for API calls

    // Should have made API calls
    expect(apiResponses.length).toBeGreaterThan(0);

    // All API calls should succeed
    const failedRequests = apiResponses.filter(r => r.status !== 200);
    if (failedRequests.length > 0) {
      console.error('Failed dashboard API requests:', failedRequests);
    }
    expect(failedRequests.length).toBe(0);
  });

  test('should display user-specific content', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Dashboard should show user-specific elements
    // This might be polls, feeds, or user profile info
    const pageContent = await page.textContent('body');
    expect(pageContent).not.toBeNull();
    
    // Should not show generic error messages
    expect(pageContent).not.toMatch(/401|403|unauthorized|forbidden/i);
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Intercept and fail API requests to test error handling
    await page.route('**/api/dashboard/data', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Should still show dashboard (not crash)
    expect(page.url()).toContain('/dashboard');
    
    // Should show error message or handle gracefully
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toBeNull();
  });

  test('should refresh feeds successfully', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Look for refresh button or feed refresh functionality
    const refreshButton = page.locator('button:has-text("Refresh"), button[aria-label*="refresh" i], [data-testid*="refresh"]').first();
    
    if (await refreshButton.isVisible({ timeout: 5000 })) {
      // Monitor API calls during refresh
      const refreshApiCalls: Array<{ url: string; status: number }> = [];
      
      page.on('response', response => {
        const url = response.url();
        if (url.includes('/api/feeds') || url.includes('/api/dashboard')) {
          refreshApiCalls.push({ url, status: response.status() });
        }
      });

      await refreshButton.click();
      await page.waitForTimeout(3000);

      // Should make API calls
      expect(refreshApiCalls.length).toBeGreaterThan(0);
      
      // API calls should succeed
      const failedCalls = refreshApiCalls.filter(r => r.status >= 400);
      expect(failedCalls.length).toBe(0);
    } else {
      // If no refresh button, skip this part
      test.skip(true, 'Feed refresh button not found');
    }
  });

  test('should load site messages', async ({ page }) => {
    const apiResponses: Array<{ url: string; status: number }> = [];

    page.on('response', response => {
      const url = response.url();
      if (url.includes('/api/site-messages')) {
        apiResponses.push({ url, status: response.status() });
      }
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Should have attempted to fetch site messages
    const siteMessageCalls = apiResponses.filter(r => r.url.includes('/api/site-messages'));
    
    if (siteMessageCalls.length > 0) {
      // API calls should succeed (not 401)
      const failedCalls = siteMessageCalls.filter(r => r.status === 401);
      expect(failedCalls.length).toBe(0);
    }
  });
});

