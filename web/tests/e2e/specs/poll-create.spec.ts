import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

import { waitForPageReady } from '../helpers/e2e-setup';

const SAMPLE_TITLE = 'Playwright Created Poll';
const SAMPLE_DESCRIPTION =
  'This poll is created by Playwright to verify the multi-step authoring experience end-to-end.';

const runAxe = async (page: Page, context: string) => {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();

  if (results.violations.length > 0) {
    console.error(`[axe] ${context} violations detected:`, results.violations);
  } else {
    console.info(`[axe] ${context} passed WCAG 2.0/2.1 A/AA checks`);
  }

  expect(results.violations, `${context} accessibility violations`).toEqual([]);
};

test.describe('Poll creation wizard', () => {
  test.beforeEach(({ page }) => {
    page.on('console', (msg) => {

      console.log(`[browser:${msg.type()}] ${msg.text()}`);
    });
  });

  test('happy path completes the wizard and publishes a poll', async ({ page }) => {
    test.setTimeout(120_000);
    page.setDefaultNavigationTimeout(60_000);
    page.setDefaultTimeout(60_000);

    await page.addInitScript(() => {
      try {
        window.localStorage?.removeItem?.('poll-wizard-store');
      } catch {
        // ignore
      }

      try {
        if (navigator.serviceWorker) {
          const originalScope = navigator.serviceWorker;
          const fakeRegistration = {
            addEventListener: () => {},
            removeEventListener: () => {},
            unregister: () => Promise.resolve(true),
            update: () => Promise.resolve(),
            scope: '/',
            active: null,
            installing: null,
            waiting: null,
          };

          Object.assign(originalScope, {
            register: () => Promise.resolve(fakeRegistration),
            ready: Promise.resolve(fakeRegistration),
            getRegistrations: () => Promise.resolve([fakeRegistration]),
            getRegistration: () => Promise.resolve(fakeRegistration),
            addEventListener: () => {},
            removeEventListener: () => {},
          });
        }
      } catch {
        // ignore service worker stubbing errors
      }
    });

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

    await page.goto('/e2e/poll-create', { waitUntil: 'networkidle', timeout: 120_000 });
    await waitForPageReady(page);
    await expect(page).toHaveURL(/\/e2e\/poll-create/);

    await page.waitForSelector('#poll-title-input', { state: 'visible', timeout: 60_000 });
    await page.fill('#poll-title-input', SAMPLE_TITLE);
    await page.fill('#poll-description-input', SAMPLE_DESCRIPTION);

    await runAxe(page, 'poll details');

    await page.getByRole('button', { name: /Next/ }).click();
    await waitForPageReady(page);

    const optionInputs = page.locator('input[id^="poll-option-"]');
    await optionInputs.nth(0).fill('Option A');
    await optionInputs.nth(1).fill('Option B');

    await runAxe(page, 'options step');

    await page.getByRole('button', { name: /Next/ }).click();
    await waitForPageReady(page);

    await page.getByRole('button', { name: /Category Technology/i }).click();
    await page.fill('#poll-tags-input', 'playwright');
    await page.getByRole('button', { name: 'Add' }).click();

    await page.getByLabel('Allow multiple votes').check();
    await page.getByLabel('Privacy level').selectOption('private');
    await page.getByLabel('Voting method').selectOption('ranked');

    await runAxe(page, 'audience step');

    await page.getByRole('button', { name: /Next/ }).click();
    await waitForPageReady(page);

    await runAxe(page, 'review step');

    await expect(page.getByText(SAMPLE_TITLE)).toBeVisible();
    await expect(page.getByText('Option A')).toBeVisible();
    await expect(page.getByText('Option B')).toBeVisible();

    await page.getByRole('button', { name: 'Publish poll' }).click();
    await waitForPageReady(page);

    await runAxe(page, 'share dialog');

    await expect(page.getByRole('heading', { name: 'Share your poll' })).toBeVisible();
    await expect(page.getByText(/Visibility:\s*private/)).toBeVisible();
    await expect(page.getByText(/Poll published!/)).toBeVisible();

    await page.getByRole('button', { name: 'Close' }).click();

    await runAxe(page, 'wizard reset');

    await expect(page.locator('#poll-title-input')).toHaveValue('');
  });
});

