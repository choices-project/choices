/**
 * @jest-environment jsdom
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import RegisterPage from '@/features/auth/pages/register/page';
import { mockSupabaseClient } from '@/tests/utils/supabase';

jest.mock('@/features/auth/components/PasskeyButton', () => ({
  PasskeyButton: ({ onSuccess }: { onSuccess?: () => void }) => (
    <button
      type="button"
      data-testid="passkey-register"
      onClick={() => onSuccess?.()}
    >
      Use passkey
    </button>
  ),
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/app/actions/register', () => ({
  register: jest.fn(),
}));

jest.mock('@/features/auth/lib/store', () => ({
  useUserStore: jest.fn(),
}));

jest.mock('@/utils/supabase/client', () => ({
  getSupabaseBrowserClient: jest.fn(),
}));

const mockedNavigation = jest.requireMock('next/navigation') as {
  useRouter: jest.Mock;
};

const mockedRegisterAction = jest.requireMock('@/app/actions/register') as jest.Mocked<
  typeof import('@/app/actions/register')
>;

const mockedAuthStore = jest.requireMock('@/features/auth/lib/store') as {
  useUserStore: jest.Mock;
};

const mockedSupabase = jest.requireMock('@/utils/supabase/client') as {
  getSupabaseBrowserClient: jest.Mock;
};

describe('RegisterPage', () => {
  const routerPush = jest.fn();
  const routerReplace = jest.fn();
  const initializeAuth = jest.fn();
  const setSessionAndDerived = jest.fn();

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    routerPush.mockReset();
    routerReplace.mockReset();
    initializeAuth.mockReset();
    setSessionAndDerived.mockReset();

    mockedNavigation.useRouter.mockReturnValue({
      push: routerPush,
      replace: routerReplace,
    });

    mockedAuthStore.useUserStore.mockImplementation((selector: (state: any) => unknown) =>
      selector({
        initializeAuth,
        setSessionAndDerived,
      }),
    );

    mockedSupabase.getSupabaseBrowserClient.mockResolvedValue(
      mockSupabaseClient({
        session: {
          access_token: 'register-token',
          user: { id: 'registered-user' },
        },
      }) as any,
    );
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('submits password registration and syncs the session', async () => {
    mockedRegisterAction.register.mockResolvedValue({ ok: true });

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    render(<RegisterPage />);

    await user.click(screen.getByRole('button', { name: /Password Account/i }));

    await user.type(screen.getByTestId('username'), 'newuser');
    await user.type(screen.getByTestId('email'), 'newuser@example.com');
    await user.type(screen.getByTestId('password'), 'StrongPass123!');
    await user.type(screen.getByTestId('confirm-password'), 'StrongPass123!');

    await user.click(screen.getByTestId('register-button'));

    await waitFor(() => expect(mockedRegisterAction.register).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(initializeAuth).toHaveBeenCalledWith(
        { id: 'registered-user' },
        expect.objectContaining({ access_token: 'register-token' }),
        true,
      ),
    );
    expect(setSessionAndDerived).toHaveBeenCalledWith(
      expect.objectContaining({ access_token: 'register-token' }),
    );

    jest.runOnlyPendingTimers();
    expect(routerReplace).toHaveBeenCalledWith('/onboarding?step=welcome');
  });

  it('handles passkey registration success', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    render(<RegisterPage />);

    await user.click(screen.getByRole('button', { name: /Use passkey/i }));

    await waitFor(() =>
      expect(initializeAuth).toHaveBeenCalledWith(
        { id: 'registered-user' },
        expect.objectContaining({ access_token: 'register-token' }),
        true,
      ),
    );
    expect(setSessionAndDerived).toHaveBeenCalled();

    jest.runOnlyPendingTimers();
    expect(routerPush).toHaveBeenCalledWith('/onboarding');
  });
});

