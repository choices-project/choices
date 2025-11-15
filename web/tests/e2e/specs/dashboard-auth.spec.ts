import { expect, test } from '@playwright/test';

import {
  ensureLoggedOut,
  setupExternalAPIMocks,
  waitForPageReady,
} from '../helpers/e2e-setup';
import { createInitialUserState } from '../../../lib/stores/userStore';
import { createInitialProfileState } from '../../../lib/stores/profileStore';
import { createInitialAdminState } from '../../../lib/stores/adminStore';

const AUTHSPEC_TIMEOUT = 30_000;

test.describe('@mocks dashboard auth experience', () => {
  let cleanupMocks: (() => Promise<void>) | undefined;

  test.beforeEach(async ({ page }, testInfo) => {
    cleanupMocks = await setupExternalAPIMocks(page, {
      auth: true,
      analytics: true,
      notifications: true,
      feeds: true,
      civics: true,
    });

    await testInfo.attach('cleanup-mocks', {
      contentType: 'application/json',
      body: JSON.stringify({ attached: true }),
    });

    await ensureLoggedOut(page);
  });

  test.afterEach(async () => {
    if (cleanupMocks) {
      await cleanupMocks();
      cleanupMocks = undefined;
    }
  });

  test('guest redirect and logout cascades profile/admin state', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: AUTHSPEC_TIMEOUT });
    await page.waitForURL(/\/auth/, { timeout: AUTHSPEC_TIMEOUT });

    const authedUserState = createInitialUserState();
    authedUserState.user = {
      id: 'user-123',
      email: 'authed-user@example.com',
    } as any;
    authedUserState.session = {
      access_token: 'mock-auth-token',
      user: { id: 'user-123', email: 'authed-user@example.com' },
    } as any;
    authedUserState.isAuthenticated = true;
    authedUserState.profile = {
      id: 'profile-123',
      user_id: 'user-123',
      username: 'Authed User',
      email: 'authed-user@example.com',
    } as any;

    const authedProfileState = createInitialProfileState();
    authedProfileState.profile = {
      id: 'profile-123',
      user_id: 'user-123',
      username: 'Authed User',
      email: 'authed-user@example.com',
    } as any;
    authedProfileState.userProfile = authedProfileState.profile;
    authedProfileState.isProfileLoaded = true;
    authedProfileState.isProfileComplete = true;
    authedProfileState.preferences = {
      dashboard: {
        showQuickActions: true,
        showElectedOfficials: true,
        showRecentActivity: true,
        showEngagementScore: true,
      },
    } as any;
    authedProfileState.privacySettings = {
      shareVotingHistory: false,
    } as any;

    const authedAdminState = createInitialAdminState();
    authedAdminState.activeTab = 'users';
    authedAdminState.userFilters = {
      ...authedAdminState.userFilters,
      showBulkActions: true,
      selectedUsers: ['user-123'],
    };

    await page.addInitScript(
      ({ user, profile, admin }) => {
        localStorage.setItem('user-store', JSON.stringify({ state: user, version: 0 }));
        localStorage.setItem('profile-store', JSON.stringify({ state: profile, version: 0 }));
        localStorage.setItem('admin-store', JSON.stringify({ state: admin, version: 0 }));
      },
      {
        user: authedUserState,
        profile: authedProfileState,
        admin: authedAdminState,
      },
    );

    await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: AUTHSPEC_TIMEOUT });
    await waitForPageReady(page, AUTHSPEC_TIMEOUT);

    await expect(page.locator('[data-testid="personal-dashboard"]')).toBeVisible({
      timeout: AUTHSPEC_TIMEOUT,
    });

    const logoutButton = page.getByRole('button', { name: /logout/i });
    await logoutButton.click();
    await page.waitForURL(/\/(login|auth)/, { timeout: AUTHSPEC_TIMEOUT });

    const persistedState = await page.evaluate(() => ({
      user: localStorage.getItem('user-store'),
      profile: localStorage.getItem('profile-store'),
      admin: localStorage.getItem('admin-store'),
    }));

    const parsedUser = JSON.parse(persistedState.user ?? '{"state":{}}');
    const parsedProfile = JSON.parse(persistedState.profile ?? '{"state":{}}');
    const parsedAdmin = JSON.parse(persistedState.admin ?? '{"state":{}}');

    expect(parsedUser.state?.isAuthenticated ?? false).toBe(false);
    expect(parsedUser.state?.user).toBeNull();
    expect(parsedProfile.state?.profile).toBeNull();
    expect(parsedProfile.state?.userProfile).toBeNull();
    expect(parsedAdmin.state?.activeTab).toBe('overview');
  });
});

