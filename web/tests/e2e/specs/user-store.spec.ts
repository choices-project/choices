import { expect, test, type Page } from '@playwright/test';

import type { UserStoreHarness } from '@/app/(app)/e2e/user-store/page';

import { waitForPageReady } from '../helpers/e2e-setup';

declare global {
  interface Window {
    __userStoreHarness?: UserStoreHarness;
  }
}

const gotoHarness = async (page: Page) => {
  await page.goto('/e2e/user-store', { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await waitForPageReady(page);
  await page.waitForFunction(() => Boolean(window.__userStoreHarness), { timeout: 60_000 });
  // Wait for harness ready attribute, but don't fail if it's not set (persistence might not hydrate in test env)
  try {
    await page.waitForFunction(
      () => document.documentElement.dataset.userStoreHarness === 'ready',
      { timeout: 30_000 },
    );
  } catch {
    // If dataset attribute isn't set, that's okay - harness is still available
    console.warn('User store harness ready attribute not set, but harness is available');
  }
};

test.describe('User Store E2E', () => {
  test.beforeEach(async ({ page }) => {
    await gotoHarness(page);
  });

  test('harness exposes user store API', async ({ page }) => {
    // Check harness exists
    const harnessExists = await page.evaluate(() => Boolean(window.__userStoreHarness));
    expect(harnessExists).toBe(true);

    // Check methods exist in page context (functions can't be serialized through evaluate)
    await page.waitForFunction(() => typeof window.__userStoreHarness?.setUser === 'function');
    await page.waitForFunction(() => typeof window.__userStoreHarness?.setSession === 'function');
    await page.waitForFunction(() => typeof window.__userStoreHarness?.signOut === 'function');
    await page.waitForFunction(() => typeof window.__userStoreHarness?.setProfile === 'function');
    await page.waitForFunction(() => typeof window.__userStoreHarness?.getSnapshot === 'function');
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

    await page.evaluate(
      (data: { user: any; session: any }) => {
        const harness = window.__userStoreHarness;
        if (harness && harness.initializeAuth) {
          // Use initializeAuth which accepts both user and session
          (harness.initializeAuth as (user: any, session: any, authenticated: boolean) => void)(data.user, data.session, true);
        }
      },
      { user: mockUser, session: mockSession }
    );

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
    } as any; // Partial profile for testing

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
      const mockUser = { id: 'user-123', email: 'test@example.com', created_at: new Date().toISOString() } as any;
      const mockSession = { access_token: 'token', refresh_token: 'refresh', expires_in: 3600, expires_at: Date.now() / 1000 + 3600 } as any;
      window.__userStoreHarness?.initializeAuth(mockUser, mockSession, true);
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

    expect(snapshot?.biometric?.isSupported).toBe(true);
    expect(snapshot?.biometric?.isAvailable).toBe(true);

    await page.evaluate(() => {
      window.__userStoreHarness?.resetBiometric();
    });

    const resetSnapshot = await page.evaluate(() => {
      const harness = window.__userStoreHarness;
      return harness?.getSnapshot();
    });

    expect(resetSnapshot?.biometric?.isSupported).toBe(false);
    expect(resetSnapshot?.biometric?.isAvailable).toBe(false);
  });

  test('clears user state', async ({ page }) => {
    // Set user and profile first
    await page.evaluate(() => {
      const mockUser = { id: 'user-123', email: 'test@example.com', created_at: new Date().toISOString() } as any;
      const mockSession = { access_token: 'token', refresh_token: 'refresh', expires_in: 3600, expires_at: Date.now() / 1000 + 3600 } as any;
      window.__userStoreHarness?.initializeAuth(mockUser, mockSession, true);
      window.__userStoreHarness?.setProfile({
        id: 'profile-123',
        user_id: 'user-123',
        display_name: 'Test User',
      } as any);
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
