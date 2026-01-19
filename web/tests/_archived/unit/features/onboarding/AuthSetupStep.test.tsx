/**
 * @jest-environment jsdom
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import AuthSetupStep from '@/features/onboarding/components/AuthSetupStep';
import { mockSupabaseClient } from '@/tests/utils/supabase';

jest.mock('@/hooks/useI18n', () => ({
  useI18n: jest.fn(),
}));

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

const mockedI18n = jest.requireMock('@/hooks/useI18n') as {
  useI18n: jest.Mock;
};

const mockedSupabase = jest.requireMock('@/utils/supabase/client') as {
  getSupabaseBrowserClient: jest.Mock;
};

const translationMap: Record<string, string> = {
  'onboarding.auth.options.email.title': 'Email',
  'onboarding.auth.options.email.description': 'Use a secure magic link',
  'onboarding.auth.options.email.bullets.noPassword': 'No password required',
  'onboarding.auth.options.email.bullets.magicLink': 'Magic link sign-in',
  'onboarding.auth.options.email.bullets.secure': 'Secure and private',
  'onboarding.auth.options.social.title': 'Social',
  'onboarding.auth.options.social.description': 'Use Google or GitHub',
  'onboarding.auth.options.social.bullets.oneClick': 'One-click sign in',
  'onboarding.auth.options.social.bullets.trusted': 'Trusted providers',
  'onboarding.auth.options.social.bullets.enhanced': 'Enhanced security',
  'onboarding.auth.options.webauthn.title': 'Passkey',
  'onboarding.auth.options.webauthn.description': 'Use a device passkey',
  'onboarding.auth.options.webauthn.bullets.biometric': 'Biometric security',
  'onboarding.auth.options.webauthn.bullets.noPassword': 'No password',
  'onboarding.auth.options.webauthn.bullets.maximum': 'Maximum protection',
  'onboarding.auth.options.anonymous.title': 'Anonymous',
  'onboarding.auth.options.anonymous.description': 'Participate privately',
  'onboarding.auth.options.anonymous.bullets.noPersonal': 'No personal data',
  'onboarding.auth.options.anonymous.bullets.maximum': 'Maximum privacy',
  'onboarding.auth.options.anonymous.bullets.limited': 'Limited features',
  'onboarding.auth.options.skip.title': 'Skip',
  'onboarding.auth.options.skip.description': 'Finish later',
  'onboarding.auth.options.skip.bullets.continue': 'Continue setup',
  'onboarding.auth.options.skip.bullets.setupLater': 'Set up later',
  'onboarding.auth.options.skip.bullets.limited': 'Limited features',
  'onboarding.auth.overview.title': 'Secure Your Account',
  'onboarding.auth.overview.subtitle': 'Choose how you sign in',
  'onboarding.auth.setup.title': 'Set up authentication',
  'onboarding.auth.setup.subtitle': 'Follow the steps below',
  'onboarding.auth.email.cardTitle': 'Email Login',
  'onboarding.auth.email.cardDescription': 'Receive a secure magic link',
  'onboarding.auth.email.fields.email.label': 'Email Address',
  'onboarding.auth.email.fields.email.placeholder': 'Email Address',
  'onboarding.auth.email.actions.sendLink': 'Send Login Link',
  'onboarding.auth.email.actions.sending': 'Sending…',
  'onboarding.auth.email.success.checkEmail': 'Check your email',
  'onboarding.auth.email.success.sent': 'We sent you a link',
  'onboarding.auth.errors.dismiss': 'Dismiss',
  'onboarding.auth.actions.continue': 'Continue',
  'onboarding.auth.actions.back': 'Back',
  'onboarding.auth.actions.skip': 'Skip',
  'onboarding.auth.social.cardTitle': 'Continue with Social Login',
  'onboarding.auth.social.cardDescription': 'Use Google or GitHub',
  'onboarding.auth.social.actions.continueWithGoogle': 'Continue with Google',
  'onboarding.auth.social.actions.continueWithGitHub': 'Continue with GitHub',
  'onboarding.auth.webauthn.cardTitle': 'Register a Passkey',
  'onboarding.auth.webauthn.cardDescription': 'Link your trusted device',
  'onboarding.auth.webauthn.benefits.title': 'Why passkeys are great',
  'onboarding.auth.webauthn.benefits.biometric': 'Works with biometrics',
  'onboarding.auth.webauthn.benefits.noPassword': 'No passwords to remember',
  'onboarding.auth.webauthn.benefits.crossDevice': 'Works across devices',
  'onboarding.auth.webauthn.benefits.maximum': 'Maximum security',
  'onboarding.auth.webauthn.actions.create': 'Create Passkey',
  'onboarding.auth.webauthn.success.registered': 'Passkey registered',
  'onboarding.auth.webauthn.success.canUse': 'You can now use this device',
  'onboarding.auth.anonymous.cardTitle': 'Use Anonymous Mode',
  'onboarding.auth.anonymous.cardDescription': 'Participate privately',
  'onboarding.auth.anonymous.bullets.noPersonal': 'No personal info needed',
  'onboarding.auth.anonymous.bullets.limited': 'Limited personalization',
  'onboarding.auth.anonymous.actions.enable': 'Continue anonymously',
};

const createI18nMock = () => ({
  t: (key: string, params?: Record<string, string>) => {
    if (key === 'onboarding.auth.options.ariaLabel') {
      return `Select ${params?.method ?? ''}`.trim();
    }

    if (key === 'onboarding.auth.overview.continueWith') {
      return `Continue with ${params?.method ?? ''}`.trim();
    }

    return translationMap[key] ?? key;
  },
  formatDate: jest.fn(),
  formatNumber: jest.fn(),
});

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
    mockedI18n.useI18n.mockReturnValue(createI18nMock());

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
        data={{}}
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

