import { expect, test, type Page } from '@playwright/test';

import { waitForPageReady } from '../helpers/e2e-setup';

const SAMPLE_TITLE = 'Playwright Created Poll';
const SAMPLE_DESCRIPTION =
  'This poll is created by Playwright to verify the multi-step authoring experience end-to-end.';

const ensureAnalyticsBridge = async (page: Page) => {
  await page.waitForFunction(() => Boolean(globalThis.__playwrightAnalytics));
};

const enableAnalytics = async (page: Page) => {
  await ensureAnalyticsBridge(page);
  await page.evaluate(() => globalThis.__playwrightAnalytics?.enable());
};

test.describe('Poll creation wizard', () => {
  test.beforeEach(({ page }) => {
    page.on('console', (msg) => {
       
      console.log(`[browser:${msg.type()}] ${msg.text()}`);
    });
  });

  test('happy path completes the wizard and publishes a poll', async ({ page }) => {
    await page.route('**/api/polls', async (route) => {
      const body = JSON.stringify({
        data: {
          id: 'playwright-poll',
          title: SAMPLE_TITLE,
        },
      });

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body,
      });
    });

    await page.goto('/e2e/poll-create');
    await waitForPageReady(page);
    await enableAnalytics(page);

    await page.fill('#title', SAMPLE_TITLE);
    await page.fill('#description', SAMPLE_DESCRIPTION);

    await page.getByRole('button', { name: /Next/ }).click();
    await waitForPageReady(page);

    const optionInputs = page.locator('input[aria-label^="Option"]');
    await optionInputs.nth(0).fill('Option A');
    await optionInputs.nth(1).fill('Option B');

    await page.getByRole('button', { name: /Next/ }).click();
    await waitForPageReady(page);

    await page.getByRole('button', { name: 'Technology' }).click();
    await page.fill('#tags', 'playwright');
    await page.getByRole('button', { name: 'Add' }).click();

    await page.getByRole('switch', { name: 'Allow multiple votes' }).click();
    await page.selectOption('#privacy-level', 'private');
    await page.selectOption('#voting-method', 'ranked');

    await page.getByRole('button', { name: /Next/ }).click();
    await waitForPageReady(page);

    await expect(page.getByText(SAMPLE_TITLE)).toBeVisible();
    await expect(page.getByText('Option A')).toBeVisible();
    await expect(page.getByText('Option B')).toBeVisible();

    await page.getByRole('button', { name: 'Publish poll' }).click();
    await waitForPageReady(page);

    await expect(page.getByRole('heading', { name: 'Share your poll' })).toBeVisible();
    await expect(page.getByText('Private – only people with the link can participate')).toBeVisible();
    await expect(page.getByText('Ranked choice')).toBeVisible();

    await expect.poll(async () =>
      page.evaluate(() => {
        const events = globalThis.__playwrightAnalytics?.events ?? [];
        return events.filter((event) => event.action === 'poll_created').length;
      })
    ).toBeGreaterThan(0);

    await expect.poll(async () =>
      page.evaluate(() => {
        const events = globalThis.__playwrightAnalytics?.events ?? [];
        return events.filter((event) => event.action === 'poll_share_opened').length;
      })
    ).toBeGreaterThan(0);

    await page.getByRole('button', { name: 'Done' }).click();

    await expect(page.locator('#title')).toHaveValue('');

    await page.evaluate(() => globalThis.__playwrightAnalytics?.reset());
  });
});

