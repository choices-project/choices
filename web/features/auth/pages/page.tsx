'use client';

import Link from 'next/link';
import React from 'react';

import { PasskeyControls } from '@/features/auth/components/PasskeyControls';
import {
  useInitializeBiometricState,
  useIsAuthenticated,
  useUser,
  useUserLoading,
} from '@/features/auth/lib/store';

export default function AuthPage() {
  useInitializeBiometricState({ fetchCredentials: false });

  const user = useUser();
  const isAuthenticated = useIsAuthenticated();
  const isLoading = useUserLoading();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
      </div>
    );
  }

  if (isAuthenticated && user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold text-gray-900">Welcome back!</h1>
          <p className="mb-6 text-gray-600">You are already logged in.</p>
          <Link href="/" className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="max-w-2xl text-center">
        <h1 className="mb-4 text-2xl font-bold text-gray-900">Authentication</h1>
        <p className="mb-6 text-gray-600">Please log in to continue.</p>

        <div className="mb-6">
          <Link href="/login" className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
            Login
          </Link>
        </div>

        <div className="border-t pt-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            WebAuthn / Passkey Authentication
          </h2>
          <PasskeyControls />
        </div>
      </div>
    </div>
  );
}