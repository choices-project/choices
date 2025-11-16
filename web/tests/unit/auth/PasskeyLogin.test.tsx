import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import PasskeyLogin from '@/features/auth/components/PasskeyLogin';
import { beginAuthenticate } from '@/features/auth/lib/webauthn/client';
import { useUserStore } from '@/lib/stores/userStore';


jest.mock('@/features/auth/lib/webauthn/client', () => ({
  beginRegister: jest.fn(),
  beginAuthenticate: jest.fn(),
  registerBiometric: jest.fn(),
  isWebAuthnSupported: jest.fn().mockReturnValue(true),
  isBiometricAvailable: jest.fn().mockResolvedValue(true),
  getUserCredentials: jest.fn().mockResolvedValue([]),
  getPrivacyStatus: jest.fn().mockResolvedValue({ status: 'ok' }),
}));

describe('PasskeyLogin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useUserStore.getState().signOut();
    Object.defineProperty(window, 'PublicKeyCredential', {
      value: {
        isUserVerifyingPlatformAuthenticatorAvailable: jest
          .fn()
          .mockResolvedValue(true),
      },
      writable: true,
      configurable: true,
    });
  });

  it('shows success message when authentication succeeds', async () => {
    beginAuthenticate.mockResolvedValue({ success: true, data: {} });

    render(<PasskeyLogin />);

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Sign In with Passkey/i }));

    await waitFor(() =>
      expect(screen.getByText(/Authentication Successful!/i)).toBeInTheDocument(),
    );
    expect(useUserStore.getState().biometric.success).toBe(true);
  });

  it('shows error message when authentication fails', async () => {
    beginAuthenticate.mockResolvedValue({ success: false, error: 'Authentication failed' });

    render(<PasskeyLogin />);

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Sign In with Passkey/i }));

    await waitFor(() =>
      expect(screen.getByText(/Authentication failed/i)).toBeInTheDocument(),
    );
    expect(useUserStore.getState().biometric.error).toBe('Authentication failed');
  });
});


