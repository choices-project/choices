import type { Page } from '@playwright/test';
import { test } from '@playwright/test';

import { waitForPageReady } from '../helpers/e2e-setup';

const assertAnyVisible = async (page: Page, selectors: string[]) => {
  for (const selector of selectors) {
    const locator = page.locator(selector);
    if (await locator.count()) {
      if (await locator.first().isVisible()) {
        return;
      }
    }
  }
  throw new Error(`None of the expected selectors were visible: ${selectors.join(', ')}`);
};

test.describe('@smoke MVP core pages', () => {
  test('auth page renders @smoke', async ({ page }) => {
    await page.goto('/auth', { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);
    await assertAnyVisible(page, ['[data-testid="login-form"]', 'h1:has-text("Sign In")', 'h1:has-text("Sign Up")']);
  });

  test('onboarding page renders @smoke', async ({ page }) => {
    await page.goto('/onboarding', { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);
    await assertAnyVisible(page, ['[data-testid="onboarding-live-message"]', 'h1']);
  });

  test('polls templates renders @smoke', async ({ page }) => {
    await page.goto('/polls/templates', { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);
    await assertAnyVisible(page, [
      'h1:has-text("Poll Templates")',
      '[data-testid="login-form"]',
      'text=/sign in|log in/i',
      'h1:has-text("Sign In")',
      'h1:has-text("Sign Up")',
    ]);
  });

  test('polls analytics renders or gates @smoke', async ({ page }) => {
    await page.goto('/polls/analytics', { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);
    await assertAnyVisible(page, [
      'h1:has-text("Poll Analytics")',
      'text=Please log in to view poll analytics.',
      'text=No analytics data available yet.',
      '[data-testid="login-form"]',
      'text=/sign in|log in/i',
      'h1:has-text("Sign In")',
    ]);
  });

  test('civics page renders @smoke', async ({ page }) => {
    await page.goto('/civics', { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);
    await assertAnyVisible(page, ['[data-testid="state-filter"]', 'text=No representatives found']);
  });

  test('representatives page renders @smoke', async ({ page }) => {
    await page.goto('/representatives', { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);
    await assertAnyVisible(page, ['h1:has-text("Find Your Representatives")']);
  });

  test('account privacy renders or gates @smoke', async ({ page }) => {
    await page.goto('/account/privacy', { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);
    // Handle both authenticated and unauthenticated states
    await assertAnyVisible(page, [
      'h1:has-text("Privacy & Data")',
      'text=Please log in to manage your privacy settings.',
      '[data-testid="login-form"]',
      'text=/log in|sign in/i',
    ]);
  });

  test('account export renders or gates @smoke', async ({ page }) => {
    await page.goto('/account/export', { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);
    await assertAnyVisible(page, [
      'h1:has-text("Data Export")',
      'text=Please log in to access this page.',
      '[data-testid="login-form"]',
      'text=/sign in|log in/i',
      'h1:has-text("Sign In")',
    ]);
  });

  test('account delete renders or gates @smoke', async ({ page }) => {
    await page.goto('/account/delete', { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);
    await assertAnyVisible(page, [
      'h1:has-text("Delete Account")',
      'h1:has-text("Account Deletion")',
      'text=Please log in to access this page.',
      '[data-testid="login-form"]',
      'text=Loading your account data...',
      'text=Failed to load user data',
    ]);
  });

  test('profile edit renders or gates @smoke', async ({ page }) => {
    await page.goto('/profile/edit', { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);
    await assertAnyVisible(page, [
      '[data-testid="profile-edit-page"]',
      '[data-testid="profile-edit-loading"]',
      'text=We couldn’t load your profile.',
      '[data-testid="login-form"]',
    ]);
  });

  test('biometric setup renders or gates @smoke', async ({ page }) => {
    await page.goto('/profile/biometric-setup', { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);
    await assertAnyVisible(page, [
      'h1:has-text("Set Up Biometric Authentication")',
      'text=Biometric Authentication Not Supported',
      '[data-testid="login-form"]',
      'text=/sign in|log in/i',
      'h1:has-text("Sign In")',
    ]);
  });
});
