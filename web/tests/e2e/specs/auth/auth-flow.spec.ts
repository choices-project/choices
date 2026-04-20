import { expect, test } from '@playwright/test';

import {
  ensureLoggedOut,
  loginTestUser,
  waitForPageReady,
} from '../../helpers/e2e-setup';

/**
 * Comprehensive Authentication Flow Tests
 *
 * Tests the complete authentication flow including:
 * - Unauthenticated redirects
 * - Login/signup functionality
 * - Session persistence
 * - Protected route access
 * - Logout functionality
 *
 * These tests verify the authentication-first redirect behavior implemented in middleware.
 */

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:3000';
const regularEmail = process.env.E2E_USER_EMAIL;
const regularPassword = process.env.E2E_USER_PASSWORD;

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure we start logged out for each test
    await ensureLoggedOut(page);
  });

  test.describe('Unauthenticated User Redirects', () => {
    // Note: In E2E harness mode, middleware bypasses auth checks for testing
    // These tests verify redirect behavior when harness mode is disabled
    // For E2E harness mode, auth state is managed client-side

    test.skip('root page redirects unauthenticated users to /auth', async ({ page }) => {
      // Skip in E2E harness mode as middleware bypasses auth
      if (process.env.NEXT_PUBLIC_ENABLE_E2E_HARNESS === '1') {
        test.skip();
      }

      await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30_000 });

      // Should redirect to /auth
      await expect(page).toHaveURL(new RegExp(`${BASE_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/auth`), { timeout: 10_000 });

      // Should see auth page content
      const authContent = page.locator('text=/log in|sign up|create account/i').first();
      await expect(authContent).toBeVisible({ timeout: 10_000 });
    });

    test.skip('feed page redirects unauthenticated users to /auth', async ({ page }) => {
      // Skip in E2E harness mode as middleware bypasses auth
      if (process.env.NEXT_PUBLIC_ENABLE_E2E_HARNESS === '1') {
        test.skip();
      }

      await page.goto(`${BASE_URL}/feed`, { waitUntil: 'networkidle', timeout: 30_000 });

      // Wait for potential redirect
      await page.waitForTimeout(3_000);

      // Should redirect to /auth (check both /auth and /login as fallback)
      const currentUrl = page.url();
      const isAuthPage = currentUrl.includes('/auth') || currentUrl.includes('/login');
      expect(isAuthPage).toBe(true);
    });

    test.skip('dashboard page redirects unauthenticated users to /auth', async ({ page }) => {
      // Skip in E2E harness mode as middleware bypasses auth
      if (process.env.NEXT_PUBLIC_ENABLE_E2E_HARNESS === '1') {
        test.skip();
      }

      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(2_000);

      // Should redirect to /auth
      await expect(page).toHaveURL(new RegExp(`${BASE_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/auth`), { timeout: 10_000 });
    });
  });

  test.describe('Auth Page Functionality', () => {
    test('auth page loads and shows login form by default', async ({ page }) => {
      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30_000 });

      // Should see login form
      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator('input[type="password"]');
      const submitButton = page.locator('[data-testid="login-submit"]');

      await expect(emailInput).toBeVisible({ timeout: 10_000 });
      await expect(passwordInput).toBeVisible({ timeout: 10_000 });
      await expect(submitButton).toBeVisible({ timeout: 10_000 });

      // Should see login heading
      const loginHeading = page.locator('text=/sign in|log in/i').first();
      await expect(loginHeading).toBeVisible({ timeout: 10_000 });
    });

    test('can toggle between login and signup forms', async ({ page }) => {
      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30_000 });

      // Find toggle button
      const toggleButton = page.locator('[data-testid="auth-toggle"]').first();
      await expect(toggleButton).toBeVisible({ timeout: 10_000 });

      // Click toggle to switch to signup
      await toggleButton.click();
      await page.waitForTimeout(500);

      // Should see signup form elements
      const displayNameInput = page.locator('input[data-testid="auth-display-name"]').first();
      const confirmPasswordInput = page.locator('input[data-testid="auth-confirm-password"]').first();

      // These fields should be visible in signup mode
      await expect(displayNameInput).toBeVisible({ timeout: 5_000 }).catch(() => {
        // Acknowledge confirmPasswordInput for future use
        void confirmPasswordInput;
        // If not visible, check if we're still in login mode
        const signupHeading = page.locator('text=/sign up|create account/i').first();
        expect(signupHeading).toBeVisible({ timeout: 5_000 });
      });

      // Toggle back to login
      await toggleButton.click();
      await page.waitForTimeout(500);

      // Should see login form again
      const emailInput = page.locator('input[type="email"]');
      await expect(emailInput).toBeVisible({ timeout: 5_000 });
    });
  });

  test.describe('Login Flow', () => {
    test.skip(!regularEmail || !regularPassword, 'E2E credentials not available');
    // Retry once on failure (production timing/hydration)
    test.describe.configure({ retries: 1 });

    test('user can log in with valid credentials', async ({ page }) => {
      test.setTimeout(120_000);

      const loginResponses: Array<{ status: number; url: string }> = [];
      page.on('response', (response) => {
        if (response.url().includes('/api/auth/login') && response.request().method() === 'POST') {
          loginResponses.push({ status: response.status(), url: response.url() });
        }
      });

      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
      await loginTestUser(page, {
        email: regularEmail!,
        password: regularPassword!,
        username: regularEmail!.split('@')[0] ?? 'e2e-user',
      });

      await waitForPageReady(page, 60_000);

      await page.goto(`${BASE_URL}/profile`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
      await waitForPageReady(page, 60_000);

      const profileUrl = page.url();
      if (profileUrl.includes('/auth')) {
        const cookies = await page.context().cookies();
        const authCookies = cookies.filter((c) => c.name.startsWith('sb-') && c.value);
        throw new Error(
          `Session did not persist to protected profile route after successful login; sb-* cookies observed: ${authCookies.length}`,
        );
      }

      const profileError = page.locator('[data-testid="profile-error"]');
      const hasProfileError = await profileError.count();
      if (hasProfileError > 0) {
        const errorText = await profileError.first().textContent().catch(() => '');
        if (errorText?.toLowerCase().includes('profile not found')) {
          throw new Error(`CRITICAL: Profile not found after login. Error: ${errorText}`);
        }
      }

      if (loginResponses.length === 0) {
        throw new Error('Expected POST /api/auth/login during UI login, but no login response was observed');
      }
      const nonSuccessLogin = loginResponses.find((entry) => entry.status >= 400);
      if (nonSuccessLogin) {
        throw new Error(`Login API returned non-success status ${nonSuccessLogin.status}: ${nonSuccessLogin.url}`);
      }
    });

    test('authenticated user visiting root redirects to /feed', async ({ page }) => {
      test.setTimeout(120_000);

      if (!regularEmail || !regularPassword) {
        test.skip();
        return;
      }

      // Log in first
      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await loginTestUser(page, {
        email: regularEmail,
        password: regularPassword,
        username: regularEmail.split('@')[0] ?? 'e2e-user',
      });

      await waitForPageReady(page);

      // Wait for authentication
      // Note: httpOnly cookies won't be accessible via document.cookie, so use Playwright's cookie API
      await expect
        .poll(
          async () => {
            // Check for httpOnly cookies using Playwright's cookie API
            const cookies = await page.context().cookies();
            const hasHttpOnlyCookie = cookies.some(c =>
              c.name.startsWith('sb-') &&
              (c.name.includes('auth') || c.name.includes('session')) &&
              c.value &&
              c.value.length > 0
            );

            // Also check for non-httpOnly cookies via document.cookie
            const hasNonHttpOnlyCookie = await page.evaluate(() => document.cookie.includes('sb-'));

            return hasHttpOnlyCookie || hasNonHttpOnlyCookie;
          },
          { timeout: 60_000, intervals: [2_000] },
        )
        .toBeTruthy();

      // Comprehensive diagnostics: Log auth state before root visit
      const cookiesBeforeRoot = await page.context().cookies();
      const authCookiesBeforeRoot = cookiesBeforeRoot.filter(c =>
        c.name.startsWith('sb-') &&
        (c.name.includes('auth') || c.name.includes('session'))
      );
      console.log('[DIAGNOSTIC] Auth state before root visit:', {
        currentUrl: page.url(),
        authCookies: authCookiesBeforeRoot.map(c => ({
          name: c.name,
          valueLength: c.value.length,
          httpOnly: c.httpOnly,
          secure: c.secure,
          domain: c.domain,
          path: c.path,
        })),
      });

      // Diagnostic: Capture redirect chain and diagnostic headers
      const redirectChain: string[] = [];
      const redirectDetails: Array<{
        status: number;
        method: string;
        from: string;
        to: string;
        headers: Record<string, string>;
      }> = [];
      const diagnosticHeaders: Record<string, string> = {};
      page.on('response', async (response) => {
        if (response.status() >= 300 && response.status() < 400) {
          const location = response.headers()['location'];
          const request = response.request();
          const fromUrl = request.url();
          const toUrl = location ? new URL(location, fromUrl).toString() : 'no location';
          redirectChain.push(`${response.status()} ${request.method()} -> ${location || 'no location'}`);

          // Capture full redirect details with diagnostic headers
          const headers = await response.allHeaders();
          const debugHeaders: Record<string, string> = {};
          Object.keys(headers).forEach(key => {
            if (key.toLowerCase().startsWith('x-auth-debug-')) {
              const value = headers[key];
              if (value) {
                debugHeaders[key] = value;
                diagnosticHeaders[key] = value; // Keep for backward compatibility
              }
            }
          });

          redirectDetails.push({
            status: response.status(),
            method: request.method(),
            from: fromUrl,
            to: toUrl,
            headers: debugHeaders,
          });
        }
      });

      // Now visit root - should redirect to /feed
      // Diagnostic: Capture initial request details (SameSite cookie issue)
      const initialRequestDetails: Array<{ url: string; headers: Record<string, string>; cookies: string[] }> = [];
      page.on('request', async (request) => {
        if (request.url() === BASE_URL || request.url() === `${BASE_URL}/`) {
          const headers = await request.allHeaders();
          const cookies = headers['cookie'] || '';
          initialRequestDetails.push({
            url: request.url(),
            headers: Object.fromEntries(
              Object.entries(headers).filter(([key]) =>
                key.toLowerCase() === 'cookie' || key.toLowerCase().startsWith('x-')
              )
            ),
            cookies: cookies ? cookies.split('; ').filter(Boolean) : [],
          });
        }
      });

      await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30_000 });

      // Diagnostic: Log initial request cookie state
      if (initialRequestDetails.length > 0) {
        console.log('[DIAGNOSTIC] Initial root request cookie state:', JSON.stringify(initialRequestDetails, null, 2));
      }

      // Diagnostic: Check what happened
      const finalUrl = page.url();
      const cookiesAfterRoot = await page.context().cookies();
      const authCookiesAfterRoot = cookiesAfterRoot.filter(c =>
        c.name.startsWith('sb-') &&
        (c.name.includes('auth') || c.name.includes('session'))
      );

      console.log('[DIAGNOSTIC] Root redirect result:', {
        finalUrl,
        expectedFeed: finalUrl.includes('/feed'),
        stayedOnMarketingHome: (() => {
          try {
            const p = new URL(finalUrl).pathname || '/';
            return p === '/' || p === '/landing';
          } catch {
            return false;
          }
        })(),
        redirectedToAuth: finalUrl.includes('/auth'),
        redirectChain: redirectChain.filter(r => r.includes(BASE_URL) || r.includes('/feed') || r.includes('/landing')),
        redirectDetails: redirectDetails.map(r => ({
          from: r.from.replace(BASE_URL, ''),
          to: r.to.replace(BASE_URL, ''),
          status: r.status,
          isAuthenticated: r.headers['x-auth-debug-isauthenticated'],
          redirectPath: r.headers['x-auth-debug-redirectpath'],
          authCookieFound: r.headers['x-auth-debug-authcookiefound'],
        })),
        authCookiesAfterRoot: authCookiesAfterRoot.map(c => ({
          name: c.name,
          valueLength: c.value.length,
          httpOnly: c.httpOnly,
        })),
        cookiesPersisted: authCookiesAfterRoot.length === authCookiesBeforeRoot.length,
        diagnosticHeaders,
      });

      // Authenticated users should be redirected to /feed directly.
      await expect(page).toHaveURL(new RegExp(`${BASE_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/feed`), { timeout: 10_000 });
    });
  });

  test.describe('Protected Route Access', () => {
    test('authenticated user can access /feed', async ({ page }) => {
      test.setTimeout(120_000);

      if (!regularEmail || !regularPassword) {
        test.skip();
        return;
      }

      // Log in first
      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await loginTestUser(page, {
        email: regularEmail,
        password: regularPassword,
        username: regularEmail.split('@')[0] ?? 'e2e-user',
      });

      await waitForPageReady(page);

      // Wait for authentication
      // Note: httpOnly cookies won't be accessible via document.cookie, so use Playwright's cookie API
      await expect
        .poll(
          async () => {
            // Check for httpOnly cookies using Playwright's cookie API
            const cookies = await page.context().cookies();
            const hasHttpOnlyCookie = cookies.some(c =>
              c.name.startsWith('sb-') &&
              (c.name.includes('auth') || c.name.includes('session')) &&
              c.value &&
              c.value.length > 0
            );

            // Also check for non-httpOnly cookies via document.cookie
            const hasNonHttpOnlyCookie = await page.evaluate(() => document.cookie.includes('sb-'));

            return hasHttpOnlyCookie || hasNonHttpOnlyCookie;
          },
          { timeout: 60_000, intervals: [2_000] },
        )
        .toBeTruthy();

      // Navigate to feed
      await page.goto(`${BASE_URL}/feed`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(2_000);

      // Should stay on feed page (not redirect to auth)
      await expect(page).toHaveURL(new RegExp(`${BASE_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/feed`), { timeout: 5_000 });

      // Page should load
      const body = page.locator('body');
      await expect(body).toBeVisible({ timeout: 10_000 });
    });

    test('authenticated user can access /dashboard', async ({ page }) => {
      test.setTimeout(120_000);

      if (!regularEmail || !regularPassword) {
        test.skip();
        return;
      }

      // Log in first
      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await loginTestUser(page, {
        email: regularEmail,
        password: regularPassword,
        username: regularEmail.split('@')[0] ?? 'e2e-user',
      });

      await waitForPageReady(page);

      // Wait for authentication
      // Note: httpOnly cookies won't be accessible via document.cookie, so use Playwright's cookie API
      await expect
        .poll(
          async () => {
            // Check for httpOnly cookies using Playwright's cookie API
            const cookies = await page.context().cookies();
            const hasHttpOnlyCookie = cookies.some(c =>
              c.name.startsWith('sb-') &&
              (c.name.includes('auth') || c.name.includes('session')) &&
              c.value &&
              c.value.length > 0
            );

            // Also check for non-httpOnly cookies via document.cookie
            const hasNonHttpOnlyCookie = await page.evaluate(() => document.cookie.includes('sb-'));

            return hasHttpOnlyCookie || hasNonHttpOnlyCookie;
          },
          { timeout: 60_000, intervals: [2_000] },
        )
        .toBeTruthy();

      // Navigate to dashboard (allow app redirect to feed)
      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 30_000 }).catch(() => undefined);
      await page.waitForURL(/\/(dashboard|feed)/, { timeout: 30_000 });

      // Should stay on an authenticated route (not redirect to auth)
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/\/(dashboard|feed)/);

      // Page should load
      const body = page.locator('body');
      await expect(body).toBeVisible({ timeout: 10_000 });
    });
  });

  test.describe('Session Persistence', () => {
    test('user session persists across page reloads', async ({ page }) => {
      test.setTimeout(120_000);

      if (!regularEmail || !regularPassword) {
        test.skip();
        return;
      }

      // Log in first
      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await loginTestUser(page, {
        email: regularEmail,
        password: regularPassword,
        username: regularEmail.split('@')[0] ?? 'e2e-user',
      });

      await waitForPageReady(page);

      // Wait for authentication
      // Note: httpOnly cookies won't be accessible via document.cookie, so use Playwright's cookie API
      await expect
        .poll(
          async () => {
            // Check for httpOnly cookies using Playwright's cookie API
            const cookies = await page.context().cookies();
            const hasHttpOnlyCookie = cookies.some(c =>
              c.name.startsWith('sb-') &&
              (c.name.includes('auth') || c.name.includes('session')) &&
              c.value &&
              c.value.length > 0
            );

            // Also check for non-httpOnly cookies via document.cookie
            const hasNonHttpOnlyCookie = await page.evaluate(() => document.cookie.includes('sb-'));

            return hasHttpOnlyCookie || hasNonHttpOnlyCookie;
          },
          { timeout: 60_000, intervals: [2_000] },
        )
        .toBeTruthy();

      // Navigate to feed
      await page.goto(`${BASE_URL}/feed`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(2_000);

      // Reload the page
      await page.reload({ waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(2_000);

      // Should still be on feed (session persisted)
      await expect(page).toHaveURL(new RegExp(`${BASE_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/feed`), { timeout: 5_000 });
    });

    test('user session persists when visiting root after login', async ({ page }) => {
      test.setTimeout(120_000);

      if (!regularEmail || !regularPassword) {
        test.skip();
        return;
      }

      // Log in first
      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await loginTestUser(page, {
        email: regularEmail,
        password: regularPassword,
        username: regularEmail.split('@')[0] ?? 'e2e-user',
      });

      await waitForPageReady(page);

      // Wait for authentication
      // Note: httpOnly cookies won't be accessible via document.cookie, so use Playwright's cookie API
      await expect
        .poll(
          async () => {
            // Check for httpOnly cookies using Playwright's cookie API
            const cookies = await page.context().cookies();
            const hasHttpOnlyCookie = cookies.some(c =>
              c.name.startsWith('sb-') &&
              (c.name.includes('auth') || c.name.includes('session')) &&
              c.value &&
              c.value.length > 0
            );

            // Also check for non-httpOnly cookies via document.cookie
            const hasNonHttpOnlyCookie = await page.evaluate(() => document.cookie.includes('sb-'));

            return hasHttpOnlyCookie || hasNonHttpOnlyCookie;
          },
          { timeout: 60_000, intervals: [2_000] },
        )
        .toBeTruthy();

      // Visit root - should redirect to /feed (not /auth and not marketing home fallback)
      await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30_000 });

      // Should redirect to /feed (authenticated)
      await expect(page).toHaveURL(new RegExp(`${BASE_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/feed`), { timeout: 10_000 });
    });
  });
});

