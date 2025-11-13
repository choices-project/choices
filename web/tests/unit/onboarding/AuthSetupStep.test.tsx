import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import AuthSetupStep from '@/features/onboarding/components/AuthSetupStep';
import { createInitialUserState, useUserStore } from '@/lib/stores/userStore';

jest.mock('@/utils/supabase/client', () => ({
  getSupabaseBrowserClient: jest.fn(),
}));

jest.mock('@/features/auth/components/PasskeyButton', () => ({
  __esModule: true,
  PasskeyButton: ({
    onSuccess,
    className,
  }: {
    onSuccess?: () => void;
    className?: string;
  }) => (
    <button
      type="button"
      data-testid="mock-passkey-button"
      className={className}
      onClick={() => onSuccess?.()}
    >
      Register Passkey
    </button>
  ),
}));

const { getSupabaseBrowserClient } = require('@/utils/supabase/client') as {
  getSupabaseBrowserClient: jest.Mock;
};

const resetUserStore = () => {
  useUserStore.setState(createInitialUserState());
};

describe('AuthSetupStep', () => {
  const onUpdate = jest.fn();
  const onNext = jest.fn();
  const onBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    resetUserStore();
  });

  const renderComponent = () =>
    render(
      <AuthSetupStep
        data={{}}
        onUpdate={onUpdate}
        onNext={onNext}
        onBack={onBack}
        forceInteractive
      />,
    );

  it('sends email login link and marks success', async () => {
    const supabaseMock = {
      auth: {
        signInWithOtp: jest.fn().mockResolvedValue({ error: null }),
      },
    };
    getSupabaseBrowserClient.mockResolvedValue(supabaseMock);

    renderComponent();

    const user = userEvent.setup();

    const continueEmail = await screen.findByRole('button', { name: /Continue with Email/i });
    await user.click(continueEmail);

    const emailField = screen.getByLabelText(/Email Address/i);
    await user.type(emailField, 'auth@example.com');

    await user.click(screen.getByRole('button', { name: /Send Login Link/i }));

    await waitFor(() => {
      expect(supabaseMock.auth.signInWithOtp).toHaveBeenCalledWith({
        email: 'auth@example.com',
        options: expect.objectContaining({
          emailRedirectTo: expect.stringContaining('/onboarding?step=auth-setup'),
        }),
      });
    });

    expect(onUpdate).toHaveBeenCalledWith({
      email: 'auth@example.com',
      authMethod: 'email',
      authSetupCompleted: true,
    });
    expect(
      screen.getByText(/Check your email for the login link!/i),
    ).toBeInTheDocument();
  });

  it('surfaces Supabase errors during email login', async () => {
    const supabaseMock = {
      auth: {
        signInWithOtp: jest
          .fn()
          .mockResolvedValue({ error: { message: 'Email failed' } }),
      },
    };
    getSupabaseBrowserClient.mockResolvedValue(supabaseMock);

    renderComponent();

    const user = userEvent.setup();

    const continueEmail = await screen.findByRole('button', { name: /Continue with Email/i });
    await user.click(continueEmail);

    await user.type(screen.getByLabelText(/Email Address/i), 'auth@example.com');
    await user.click(screen.getByRole('button', { name: /Send Login Link/i }));

    await waitFor(() =>
      expect(screen.getByText('Email failed')).toBeInTheDocument(),
    );
  });

  it('handles passkey registration success', async () => {
    const supabaseMock = {
      auth: {
        signInWithOtp: jest.fn(),
      },
    };
    getSupabaseBrowserClient.mockResolvedValue(supabaseMock);

    renderComponent();

    const user = userEvent.setup();

    await user.click(screen.getByRole('heading', { name: 'Passkey' }));
    const continuePasskey = await screen.findByRole('button', { name: /Continue with Passkey/i });
    await user.click(continuePasskey);

    await user.click(screen.getByTestId('mock-passkey-button'));

    expect(onUpdate).toHaveBeenCalledWith({
      authMethod: 'webauthn',
      authSetupCompleted: true,
    });
    expect(
      screen.getByText(/Passkey registered successfully!/i),
    ).toBeInTheDocument();
  });
});


