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
  context: ServerActionContext;
};

export async function loginWithPassword(payload: LoginPayload) {
  const formData = new FormData();
  formData.append('email', payload.email);
  formData.append('password', payload.password);
  return loginAction(formData);
}

export async function registerUser(payload: RegisterPayload) {
  const formData = new FormData();
  formData.append('email', payload.email);
  formData.append('username', payload.username);
  formData.append('password', payload.password);
  return register(formData, payload.context);
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

