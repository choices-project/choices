'use client';

import {
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Fingerprint,
  Laptop,
  Loader2,
  Shield,
  Smartphone,
} from 'lucide-react';
import React from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { useUserStore } from '@/lib/stores/userStore';
import logger from '@/lib/utils/logger';

import {
  useBiometricError,
  useBiometricRegistering,
  useBiometricSuccess,
  useBiometricSupported,
  useInitializeBiometricState,
  useUserActions,
} from '../lib/store';
import { beginRegister } from '../lib/webauthn/client';

import type { BeginRegisterOptions } from '../lib/webauthn/native/client';

type PasskeyRegisterProps = {
  onSuccess?: (credential: unknown) => void;
  onError?: (error: string) => void;
  className?: string;
};

export function PasskeyRegister({
  onSuccess,
  onError,
  className,
}: PasskeyRegisterProps) {
  const [showAdvanced, setShowAdvanced] = React.useState(false);
  const [username, setUsername] = React.useState('');
  const [displayName, setDisplayName] = React.useState('');

  useInitializeBiometricState();

  const isSupported = useBiometricSupported();
  const isRegistering = useBiometricRegistering();
  const error = useBiometricError();
  const success = useBiometricSuccess();

  const {
    setBiometricRegistering,
    setBiometricError,
    setBiometricSuccess,
    setBiometricCredentials,
  } = useUserActions();

  const isWebAuthnSupported = React.useCallback(() => {
    return (
      typeof window !== 'undefined' &&
      'PublicKeyCredential' in window &&
      typeof window.PublicKeyCredential?.isUserVerifyingPlatformAuthenticatorAvailable === 'function'
    );
  }, []);

  const checkPlatformAuthenticator = React.useCallback(async () => {
    if (!isWebAuthnSupported()) return false;

    try {
      return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        logger.error('Error checking platform authenticator:', err);
      }
      return false;
    }
  }, [isWebAuthnSupported]);

  const handleRegister = React.useCallback(async () => {
    if (!isWebAuthnSupported()) {
      const message = 'WebAuthn is not supported in this browser';
      setBiometricError(message);
      onError?.(message);
      return;
    }

    setBiometricRegistering(true);
    setBiometricError(null);
    setBiometricSuccess(false);

    try {
      const hasPlatformAuth = await checkPlatformAuthenticator();

        const registerOptions: BeginRegisterOptions = {
          authenticatorAttachment: hasPlatformAuth ? 'platform' : 'cross-platform',
          userVerification: 'required',
        };

        if (username) {
          registerOptions.username = username;
        }

        if (displayName) {
          registerOptions.displayName = displayName;
        }

        const result = await beginRegister(registerOptions);

      if (!result.success) {
        // Set error state immediately to ensure it's set synchronously
        const errorMessage = result.error || 'Failed to complete registration';
        setBiometricError(errorMessage);
        setBiometricSuccess(false);
        setBiometricRegistering(false);
        onError?.(errorMessage);
        // Use requestAnimationFrame to ensure React processes the state update and re-renders
        // This is more reliable than setTimeout(0) for ensuring DOM updates
        await new Promise(resolve => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              resolve(undefined);
            });
          });
        });
        return; // Return early instead of throwing to ensure error state is set
      }

      // Set success state immediately and ensure it persists
      setBiometricSuccess(true);
      setBiometricCredentials(true);

      // Force a small delay to ensure state updates propagate
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify success state was set
      setBiometricSuccess(true);

      onSuccess?.(result.data);
    } catch (err) {
      // Set error state if not already set (for unexpected errors)
      const currentError = useUserStore.getState().biometric.error;
      if (!currentError) {
        const message = err instanceof Error ? err.message : 'Registration failed';
        setBiometricError(message);
        setBiometricSuccess(false);
        onError?.(message);
      }
      setBiometricRegistering(false);
    }
  }, [
    checkPlatformAuthenticator,
    displayName,
    isWebAuthnSupported,
    onError,
    onSuccess,
    setBiometricCredentials,
    setBiometricError,
    setBiometricRegistering,
    setBiometricSuccess,
    username,
  ]);

  const getAuthenticatorIcon = React.useCallback(() => {
    if (typeof window === 'undefined') return <Shield className="h-6 w-6" />;

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

    return isMobile ? <Smartphone className="h-6 w-6" /> : <Laptop className="h-6 w-6" />;
  }, []);

  if (!isSupported) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <span>WebAuthn Not Supported</span>
          </CardTitle>
          <CardDescription>
            Your browser does not support WebAuthn. Please use a modern browser or try a different
            authentication method.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Fingerprint className="h-5 w-5 text-blue-600" />
          <span>Register Passkey</span>
        </CardTitle>
        <CardDescription>
          Create a secure passkey using your device&apos;s biometric authentication or security key
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {success ? (
          <div className="text-center space-y-4" data-testid="passkey-register-success">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto animate-in fade-in zoom-in duration-300" />
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-green-700">Registration Successful!</h3>
              <p className="text-gray-600">
                Your passkey has been created and you can now use it to sign in.
              </p>
              <p className="text-sm text-gray-500">
                You can close this dialog and use your passkey to sign in next time.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Advanced Options */}
            <div className="space-y-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center space-x-2"
              >
                {showAdvanced ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                <span>{showAdvanced ? 'Hide' : 'Show'} Advanced Options</span>
              </Button>

              {showAdvanced && (
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Label htmlFor="username">Username (Optional)</Label>
                    <Input
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter a username"
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Leave empty for usernameless authentication
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="displayName">Display Name (Optional)</Label>
                    <Input
                      id="displayName"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Enter a display name"
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      This will be shown when you sign in
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Device Information */}
            <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
              {getAuthenticatorIcon()}
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">Device Authentication</p>
                <p className="text-xs text-blue-700">
                  Your device will prompt you to use biometric authentication or enter your device passcode
                </p>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2 duration-300">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="font-medium">{error}</AlertDescription>
                <p className="mt-2 text-xs text-red-600">
                  If this problem persists, try using email/password authentication instead.
                </p>
              </Alert>
            )}

            {/* Register Button */}
            <Button
              data-testid="webauthn-register"
              onClick={handleRegister}
              disabled={isRegistering}
              className="w-full transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              size="lg"
            >
              {isRegistering ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  <span>Creating Passkey...</span>
                  <span className="ml-2 text-xs opacity-75">Follow your device prompt</span>
                </>
              ) : (
                <>
                  <Fingerprint className="h-4 w-4 mr-2" />
                  <span>Create Passkey</span>
                </>
              )}
            </Button>

            {/* Security Information */}
            <div className="text-xs text-gray-500 space-y-1">
              <p>• Your passkey is stored securely on your device</p>
              <p>• No passwords are transmitted or stored</p>
              <p>• Works with Touch ID, Face ID, Windows Hello, and security keys</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default PasskeyRegister;
