'use client';

import { 
Fingerprint, 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  Shield,
  Smartphone,
  Laptop,
  Key
} from 'lucide-react';
import React, { useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import logger from '@/lib/utils/logger'

type PasskeyLoginProps = {
  onSuccess?: (session: any) => void;
  onError?: (error: string) => void;
  className?: string;
}

export function PasskeyLogin({
  onSuccess,
  onError,
  className
}: PasskeyLoginProps) {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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

  const handleLogin = async () => {
    if (!isWebAuthnSupported()) {
      setError('WebAuthn is not supported in this browser');
      onError?.('WebAuthn is not supported in this browser');
      return;
    }

    setIsAuthenticating(true);
    setError(null);
    setSuccess(false);

    try {
      // Check if platform authenticator is available
      const hasPlatformAuth = await checkPlatformAuthenticator();
      
      // Start WebAuthn authentication
      const response = await fetch('/api/auth/webauthn/authenticate/begin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userVerification: 'required',
          authenticatorAttachment: hasPlatformAuth ? 'platform' : 'cross-platform'
        }),
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          throw new Error('Invalid JSON response from authentication endpoint');
        }
        throw new Error(errorData.error || 'Failed to start authentication');
      }

      let credentialOptions;
      try {
        credentialOptions = await response.json();
      } catch {
        throw new Error('Invalid JSON response from authentication endpoint');
      }

      // Get credential
      const credential = await navigator.credentials.get({
        publicKey: {
          ...credentialOptions,
          userVerification: 'required',
          authenticatorSelection: {
            userVerification: 'required',
            authenticatorAttachment: hasPlatformAuth ? 'platform' : 'cross-platform'
          }
        }
      }) as PublicKeyCredential;

      if (!credential) {
        throw new Error('Authentication was cancelled or failed');
      }

      // Complete authentication
      const completeResponse = await fetch('/api/auth/webauthn/authenticate/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          credential: {
            id: credential.id,
            rawId: Array.from(new Uint8Array(credential.rawId)),
              response: {
              authenticatorData: Array.from(new Uint8Array((credential.response as AuthenticatorAssertionResponse).authenticatorData)),
              clientDataJSON: Array.from(new Uint8Array(credential.response.clientDataJSON)),
              signature: Array.from(new Uint8Array((credential.response as AuthenticatorAssertionResponse).signature)),
              userHandle: (() => {
                const uh = (credential.response as AuthenticatorAssertionResponse).userHandle;
                return uh ? Array.from(new Uint8Array(uh)) : null;
              })()
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
          throw new Error('Invalid JSON response from authentication completion endpoint');
        }
        throw new Error(errorData.error || 'Authentication failed');
      }

      let result;
      try {
        result = await completeResponse.json();
      } catch {
        throw new Error('Invalid JSON response from authentication completion endpoint');
      }
      setSuccess(true);
      onSuccess?.(result);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsAuthenticating(false);
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
          <span>Sign In with Passkey</span>
        </CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-400">
          Use your registered passkey to sign in securely
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {success ? (
          <div className="text-center space-y-4" role="status" aria-live="polite">
            <CheckCircle className="h-12 w-12 text-green-500 dark:text-green-400 mx-auto" aria-hidden="true" />
            <div>
              <h3 className="text-lg font-semibold text-green-700 dark:text-green-300">Authentication Successful!</h3>
              <p className="text-gray-600 dark:text-gray-400">
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
              <Alert variant="destructive" role="alert" aria-live="assertive">
                <AlertCircle className="h-4 w-4" aria-hidden="true" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Login Button */}
            <Button
              onClick={handleLogin}
              disabled={isAuthenticating}
              className="w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              size="lg"
              aria-label="Sign in with passkey"
              aria-busy={isAuthenticating}
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
