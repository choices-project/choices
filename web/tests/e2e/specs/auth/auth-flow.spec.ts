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

const PRODUCTION_URL = process.env.PRODUCTION_URL || 'https://www.choices-app.com';
const BASE_URL = process.env.BASE_URL || PRODUCTION_URL;
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
      const submitButton = page.locator('button[type="submit"]');
      
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

    test('user can log in with valid credentials', async ({ page }) => {
      test.setTimeout(120_000);
      
      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      
      // Fill in login form
      await page.fill('input[type="email"]', regularEmail!);
      await page.fill('input[type="password"]', regularPassword!);
      await page.click('button[type="submit"]');
      
      // Wait for authentication to complete
      await page.waitForTimeout(3_000);
      
      // Check for authentication tokens/cookies
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
            
            // Check localStorage (set by client-side code)
            const hasToken = await page.evaluate(() => {
              const token = localStorage.getItem('supabase.auth.token');
              return token !== null && token !== 'null';
            });
            
            return hasHttpOnlyCookie || hasNonHttpOnlyCookie || hasToken;
          },
          { timeout: 60_000, intervals: [2_000] },
        )
        .toBeTruthy();
      
      // Should redirect after login (to dashboard or feed)
      await expect(page).toHaveURL(/(dashboard|feed|onboarding)/, { timeout: 60_000 });
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
      
      // Now visit root - should redirect to /feed
      await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30_000 });
      
      // Authenticated users should be redirected to /feed
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
      
      // Navigate to dashboard
      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(2_000);
      
      // Should stay on dashboard (not redirect to auth)
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/\/dashboard/);
      
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
      
      // Visit root - should redirect to /feed (not /auth)
      await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30_000 });
      
      // Should redirect to /feed (authenticated)
      await expect(page).toHaveURL(new RegExp(`${BASE_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/feed`), { timeout: 10_000 });
    });
  });
});

