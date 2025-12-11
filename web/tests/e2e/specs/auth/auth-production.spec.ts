import { expect, test } from '@playwright/test';

import {
  ensureLoggedOut,
  loginAsAdmin,
  loginTestUser,
  SHOULD_USE_MOCKS,
  waitForPageReady,
} from '../../helpers/e2e-setup';

const PRODUCTION_URL = process.env.PRODUCTION_URL || 'https://choices-app.com';
const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:3000';
const regularEmail = process.env.E2E_USER_EMAIL;
const regularPassword = process.env.E2E_USER_PASSWORD;
const adminEmail = process.env.E2E_ADMIN_EMAIL;
const adminPassword = process.env.E2E_ADMIN_PASSWORD;

test.describe('Auth – real backend', () => {
  // Skip if mocks are enabled
  // Note: This test requires a working production deployment. If deployment is failing,
  // these tests will also fail. Focus on fixing deployment first.
  test.skip(SHOULD_USE_MOCKS, 'Set PLAYWRIGHT_USE_MOCKS=0 to exercise the real backend');

  test.beforeEach(async ({ page }) => {
    await ensureLoggedOut(page);
  });

  test('existing test user can sign in via /auth', async ({ page }) => {
    test.setTimeout(120_000); // Increase test timeout for production server

    // Navigate to auth page on the correct base URL
    await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30_000 });

    await loginTestUser(page, {
      email: regularEmail!,
      password: regularPassword!,
      username: regularEmail.split('@')[0] ?? 'e2e-user',
    });

    await waitForPageReady(page);

    // Wait for authentication to complete first (cookies/tokens)
    // Increase timeout to 60s for production server which may be slower
    await expect
      .poll(
        async () => {
          const hasCookie = await page.evaluate(() => document.cookie.includes('sb-'));
          const hasToken = await page.evaluate(() => {
            const token = localStorage.getItem('supabase.auth.token');
            return token !== null && token !== 'null';
          });
          // Also check for session storage
          const hasSessionToken = await page.evaluate(() => {
            try {
              const session = sessionStorage.getItem('supabase.auth.token');
              return session !== null && session !== 'null';
            } catch {
              return false;
            }
          });
          return hasCookie || hasToken || hasSessionToken;
        },
        { timeout: 60_000, intervals: [2_000] }, // Check every 2 seconds, 60s timeout for production
      )
      .toBeTruthy();

    // Wait for redirect with longer timeout for production server
    // The client-side redirect happens after a setTimeout(1000) in the auth page
    await expect(page).toHaveURL(/(dashboard|onboarding)/, { timeout: 60_000 });
  });

  test('admin credentials unlock admin routes', async ({ page }) => {
    test.setTimeout(120_000); // Increase test timeout for production server

    // Navigate to auth page on the correct base URL
    await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30_000 });

    await loginAsAdmin(page, {
      email: adminEmail!,
      password: adminPassword!,
      username: adminEmail.split('@')[0] ?? 'e2e-admin',
    });

    await waitForPageReady(page);

    // Wait for authentication to complete first
    // Increase timeout to 60s for production server which may be slower
    await expect
      .poll(
        async () => {
          const hasCookie = await page.evaluate(() => document.cookie.includes('sb-'));
          const hasToken = await page.evaluate(() => {
            const token = localStorage.getItem('supabase.auth.token');
            return token !== null && token !== 'null';
          });
          // Also check for session storage
          const hasSessionToken = await page.evaluate(() => {
            try {
              const session = sessionStorage.getItem('supabase.auth.token');
              return session !== null && session !== 'null';
            } catch {
              return false;
            }
          });
          return hasCookie || hasToken || hasSessionToken;
        },
        { timeout: 60_000, intervals: [2_000] }, // Check every 2 seconds, 60s timeout for production
      )
      .toBeTruthy();

    await page.goto('/admin', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await waitForPageReady(page);

    await expect(page).toHaveURL(/\/admin/, { timeout: 30_000 });
    
    // Wait for admin status check to complete
    // The page shows a loading state initially, then either shows access denied or admin dashboard
    // Wait for either the admin dashboard tab (which only appears when admin) or access denied message
    await page.waitForFunction(
      () => {
        // Check if admin dashboard tab is visible (indicates admin access granted)
        const adminTab = document.querySelector('[data-testid="admin-dashboard-tab"]');
        if (adminTab) return true;
        
        // Check if access denied is visible (indicates admin access denied)
        const accessDenied = document.querySelector('[data-testid="admin-access-denied"]');
        if (accessDenied) return true;
        
        return false; // Still loading
      },
      { timeout: 60_000 }
    );
    
    // Verify the admin dashboard is visible (not access denied)
    // The admin dashboard tab should be visible if admin access is granted
    const adminTab = page.locator('[data-testid="admin-dashboard-tab"]');
    await expect(adminTab).toBeVisible({ timeout: 30_000 });
    
    // Verify access denied is NOT visible
    const accessDenied = page.locator('[data-testid="admin-access-denied"]');
    await expect(accessDenied).toHaveCount(0, { timeout: 5_000 });
  });
});

