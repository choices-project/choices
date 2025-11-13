import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import PasskeyRegister from '@/features/auth/components/PasskeyRegister';
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

const { beginRegister } = require('@/features/auth/lib/webauthn/client') as {
  beginRegister: jest.Mock;
};

describe('PasskeyRegister', () => {
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

  it('shows success message when registration succeeds', async () => {
    beginRegister.mockResolvedValue({ success: true, data: {} });

    render(<PasskeyRegister />);

    const user = userEvent.setup();
    const createButton = await screen.findByRole('button', { name: /Create Passkey/i });
    await user.click(createButton);

    await waitFor(() =>
      expect(screen.getByText(/Registration Successful!/i)).toBeInTheDocument(),
    );
    expect(useUserStore.getState().biometric.success).toBe(true);
  });

  it('shows error message when registration fails', async () => {
    beginRegister.mockResolvedValue({ success: false, error: 'Registration failed' });

    render(<PasskeyRegister />);

    const user = userEvent.setup();
    const createButton = await screen.findByRole('button', { name: /Create Passkey/i });
    await user.click(createButton);

    await waitFor(() =>
      expect(screen.getByText(/Registration failed/i)).toBeInTheDocument(),
    );
    expect(useUserStore.getState().biometric.error).toBe('Registration failed');
  });
});


