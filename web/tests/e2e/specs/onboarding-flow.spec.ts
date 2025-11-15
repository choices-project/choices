import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

import { setupExternalAPIMocks, waitForPageReady } from '../helpers/e2e-setup';
import { runAxeAudit } from '../helpers/accessibility';

const gotoHarness = async (page: Page) => {
  await page.goto('/e2e/onboarding-flow', { waitUntil: 'domcontentloaded', timeout: 45_000 });
  await waitForPageReady(page);
  await page.waitForFunction(
    () => document.documentElement.dataset.onboardingFlowReady === 'true',
    undefined,
    { timeout: 15_000 },
  );
};

test.describe('@axe Onboarding flow harness', () => {
  test.beforeEach(async ({ page }) => {
    await setupExternalAPIMocks(page, { analytics: true, notifications: true, civics: false });
  });

  test('completes onboarding via harness helpers', async ({ page }) => {
    await gotoHarness(page);
    await runAxeAudit(page, 'onboarding flow initial state');

    await page.evaluate(() => {
      const harness = window.__onboardingFlowHarness;
      if (!harness) {
        throw new Error('Onboarding flow harness not initialised');
      }

      harness.reset();
      harness.startOnboarding();
      harness.completeAuthStep();
      harness.fillProfileStep();
      harness.setValuesStep();
      harness.completePrivacyStep();
      harness.finish();
    });

    await expect(page.getByTestId('onboarding-flow-status')).toHaveText('completed');
    await expect(page.getByTestId('onboarding-flow-current-step')).toHaveText('5');

    await runAxeAudit(page, 'onboarding flow completion state');
  });

  test('supports custom values and preferences data', async ({ page }) => {
    await gotoHarness(page);
    await runAxeAudit(page, 'onboarding flow custom data initial state');

    await page.evaluate(() => {
      const harness = window.__onboardingFlowHarness;
      if (!harness) {
        throw new Error('Onboarding flow harness not initialised');
      }

      harness.reset();
      harness.startOnboarding({
        profile: { displayName: 'Harness Tester' },
      });
      harness.completeAuthStep({ method: 'google' });
      harness.fillProfileStep({ profileVisibility: 'friends_only' });
      harness.setValuesStep({
        primaryConcerns: ['education', 'economy'],
        communityFocus: ['local'],
      });
      harness.completePrivacyStep({ marketingOptIn: true });
      harness.finish();
    });

    const snapshot = await page.evaluate(() => {
      const harness = window.__onboardingFlowHarness;
      if (!harness) {
        throw new Error('Harness missing');
      }
      return harness.snapshot();
    });

    expect(snapshot).toMatchObject({
      isCompleted: true,
      authData: expect.objectContaining({ method: 'google' }),
      profileData: expect.objectContaining({ displayName: 'Harness Tester' }),
      valuesData: expect.objectContaining({
        primaryConcerns: ['education', 'economy'],
        communityFocus: ['local'],
      }),
      preferencesData: expect.objectContaining({ marketing: true }),
    });

    await runAxeAudit(page, 'onboarding flow custom data completion state');
  });
});

