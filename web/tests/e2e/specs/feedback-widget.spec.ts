import { expect, test, type Page } from '@playwright/test';

import { waitForPageReady } from '../helpers/e2e-setup';

const ensureAnalyticsBridge = async (page: Page) => {
  await page.waitForFunction(() => Boolean(globalThis.__playwrightAnalytics));
};

const enableAnalytics = async (page: Page) => {
  await ensureAnalyticsBridge(page);
  await page.evaluate(() => globalThis.__playwrightAnalytics?.enable?.());
};

const navigateHome = async (page: Page) => {
  await page.goto('/e2e/feedback');
  await waitForPageReady(page);
  await expect(page.getByTestId('feedback-widget-button')).toBeVisible({ timeout: 10_000 });
};

const openFeedbackWidget = async (page: Page) => {
  await page.getByTestId('feedback-widget-button').click();
  await expect(page.getByRole('heading', { name: 'Enhanced Feedback' })).toBeVisible();
};

test.describe('Feedback Widget', () => {
  test.afterEach(async ({ page }) => {
    await page.evaluate(() => {
      globalThis.__playwrightAnalytics?.reset?.();
    });
  });

  test.beforeEach(({ page }) => {
    page.on('console', (msg) => {
       
      console.log(`[browser:${msg.type()}] ${msg.text()}`);
    });
  });

  test('renders floating trigger on the home page', async ({ page }) => {
    await navigateHome(page);
  });

  test('tracks analytics when the widget is opened', async ({ page }) => {
    await navigateHome(page);
    await enableAnalytics(page);

    await openFeedbackWidget(page);

    await expect.poll(async () =>
      page.evaluate(() => {
        const events = globalThis.__playwrightAnalytics?.events ?? [];
        return events.filter((event) => event.action === 'feedback_widget_opened').length;
      })
    ).toBeGreaterThan(0);

    await page.evaluate(() => globalThis.__playwrightAnalytics?.reset?.());
  });

  test('submits a bug report with contextual payload', async ({ page }) => {
    const interceptedRequests: Array<Record<string, unknown>> = [];

    await page.route('**/api/feedback', async (route) => {
      const payload = route.request().postDataJSON();
      interceptedRequests.push(payload);

      await route.fulfill({
        status: 200,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ success: true, message: 'Feedback submitted successfully!' }),
      });
    });

    try {
      await navigateHome(page);
      await page.evaluate(() => {
        console.info('feedback-e2e-info');
        console.warn({ key: 'feedback-e2e-object', status: 'test' });
      });
      await openFeedbackWidget(page);

      await page.getByRole('button', { name: 'Bug Report' }).click();
      await page.getByPlaceholder('Brief title').fill('Widget regression bug');
      await page
        .getByPlaceholder('Detailed description...')
        .fill('Playwright verifies that the widget can submit detailed bug reports.');
      await page.getByRole('button', { name: 'Next' }).click();
      await page.getByRole('button', { name: 'Negative' }).click();
      await page.getByRole('button', { name: 'Submit Feedback' }).click();

      await expect.poll(() => interceptedRequests.length).toBe(1);

      const payload = interceptedRequests[0];
      expect(payload).toMatchObject({
        type: 'bug',
        sentiment: 'negative',
        title: 'Widget regression bug',
      });

      expect(typeof payload?.description).toBe('string');
      expect(payload?.userJourney).toMatchObject({ currentPage: expect.stringContaining('/') });
      expect(payload?.feedbackContext).toBeDefined();

      const context = payload?.feedbackContext as Record<string, unknown>;
      expect(context).toBeDefined();

      expect(typeof context?.feedbackId).toBe('string');
      expect(typeof context?.timestamp).toBe('string');
      expect(Array.isArray(context?.consoleLogs)).toBe(true);
      expect((context?.consoleLogs as unknown[] | undefined)?.length ?? 0).toBeGreaterThan(0);
      expect(JSON.stringify(context?.consoleLogs)).toContain('feedback-e2e-info');
      expect(context?.category).toEqual(expect.arrayContaining(['bug']));
      expect(context?.priority).toMatch(/low|medium|high|urgent/);
      expect(context?.severity).toMatch(/minor|moderate|major|critical/);
      expect(context?.userJourney).toMatchObject({
        currentPage: expect.stringContaining('/'),
        deviceInfo: expect.objectContaining({
          deviceType: expect.any(String),
          browser: expect.any(String),
        }),
        sessionId: expect.any(String),
      });
      expect(Array.isArray(context?.networkRequests)).toBe(true);

      await expect(page.getByText('Thank You! 🎉')).toBeVisible();
      await page.getByRole('button', { name: 'Close' }).click();

      await expect(page.getByRole('heading', { name: 'Enhanced Feedback' })).not.toBeVisible();
    } finally {
      await page.unroute('**/api/feedback');
      await page.evaluate(() => globalThis.__playwrightAnalytics?.reset?.());
    }
  });

  test('surfaces an error banner when submission fails', async ({ page }) => {
    await page.route('**/api/feedback', async (route) => {
      await route.fulfill({
        status: 500,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ success: false, error: 'Service unavailable' }),
      });
    });

    try {
      await navigateHome(page);
      await openFeedbackWidget(page);

      await page.getByRole('button', { name: 'Bug Report' }).click();
      await page.getByPlaceholder('Brief title').fill('Broken widget error path');
      await page
        .getByPlaceholder('Detailed description...')
        .fill('Verify that the feedback widget shows a visible error when the API fails.');
      await page.getByRole('button', { name: 'Next' }).click();
      await page.getByRole('button', { name: 'Negative' }).click();
      await page.getByRole('button', { name: 'Submit Feedback' }).click();

      const banner = page.getByTestId('feedback-widget-error');
      await expect(banner).toBeVisible();
      await expect(banner).toContainText('Service unavailable');

      // The floating button should be removed while the error banner is shown
      await expect(page.getByTestId('feedback-widget-button')).not.toBeVisible();
    } finally {
      await page.unroute('**/api/feedback');
      await page.evaluate(() => globalThis.__playwrightAnalytics?.reset?.());
    }
  });
});

