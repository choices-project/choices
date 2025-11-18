'use client';

import {
  AlertCircle,
  CheckCircle,
  Fingerprint,
  Key,
  Laptop,
  Loader2,
  Shield,
  Smartphone,
} from 'lucide-react';
import React from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import logger from '@/lib/utils/logger';

import {
  useBiometricSupported,
  useInitializeBiometricState,
  useUserActions,
} from '../lib/store';
import { beginAuthenticate } from '../lib/webauthn/client';

type PasskeyLoginProps = {
  onSuccess?: (session: any) => void;
  onError?: (error: string) => void;
  className?: string;
};

export function PasskeyLogin({
  onSuccess,
  onError,
  className,
}: PasskeyLoginProps) {
  const [isAuthenticating, setIsAuthenticating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  useInitializeBiometricState({ fetchCredentials: false });

  const isSupported = useBiometricSupported();
  const { setBiometricSuccess, setBiometricError } = useUserActions();

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
      logger.error('Error checking platform authenticator:', err);
      return false;
    }
  }, [isWebAuthnSupported]);

  const handleLogin = React.useCallback(async () => {
    if (!isWebAuthnSupported()) {
      const message = 'WebAuthn is not supported in this browser';
      setError(message);
      setBiometricError(message);
      setBiometricSuccess(false);
      onError?.(message);
      return;
    }

    setIsAuthenticating(true);
    setError(null);
    setBiometricError(null);
    setSuccess(false);
    setBiometricSuccess(false);

    try {
      const hasPlatformAuth = await checkPlatformAuthenticator();

      const result = await beginAuthenticate({
        authenticatorAttachment: hasPlatformAuth ? 'platform' : 'cross-platform',
        userVerification: 'required',
      });

      if (!result.success) {
        throw new Error(result.error || 'Authentication failed');
      }

      setSuccess(true);
      setBiometricSuccess(true);
      onSuccess?.(result.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
      setError(errorMessage);
      setBiometricError(errorMessage);
      setBiometricSuccess(false);
      onError?.(errorMessage);
    } finally {
      setIsAuthenticating(false);
    }
  }, [checkPlatformAuthenticator, isWebAuthnSupported, onError, onSuccess, setBiometricError, setBiometricSuccess]);

  const getAuthenticatorIcon = React.useCallback(() => {
    if (typeof window === 'undefined') return <Shield className="h-6 w-6" />;

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

    return isMobile ? <Smartphone className="h-6 w-6" /> : <Laptop className="h-6 w-6" />;
  }, []);

  if (isSupported === false) {
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
          <span>Sign In with Passkey</span>
        </CardTitle>
        <CardDescription>
          Use your registered passkey to sign in securely
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {success ? (
          <div className="text-center space-y-4">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold text-green-700">Authentication Successful!</h3>
              <p className="text-gray-600">
                You have been signed in successfully.
              </p>
            </div>
          </div>
        ) : (
          <>
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

            {/* Available Credentials Info */}
            <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
              <Key className="h-5 w-5 text-green-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900">Registered Passkeys</p>
                <p className="text-xs text-green-700">
                  We&apos;ll automatically detect and use your registered passkeys
                </p>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Login Button */}
            <Button
              onClick={handleLogin}
              disabled={isAuthenticating}
              className="w-full"
              size="lg"
            >
              {isAuthenticating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <Fingerprint className="h-4 w-4 mr-2" />
                  Sign In with Passkey
                </>
              )}
            </Button>

            {/* Security Information */}
            <div className="text-xs text-gray-500 space-y-1">
              <p>• Your passkey is verified on your device</p>
              <p>• No passwords or personal data are transmitted</p>
              <p>• Works with Touch ID, Face ID, Windows Hello, and security keys</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default PasskeyLogin;
