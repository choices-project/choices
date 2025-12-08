import { expect, test, type Page } from '@playwright/test';

import type { UserStoreHarness } from '@/app/(app)/e2e/user-store/page';

import { waitForPageReady } from '../helpers/e2e-setup';

declare global {
   
  interface Window {
    __userStoreHarness?: UserStoreHarness;
  }
}

const HARNESS_TIMEOUT = 90_000;

const gotoHarness = async (page: Page) => {
  await page.goto('/e2e/user-store', { waitUntil: 'domcontentloaded', timeout: HARNESS_TIMEOUT });
  await waitForPageReady(page);
  await page.waitForFunction(() => Boolean(window.__userStoreHarness));
  await page.waitForFunction(
    () => document.documentElement.dataset.userStoreHarness === 'ready',
    undefined,
    { timeout: HARNESS_TIMEOUT }
  );
};

test.describe('User Store E2E', () => {
  test.beforeEach(async ({ page }) => {
    await gotoHarness(page);
  });

  test('harness exposes user store API', async ({ page }) => {
    const harness = await page.evaluate(() => window.__userStoreHarness);
    expect(harness).toBeDefined();
    expect(harness?.setUser).toBeDefined();
    expect(harness?.setSession).toBeDefined();
    expect(harness?.signOut).toBeDefined();
    expect(harness?.setProfile).toBeDefined();
    expect(harness?.getSnapshot).toBeDefined();
  });

  test('manages user and session state', async ({ page }) => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      created_at: new Date().toISOString(),
    };

    const mockSession = {
      access_token: 'token-123',
      refresh_token: 'refresh-123',
      expires_in: 3600,
      expires_at: Date.now() / 1000 + 3600,
    };

    await page.evaluate((user, session) => {
      window.__userStoreHarness?.setUserAndAuth(user, session);
    }, mockUser, mockSession);

    const snapshot = await page.evaluate(() => {
      const harness = window.__userStoreHarness;
      return harness?.getSnapshot();
    });

    expect(snapshot?.user?.id).toBe('user-123');
    expect(snapshot?.isAuthenticated).toBe(true);
  });

  test('manages user profile', async ({ page }) => {
    const mockProfile = {
      id: 'profile-123',
      user_id: 'user-123',
      display_name: 'Test User',
      bio: 'Test bio',
    };

    await page.evaluate((profile) => {
      window.__userStoreHarness?.setProfile(profile);
    }, mockProfile);

    const snapshot = await page.evaluate(() => {
      const harness = window.__userStoreHarness;
      return harness?.getSnapshot();
    });

    expect(snapshot?.profile?.display_name).toBe('Test User');
  });

  test('signs out user', async ({ page }) => {
    // Set user first
    await page.evaluate(() => {
      window.__userStoreHarness?.setUserAndAuth(
        { id: 'user-123', email: 'test@example.com', created_at: new Date().toISOString() },
        { access_token: 'token', refresh_token: 'refresh', expires_in: 3600, expires_at: Date.now() / 1000 + 3600 }
      );
    });

    await page.evaluate(() => {
      window.__userStoreHarness?.signOut();
    });

    const snapshot = await page.evaluate(() => {
      const harness = window.__userStoreHarness;
      return harness?.getSnapshot();
    });

    expect(snapshot?.user).toBeNull();
    expect(snapshot?.isAuthenticated).toBe(false);
    expect(snapshot?.session).toBeNull();
  });

  test('manages profile edit errors', async ({ page }) => {
    await page.evaluate(() => {
      window.__userStoreHarness?.setProfileEditError('display_name', 'Display name is required');
    });

    const snapshot = await page.evaluate(() => {
      const harness = window.__userStoreHarness;
      return harness?.getSnapshot();
    });

    expect(snapshot?.profileEditErrors?.display_name).toBe('Display name is required');

    await page.evaluate(() => {
      window.__userStoreHarness?.clearProfileEditError('display_name');
    });

    const updatedSnapshot = await page.evaluate(() => {
      const harness = window.__userStoreHarness;
      return harness?.getSnapshot();
    });

    expect(updatedSnapshot?.profileEditErrors?.display_name).toBeUndefined();
  });

  test('manages biometric state', async ({ page }) => {
    await page.evaluate(() => {
      window.__userStoreHarness?.setBiometricSupported(true);
      window.__userStoreHarness?.setBiometricAvailable(true);
    });

    const snapshot = await page.evaluate(() => {
      const harness = window.__userStoreHarness;
      return harness?.getSnapshot();
    });

    expect(snapshot?.biometricSupported).toBe(true);
    expect(snapshot?.biometricAvailable).toBe(true);

    await page.evaluate(() => {
      window.__userStoreHarness?.resetBiometric();
    });

    const resetSnapshot = await page.evaluate(() => {
      const harness = window.__userStoreHarness;
      return harness?.getSnapshot();
    });

    expect(resetSnapshot?.biometricSupported).toBe(false);
    expect(resetSnapshot?.biometricAvailable).toBe(false);
  });

  test('clears user state', async ({ page }) => {
    // Set user and profile first
    await page.evaluate(() => {
      window.__userStoreHarness?.setUserAndAuth(
        { id: 'user-123', email: 'test@example.com', created_at: new Date().toISOString() },
        { access_token: 'token', refresh_token: 'refresh', expires_in: 3600, expires_at: Date.now() / 1000 + 3600 }
      );
      window.__userStoreHarness?.setProfile({
        id: 'profile-123',
        user_id: 'user-123',
        display_name: 'Test User',
      });
    });

    await page.evaluate(() => {
      window.__userStoreHarness?.clearUser();
    });

    const snapshot = await page.evaluate(() => {
      const harness = window.__userStoreHarness;
      return harness?.getSnapshot();
    });

    expect(snapshot?.user).toBeNull();
    expect(snapshot?.profile).toBeNull();
    expect(snapshot?.isAuthenticated).toBe(false);
  });
});
