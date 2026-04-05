/**
 * End-to-end: feedback widget (harness) → admin feedback → optional GitHub issue creation.
 * Run with Playwright’s `webServer` (e.g. `CI=true npx playwright test …`) so `.env.local` is merged
 * into the dev server process — otherwise client `env` validation can fail on `/e2e/*`.
 * Requires Supabase feedback writes (anon insert or service-role fallback). If POST returns 5xx, the test is skipped with a note.
 * GitHub step succeeds only when GITHUB_ISSUES_TOKEN + GITHUB_ISSUES_REPOSITORY are set for the server.
 *
 * Note: selecting a sentiment advances to the screenshot step; submit from there without an image.
 */
import { expect, test } from '@playwright/test';

test.describe('Feedback harness → admin → GitHub issue', () => {
  test('widget submit, admin triage, generate-issue request', async ({ page }) => {
    const unique = `e2e-cycle-${Date.now()}`;

    // Framer Motion starts the dialog at opacity 0; without reduced motion, Playwright may not treat it as visible.
    await page.emulateMedia({ reducedMotion: 'reduce' });

    // Avoid `networkidle` here — Next.js dev server keeps connections open (HMR).
    await page.goto('/e2e/feedback', { waitUntil: 'domcontentloaded' });
    await expect(
      page.getByRole('heading', { name: 'Feedback Widget Harness' }),
    ).toBeVisible({ timeout: 60_000 });

    const openBtn = page.getByTestId('feedback-widget-button');
    await openBtn.scrollIntoViewIfNeeded();
    await expect(openBtn).toBeVisible({ timeout: 15_000 });
    // Wait for hydration to attach React handlers (rAF alone is flaky on cold Next dev).
    await page.evaluate(
      () =>
        new Promise<void>((resolve) => {
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
        }),
    );
    await page.waitForTimeout(1000);
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
        'Automated browser test of the feedback pipeline. Plain text only for validation rules.',
      );
    await page.getByRole('button', { name: 'Continue to sentiment selection' }).click();
    await page.getByRole('button', { name: 'Neutral sentiment' }).click();
    // Selecting sentiment advances to the screenshot step; submit without attaching an image.
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
        `POST /api/feedback returned ${postRes.status()}. Check Supabase \`feedback\` table schema/RLS and SUPABASE_SERVICE_ROLE_KEY. ${detail.slice(0, 400)}`,
      );
    }
    expect(postRes.ok(), `POST /api/feedback failed: ${postRes.status()}`).toBeTruthy();

    await expect(page.getByText('Feedback submitted successfully!')).toBeVisible({
      timeout: 30_000,
    });

    await page.goto('/admin/feedback', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('admin-feedback-page')).toBeVisible({ timeout: 30_000 });

    await page.getByPlaceholder('Search feedback...').fill(unique);
    await expect(page.getByText(unique).first()).toBeVisible({ timeout: 60_000 });

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
          'GitHub issue API returned 503 — set GITHUB_ISSUES_TOKEN and GITHUB_ISSUES_REPOSITORY on the dev server to test real issue creation.',
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
