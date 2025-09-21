/**
 * Feature Flags E2E Tests
 * 
 * Tests that disabled features are properly gated and enabled features work correctly.
 * This is critical for ensuring only MVP features are accessible.
 */

import { test, expect } from '@playwright/test';

test.describe('Feature Flags', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should verify disabled social sharing features are not accessible', async ({ page }) => {
    // Navigate to a poll page
    await page.goto('/polls');
    await page.waitForLoadState('networkidle');

    // Check that social sharing buttons are not present
    const socialShareButtons = await page.locator('[data-testid*="social-share"]').count();
    expect(socialShareButtons).toBe(0);

    // Check that social sharing components are not rendered
    const socialComponents = await page.locator('[class*="social"]').count();
    expect(socialComponents).toBe(0);

    // Verify no social sharing API calls are made
    const requests: string[] = [];
    page.on('request', request => {
      if (request.url().includes('social') || request.url().includes('share')) {
        requests.push(request.url());
      }
    });

    // Wait a bit to catch any potential requests
    await page.waitForTimeout(2000);
    expect(requests).toHaveLength(0);
  });

  test('should verify analytics are disabled', async ({ page }) => {
    // Check that no analytics scripts are loaded
    const analyticsScripts = await page.locator('script[src*="analytics"], script[src*="gtag"], script[src*="ga"]').count();
    expect(analyticsScripts).toBe(0);

    // Check that no analytics API calls are made
    const requests: string[] = [];
    page.on('request', request => {
      if (request.url().includes('analytics') || request.url().includes('gtag') || request.url().includes('ga')) {
        requests.push(request.url());
      }
    });

    // Navigate around to trigger any potential analytics
    await page.goto('/dashboard');
    await page.waitForTimeout(2000);
    expect(requests).toHaveLength(0);
  });

  test('should verify experimental features are not accessible', async ({ page }) => {
    // Check that experimental UI components are not present
    const experimentalComponents = await page.locator('[class*="experimental"]').count();
    expect(experimentalComponents).toBe(0);

    // Check that experimental features are not in the UI
    const experimentalElements = await page.locator('[data-testid*="experimental"]').count();
    expect(experimentalElements).toBe(0);
  });

  test('should verify civics address lookup is disabled', async ({ page }) => {
    // Navigate to civics page
    await page.goto('/civics');
    await page.waitForLoadState('networkidle');

    // Check that address lookup functionality is not present
    const addressLookup = await page.locator('[data-testid*="address-lookup"]').count();
    expect(addressLookup).toBe(0);

    // Check that no civics API calls are made
    const requests: string[] = [];
    page.on('request', request => {
      if (request.url().includes('/api/civics/')) {
        requests.push(request.url());
      }
    });

    await page.waitForTimeout(2000);
    expect(requests).toHaveLength(0);
  });

  test('should verify enabled features work correctly', async ({ page }) => {
    // Test authentication is enabled
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    // Check for login page elements instead of specific form
    const loginPage = await page.locator('text=Sign in to your account').count();
    expect(loginPage).toBeGreaterThan(0);

    // Test polls are enabled
    await page.goto('/polls');
    await page.waitForLoadState('networkidle');
    const pollsPage = await page.locator('text=Polls').count();
    expect(pollsPage).toBeGreaterThan(0);

    // Test admin is enabled (if user has access)
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    // Should either show admin interface or access denied, but not 404
    const is404 = await page.locator('text=404').count();
    expect(is404).toBe(0);

    // Test PWA features are enabled (navigate to dashboard where PWA components are rendered)
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    const pwaStatus = await page.locator('[data-testid="pwa-status"]').count();
    expect(pwaStatus).toBeGreaterThan(0);
  });

  test('should verify feature flag API works correctly', async ({ page }) => {
    // Test the feature flag API endpoint
    const response = await page.request.get('/api/e2e/flags');
    expect(response.ok()).toBe(true);
    
    const flags = await response.json();
    
    // Verify expected flags are present in the flags object
    expect(flags.flags).toHaveProperty('PWA');
    expect(flags.flags).toHaveProperty('SOCIAL_SHARING');
    expect(flags.flags).toHaveProperty('ANALYTICS');
    
    // Verify expected values
    expect(flags.flags.PWA).toBe(true);
    expect(flags.flags.SOCIAL_SHARING).toBe(false);
    expect(flags.flags.ANALYTICS).toBe(false);
  });

  test('should verify no social sharing routes are accessible', async ({ page }) => {
    // Test that social sharing routes return 404 or are not accessible
    const socialRoutes = [
      '/api/social/share',
      '/api/social/candidates',
      '/api/social/trending',
      '/share'
    ];

    for (const route of socialRoutes) {
      const response = await page.request.get(route);
      // Should either be 404 or return an error, not a successful response
      // Note: Some routes might return 405 (Method Not Allowed) which is also acceptable
      expect(response.status()).not.toBe(200);
    }
  });

  test('should verify OpenGraph images are disabled', async ({ page }) => {
    // Test that opengraph-image routes are not accessible
    const response = await page.request.get('/p/test-poll/opengraph-image');
    expect(response.status()).toBe(404);
  });

  test('should verify social signup is disabled', async ({ page }) => {
    // Navigate to registration page
    await page.goto('/register');
    await page.waitForLoadState('networkidle');

    // Check that social signup buttons are not present
    const socialSignupButtons = await page.locator('[data-testid*="social-signup"]').count();
    expect(socialSignupButtons).toBe(0);

    // Check that OAuth buttons are not present
    const oauthButtons = await page.locator('[data-testid*="oauth"]').count();
    expect(oauthButtons).toBe(0);
  });

  test('should verify advanced privacy features are disabled', async ({ page }) => {
    // Navigate to privacy settings
    await page.goto('/account/privacy');
    await page.waitForLoadState('networkidle');

    // Check that advanced privacy options are not present
    const advancedPrivacy = await page.locator('[data-testid*="advanced-privacy"]').count();
    expect(advancedPrivacy).toBe(0);
  });
});
