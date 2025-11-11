import { expect, test, type Page } from '@playwright/test';

import type { OnboardingStoreHarness } from '@/app/(app)/e2e/onboarding-store/page';

import { waitForPageReady } from '../helpers/e2e-setup';

declare global {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Window {
    __onboardingStoreHarness?: OnboardingStoreHarness;
  }
}

const gotoHarness = async (page: Page) => {
  await page.goto('/e2e/onboarding-store', { waitUntil: 'domcontentloaded', timeout: 45_000 });
  await waitForPageReady(page);
  await page.waitForFunction(
    () => document?.documentElement?.dataset.onboardingStoreHarness === 'ready',
    undefined,
    { timeout: 45_000 }
  );
};

test.describe('Onboarding store harness', () => {
  test('drives step progression and reset', async ({ page }) => {
    await gotoHarness(page);

    const currentStep = page.getByTestId('onboarding-current-step');
    const progress = page.getByTestId('onboarding-progress');
    const isCompleted = page.getByTestId('onboarding-is-completed');
    const isSkipped = page.getByTestId('onboarding-is-skipped');
    const isActive = page.getByTestId('onboarding-is-active');
    const completedCount = page.getByTestId('onboarding-completed-count');
    const completedSteps = page.getByTestId('onboarding-completed-steps');

    await expect(currentStep).toHaveText('0');
    await expect(progress).toHaveText('0');
    await expect(isCompleted).toHaveText('false');
    await expect(isSkipped).toHaveText('false');
    await expect(isActive).toHaveText('false');
    await expect(completedCount).toHaveText('0');
    await expect(completedSteps).toHaveText('none');

    await page.evaluate(() => {
      const harness = window.__onboardingStoreHarness;
      harness?.setCurrentStep(2);
      harness?.markStepCompleted(2);
      harness?.nextStep();
    });

    await expect(currentStep).toHaveText('3');
    await expect(progress).toHaveText('50');
    await expect(completedCount).toHaveText('1');
    await expect(completedSteps).toHaveText('2');

    await page.evaluate(() => {
      window.__onboardingStoreHarness?.completeOnboarding();
    });

    await expect(isCompleted).toHaveText('true');
    await expect(progress).toHaveText('100');

    await page.evaluate(() => {
      window.__onboardingStoreHarness?.restartOnboarding();
    });

    await expect(currentStep).toHaveText('0');
    await expect(progress).toHaveText('0');
    await expect(isCompleted).toHaveText('false');
    await expect(isSkipped).toHaveText('false');
    await expect(isActive).toHaveText('true');

    await page.evaluate(() => {
      window.__onboardingStoreHarness?.skipOnboarding();
    });

    await expect(isSkipped).toHaveText('true');
    await expect(isActive).toHaveText('false');
    await expect(progress).toHaveText('100');
  });

  test('merges and clears onboarding data slices', async ({ page }) => {
    await gotoHarness(page);

    const authData = page.getByTestId('onboarding-auth-data');
    const profileData = page.getByTestId('onboarding-profile-data');
    const valuesData = page.getByTestId('onboarding-values-data');
    const preferencesData = page.getByTestId('onboarding-preferences-data');
    const stepData = page.getByTestId('onboarding-step-data');

    await expect(authData).toHaveText('{}');
    await expect(profileData).toHaveText('{}');

    await page.evaluate(() => {
      const harness = window.__onboardingStoreHarness;
      harness?.updateAuthData({ method: 'email', email: 'civic@example.com' });
      harness?.updateProfileData({ firstName: 'Civic', username: 'civics-user' });
      harness?.updateValuesData({ primaryInterests: ['community'] });
      harness?.updatePreferencesData({ theme: 'dark', language: 'en-US' });
      harness?.updateFormData(3, {
        primaryConcerns: ['voter access'],
        communityFocus: ['students'],
      });
    });

    await expect(authData).toContainText('civic@example.com');
    await expect(profileData).toContainText('Civic');
    await expect(valuesData).toContainText('community');
    await expect(preferencesData).toContainText('dark');
    await expect(stepData).toContainText('voter access');

    const canProceedValues = await page.evaluate(() =>
      window.__onboardingStoreHarness?.canProceedToNextStep(3)
    );
    expect(canProceedValues).toBe(true);

    await page.evaluate(() => {
      const harness = window.__onboardingStoreHarness;
      harness?.clearStepData(3);
      harness?.clearAllData();
    });

    await expect(stepData).toHaveText('{}');
    await expect(authData).toHaveText('{}');
    await expect(profileData).toHaveText('{}');
    await expect(valuesData).toHaveText('{}');
    await expect(preferencesData).toHaveText('{}');
  });
});

