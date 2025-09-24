'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
      console.error('Error checking platform authenticator:', err);
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
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start authentication');
      }

      const credentialOptions = await response.json();

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
              userHandle: (credential.response as AuthenticatorAssertionResponse).userHandle 
                ? Array.from(new Uint8Array((credential.response as AuthenticatorAssertionResponse).userHandle!))
                : null
            },
            type: credential.type
          }
        }),
      });

      if (!completeResponse.ok) {
        const errorData = await completeResponse.json();
        throw new Error(errorData.error || 'Authentication failed');
      }

      const result = await completeResponse.json();
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
            <AlertCircle className="h-5 w-5 text-red-500" />
            <span>WebAuthn Not Supported</span>
          </CardTitle>
          <CardDescription>
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
