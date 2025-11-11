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
import { withOptional } from '@/lib/util/objects';
import logger from '@/lib/utils/logger';

import {
  useBiometricError,
  useBiometricRegistering,
  useBiometricSuccess,
  useBiometricSupported,
  useInitializeBiometricState,
  useUserActions,
} from '../lib/store';

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

      const response = await fetch('/api/v1/auth/webauthn/native/register/options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username || undefined,
          displayName: displayName || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start registration');
      }

      const credentialOptions = await response.json();
      const publicKeyOptions = withOptional(credentialOptions ?? {}, {
        authenticatorSelection: withOptional(
          credentialOptions?.authenticatorSelection ?? {},
          {
            userVerification: 'required',
            authenticatorAttachment: hasPlatformAuth ? 'platform' : 'cross-platform',
          }
        ),
      });

      const credential = (await navigator.credentials.create({
        publicKey: publicKeyOptions,
      })) as PublicKeyCredential | null;

      if (!credential) {
        throw new Error('Failed to create credential');
      }

      const completeResponse = await fetch('/api/v1/auth/webauthn/native/register/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: credential.id,
          rawId: Array.from(new Uint8Array(credential.rawId)),
          response: {
            attestationObject: Array.from(
              new Uint8Array(
                (credential.response as AuthenticatorAttestationResponse).attestationObject
              )
            ),
            clientDataJSON: Array.from(new Uint8Array(credential.response.clientDataJSON)),
          },
          type: credential.type,
        }),
      });

      if (!completeResponse.ok) {
        const errorData = await completeResponse.json();
        throw new Error(errorData.error || 'Failed to complete registration');
      }

      const result = await completeResponse.json();
      setBiometricSuccess(true);
      setBiometricCredentials(true);
      onSuccess?.(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setBiometricError(message);
      onError?.(message);
    } finally {
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
          <div className="text-center space-y-4">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold text-green-700">Registration Successful!</h3>
              <p className="text-gray-600">
                Your passkey has been created and you can now use it to sign in.
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
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Register Button */}
            <Button
              data-testid="webauthn-register"
              onClick={handleRegister}
              disabled={isRegistering}
              className="w-full"
              size="lg"
            >
              {isRegistering ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Passkey...
                </>
              ) : (
                <>
                  <Fingerprint className="h-4 w-4 mr-2" />
                  Create Passkey
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
