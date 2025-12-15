import { expect, test, type Page } from '@playwright/test';
import { ensureLoggedOut, loginTestUser, waitForPageReady } from '../../helpers/e2e-setup';

/**
 * Production Observability Tests
 *
 * These tests are explicitly focused on capturing:
 * - Network responses (especially API failures)
 * - Console errors/warnings
 *
 * for key user journeys in the live environment:
 * - /feed
 * - /account/privacy
 * - /dashboard
 *
 * They are intentionally a bit more verbose in logging so we can
 * diagnose real production issues from CI logs.
 */

const PRODUCTION_URL = process.env.PRODUCTION_URL || 'https://choices-app.com';
const BASE_URL = process.env.BASE_URL || PRODUCTION_URL;
const IS_PRODUCTION_TARGET =
  BASE_URL.startsWith('https://') &&
  process.env.NEXT_PUBLIC_ENABLE_E2E_HARNESS !== '1' &&
  process.env.PLAYWRIGHT_USE_MOCKS !== '1';

const regularEmail = process.env.E2E_USER_EMAIL;
const regularPassword = process.env.E2E_USER_PASSWORD;

async function attachObservability(page: Page, label: string, baseUrl: string) {
  page.on('console', (msg) => {
    const type = msg.type();
    if (type === 'error' || type === 'warning') {
      console.log(`[${label} console][${type}] ${msg.text()}`);
    }
  });

  page.on('response', async (response) => {
    const url = response.url();
    if (!url.startsWith(baseUrl)) return;

    const status = response.status();
    if (status >= 400) {
      let bodySnippet = '';
      try {
        const body = await response.json();
        bodySnippet = JSON.stringify(body).slice(0, 600);
      } catch {
        // Non‑JSON or already consumed; that's fine
      }
      console.log(`[${label} response][${status}] ${url} body=${bodySnippet}`);
    }
  });
}

test.describe('Production Observability', () => {
  test('feed page API + console diagnostics', async ({ page }) => {
    if (!IS_PRODUCTION_TARGET) {
      test.skip('Production observability tests run only against real production targets');
    }

    test.setTimeout(120_000);

    await attachObservability(page, 'feed', BASE_URL);

    // If we have credentials configured, log in first to mimic a real user
    if (regularEmail && regularPassword) {
      await ensureLoggedOut(page);
      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'networkidle', timeout: 30_000 });

      await loginTestUser(page, {
        email: regularEmail,
        password: regularPassword,
        username: regularEmail.split('@')[0] ?? 'e2e-user',
      });

      await waitForPageReady(page, 60_000);
      await page.waitForTimeout(2_000);
    }

    // Now go to feed
    await page.goto(`${BASE_URL}/feed`, { waitUntil: 'networkidle', timeout: 60_000 });

    // Wait for feeds API response and log its status/body
    const feedsResponse = await page.waitForResponse(
      (resp) =>
        resp.url().startsWith(`${BASE_URL}/api/feeds`) &&
        resp.request().method() === 'GET',
      { timeout: 30_000 },
    );

    const status = feedsResponse.status();
    console.log(`[feed api] status=${status}`);

    // We *expect* this to be healthy in a correct production environment.
    // If it is 500 or similar, tests will fail and logs above will show details.
    expect(status).not.toBe(500);
  });

  test('privacy page API + console diagnostics', async ({ page }) => {
    if (!IS_PRODUCTION_TARGET) {
      test.skip('Production observability tests run only against real production targets');
    }
    test.setTimeout(120_000);

    await attachObservability(page, 'privacy', BASE_URL);

    // Try to mimic a real logged‑in user if credentials are available
    if (regularEmail && regularPassword) {
      await ensureLoggedOut(page);
      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'networkidle', timeout: 30_000 });

      await loginTestUser(page, {
        email: regularEmail,
        password: regularPassword,
        username: regularEmail.split('@')[0] ?? 'e2e-user',
      });

      await waitForPageReady(page, 60_000);
      await page.waitForTimeout(2_000);
    }

    // Navigate to privacy/settings page used in your screenshot
    await page.goto(`${BASE_URL}/account/privacy`, {
      waitUntil: 'domcontentloaded',
      timeout: 60_000,
    });

    // Allow some time for any long‑running calls / spinners
    await page.waitForTimeout(10_000);

    // At minimum, the page should render something; errors will be visible in logs
    const body = page.locator('body');
    await expect(body).toBeVisible({ timeout: 10_000 });
  });

  test('dashboard navigation + auth diagnostics', async ({ page }) => {
    if (!IS_PRODUCTION_TARGET) {
      test.skip('Production observability tests run only against real production targets');
    }
    test.setTimeout(120_000);

    await attachObservability(page, 'dashboard', BASE_URL);

    if (!regularEmail || !regularPassword) {
      test.skip();
      return;
    }

    await ensureLoggedOut(page);

    // Log in
    await page.goto(`${BASE_URL}/auth`, { waitUntil: 'networkidle', timeout: 30_000 });
    await loginTestUser(page, {
      email: regularEmail,
      password: regularPassword,
      username: regularEmail.split('@')[0] ?? 'e2e-user',
    });
    await waitForPageReady(page, 60_000);
    await page.waitForTimeout(2_000);

    // Navigate to dashboard and see if we get bounced back to auth
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForTimeout(5_000);

    const currentUrl = page.url();
    console.log(`[dashboard] finalUrl=${currentUrl}`);

    // In a healthy state, we should *not* end up back on /auth
    expect(currentUrl.includes('/auth')).toBeFalsy();
  });
});


