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

type WebAuthnPromptProps = {
  mode: 'register' | 'authenticate';
  onComplete: () => void;
  onCancel: () => void;
  onError?: (error: string) => void;
  className?: string;
}

export function WebAuthnPrompt({
  mode,
  onComplete,
  onCancel,
  onError,
  className
}: WebAuthnPromptProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleBiometric = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      // Simulate WebAuthn biometric authentication
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess(true);
      setTimeout(() => {
        onComplete();
      }, 1000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Biometric authentication failed';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCrossDevice = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      // Simulate cross-device authentication
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSuccess(true);
      setTimeout(() => {
        onComplete();
      }, 1000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Cross-device authentication failed';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const getTitle = () => {
    return mode === 'register' ? 'Create Passkey' : 'Sign in with Passkey';
  };

  const getDescription = () => {
    return mode === 'register' 
      ? 'Choose how you want to create your passkey'
      : 'Choose how you want to sign in';
  };

  const getAuthenticatorIcon = () => {
    if (typeof window === 'undefined') return <Shield className="h-6 w-6" />;
    
    // Check if we're on a mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    return isMobile ? <Smartphone className="h-6 w-6" /> : <Laptop className="h-6 w-6" />;
  };

  if (success) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold text-green-700">
                {mode === 'register' ? 'Passkey Created!' : 'Signed In Successfully!'}
              </h3>
              <p className="text-gray-600">
                {mode === 'register' 
                  ? 'Your passkey has been created and is ready to use.'
                  : 'You have been signed in successfully.'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          {getAuthenticatorIcon()}
          <span>{getTitle()}</span>
        </CardTitle>
        <CardDescription>{getDescription()}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
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
            <p className="text-sm font-medium text-green-900">Secure Authentication</p>
            <p className="text-xs text-green-700">
              {mode === 'register' 
                ? 'Your passkey will be stored securely on this device'
                : 'We\'ll use your registered passkeys for authentication'
              }
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

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={handleBiometric}
            disabled={isProcessing}
            className="w-full"
            size="lg"
            data-testid="webauthn-biometric-button"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {mode === 'register' ? 'Creating...' : 'Signing in...'}
              </>
            ) : (
              <>
                <Fingerprint className="h-4 w-4 mr-2" />
                {mode === 'register' ? 'Create with Biometrics' : 'Use Biometrics'}
              </>
            )}
          </Button>

          <Button
            onClick={handleCrossDevice}
            disabled={isProcessing}
            variant="outline"
            className="w-full"
            size="lg"
            data-testid="webauthn-cross-device-button"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {mode === 'register' ? 'Creating...' : 'Signing in...'}
              </>
            ) : (
              <>
                <Smartphone className="h-4 w-4 mr-2" />
                {mode === 'register' ? 'Use Another Device' : 'Use Another Device'}
              </>
            )}
          </Button>

          <Button
            onClick={onCancel}
            variant="ghost"
            className="w-full"
            data-testid="cancel-webauthn-button"
          >
            Cancel
          </Button>
        </div>

        {/* Security Information */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>• Your passkey is stored securely on your device</p>
          <p>• No passwords are transmitted or stored</p>
          <p>• Works with Touch ID, Face ID, Windows Hello, and security keys</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default WebAuthnPrompt;
