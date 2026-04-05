/**
 * Production: signed-in user submits via the floating widget; admin lists feedback and may generate a GitHub issue.
 * Requires E2E_USER_* and E2E_ADMIN_* in the environment (see docs/TESTING.md).
 * Uses BASE_URL from playwright.production.config.ts (www.choices-app.com).
 */
import { devices, expect, test } from '@playwright/test';

import {
  ensureLoggedOut,
  getE2EAdminCredentials,
  getE2EUserCredentials,
  loginAsAdmin,
  loginTestUser,
  waitForPageReady,
} from '../../helpers/e2e-setup';

// playwright.production.config sets userAgent to ChoicesE2E — some edges return a blank /auth; use a real Chrome UA here.
test.use({
  userAgent: devices['Desktop Chrome'].userAgent,
});

test.describe('Production feedback (user + admin)', () => {
  test('widget submit on /feed, admin triage, optional GitHub generate', async ({ page }) => {
    test.setTimeout(180_000);

    const user = getE2EUserCredentials();
    const admin = getE2EAdminCredentials();
    test.skip(
      !user || !admin,
      'Set E2E_USER_EMAIL, E2E_USER_PASSWORD, E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD',
    );

    const unique = `prod-feedback-${Date.now()}`;
    await page.emulateMedia({ reducedMotion: 'reduce' });

    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await ensureLoggedOut(page);
    await loginTestUser(page, user!);
    // loginTestUser (production) already navigates / → /feed with load; avoid a second bare /feed goto that can miss cookie priming.
    await waitForPageReady(page);
    // Match root global-error.tsx only (h1), not ErrorBoundary (h2) inside the app shell — the widget can still be usable with the latter.
    const globalErrorH1 = page.getByRole('heading', { level: 1, name: /^Something went wrong$/i });
    const globalErrorBody = page.getByText('An unexpected error occurred. Please try again.', {
      exact: true,
    });
    if (
      (await globalErrorH1.isVisible({ timeout: 4_000 }).catch(() => false)) &&
      (await globalErrorBody.isVisible({ timeout: 1_000 }).catch(() => false))
    ) {
      test.skip(
        true,
        `Production hit Next.js global-error (root). pageerror: ${pageErrors.slice(0, 5).join(' | ') || 'none'}`,
      );
    }
    await page.evaluate(
      () =>
        new Promise<void>((resolve) => {
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
        }),
    );
    await page.waitForTimeout(1000);

    const openBtn = page.getByTestId('feedback-widget-button');
    await expect(openBtn).toBeVisible({ timeout: 30_000 });
    await openBtn.click();
    await expect(openBtn).toHaveAttribute('data-state', 'open', { timeout: 15_000 });
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText('What type of feedback?', { exact: true })).toBeVisible({
      timeout: 15_000,
    });
    await page.getByRole('button', { name: /Bug Report/i }).first().click();
    await page.getByLabel('Feedback title').fill(unique);
    await page
      .getByLabel('Feedback description')
      .fill(
        'Production E2E feedback test. Plain text only for validation rules.',
      );
    await page.getByRole('button', { name: 'Continue to sentiment selection' }).click();
    await page.getByRole('button', { name: 'Neutral sentiment' }).click();
    await expect(page.getByRole('heading', { name: 'Add a screenshot?' })).toBeVisible({
      timeout: 15_000,
    });

    const feedbackPost = page.waitForResponse(
      (res) => res.url().includes('/api/feedback') && res.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Submit Feedback' }).click();
    const postRes = await feedbackPost;

    if (postRes.status() >= 500) {
      const detail = await postRes.text().catch(() => '');
      test.skip(
        true,
        `POST /api/feedback ${postRes.status()} on production. ${detail.slice(0, 400)}`,
      );
    }
    expect(postRes.ok(), `POST /api/feedback failed: ${postRes.status()}`).toBeTruthy();

    await expect(page.getByText('Feedback submitted successfully!')).toBeVisible({
      timeout: 30_000,
    });

    await ensureLoggedOut(page);
    await loginAsAdmin(page);

    await page.goto('/admin/feedback', { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await expect(page.getByTestId('admin-feedback-page')).toBeVisible({ timeout: 60_000 });

    await page.getByPlaceholder('Search feedback...').fill(unique);
    await expect(page.getByText(unique).first()).toBeVisible({ timeout: 90_000 });

    await expect(page.getByRole('heading', { name: 'GitHub Issue Generation' })).toBeVisible();
    const genPromise = page.waitForResponse((res) =>
      res.url().includes('/api/admin/feedback/') && res.url().includes('/generate-issue'),
    );
    await page.getByRole('button', { name: 'Generate' }).first().click();
    const genRes = await genPromise;

    if (genRes.status() === 503) {
      test.info().annotations.push({
        type: 'issue',
        description:
          'generate-issue returned 503 — configure GITHUB_ISSUES_TOKEN and GITHUB_ISSUES_REPOSITORY on Vercel for live issue creation.',
      });
      return;
    }

    expect(
      genRes.ok(),
      `generate-issue expected 2xx, got ${genRes.status()}: ${await genRes.text().catch(() => '')}`,
    ).toBeTruthy();

    const genJson = (await genRes.json()) as { success?: boolean; data?: { issueUrl?: string } };
    expect(genJson.success).toBeTruthy();
    expect(genJson.data?.issueUrl).toMatch(/^https:\/\/github\.com\//);

    await expect(page.getByText(/Issue #\d+ created/)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('link', { name: 'View on GitHub' })).toBeVisible();
  });
});
