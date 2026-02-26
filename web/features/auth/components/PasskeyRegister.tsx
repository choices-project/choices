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

import logger from '@/lib/utils/logger';

import { useI18n } from '@/hooks/useI18n';

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
  const { t } = useI18n();
  const [showAdvanced, setShowAdvanced] = React.useState(false);
  const [username, setUsername] = React.useState('');
  const [displayName, setDisplayName] = React.useState('');

  useInitializeBiometricState();

  const isSupported = useBiometricSupported();
  const isRegistering = useBiometricRegistering();
  const error = useBiometricError();
  const success = useBiometricSuccess();
  const errorRef = React.useRef(error);
  const errorRegionRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => { errorRef.current = error; }, [error]);

  // Focus error region on failure for keyboard/screen-reader users
  React.useEffect(() => {
    if (error && errorRegionRef.current) {
      errorRegionRef.current.focus({ preventScroll: true });
    }
  }, [error]);

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
        // Set error state immediately and synchronously
        const errorMessage = result.error || 'Failed to complete registration';
        // Set all error-related state synchronously
        setBiometricError(errorMessage);
        setBiometricSuccess(false);
        setBiometricRegistering(false);
        onError?.(errorMessage);
        return; // Return early to ensure error state is set
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
      if (!errorRef.current) {
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
            <span>{t('auth.passkey.notSupported')}</span>
          </CardTitle>
          <CardDescription>
            {t('auth.passkey.notSupportedDescription')}
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
          <span>{t('auth.passkey.registerTitle')}</span>
        </CardTitle>
        <CardDescription>
          {t('auth.passkey.registerDescription')}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {success ? (
          <div
            className="text-center space-y-4"
            data-testid="passkey-register-success"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto animate-in fade-in zoom-in duration-300" />
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-green-700">{t('auth.passkey.registrationSuccess')}</h3>
              <p className="text-gray-600">
                {t('auth.passkey.createdAndCanSignIn')}
              </p>
              <p className="text-sm text-gray-500">
                {t('auth.passkey.closeAndUseNextTime')}
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center space-x-2"
              >
                {showAdvanced ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                <span>{showAdvanced ? t('auth.passkey.hideAdvanced') : t('auth.passkey.showAdvanced')}</span>
              </Button>

              {showAdvanced && (
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Label htmlFor="username">{t('auth.passkey.usernameOptional')}</Label>
                    <Input
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder={t('auth.passkey.usernamePlaceholder')}
                      className="mt-1"
                      aria-describedby="username-hint"
                    />
                    <p id="username-hint" className="text-xs text-gray-500 mt-1">
                      {t('auth.passkey.usernamelessHint')}
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="displayName">{t('auth.passkey.displayNameOptional')}</Label>
                    <Input
                      id="displayName"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder={t('auth.passkey.displayNamePlaceholder')}
                      className="mt-1"
                      aria-describedby="displayName-hint"
                    />
                    <p id="displayName-hint" className="text-xs text-gray-500 mt-1">
                      {t('auth.passkey.displayNameSignInHint')}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
              {getAuthenticatorIcon()}
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">{t('auth.passkey.deviceAuth')}</p>
                <p className="text-xs text-blue-700">
                  {t('auth.passkey.deviceAuthDesc')}
                </p>
              </div>
            </div>

            {error && (
              <Alert
                ref={errorRegionRef}
                variant="destructive"
                className="animate-in fade-in slide-in-from-top-2 duration-300"
                role="alert"
                aria-live="assertive"
                aria-atomic="true"
                id="passkey-register-error"
                tabIndex={-1}
              >
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="font-medium" id="passkey-register-error-message">{error}</AlertDescription>
                <p className="mt-2 text-xs text-red-600">
                  {t('auth.passkey.errorHint')}
                </p>
              </Alert>
            )}

            <Button
              data-testid="webauthn-register"
              onClick={handleRegister}
              disabled={isRegistering}
              className="w-full transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              size="lg"
              aria-busy={isRegistering}
              aria-describedby={error ? 'passkey-register-error-message' : undefined}
            >
              {isRegistering ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  <span>{t('auth.passkey.creatingPasskey')}</span>
                  <span className="ml-2 text-xs opacity-75">{t('auth.passkey.followPrompt')}</span>
                </>
              ) : (
                <>
                  <Fingerprint className="h-4 w-4 mr-2" />
                  <span>{t('auth.passkey.create')}</span>
                </>
              )}
            </Button>

            <div className="text-xs text-gray-500 space-y-1">
              <p>• {t('auth.passkey.storedSecurely')}</p>
              <p>• {t('auth.passkey.noPasswordsTransmitted')}</p>
              <p>• {t('auth.passkey.worksWith')}</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default PasskeyRegister;
