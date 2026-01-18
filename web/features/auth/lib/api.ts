/**
 * Auth API Helpers
 *
 * Shared client helpers for authentication actions to keep components/tests consistent.
 */

// Use API routes instead of importing server actions to satisfy boundaries rules

import {
  beginRegister,
  beginAuthenticate,
  registerBiometric,
  getPrivacyStatus,
  isBiometricAvailable,
  isWebAuthnSupported,
  getUserCredentials,
} from './webauthn/client';

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  email: string;
  username: string;
  password: string;
};

async function getCsrfToken(): Promise<string | null> {
  try {
    const response = await fetch('/api/auth/csrf', {
      credentials: 'include',
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json().catch(() => null);
    return data?.data?.csrfToken ?? null;
  } catch {
    return null;
  }
}

export async function loginWithPassword(payload: LoginPayload) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // CRITICAL: Include cookies in request/response for authentication
    body: JSON.stringify({
      email: payload.email,
      password: payload.password,
    }),
  });
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const error = new Error(errorBody?.message ?? 'Login failed');
    // Attach status code for rate limit detection
    (error as any).status = response.status;
    throw error;
  }
  return response.json();
}

export async function registerUser(payload: RegisterPayload) {
  const csrfToken = await getCsrfToken();
  if (!csrfToken) {
    const error = new Error('Unable to obtain CSRF token. Please refresh and try again.');
    (error as any).status = 403;
    throw error;
  }

  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken,
    },
    credentials: 'include', // CRITICAL: Include cookies in request/response for authentication
    body: JSON.stringify({
      email: payload.email,
      username: payload.username,
      password: payload.password,
    }),
  });
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const error = new Error(errorBody?.message ?? 'Registration failed');
    // Attach status code for rate limit detection
    (error as any).status = response.status;
    throw error;
  }
  return response.json();
}

export const passkeyAPI = {
  beginRegister,
  beginAuthenticate,
  registerBiometric,
  getPrivacyStatus,
  isBiometricAvailable,
  isWebAuthnSupported,
  getUserCredentials,
};

