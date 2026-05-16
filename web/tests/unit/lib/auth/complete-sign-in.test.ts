/**
 * @jest-environment jsdom
 */

import { completeSignIn } from '@/lib/auth/complete-sign-in';
import { useUserStore } from '@/lib/stores/userStore';

import type { Session } from '@supabase/supabase-js';

const mockSession = {
  access_token: 'at',
  refresh_token: 'rt',
  expires_in: 3600,
  token_type: 'bearer',
  user: {
    id: 'user-oauth',
    email: 'oauth@example.com',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: '2020-01-01T00:00:00Z',
  },
} as Session;

jest.mock('@/lib/auth/browser-session', () => ({
  hydrateBrowserSessionFromServer: jest.fn(),
  applySessionTokensToBrowser: jest.fn(),
}));

jest.mock('@/lib/auth/post-auth-navigation', () => ({
  navigateAfterAuth: jest.fn(),
}));

const { hydrateBrowserSessionFromServer } = jest.requireMock(
  '@/lib/auth/browser-session',
) as { hydrateBrowserSessionFromServer: jest.Mock };
const { navigateAfterAuth } = jest.requireMock(
  '@/lib/auth/post-auth-navigation',
) as { navigateAfterAuth: jest.Mock };

describe('completeSignIn', () => {
  beforeEach(() => {
    useUserStore.getState().signOut();
    hydrateBrowserSessionFromServer.mockReset();
    navigateAfterAuth.mockReset();
  });

  it('syncs the user store before navigating after OAuth hydration', async () => {
    hydrateBrowserSessionFromServer.mockResolvedValue(mockSession);

    const ok = await completeSignIn('/feed');

    expect(ok).toBe(true);
    expect(useUserStore.getState().isAuthenticated).toBe(true);
    expect(useUserStore.getState().user?.id).toBe('user-oauth');
    expect(navigateAfterAuth).toHaveBeenCalledWith('/feed');
  });

  it('returns false when hydration fails', async () => {
    hydrateBrowserSessionFromServer.mockResolvedValue(null);

    const ok = await completeSignIn('/feed');

    expect(ok).toBe(false);
    expect(useUserStore.getState().isAuthenticated).toBe(false);
    expect(navigateAfterAuth).not.toHaveBeenCalled();
  });
});
