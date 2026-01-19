import { expect, test, type Page } from '@playwright/test';

import type { PollWizardHarness } from '@/app/(app)/e2e/poll-wizard/page';

import { waitForPageReady } from '../helpers/e2e-setup';

declare global {
   
  interface Window {
    __pollWizardHarness?: PollWizardHarness;
  }
   
}

const gotoHarness = async (page: Page) => {
  await page.goto('/e2e/poll-wizard', { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await waitForPageReady(page);
  await page.waitForFunction(() => Boolean(window.__pollWizardHarness), { timeout: 60_000 });
  await page.waitForFunction(
    () => document.documentElement.dataset.pollWizardHarness === 'ready',
    { timeout: 60_000 },
  );
  await page.evaluate(() => {
    window.__pollWizardHarness?.actions.resetWizard();
    window.__pollWizardHarness?.actions.clearAllErrors();
  });
};

test.describe('Poll wizard store harness', () => {
  test('advances through steps when data is valid', async ({ page }) => {
    await gotoHarness(page);

    const currentStep = page.getByTestId('wizard-current-step');
    const errorList = page.getByTestId('wizard-errors');
    const tagsCount = page.getByTestId('wizard-tags-count');
    const isComplete = page.getByTestId('wizard-is-complete');

    await expect(currentStep).toHaveText('0');

    await page.evaluate(() => {
      const harness = window.__pollWizardHarness;
      if (!harness) return;
      harness.actions.updateData({
        title: 'Community Garden Vote',
        description: 'Help decide funding for the neighborhood garden.',
      });
      harness.actions.updateOption(0, 'Approve funding');
      harness.actions.updateOption(1, 'Delay decision');
    });

    await page.evaluate(() => window.__pollWizardHarness?.actions.nextStep());
    await expect(currentStep).toHaveText('1');
    await expect(errorList).toContainText('None');

    await page.evaluate(() => window.__pollWizardHarness?.actions.nextStep());
    await expect(currentStep).toHaveText('2');

    await page.evaluate(() => {
      const harness = window.__pollWizardHarness;
      harness?.actions.addTag('community');
    });

    await page.evaluate(() => window.__pollWizardHarness?.actions.nextStep());
    await expect(currentStep).toHaveText('3');
    await expect(tagsCount).toHaveText('1');
    await expect(isComplete).toHaveText('true');
  });

  test('surfaces validation errors when attempting to proceed prematurely', async ({ page }) => {
    await gotoHarness(page);

    const currentStep = page.getByTestId('wizard-current-step');
    const errorList = page.getByTestId('wizard-errors');
    const canProceed = page.getByTestId('wizard-can-proceed');

    await page.evaluate(() => window.__pollWizardHarness?.actions.nextStep());

    await expect(currentStep).toHaveText('0');
    await expect(canProceed).toHaveText('false');
    await expect(errorList).toContainText('Title is required');
    await expect(errorList).toContainText('Description is required');
  });
});

