import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

import { setupExternalAPIMocks, waitForPageReady } from '../helpers/e2e-setup';

const triggerHiddenAdvance = async (page: Page, testId: string) => {
  await page.evaluate((id: string) => {
    const element = document.querySelector<HTMLButtonElement>(`[data-testid="${id}"]`);
    element?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  }, testId);
};

test.describe('Balanced onboarding flow', () => {
  test.beforeEach(async ({ page }) => {
    await setupExternalAPIMocks(page, { analytics: true, notifications: true, civics: false });
  });

  test.fixme('allows a guest to skip steps and reach completion', async ({ page }) => {
    await page.goto('/onboarding', { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await waitForPageReady(page);
    await page.waitForFunction(
      () => document.documentElement.dataset.onboardingFlowReady === 'true',
      undefined,
      { timeout: 15_000 }
    );

    await triggerHiddenAdvance(page, 'tour-next');
    await triggerHiddenAdvance(page, 'data-usage-next');
    await triggerHiddenAdvance(page, 'interests-next');
    await triggerHiddenAdvance(page, 'experience-next');
    await triggerHiddenAdvance(page, 'experience-next');
    await page.waitForFunction(
      () => document.documentElement.dataset.onboardingFlowStep === '5',
      undefined,
      { timeout: 10_000 }
    );

    const completionHeading = page.getByRole('heading', { name: /You'?re All Set!/i });
    await expect(completionHeading).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: 'Find My Representatives' })).toBeVisible({ timeout: 10_000 });

    await Promise.all([
      page.waitForFunction(() => window.location.pathname.includes('/civics'), { timeout: 45_000 }),
      page.getByTestId('complete-onboarding').click(),
    ]);
  });

  test.fixme('completes onboarding with address lookup and representative results', async ({ page }) => {
    const addressResponse = {
      ok: true,
      district: '12',
      state: 'CA',
      county: 'San Francisco',
      normalizedInput: {
        line1: '1 Dr Carlton B Goodlett Pl',
        city: 'San Francisco',
        state: 'CA',
        zip: '94102',
      },
      jurisdiction: {
        state: 'CA',
        district: '12',
        fallback: false,
      },
    };

    const representativesResponse = {
      representatives: [
        {
          id: 201,
          name: 'Jamie Rivera',
          party: 'Independent',
          office: 'House of Representatives',
          level: 'federal',
          state: 'CA',
          district: '12',
        },
        {
          id: 202,
          name: 'Alex Chen',
          party: 'Democratic',
          office: 'Senator',
          level: 'federal',
          state: 'CA',
        },
      ],
    };

    await page.route('**/api/v1/civics/address-lookup', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(addressResponse),
      });
    });

    await page.route('**/api/v1/civics/by-state**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(representativesResponse),
      });
    });

    await page.goto('/onboarding', { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await waitForPageReady(page);
    await page.waitForFunction(
      () => document.documentElement.dataset.onboardingFlowReady === 'true',
      undefined,
      { timeout: 15_000 }
    );

    await page.getByRole('button', { name: 'Get Started' }).click();
    await page.getByTestId('privacy-next').click();

    const addressInput = page.getByLabel(/Enter Your Address/i);
    await addressInput.fill('1 Dr Carlton B Goodlett Pl, San Francisco CA 94102');

    await page
      .getByRole('button', { name: 'Lookup District' })
      .evaluate((button: HTMLButtonElement) => button.form?.requestSubmit());
    await expect(page.getByText(/District Found!/i)).toBeVisible({ timeout: 10_000 });

    await Promise.all([
      page.waitForFunction(() => window.location.pathname.includes('/civics'), { timeout: 45_000 }),
      page.getByTestId('complete-onboarding').click(),
    ]);
  });
});

