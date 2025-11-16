/* eslint-disable @typescript-eslint/no-empty-function */
import { expect, test } from '@playwright/test';

import { runAxeAudit } from '../helpers/accessibility';
import { waitForPageReady } from '../helpers/e2e-setup';
import { installScreenReaderCapture, waitForAnnouncement } from '../helpers/screen-reader';

const SAMPLE_TITLE = 'Playwright Created Poll';
const SAMPLE_DESCRIPTION =
  'This poll is created by Playwright to verify the multi-step authoring experience end-to-end.';

test.describe('@axe Poll creation wizard', () => {
  test.beforeEach(async ({ page }) => {
    await installScreenReaderCapture(page);
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
    await waitForAnnouncement(page, {
      priority: 'polite',
      textFragment: 'Step 1 of 4: Describe your poll',
      timeout: 15_000,
    });

    await page.waitForSelector('#poll-title-input', { state: 'visible', timeout: 60_000 });
    await page.fill('#poll-title-input', SAMPLE_TITLE);
    await page.fill('#poll-description-input', SAMPLE_DESCRIPTION);

    await runAxeAudit(page, 'poll details');

    await page.getByRole('button', { name: /Next/ }).click();
    await waitForPageReady(page);
    await waitForAnnouncement(page, {
      priority: 'polite',
      textFragment: 'Step 2 of 4: Add response options',
    });

    const optionInputs = page.locator('input[id^="poll-option-"]');
    await optionInputs.nth(0).fill('Option A');
    await optionInputs.nth(1).fill('Option B');

    await runAxeAudit(page, 'options step');

    await page.getByRole('button', { name: /Next/ }).click();
    await waitForPageReady(page);
    await waitForAnnouncement(page, {
      priority: 'polite',
      textFragment: 'Step 3 of 4: Audience & discovery',
    });

    await page.getByRole('button', { name: /Category Technology/i }).click();
    await page.fill('#poll-tags-input', 'playwright');
    await page.getByRole('button', { name: 'Add' }).click();

    await page.evaluate(() => {
      const harness = (window as typeof window & { __pollWizardHarness?: any }).__pollWizardHarness;
      harness?.actions.updateSettings({
        allowMultipleVotes: true,
        privacyLevel: 'private',
        votingMethod: 'ranked',
      });
      const snapshot = harness?.getSnapshot();
      if (snapshot) {
        if (!snapshot.data.settings.allowMultipleVotes) {
          throw new Error('allowMultipleVotes not enabled');
        }
        if (snapshot.data.settings.privacyLevel !== 'private') {
          throw new Error('privacyLevel not set to private');
        }
        if (snapshot.data.settings.votingMethod !== 'ranked') {
          throw new Error('votingMethod not set to ranked');
        }
      }
    });

    await runAxeAudit(page, 'audience step');

    await page.getByRole('button', { name: /Next/ }).click();
    await waitForPageReady(page);
    await waitForAnnouncement(page, {
      priority: 'polite',
      textFragment: 'Step 4 of 4: Preview & publish',
    });

    await runAxeAudit(page, 'review step');

    await expect(page.getByText(SAMPLE_TITLE)).toBeVisible();
    await expect(page.getByText('Option A')).toBeVisible();
    await expect(page.getByText('Option B')).toBeVisible();

    await page.getByRole('button', { name: 'Publish poll' }).click();
    await waitForPageReady(page);
    await waitForAnnouncement(page, {
      priority: 'polite',
      textFragment: 'Poll created successfully',
      timeout: 15_000,
    });

    await runAxeAudit(page, 'share dialog');

    await expect(page.getByRole('heading', { name: 'Share your poll' })).toBeVisible();
    await expect(page.getByText(/Visibility:\s*private/)).toBeVisible();
    await expect(page.getByText(/Poll published!/)).toBeVisible();
    await page.getByRole('button', { name: 'Close' }).first().click();

    await runAxeAudit(page, 'wizard reset');

    await expect(page.locator('#poll-title-input')).toHaveValue('');
  });
});

/* eslint-enable @typescript-eslint/no-empty-function */
