/**
 * Auth API Helpers
 *
 * Shared client helpers for authentication actions to keep components/tests consistent.
 */

// These helpers are an intentional bridge from feature-level code to app actions
// eslint-disable-next-line boundaries/element-types
import { loginAction } from '@/app/actions/login';
// eslint-disable-next-line boundaries/element-types
import { register } from '@/app/actions/register';
import type { ServerActionContext } from '@/lib/core/auth/server-actions';

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

export async function loginWithPassword(payload: LoginPayload) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: payload.email,
      password: payload.password,
    }),
  });
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody?.message ?? 'Login failed');
  }
  return response.json();
}

export async function registerUser(payload: RegisterPayload) {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: payload.email,
      username: payload.username,
      password: payload.password,
    }),
  });
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody?.message ?? 'Registration failed');
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

