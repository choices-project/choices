/* eslint-disable boundaries/element-types */
/**
 * @jest-environment jsdom
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import AuthPage from '@/app/auth/page';
import { mockSupabaseClient } from '@/tests/utils/supabase';

jest.mock('@/features/auth/components/PasskeyControls', () => ({
  __esModule: true,
  default: () => <div data-testid="passkey-controls" />,
}));

jest.mock('next/dynamic', () => () => () => <div data-testid="passkey-controls" />);

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/features/auth/lib/api', () => ({
  loginWithPassword: jest.fn(),
  registerUser: jest.fn(),
}));

jest.mock('@/features/auth/lib/store', () => ({
  useUserError: jest.fn(),
  useUserLoading: jest.fn(),
  useUserActions: jest.fn(),
  useUserStore: jest.fn(),
  useInitializeBiometricState: jest.fn(),
}));

jest.mock('@/hooks/useI18n', () => ({
  useI18n: jest.fn(),
}));

jest.mock('@/utils/supabase/client', () => ({
  getSupabaseBrowserClient: jest.fn(),
}));

const mockedNavigation = jest.requireMock('next/navigation') as {
  useRouter: jest.Mock;
};

const mockedApi = jest.requireMock('@/features/auth/lib/api') as jest.Mocked<
  typeof import('@/features/auth/lib/api')
>;

const mockedAuthStore = jest.requireMock('@/features/auth/lib/store') as {
  useUserError: jest.Mock;
  useUserLoading: jest.Mock;
  useUserActions: jest.Mock;
  useUserStore: jest.Mock;
  useInitializeBiometricState: jest.Mock;
};

const mockedI18n = jest.requireMock('@/hooks/useI18n') as {
  useI18n: jest.Mock;
};

const mockedSupabase = jest.requireMock('@/utils/supabase/client') as {
  getSupabaseBrowserClient: jest.Mock;
};

describe('AuthPage', () => {
  const setLoading = jest.fn();
  const setError = jest.fn();
  const clearError = jest.fn();
  const initializeAuth = jest.fn();
  const setSessionAndDerived = jest.fn();
  const routerPush = jest.fn();
  const routerReplace = jest.fn();

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    setLoading.mockReset();
    setError.mockReset();
    clearError.mockReset();
    initializeAuth.mockReset();
    setSessionAndDerived.mockReset();
    routerPush.mockReset();
    routerReplace.mockReset();

    mockedAuthStore.useUserError.mockReturnValue(null);
    mockedAuthStore.useUserLoading.mockReturnValue(false);
    mockedAuthStore.useUserActions.mockReturnValue({
      setLoading,
      setError,
      clearError,
    });
    mockedAuthStore.useUserStore.mockImplementation((selector: (state: any) => unknown) =>
      selector({
        initializeAuth,
        setSessionAndDerived,
      }),
    );
    mockedAuthStore.useInitializeBiometricState.mockReturnValue(undefined);

    mockedNavigation.useRouter.mockReturnValue({
      push: routerPush,
      replace: routerReplace,
    });

    mockedI18n.useI18n.mockReturnValue({
      t: (key: string) => {
        const dictionary: Record<string, string> = {
          'auth.toggle.toSignUp': 'Create account',
          'auth.toggle.toSignIn': 'Already have an account? Sign in',
          'auth.form.displayNameLabel': 'Display name',
          'auth.form.displayNamePlaceholder': 'Your display name',
          'auth.form.displayNameAria': 'Display name',
          'auth.form.emailLabel': 'Email',
          'auth.form.emailPlaceholder': 'Enter email',
          'auth.form.emailAria': 'Email',
          'auth.form.passwordLabel': 'Password',
          'auth.form.passwordPlaceholder': 'Enter password',
          'auth.form.passwordAria': 'Password',
          'auth.form.confirmPasswordLabel': 'Confirm password',
          'auth.form.confirmPasswordAria': 'Confirm password',
          'auth.form.submit.signUp': 'Create account',
          'auth.form.submit.signIn': 'Sign in',
          'auth.form.working': 'Working…',
          'auth.success.accountCreated': 'Account created!',
          'auth.success.login': 'Logged in!',
          'auth.errors.passwordRequired': 'Password required',
          'auth.errors.loginFailed': 'Login failed',
          'auth.errors.unexpected': 'Unexpected error',
        };
        return dictionary[key] ?? key;
      },
    });

    mockedSupabase.getSupabaseBrowserClient.mockResolvedValue(
      mockSupabaseClient({
        session: {
          access_token: 'token',
          user: { id: 'session-user' },
        },
      }) as any,
    );
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('registers a new user and synchronizes the session', async () => {
    mockedApi.registerUser.mockResolvedValue({ ok: true });

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    render(<AuthPage />);

    await user.click(screen.getByTestId('auth-toggle'));

    await user.type(screen.getByTestId('auth-display-name'), 'Test User');
    await user.type(screen.getByTestId('login-email'), 'new-user@example.com');
    await user.type(screen.getByTestId('login-password'), 'StrongPass123!');
    await user.type(screen.getByTestId('auth-confirm-password'), 'StrongPass123!');

    await user.click(screen.getByTestId('login-submit'));

    await waitFor(() => expect(mockedApi.registerUser).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(initializeAuth).toHaveBeenCalledWith(
        { id: 'session-user' },
        expect.objectContaining({ access_token: 'token' }),
        true,
      ),
    );
    expect(setSessionAndDerived).toHaveBeenCalledWith(
      expect.objectContaining({ access_token: 'token' }),
    );

    jest.runOnlyPendingTimers();

    expect(routerPush).toHaveBeenCalledWith('/onboarding');
    expect(setLoading).toHaveBeenCalledWith(true);
    expect(setLoading).toHaveBeenCalledWith(false);
  });

  it('surfaces an error when login fails', async () => {
    mockedApi.loginWithPassword.mockRejectedValue(new Error('Invalid credentials'));

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    render(<AuthPage />);

    await user.type(screen.getByTestId('login-email'), 'user@example.com');
    await user.type(screen.getByTestId('login-password'), 'WrongPass!');

    await user.click(screen.getByTestId('login-submit'));

    await waitFor(() => expect(setError).toHaveBeenCalledWith('Invalid credentials'));
  });
});

/* eslint-enable boundaries/element-types */
