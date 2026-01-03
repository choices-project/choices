'use client';

import { 
Fingerprint, 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  Eye, 
  EyeOff,
  Shield,
  Smartphone,
  Laptop
} from 'lucide-react';
import React, { useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import logger from '@/lib/utils/logger';

type PasskeyRegisterProps = {
  onSuccess?: (credential: any) => void;
  onError?: (error: string) => void;
  className?: string;
}

export function PasskeyRegister({
  onSuccess,
  onError,
  className
}: PasskeyRegisterProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');

  const isWebAuthnSupported = () => {
    return typeof window !== 'undefined' && 
           window.PublicKeyCredential && 
           typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function';
  };

  const checkPlatformAuthenticator = async () => {
    if (!isWebAuthnSupported()) return false;
    
    try {
      return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    } catch (err) {
      logger.error('Error checking platform authenticator:', err);
      return false;
    }
  };

  const handleRegister = async () => {
    if (!isWebAuthnSupported()) {
      setError('WebAuthn is not supported in this browser');
      onError?.('WebAuthn is not supported in this browser');
      return;
    }

    setIsRegistering(true);
    setError(null);
    setSuccess(false);

    try {
      // Check if platform authenticator is available
      const hasPlatformAuth = await checkPlatformAuthenticator();
      
      // Start WebAuthn registration
      const response = await fetch('/api/auth/webauthn/register/begin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username || undefined,
          displayName: displayName || undefined,
        }),
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          throw new Error('Invalid JSON response from registration endpoint');
        }
        throw new Error(errorData.error || 'Failed to start registration');
      }

      let credentialOptions;
      try {
        credentialOptions = await response.json();
      } catch {
        throw new Error('Invalid JSON response from registration endpoint');
      }

      // Create credential
      const publicKeyOptions = {
        ...(credentialOptions ?? {}),
        authenticatorSelection: {
          ...(credentialOptions?.authenticatorSelection ?? {}),
          userVerification: 'required',
          authenticatorAttachment: hasPlatformAuth ? 'platform' : 'cross-platform',
        },
      };

      const credential = await navigator.credentials.create({
        publicKey: publicKeyOptions,
      }) as PublicKeyCredential;

      if (!credential) {
        throw new Error('Failed to create credential');
      }

      // Complete registration
      const completeResponse = await fetch('/api/auth/webauthn/register/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          credential: {
            id: credential.id,
            rawId: Array.from(new Uint8Array(credential.rawId)),
            response: {
              attestationObject: Array.from(new Uint8Array((credential.response as AuthenticatorAttestationResponse).attestationObject)),
              clientDataJSON: Array.from(new Uint8Array(credential.response.clientDataJSON))
            },
            type: credential.type
          }
        }),
      });

      if (!completeResponse.ok) {
        let errorData;
        try {
          errorData = await completeResponse.json();
        } catch {
          throw new Error('Invalid JSON response from registration completion endpoint');
        }
        throw new Error(errorData.error || 'Failed to complete registration');
      }

      let result;
      try {
        result = await completeResponse.json();
      } catch {
        throw new Error('Invalid JSON response from registration completion endpoint');
      }
      setSuccess(true);
      onSuccess?.(result);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsRegistering(false);
    }
  };

  const getAuthenticatorIcon = () => {
    if (typeof window === 'undefined') return <Shield className="h-6 w-6" />;
    
    // Check if we're on a mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    return isMobile ? <Smartphone className="h-6 w-6" /> : <Laptop className="h-6 w-6" />;
  };

  if (!isWebAuthnSupported()) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400" aria-hidden="true" />
            <span>WebAuthn Not Supported</span>
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Your browser does not support WebAuthn. Please use a modern browser or try a different authentication method.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Fingerprint className="h-5 w-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
          <span>Register Passkey</span>
        </CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-400">
          Create a secure passkey using your device&apos;s biometric authentication or security key
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {success ? (
          <div className="text-center space-y-4" role="status" aria-live="polite">
            <CheckCircle className="h-12 w-12 text-green-500 dark:text-green-400 mx-auto" aria-hidden="true" />
            <div>
              <h3 className="text-lg font-semibold text-green-700 dark:text-green-300">Registration Successful!</h3>
              <p className="text-gray-600 dark:text-gray-400">
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
            <div className="flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              {getAuthenticatorIcon()}
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Device Authentication</p>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Your device will prompt you to use biometric authentication or enter your device passcode
                </p>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <Alert variant="destructive" role="alert" aria-live="assertive">
                <AlertCircle className="h-4 w-4" aria-hidden="true" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Register Button */}
            <Button
              onClick={handleRegister}
              disabled={isRegistering}
              className="w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              size="lg"
              aria-label="Create passkey"
              aria-busy={isRegistering}
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
            <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
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
