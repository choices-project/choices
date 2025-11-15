/**
 * @jest-environment jsdom
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import AuthSetupStep from '@/features/onboarding/components/AuthSetupStep';
import { mockSupabaseClient } from '@/tests/utils/supabase';

jest.mock('@/features/auth/components/PasskeyButton', () => ({
  PasskeyButton: ({ onSuccess }: { onSuccess?: () => void }) => (
    <button type="button" data-testid="passkey-setup" onClick={() => onSuccess?.()}>
      Register passkey
    </button>
  ),
}));

jest.mock('@/lib/stores', () => ({
  useUserActions: jest.fn(),
  useUserError: jest.fn(),
  useUserLoading: jest.fn(),
  useUserStore: jest.fn(),
}));

jest.mock('@/utils/supabase/client', () => ({
  getSupabaseBrowserClient: jest.fn(),
}));

const mockedStores = jest.requireMock('@/lib/stores') as {
  useUserActions: jest.Mock;
  useUserError: jest.Mock;
  useUserLoading: jest.Mock;
  useUserStore: jest.Mock;
};

const mockedSupabase = jest.requireMock('@/utils/supabase/client') as {
  getSupabaseBrowserClient: jest.Mock;
};

describe('AuthSetupStep', () => {
  const setLoading = jest.fn();
  const setError = jest.fn();
  const clearError = jest.fn();
  const onUpdate = jest.fn();
  const onNext = jest.fn();
  const onBack = jest.fn();
  const initializeAuth = jest.fn();
  const setSessionAndDerived = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    setLoading.mockReset();
    setError.mockReset();
    clearError.mockReset();
    onUpdate.mockReset();
    onNext.mockReset();
    onBack.mockReset();
    initializeAuth.mockReset();
    setSessionAndDerived.mockReset();

    mockedStores.useUserActions.mockReturnValue({
      setLoading,
      setError,
      clearError,
      signOut: jest.fn(),
    });
    mockedStores.useUserError.mockReturnValue(null);
    mockedStores.useUserLoading.mockReturnValue(false);
    mockedStores.useUserStore.mockImplementation((selector: (state: any) => unknown) =>
      selector({
        initializeAuth,
        setSessionAndDerived,
      }),
    );

    mockedSupabase.getSupabaseBrowserClient.mockResolvedValue(
      mockSupabaseClient({
        session: {
          access_token: 'onboarding-token',
          user: { id: 'onboarding-user' },
        },
      }) as any,
    );
  });

  const renderStep = () =>
    render(
      <AuthSetupStep
        data={undefined}
        onUpdate={onUpdate}
        onNext={onNext}
        onBack={onBack}
        forceInteractive
      />,
    );

  it('sends email login link and marks auth setup as complete', async () => {
    const user = userEvent.setup();

    renderStep();

    await user.click(screen.getByRole('button', { name: /Select Email/i }));
    await user.click(screen.getByRole('button', { name: /^Continue with Email/ }));

    const emailField = screen.getByLabelText(/Email Address/i);
    await user.type(emailField, 'otp-user@example.com');

    await user.click(screen.getByRole('button', { name: /Send Login Link/i }));

    await waitFor(() => expect(setLoading).toHaveBeenCalledWith(true));
    await waitFor(() =>
      expect(onUpdate).toHaveBeenCalledWith({
        email: 'otp-user@example.com',
        authMethod: 'email',
        authSetupCompleted: true,
      }),
    );
    await waitFor(() =>
      expect(initializeAuth).toHaveBeenCalledWith(
        { id: 'onboarding-user' },
        expect.objectContaining({ access_token: 'onboarding-token' }),
        true,
      ),
    );
  });

  it('handles passkey success and synchronizes the session', async () => {
    const user = userEvent.setup();

    renderStep();

    await user.click(screen.getByRole('button', { name: /Select Passkey/i }));
    await user.click(screen.getByRole('button', { name: /^Continue with Passkey/ }));

    await user.click(screen.getByTestId('passkey-setup'));

    await waitFor(() =>
      expect(initializeAuth).toHaveBeenCalledWith(
        { id: 'onboarding-user' },
        expect.objectContaining({ access_token: 'onboarding-token' }),
        true,
      ),
    );
    expect(onUpdate).toHaveBeenCalledWith({
      authMethod: 'webauthn',
      authSetupCompleted: true,
    });
  });

  it('anonymous option clears auth state and proceeds', async () => {
    const user = userEvent.setup();

    renderStep();

    await user.click(screen.getByRole('button', { name: /Select Anonymous/i }));
    await user.click(screen.getByRole('button', { name: /^Continue with Anonymous/ }));

    await waitFor(() =>
      expect(onUpdate).toHaveBeenCalledWith({
        authMethod: 'anonymous',
        authSetupCompleted: true,
      }),
    );
    expect(initializeAuth).toHaveBeenCalledWith(null, null, false);
    expect(onNext).toHaveBeenCalled();
  });
});

