import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { useUserStore } from '@/lib/stores/userStore';
import { getSupabaseBrowserClient } from '@/utils/supabase/client';

jest.mock('@/utils/supabase/client', () => ({
  getSupabaseBrowserClient: jest.fn(),
}));

type SupabaseMock = {
  auth: {
    getSession: jest.Mock;
    onAuthStateChange: jest.Mock;
    signOut?: jest.Mock;
  };
  from: jest.Mock;
};

const createSupabaseMock = (): SupabaseMock => {
  const single = jest.fn().mockResolvedValue({
    data: {
      id: 'profile-123',
      user_id: 'user-123',
      username: 'tester',
    },
    error: null,
  });

  const eq = jest.fn().mockReturnValue({ single });
  const select = jest.fn().mockReturnValue({ eq, single });

  return {
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: {
          session: {
            access_token: 'token',
            user: {
              id: 'user-123',
              email: 'auth@example.com',
            },
          },
        },
      }),
      onAuthStateChange: jest.fn().mockReturnValue({
        data: {
          subscription: { unsubscribe: jest.fn() },
        },
      }),
    },
    from: jest.fn().mockReturnValue({
      select,
      eq,
      single,
    }),
  };
};

const TestConsumer = () => {
  const { user, session, loading } = useAuth();
  return (
    <div>
      <div data-testid="auth-loading">{String(loading)}</div>
      <div data-testid="auth-user-email">{user?.email ?? 'none'}</div>
      <div data-testid="auth-session-token">{session?.access_token ?? 'none'}</div>
    </div>
  );
};

const LogoutConsumer = () => {
  const { signOut } = useAuth();
  return (
    <button type="button" onClick={() => void signOut()} data-testid="auth-signout">
      Sign Out
    </button>
  );
};

describe('AuthProvider', () => {
  const mockedGetSupabaseBrowserClient = jest.mocked(getSupabaseBrowserClient);

  beforeEach(() => {
    jest.clearAllMocks();
    useUserStore.getState().signOut();
  });

  it('hydrates session and profile data', async () => {
    const supabaseMock = createSupabaseMock();
    mockedGetSupabaseBrowserClient.mockResolvedValue(supabaseMock as any);

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('auth-loading')).toHaveTextContent('false'));

    expect(screen.getByTestId('auth-user-email')).toHaveTextContent('auth@example.com');
    expect(screen.getByTestId('auth-session-token')).toHaveTextContent('token');

    const profile = useUserStore.getState().profile;
    expect(profile?.username).toBe('tester');
  });

  it('signOut clears the store state', async () => {
    const supabaseMock = createSupabaseMock();
    supabaseMock.auth.signOut = jest.fn().mockResolvedValue({ error: null });
    mockedGetSupabaseBrowserClient.mockResolvedValue(supabaseMock as any);

    render(
      <AuthProvider>
        <LogoutConsumer />
      </AuthProvider>,
    );

    await waitFor(() => expect(supabaseMock.auth.getSession).toHaveBeenCalled());

    await userEvent.click(screen.getByTestId('auth-signout'));

    await waitFor(() => {
      const state = useUserStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.session).toBeNull();
    });
  });
});


