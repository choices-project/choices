'use client';

import { AlertTriangle, CheckCircle, Fingerprint, Shield, XCircle } from 'lucide-react';
import React from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { devLog } from '@/lib/utils/logger';

import {
  useBiometricAvailable,
  useBiometricCredentials,
  useBiometricError,
  useBiometricRegistering,
  useBiometricSuccess,
  useBiometricSupported,
  useInitializeBiometricState,
  useUserActions,
} from '../lib/store';

type BiometricSetupProps = {
  userId: string;
  username: string;
  onSuccess?: () => void;
  onError?: () => void;
};

export default function BiometricSetup({
  userId,
  username,
  onSuccess,
  onError,
}: BiometricSetupProps) {
  if (!userId || !username) {
    throw new Error('userId and username are required for biometric setup');
  }

  useInitializeBiometricState();

  const isSupported = useBiometricSupported();
  const isAvailable = useBiometricAvailable();
  const hasCredentials = useBiometricCredentials();
  const isRegistering = useBiometricRegistering();
  const error = useBiometricError();
  const success = useBiometricSuccess();

  const {
    setBiometricRegistering,
    setBiometricCredentials,
    setBiometricError,
    setBiometricSuccess,
    resetBiometric,
  } = useUserActions();

  React.useEffect(
    () => () => {
      resetBiometric();
    },
    [resetBiometric]
  );

  const handleRegister = React.useCallback(async () => {
    if (!isSupported) {
      setBiometricError('WebAuthn is not supported in this browser');
      onError?.();
      return;
    }

    setBiometricRegistering(true);
    setBiometricError(null);
    setBiometricSuccess(false);

    try {
      const { registerBiometric } = await import('@/features/auth/lib/webauthn/client');
      const result = await registerBiometric();

      if (result.success) {
        setBiometricSuccess(true);
        setBiometricCredentials(true);
        onSuccess?.();
        devLog('Biometric registration succeeded', { userId });
      } else {
        const message =
          typeof result.error === 'string' ? result.error : 'Registration failed';
        setBiometricError(message);
        onError?.();
        devLog('Biometric registration failed', { userId, error: message });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setBiometricError(message);
      onError?.();
      devLog('Biometric registration error', { userId, error: message });
    } finally {
      setBiometricRegistering(false);
    }
  }, [
    isSupported,
    onError,
    onSuccess,
    setBiometricCredentials,
    setBiometricError,
    setBiometricRegistering,
    setBiometricSuccess,
    userId,
  ]);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Fingerprint className="h-5 w-5" />
          Biometric Authentication Setup
          <Shield className="h-4 w-4 text-green-600" />
        </CardTitle>
        <CardDescription>
          Set up fingerprint or face recognition for secure, passwordless login for {username}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">WebAuthn Support</span>
            <Badge variant={isSupported ? 'default' : 'secondary'}>
              {isSupported ? 'Supported' : 'Not Supported'}
            </Badge>
          </div>

          {isSupported && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Biometric Availability</span>
              <Badge variant={isAvailable ? 'default' : 'secondary'}>
                {isAvailable ? 'Available' : 'Not Available'}
              </Badge>
            </div>
          )}

          {isAvailable && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Credentials Status</span>
              <Badge variant={hasCredentials ? 'default' : 'secondary'}>
                {hasCredentials ? 'Configured' : 'Not Configured'}
              </Badge>
            </div>
          )}
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Your biometric authentication has been successfully configured. You can now use
              fingerprint or face recognition to log in.
            </AlertDescription>
          </Alert>
        )}

        {isSupported && isAvailable && !hasCredentials && !success && (
          <Button onClick={handleRegister} disabled={isRegistering} className="w-full">
            {isRegistering ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                Setting up...
              </>
            ) : (
              <>
                <Fingerprint className="mr-2 h-4 w-4" />
                Set Up Biometric Authentication
              </>
            )}
          </Button>
        )}

        {hasCredentials && !success && (
          <div className="rounded-lg bg-green-50 p-4 text-center">
            <CheckCircle className="mx-auto mb-2 h-8 w-8 text-green-500" />
            <p className="font-medium text-green-700">Biometric authentication is already configured</p>
            <p className="text-sm text-green-600">
              You can use fingerprint or face recognition to log in
            </p>
          </div>
        )}

        {!isSupported && (
          <div className="rounded-lg bg-gray-50 p-4 text-center">
            <XCircle className="mx-auto mb-2 h-8 w-8 text-gray-500" />
            <p className="font-medium text-gray-700">WebAuthn not supported</p>
            <p className="text-sm text-gray-600">
              Your browser doesn&apos;t support WebAuthn. Please use a modern browser like Chrome,
              Firefox, or Safari.
            </p>
          </div>
        )}

        {isSupported && !isAvailable && (
          <div className="rounded-lg bg-gray-50 p-4 text-center">
            <XCircle className="mx-auto mb-2 h-8 w-8 text-gray-500" />
            <p className="font-medium text-gray-700">Biometric authentication not available</p>
            <p className="text-sm text-gray-600">
              Your device doesn&apos;t have biometric authentication capabilities or it&apos;s not enabled.
            </p>
          </div>
        )}

        <div className="mt-6 rounded-lg bg-blue-50 p-4">
          <h4 className="mb-2 font-medium text-blue-900">Security Features</h4>
          <ul className="space-y-1 text-sm text-blue-800">
            <li>• Biometric data never leaves your device</li>
            <li>• Uses industry-standard WebAuthn protocol</li>
            <li>• Protected by your device&apos;s secure enclave</li>
            <li>• Cannot be copied or transferred</li>
            <li>• Automatically logs all authentication attempts</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
