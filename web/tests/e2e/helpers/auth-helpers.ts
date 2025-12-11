import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Authentication Helper Functions
 * 
 * Utilities for testing authentication flows in E2E tests.
 * These helpers simplify common authentication operations.
 */

export type AuthCredentials = {
  email: string;
  password: string;
  username?: string;
};

/**
 * Ensure a user is authenticated
 * 
 * @param page - Playwright page object
 * @param credentials - User credentials for login
 * @param options - Additional options for authentication
 */
export async function ensureAuthenticated(
  page: Page,
  credentials: AuthCredentials,
  options: {
    baseUrl?: string;
    timeout?: number;
  } = {}
): Promise<void> {
  const baseUrl = options.baseUrl || process.env.BASE_URL || 'http://127.0.0.1:3000';
  const timeout = options.timeout || 120_000;

  // Navigate to auth page
  await page.goto(`${baseUrl}/auth`, { waitUntil: 'domcontentloaded', timeout: 30_000 });

  // Fill in login form
  await page.fill('input[type="email"]', credentials.email);
  await page.fill('input[type="password"]', credentials.password);
  await page.click('button[type="submit"]');

  // Wait for authentication to complete
  await page.waitForTimeout(3_000);

  // Check for authentication tokens/cookies
  await expect
    .poll(
      async () => {
        const hasCookie = await page.evaluate(() => document.cookie.includes('sb-'));
        const hasToken = await page.evaluate(() => {
          const token = localStorage.getItem('supabase.auth.token');
          return token !== null && token !== 'null';
        });
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
      { timeout, intervals: [2_000] },
    )
    .toBeTruthy();
}

/**
 * Ensure a user is not authenticated (logged out)
 * 
 * @param page - Playwright page object
 */
export async function ensureUnauthenticated(page: Page): Promise<void> {
  // Clear cookies
  await page.context().clearCookies();

  // Clear localStorage and sessionStorage
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  // Verify we're logged out by checking cookies
  const cookies = await page.context().cookies();
  const hasAuthCookie = cookies.some((cookie) => cookie.name.startsWith('sb-'));
  
  if (hasAuthCookie) {
    // If cookies still exist, navigate to a page that will clear them
    await page.goto('/auth', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(1_000);
  }
}

/**
 * Check if a page redirects to the expected authentication path
 * 
 * @param page - Playwright page object
 * @param expectedPath - Expected redirect path (e.g., '/auth' or '/feed')
 * @param options - Additional options
 */
export async function checkAuthRedirect(
  page: Page,
  expectedPath: string,
  options: {
    timeout?: number;
    baseUrl?: string;
  } = {}
): Promise<void> {
  const timeout = options.timeout || 10_000;
  const baseUrl = options.baseUrl || process.env.BASE_URL || 'http://127.0.0.1:3000';
  
  const expectedUrl = new RegExp(
    `${baseUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}${expectedPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`
  );
  
  await expect(page).toHaveURL(expectedUrl, { timeout });
}

/**
 * Wait for authentication to complete
 * 
 * @param page - Playwright page object
 * @param timeout - Maximum time to wait (default: 60 seconds)
 */
export async function waitForAuthentication(
  page: Page,
  timeout: number = 60_000
): Promise<void> {
  await expect
    .poll(
      async () => {
        const hasCookie = await page.evaluate(() => document.cookie.includes('sb-'));
        const hasToken = await page.evaluate(() => {
          const token = localStorage.getItem('supabase.auth.token');
          return token !== null && token !== 'null';
        });
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
      { timeout, intervals: [2_000] },
    )
    .toBeTruthy();
}

/**
 * Check if user is currently authenticated
 * 
 * @param page - Playwright page object
 * @returns True if user appears to be authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  const hasCookie = await page.evaluate(() => document.cookie.includes('sb-'));
  const hasToken = await page.evaluate(() => {
    const token = localStorage.getItem('supabase.auth.token');
    return token !== null && token !== 'null';
  });
  const hasSessionToken = await page.evaluate(() => {
    try {
      const session = sessionStorage.getItem('supabase.auth.token');
      return session !== null && session !== 'null';
    } catch {
      return false;
    }
  });
  
  return hasCookie || hasToken || hasSessionToken;
}

