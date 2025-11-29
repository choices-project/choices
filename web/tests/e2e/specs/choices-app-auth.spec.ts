import { expect, test } from '@playwright/test';

/**
 * Comprehensive authentication tests for choices-app.com
 * 
 * These tests verify:
 * - Login flow with real credentials
 * - Session persistence across page navigations
 * - Cookie management and security
 * - API authentication after login
 * - Logout functionality
 * - Error handling for invalid credentials
 */

const TEST_USER_EMAIL = process.env.E2E_USER_EMAIL || process.env.CHOICES_APP_TEST_EMAIL;
const TEST_USER_PASSWORD = process.env.E2E_USER_PASSWORD || process.env.CHOICES_APP_TEST_PASSWORD;
const TEST_ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || process.env.CHOICES_APP_ADMIN_EMAIL;
const TEST_ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || process.env.CHOICES_APP_ADMIN_PASSWORD;

test.describe('Choices App - Authentication Flow', () => {
  test.beforeEach(async ({ page, context }) => {
    // Clear all cookies and storage before each test
    await context.clearCookies();
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('should successfully log in with valid credentials', async ({ page }) => {
    test.skip(!TEST_USER_EMAIL || !TEST_USER_PASSWORD, 'Test credentials not configured');

    // Navigate to login page
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');

    // Fill in login form
    await page.fill('input[type="email"]', TEST_USER_EMAIL!);
    await page.fill('input[type="password"]', TEST_USER_PASSWORD!);

    // Submit login form
    await page.click('button[type="submit"]');

    // Wait for redirect after login
    await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 15_000 });

    // Verify we're authenticated
    const url = page.url();
    expect(url).toMatch(/\/(dashboard|onboarding)/);

    // Verify cookies are set
    const cookies = await page.context().cookies();
    const authCookies = cookies.filter(cookie => 
      cookie.name.includes('auth-token') || 
      cookie.name.includes('sb-') ||
      cookie.name.includes('access-token')
    );
    
    expect(authCookies.length).toBeGreaterThan(0);
    
    // Verify cookies have secure flags in production
    const secureCookies = authCookies.filter(cookie => cookie.secure);
    expect(secureCookies.length).toBeGreaterThan(0);
  });

  test('should persist session across page navigations', async ({ page }) => {
    test.skip(!TEST_USER_EMAIL || !TEST_USER_PASSWORD, 'Test credentials not configured');

    // Login first
    await page.goto('/auth');
    await page.fill('input[type="email"]', TEST_USER_EMAIL!);
    await page.fill('input[type="password"]', TEST_USER_PASSWORD!);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 15_000 });

    // Navigate to different pages and verify session persists
    const pagesToTest = ['/dashboard', '/polls', '/profile'];
    
    for (const path of pagesToTest) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      
      // Should not be redirected to login
      expect(page.url()).not.toContain('/auth');
      
      // Verify we can access protected content
      const bodyText = await page.textContent('body');
      expect(bodyText).not.toContain('Sign in');
    }
  });

  test('should authenticate API requests after login', async ({ page }) => {
    test.skip(!TEST_USER_EMAIL || !TEST_USER_PASSWORD, 'Test credentials not configured');

    // Login
    await page.goto('/auth');
    await page.fill('input[type="email"]', TEST_USER_EMAIL!);
    await page.fill('input[type="password"]', TEST_USER_PASSWORD!);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 15_000 });

    // Navigate to dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Monitor API requests
    const apiRequests: Array<{ url: string; status: number }> = [];
    page.on('response', response => {
      const url = response.url();
      if (url.includes('/api/')) {
        apiRequests.push({ url, status: response.status() });
      }
    });

    // Wait for dashboard to load and make API calls
    await page.waitForTimeout(3000);

    // Check that API requests succeeded (not 401)
    const failedAuthRequests = apiRequests.filter(req => req.status === 401);
    expect(failedAuthRequests.length).toBe(0);

    // Verify at least some API requests were made
    expect(apiRequests.length).toBeGreaterThan(0);
  });

  test('should handle invalid credentials gracefully', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');

    // Try to login with invalid credentials
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Should show error message
    await page.waitForTimeout(2000);
    
    const errorMessage = await page.textContent('body');
    expect(errorMessage).toMatch(/invalid|error|incorrect|failed/i);
    
    // Should still be on auth page
    expect(page.url()).toContain('/auth');
  });

  test('should logout and clear session', async ({ page }) => {
    test.skip(!TEST_USER_EMAIL || !TEST_USER_PASSWORD, 'Test credentials not configured');

    // Login first
    await page.goto('/auth');
    await page.fill('input[type="email"]', TEST_USER_EMAIL!);
    await page.fill('input[type="password"]', TEST_USER_PASSWORD!);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 15_000 });

    // Get cookies before logout
    const cookiesBefore = await page.context().cookies();
    const authCookiesBefore = cookiesBefore.filter(cookie => 
      cookie.name.includes('auth-token') || 
      cookie.name.includes('sb-')
    );
    expect(authCookiesBefore.length).toBeGreaterThan(0);

    // Find and click logout button
    // This might be in a menu or header
    const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign out"), [data-testid="logout"]').first();
    if (await logoutButton.isVisible({ timeout: 5000 })) {
      await logoutButton.click();
    } else {
      // Try navigating to logout endpoint
      await page.goto('/auth/logout');
    }

    // Wait for redirect to login
    await page.waitForURL(/\/auth/, { timeout: 10_000 });

    // Verify cookies are cleared
    const cookiesAfter = await page.context().cookies();
    const authCookiesAfter = cookiesAfter.filter(cookie => 
      cookie.name.includes('auth-token') || 
      cookie.name.includes('sb-')
    );
    
    // Most auth cookies should be cleared
    expect(authCookiesAfter.length).toBeLessThan(authCookiesBefore.length);
  });

  test('should maintain session after page refresh', async ({ page }) => {
    test.skip(!TEST_USER_EMAIL || !TEST_USER_PASSWORD, 'Test credentials not configured');

    // Login
    await page.goto('/auth');
    await page.fill('input[type="email"]', TEST_USER_EMAIL!);
    await page.fill('input[type="password"]', TEST_USER_PASSWORD!);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 15_000 });

    const urlBeforeRefresh = page.url();

    // Refresh the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Should still be authenticated
    expect(page.url()).toMatch(/\/(dashboard|onboarding)/);
    expect(page.url()).toBe(urlBeforeRefresh);
  });

  test('admin user can access admin routes', async ({ page }) => {
    test.skip(!TEST_ADMIN_EMAIL || !TEST_ADMIN_PASSWORD, 'Admin credentials not configured');

    // Login as admin
    await page.goto('/auth');
    await page.fill('input[type="email"]', TEST_ADMIN_EMAIL!);
    await page.fill('input[type="password"]', TEST_ADMIN_PASSWORD!);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 15_000 });

    // Navigate to admin route
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    // Should be able to access admin page
    expect(page.url()).toContain('/admin');
    
    // Should see admin content (not 403/404)
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toMatch(/403|404|forbidden|not found/i);
  });
});

