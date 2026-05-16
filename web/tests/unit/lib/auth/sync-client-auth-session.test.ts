/**
 * @jest-environment jsdom
 */

import { useUserStore } from '@/lib/stores/userStore';
import { syncClientAuthSession } from '@/lib/auth/sync-client-auth-session';

import type { Session } from '@supabase/supabase-js';

const mockSession = {
  access_token: 'at',
  refresh_token: 'rt',
  expires_in: 3600,
  token_type: 'bearer',
  user: {
    id: 'user-1',
    email: 'test@example.com',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: '2020-01-01T00:00:00Z',
  },
} as Session;

describe('syncClientAuthSession', () => {
  beforeEach(() => {
    useUserStore.getState().signOut();
    useUserStore.getState().setLoading(true);
  });

  it('marks the user store authenticated and clears loading', () => {
    syncClientAuthSession(mockSession);

    const state = useUserStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user?.id).toBe('user-1');
    expect(state.session).toBe(mockSession);
    expect(state.isLoading).toBe(false);
  });
});
