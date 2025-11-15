import { expect, test, type Page } from '@playwright/test';

import { waitForPageReady } from '../helpers/e2e-setup';
import { runAxeAudit } from '../helpers/accessibility';

const POLL_ID = 'harness-poll';
const RESULTS_ROUTE = new RegExp(`/api/polls/${POLL_ID}/results$`);
const VOTE_ROUTE = new RegExp(`/api/polls/${POLL_ID}/vote$`);
const CANCEL_ROUTE = new RegExp(`/api/voting/records/vote-harness$`);

const getEventCount = async (page: Page, action: string) => {
  return page.evaluate((target) => {
    const events = globalThis.__playwrightAnalytics?.events ?? [];
    return events.filter((event) => event.action === target).length;
  }, action);
};

test.describe('@axe Poll viewer harness', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: async () => Promise.resolve(),
        },
        configurable: true,
      });

      window.addEventListener('playwright:analytics-ready', () => {
        globalThis.__playwrightAnalytics?.enable?.();
      });
    });

    await page.route(RESULTS_ROUTE, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            voting_method: 'single',
            total_votes: 12,
            results: [
              { option_id: '0', option_text: 'Increase research funding', vote_count: 6 },
              { option_id: '1', option_text: 'Invest in community programs', vote_count: 4 },
              { option_id: '2', option_text: 'Expand customer success', vote_count: 2 },
            ],
            trust_tier_filter: null,
          },
        }),
      });
    });

    await page.route(VOTE_ROUTE, async (route) => {
      const method = route.request().method();
      if (method === 'HEAD') {
        await route.fulfill({ status: 404 });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ voteId: 'vote-harness' }),
      });
    });

    await page.route(CANCEL_ROUTE, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });
  });

  test('emits analytics for viewing, sharing, and voting', async ({ page }) => {
    await page.goto(`/e2e/poll-run/${POLL_ID}`, { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);
    await page.waitForFunction(() => Boolean(globalThis.__playwrightAnalytics));
    await runAxeAudit(page, 'poll run initial state');

    await page.getByRole('button', { name: /Share/i }).click();
    await runAxeAudit(page, 'poll share dialog');
    await expect.poll(() => getEventCount(page, 'detail_copy_link')).toBeGreaterThan(0);

    await page.getByTestId('start-voting-button').click();
    await expect.poll(() => getEventCount(page, 'detail_start_voting')).toBeGreaterThan(0);

    await page.getByTestId('option-1-radio').click();
    await page.getByTestId('submit-vote-button').click();
    await runAxeAudit(page, 'poll vote confirmation');
    await expect.poll(() => getEventCount(page, 'vote_cast')).toBeGreaterThan(0);

    await page.getByTestId('undo-vote-button').click();
    await expect.poll(() => getEventCount(page, 'vote_undo')).toBeGreaterThan(0);

    await page.evaluate(() => globalThis.__playwrightAnalytics?.reset?.());
  });
});

