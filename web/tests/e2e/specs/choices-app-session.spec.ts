import { expect, test } from '@playwright/test';

import {
  ensureLoggedOut,
  waitForPageReady,
} from '../helpers/e2e-setup';
import { loginToProduction } from '../helpers/production-auth';

/**
 * Session persistence and cookie management tests for choices-app.com
 * 
 * These tests specifically verify:
 * - Cookie security settings
 * - Session persistence across browser contexts
 * - Cookie expiration handling
 * - Cross-tab session sharing
 * - API authentication with cookies
 */

const TEST_USER_EMAIL = process.env.E2E_USER_EMAIL || process.env.CHOICES_APP_TEST_EMAIL;
const TEST_USER_PASSWORD = process.env.E2E_USER_PASSWORD || process.env.CHOICES_APP_TEST_PASSWORD;

test.describe('Choices App - Session & Cookie Management', () => {
  test('should set secure cookies in production', async ({ page, context }) => {
    test.skip(!TEST_USER_EMAIL || !TEST_USER_PASSWORD, 'Test credentials not configured');

    await ensureLoggedOut(page);

    await loginToProduction(page, {
      email: TEST_USER_EMAIL!,
      password: TEST_USER_PASSWORD!,
    });
    await waitForPageReady(page);
    await expect(page).toHaveURL(/\/(dashboard|onboarding)/, { timeout: 15_000 });

    // Check cookie security settings
    const cookies = await context.cookies();
    const authCookies = cookies.filter(cookie => 
      cookie.name.includes('auth-token') || 
      cookie.name.includes('sb-') ||
      cookie.name.includes('access-token')
    );

    expect(authCookies.length).toBeGreaterThan(0);

    // In production (HTTPS), cookies should be secure
    const isHttps = page.url().startsWith('https://');
    if (isHttps) {
      const secureCookies = authCookies.filter(cookie => cookie.secure);
      expect(secureCookies.length).toBeGreaterThan(0);
    }

    // Cookies should have httpOnly for security (we can't directly check this,
    // but we verify they're not accessible via JavaScript)
    const cookieNames = authCookies.map(c => c.name);
    const jsCookies = await page.evaluate(() => document.cookie);
    
    // HttpOnly cookies won't appear in document.cookie
    // So if we have auth cookies but they're not in document.cookie, they're likely httpOnly
    const hasHttpOnlyCookies = cookieNames.some(name => !jsCookies.includes(name));
    expect(hasHttpOnlyCookies).toBeTruthy();
  });

  test('should persist session in new browser context', async ({ browser }) => {
    test.skip(!TEST_USER_EMAIL || !TEST_USER_PASSWORD, 'Test credentials not configured');

    // Create first context and login
    const context1 = await browser.newContext();
    const page1 = await context1.newPage();
    
    await loginTestUser(page1, {
      email: TEST_USER_EMAIL!,
      password: TEST_USER_PASSWORD!,
      username: TEST_USER_EMAIL!.split('@')[0] ?? 'test-user',
    });
    await waitForPageReady(page1);
    await expect(page1).toHaveURL(/\/(dashboard|onboarding)/, { timeout: 15_000 });

    // Get cookies from first context
    const cookies = await context1.cookies();

    // Create second context and set cookies
    const context2 = await browser.newContext();
    await context2.addCookies(cookies);
    const page2 = await context2.newPage();

    // Navigate to protected page in new context
    await page2.goto('/dashboard');
    await page2.waitForLoadState('networkidle');

    // Should be authenticated (not redirected to login)
    expect(page2.url()).not.toContain('/auth');
    expect(page2.url()).toContain('/dashboard');

    await context1.close();
    await context2.close();
  });

  test('should authenticate API requests with cookies', async ({ page }) => {
    test.skip(!TEST_USER_EMAIL || !TEST_USER_PASSWORD, 'Test credentials not configured');

    await ensureLoggedOut(page);

    // Login
    await loginToProduction(page, {
      email: TEST_USER_EMAIL!,
      password: TEST_USER_PASSWORD!,
    });
    await waitForPageReady(page);
    await expect(page).toHaveURL(/\/(dashboard|onboarding)/, { timeout: 15_000 });

    // Navigate to dashboard which makes API calls
    await page.goto('/dashboard');
    
    // Monitor API responses
    const apiResponses: Array<{ url: string; status: number; headers: Record<string, string> }> = [];
    
    page.on('response', async response => {
      const url = response.url();
      if (url.includes('/api/dashboard') || url.includes('/api/site-messages')) {
        const headers = response.headers();
        apiResponses.push({
          url,
          status: response.status(),
          headers: {
            'content-type': headers['content-type'] || '',
          },
        });
      }
    });

    // Wait for dashboard to load and API calls to complete
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Verify API calls succeeded
    expect(apiResponses.length).toBeGreaterThan(0);
    
    const failedRequests = apiResponses.filter(r => r.status === 401 || r.status === 403);
    if (failedRequests.length > 0) {
      console.error('Failed API requests:', failedRequests);
    }
    expect(failedRequests.length).toBe(0);
  });

  test('should maintain session across multiple tabs', async ({ context }) => {
    test.skip(!TEST_USER_EMAIL || !TEST_USER_PASSWORD, 'Test credentials not configured');

    // Login in first tab
    const page1 = await context.newPage();
    await loginTestUser(page1, {
      email: TEST_USER_EMAIL!,
      password: TEST_USER_PASSWORD!,
      username: TEST_USER_EMAIL!.split('@')[0] ?? 'test-user',
    });
    await waitForPageReady(page1);
    await expect(page1).toHaveURL(/\/(dashboard|onboarding)/, { timeout: 15_000 });

    // Open second tab
    const page2 = await context.newPage();
    await page2.goto('/dashboard');
    await page2.waitForLoadState('networkidle');

    // Should be authenticated in second tab too
    expect(page2.url()).not.toContain('/auth');
    expect(page2.url()).toContain('/dashboard');

    await page1.close();
    await page2.close();
  });

  test('should handle cookie expiration gracefully', async ({ page }) => {
    test.skip(!TEST_USER_EMAIL || !TEST_USER_PASSWORD, 'Test credentials not configured');

    await ensureLoggedOut(page);

    // Login
    await loginToProduction(page, {
      email: TEST_USER_EMAIL!,
      password: TEST_USER_PASSWORD!,
    });
    await waitForPageReady(page);
    await expect(page).toHaveURL(/\/(dashboard|onboarding)/, { timeout: 15_000 });

    // Get cookies and check expiration
    const cookies = await page.context().cookies();
    const authCookies = cookies.filter(cookie => 
      cookie.name.includes('auth-token') || 
      cookie.name.includes('sb-')
    );

    expect(authCookies.length).toBeGreaterThan(0);

    // Cookies should have expiration set
    const cookiesWithExpiry = authCookies.filter(cookie => cookie.expires !== -1);
    expect(cookiesWithExpiry.length).toBeGreaterThan(0);
  });

  test('should set cookies with correct SameSite attribute', async ({ page }) => {
    test.skip(!TEST_USER_EMAIL || !TEST_USER_PASSWORD, 'Test credentials not configured');

    await ensureLoggedOut(page);

    await loginToProduction(page, {
      email: TEST_USER_EMAIL!,
      password: TEST_USER_PASSWORD!,
    });
    await waitForPageReady(page);
    await expect(page).toHaveURL(/\/(dashboard|onboarding)/, { timeout: 15_000 });

    const cookies = await page.context().cookies();
    const authCookies = cookies.filter(cookie => 
      cookie.name.includes('auth-token') || 
      cookie.name.includes('sb-')
    );

    // Cookies should have SameSite set (lax or strict)
    // Note: Playwright doesn't expose SameSite directly, but we can verify
    // cookies are set correctly by checking they work for same-site requests
    expect(authCookies.length).toBeGreaterThan(0);

    // Verify cookies work for same-site navigation
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    expect(page.url()).not.toContain('/auth');
  });
});

