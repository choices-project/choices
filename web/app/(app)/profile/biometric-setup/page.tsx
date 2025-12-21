'use client'


import { AlertCircle, CheckCircle2, Fingerprint, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useRef } from 'react';

import PasskeyRegister from '@/features/auth/components/PasskeyRegister';
import {
  useInitializeBiometricState,
  useBiometricSupported,
  useBiometricAvailable,
  useBiometricCredentials,
  useBiometricRegistering,
  useBiometricError,
  useBiometricSuccess,
  useIsAuthenticated,
  useUserLoading,
} from '@/features/auth/lib/store';
import { useProfileData } from '@/features/profile/hooks/use-profile';

export default function BiometricSetupPage() {
  const router = useRouter();
  const routerRef = useRef(router);
  useEffect(() => { routerRef.current = router; }, [router]);
  const isAuthenticated = useIsAuthenticated();
  const isUserLoading = useUserLoading();
  const { isLoading: profileLoading } = useProfileData();

  useInitializeBiometricState();

  const isSupported = useBiometricSupported();
  const isAvailable = useBiometricAvailable();
  const hasCredentials = useBiometricCredentials();
  const isRegistering = useBiometricRegistering();
  const biometricError = useBiometricError();
  const biometricSuccess = useBiometricSuccess();

  useEffect(() => {
    if (!isUserLoading && !isAuthenticated) {
      routerRef.current.replace('/auth?redirectTo=/profile/biometric-setup');
    }
  }, [isAuthenticated, isUserLoading]); // Removed router

  useEffect(() => {
    if (biometricSuccess) {
      const timeout = window.setTimeout(() => {
        routerRef.current.push('/profile');
      }, 2000);
      return () => window.clearTimeout(timeout);
    }
    return undefined;
  }, [biometricSuccess]); // Removed router

  const handleSuccess = useCallback(() => {
    // Success state handled by store; effect above triggers redirect.
  }, []);

  const handleError = useCallback(() => {
    // Error state already stored; no-op placeholder for future analytics.
  }, []);

  if (isSupported === null || isAvailable === null || profileLoading || isUserLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
        </div>
      </div>
    );
  }

  if (!isSupported || !isAvailable) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="max-w-md w-full space-y-8 p-6">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Biometric Authentication Not Supported
            </h1>
            <p className="text-gray-600 mb-6">
              Your device or browser doesn&apos;t support biometric authentication. You can still use
              email and password login.
            </p>
            <button
              onClick={() => routerRef.current.push('/profile')}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Back to Profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Fingerprint className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Set Up Biometric Authentication</h1>
          <p className="text-gray-600">
            Use your fingerprint, face, or other biometric to sign in securely
          </p>
        </div>

        {biometricError && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-700">{biometricError}</p>
              </div>
            </div>
          </div>
        )}

        {biometricSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <CheckCircle2 className="h-5 w-5 text-green-400" />
              <div className="ml-3">
                <p className="text-sm text-green-700">
                  Biometric authentication is ready to use. Redirecting…
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">How it works:</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Touch your fingerprint sensor or use face recognition</li>
              <li>• Your biometric data stays on your device</li>
              <li>• No passwords needed for future logins</li>
              <li>• Works across supported devices</li>
            </ul>
          </div>

          <PasskeyRegister
            onSuccess={handleSuccess}
            onError={handleError}
            className="shadow-sm"
          />

          {hasCredentials && (
            <p className="text-sm text-green-700 text-center">
              You already have a passkey registered. Registering again will add another credential.
            </p>
          )}

          <button
            onClick={() => routerRef.current.push('/profile')}
            className="w-full text-gray-600 hover:text-gray-800 transition-colors"
            disabled={isRegistering}
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
