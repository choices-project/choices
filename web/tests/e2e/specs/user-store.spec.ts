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
      harness.setCurrentAddress('123 Main St');
      harness.setRepresentatives([{ id: 'rep-1' }] as any);
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

  test('handles biometric/passkey state transitions', async ({ page }) => {
    await gotoHarness(page);

    const supported = page.getByTestId('user-biometric-supported');
    const available = page.getByTestId('user-biometric-available');
    const credentials = page.getByTestId('user-biometric-credentials');
    const registering = page.getByTestId('user-biometric-registering');
    const success = page.getByTestId('user-biometric-success');
    const error = page.getByTestId('user-biometric-error');

    await expect(supported).toHaveText('none');
    await expect(available).toHaveText('none');
    await expect(credentials).toHaveText('none');
    await expect(registering).toHaveText('false');
    await expect(success).toHaveText('false');
    await expect(error).toHaveText('none');

    await page.evaluate(() => {
      const harness = window.__userStoreHarness;
      if (!harness) return;
      harness.setBiometricSupported(true);
      harness.setBiometricAvailable(true);
      harness.setBiometricCredentials(false);
      harness.setBiometricRegistering(true);
    });

    await expect(supported).toHaveText('true');
    await expect(available).toHaveText('true');
    await expect(credentials).toHaveText('false');
    await expect(registering).toHaveText('true');

    await page.evaluate(() => {
      const harness = window.__userStoreHarness;
      if (!harness) return;
      harness.setBiometricSuccess(true);
      harness.setBiometricError(null);
      harness.setBiometricCredentials(true);
      harness.setBiometricRegistering(false);
    });

    await expect(success).toHaveText('true');
    await expect(error).toHaveText('none');
    await expect(credentials).toHaveText('true');
    await expect(registering).toHaveText('false');

    await page.evaluate(() => {
      window.__userStoreHarness?.setBiometricError('Hardware failure');
      window.__userStoreHarness?.setBiometricSuccess(false);
    });

    await expect(error).toHaveText('Hardware failure');
    await expect(success).toHaveText('false');

    await page.evaluate(() => {
      window.__userStoreHarness?.resetBiometric();
    });

    await expect(supported).toHaveText('none');
    await expect(available).toHaveText('none');
    await expect(credentials).toHaveText('none');
    await expect(registering).toHaveText('false');
    await expect(success).toHaveText('false');
    await expect(error).toHaveText('none');
  });
});

