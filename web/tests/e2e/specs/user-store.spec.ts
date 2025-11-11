import { expect, test, type Page } from '@playwright/test';

import type { UserStoreHarness } from '@/app/(app)/e2e/user-store/page';

import { waitForPageReady } from '../helpers/e2e-setup';

declare global {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Window {
    __userStoreHarness?: UserStoreHarness;
  }
}

const gotoHarness = async (page: Page) => {
  await page.goto('/e2e/user-store', { waitUntil: 'domcontentloaded', timeout: 45_000 });
  await waitForPageReady(page);
  await page.waitForFunction(
    () => document.documentElement.dataset.userStoreHarness === 'ready',
    undefined,
    { timeout: 45_000 }
  );
};

test.describe('User store harness', () => {
  test('manipulates authentication and profile editing state', async ({ page }) => {
    page.on('console', (msg) => {
      console.log(`[browser:${msg.type()}] ${msg.text()}`);
    });

    await gotoHarness(page);

    const authenticated = page.getByTestId('user-authenticated');
    const userId = page.getByTestId('user-id');
    const sessionToken = page.getByTestId('user-session');
    const profileDisplayName = page.getByTestId('user-profile-display-name');
    const profileEditData = page.getByTestId('user-profile-edit');
    const currentAddress = page.getByTestId('user-current-address');
    const representativeCount = page.getByTestId('user-representatives');

    await expect(authenticated).toHaveText('false');
    await expect(userId).toHaveText('none');

    await page.evaluate(() => {
      window.__userStoreHarness?.setUserAndAuth(
        {
          id: 'user-e2e',
          email: 'user@example.com',
        } as any,
        true
      );
    });

    await expect(authenticated).toHaveText('true');
    await expect(userId).toHaveText('user-e2e');

    await page.evaluate(() => {
      window.__userStoreHarness?.setSession({
        access_token: 'session-token',
      } as any);
    });

    await expect(sessionToken).toHaveText('session-token');

    await page.evaluate(() => {
      window.__userStoreHarness?.setProfile({
        id: 'profile-1',
        username: 'playwright',
        privacy_settings: { shareVotingHistory: false },
      } as any);
    });

    await expect(profileDisplayName).toHaveText('playwright');

    await page.evaluate(() => {
      window.__userStoreHarness?.updateProfileField('display_name', 'Playwright User');
      window.__userStoreHarness?.updateArrayField('primary_concerns', 'climate');
    });

    const parsedEditData = JSON.parse(await profileEditData.textContent() ?? '{}');
    expect(parsedEditData.display_name).toBe('Playwright User');
    expect(parsedEditData.primary_concerns).toEqual(['climate']);

    await page.evaluate(() => {
      const harness = window.__userStoreHarness;
      if (!harness) return;
      const snapshot = harness.getSnapshot();
      snapshot.setCurrentAddress?.('123 Main St');
      snapshot.setRepresentatives?.([{ id: 'rep-1' }] as any);
    });

    await expect(currentAddress).toHaveText('123 Main St');
    await expect(representativeCount).toHaveText('1');

    await page.evaluate(() => {
      window.__userStoreHarness?.clearUser();
    });

    await expect(authenticated).toHaveText('false');
    await expect(userId).toHaveText('none');
    await expect(sessionToken).toHaveText('none');
    const clearedEdit = (await profileEditData.textContent()) ?? '';
    expect(clearedEdit.trim()).toBe('{}');
    await expect(representativeCount).toHaveText('0');
    await expect(currentAddress).toHaveText('none');
  });

  test('derives session state and reinitializes authentication', async ({ page }) => {
    await gotoHarness(page);

    const authenticated = page.getByTestId('user-authenticated');
    const userId = page.getByTestId('user-id');
    const sessionToken = page.getByTestId('user-session');

    await expect(authenticated).toHaveText('false');

    await page.evaluate(() => {
      window.__userStoreHarness?.setSessionAndDerived({
        access_token: 'derived-token',
        user: {
          id: 'derived-user',
          email: 'derived@example.com',
        },
      } as any);
    });

    await expect(authenticated).toHaveText('true');
    await expect(userId).toHaveText('derived-user');
    await expect(sessionToken).toHaveText('derived-token');

    await page.evaluate(() => {
      window.__userStoreHarness?.initializeAuth(null, null, false);
    });

    await expect(authenticated).toHaveText('false');
    await expect(userId).toHaveText('none');
    await expect(sessionToken).toHaveText('none');
  });
});

