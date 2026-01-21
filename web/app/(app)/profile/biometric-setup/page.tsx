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

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

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
    // In E2E harness mode, authentication is mocked - don't redirect
    if (process.env.NEXT_PUBLIC_ENABLE_E2E_HARNESS === '1') {
      return;
    }
    if (!isUserLoading && !isAuthenticated) {
      routerRef.current.replace('/auth?redirectTo=/profile/biometric-setup');
    }
  }, [isAuthenticated, isUserLoading]);

  useEffect(() => {
    if (biometricSuccess) {
      const timeout = window.setTimeout(() => {
        routerRef.current.push('/profile');
      }, 2000);
      return () => window.clearTimeout(timeout);
    }
    return undefined;
  }, [biometricSuccess]);

  const handleSuccess = useCallback(() => {
    // Success state handled by store; effect above triggers redirect.
  }, []);

  const handleError = useCallback(() => {
    // Error state already stored; no-op placeholder for future analytics.
  }, []);

  if (isSupported === null || isAvailable === null || profileLoading || isUserLoading) {
    return (
      <main id="main-content" role="main" className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Checking device support...</p>
        </div>
      </main>
    );
  }

  if (!isSupported || !isAvailable) {
    return (
      <main id="main-content" role="main" className="min-h-screen bg-background flex items-center justify-center py-12 px-4">
        <Card className="max-w-md w-full bg-card dark:bg-card border-border">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <CardTitle className="text-2xl text-foreground">Biometric Authentication Not Supported</CardTitle>
            <CardDescription className="mt-2 text-muted-foreground">
              Your device or browser doesn&apos;t support biometric authentication. You can still use
              email and password login.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => routerRef.current.push('/profile')}
              className="w-full"
            >
              Back to Profile
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main id="main-content" role="main" className="min-h-screen bg-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-md w-full bg-card dark:bg-card border-border">
        <CardHeader className="text-center">
          <Fingerprint className="h-12 w-12 text-primary mx-auto mb-4" />
          <CardTitle className="text-3xl text-foreground">Set Up Biometric Authentication</CardTitle>
          <CardDescription className="mt-2 text-muted-foreground">
            Use your fingerprint, face, or other biometric to sign in securely
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {biometricError && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
                <div className="ml-3">
                  <p className="text-sm text-destructive">{biometricError}</p>
                </div>
              </div>
            </div>
          )}

          {biometricSuccess && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-4">
              <div className="flex">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
                <div className="ml-3">
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Biometric authentication is ready to use. Redirecting…
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">How it works:</h3>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
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
            <p className="text-sm text-green-600 dark:text-green-400 text-center">
              You already have a passkey registered. Registering again will add another credential.
            </p>
          )}

          <Button
            onClick={() => routerRef.current.push('/profile')}
            variant="ghost"
            className="w-full text-muted-foreground hover:text-foreground"
            disabled={isRegistering}
          >
            Skip for now
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
