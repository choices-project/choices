import { expect, test, type Page } from '@playwright/test';

import type { ProfileStoreHarness } from '@/app/(app)/e2e/profile-store/page';

import { waitForPageReady } from '../helpers/e2e-setup';

declare global {
   
  interface Window {
    __profileStoreHarness?: ProfileStoreHarness;
  }
   
}

const gotoHarness = async (page: Page) => {
  await page.goto('/e2e/profile-store', { waitUntil: 'domcontentloaded' });
  await waitForPageReady(page);
  await page.waitForFunction(() => Boolean(window.__profileStoreHarness));
};

test.describe('Profile store harness', () => {
  test('exposes core state transitions', async ({ page }) => {
    await gotoHarness(page);

    const loaded = page.getByTestId('profile-loaded');
    const displayName = page.getByTestId('profile-display-name');
    const username = page.getByTestId('profile-username');
    const completeness = page.getByTestId('profile-completeness');
    const missingFields = page.getByTestId('profile-missing-fields');
    const preferencesTheme = page.getByTestId('profile-preferences-theme');
    const userPresent = page.getByTestId('profile-user-present');

    await expect(loaded).toHaveText('false');
    await expect(displayName).toHaveText('none');
    await expect(preferencesTheme).toHaveText('none');

    await page.evaluate(() => {
      window.__profileStoreHarness?.setProfile({
        id: 'profile-1',
        display_name: 'Ada Lovelace',
        email: 'ada@example.com'
      } as any);
    });

    await expect(loaded).toHaveText('true');

    await page.evaluate(() => {
      window.__profileStoreHarness?.updateProfileCompleteness();
    });

    await expect(completeness).toHaveText('67');
    await expect(missingFields).toHaveText('username');

    await page.evaluate(() => {
      window.__profileStoreHarness?.setUserProfile({
        id: 'user-1',
        preferences: { theme: 'dark' },
        privacy_settings: { visibility: 'private' }
      } as any);
    });

    await expect(userPresent).toHaveText('true');
    await expect(preferencesTheme).toHaveText('dark');

    await page.evaluate(() => {
      window.__profileStoreHarness?.setProfile({
        id: 'profile-1',
        display_name: 'Ada Lovelace',
        username: 'adalovelace',
        email: 'ada@example.com'
      } as any);
      window.__profileStoreHarness?.updateProfileCompleteness();
    });

    await expect(completeness).toHaveText('100');
    await expect(missingFields).toHaveText('none');
    await expect(username).toHaveText('adalovelace');

    await page.evaluate(() => {
      window.__profileStoreHarness?.resetProfile();
    });

    await expect(loaded).toHaveText('false');
    await expect(displayName).toHaveText('none');
    await expect(preferencesTheme).toHaveText('none');
    await expect(completeness).toHaveText('0');
    await expect(missingFields).toHaveText('none');
  });
});

