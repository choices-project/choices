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

import { getSupabaseBrowserClient } from '@/utils/supabase/client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import logger from '@/lib/utils/logger';

import { useI18n } from '@/hooks/useI18n';

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

const hasSessionTokens = (
  value: unknown
): value is { access_token: string; refresh_token: string } => {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const session = value as { access_token?: unknown; refresh_token?: unknown };
  return typeof session.access_token === 'string' && typeof session.refresh_token === 'string';
};

export function PasskeyLogin({
  onSuccess,
  onError,
  className,
}: PasskeyLoginProps) {
  const { t } = useI18n();
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

      const session = result?.data?.session;
      if (!hasSessionTokens(session)) {
        throw new Error('Missing session data after passkey authentication');
      }

      const supabase = await getSupabaseBrowserClient();
      if (!supabase) {
        throw new Error('Unable to initialize auth session');
      }
      await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      });

      // Set success state immediately and ensure it persists
      setSuccess(true);
      setBiometricSuccess(true);
      
      // Force a small delay to ensure state updates propagate
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Verify success state was set
      setBiometricSuccess(true);
      
      onSuccess?.(result.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
      setError(errorMessage);
      setBiometricError(errorMessage);
      setBiometricSuccess(false);
      setSuccess(false);
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
          <span>{t('auth.passkey.loginTitle')}</span>
        </CardTitle>
        <CardDescription>
          {t('auth.passkey.loginDescription')}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {success ? (
          <div className="text-center space-y-4" data-testid="passkey-login-success">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto animate-in fade-in zoom-in duration-300" />
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-green-700">{t('auth.passkey.authSuccessful')}</h3>
              <p className="text-gray-600">
                {t('auth.passkey.signedIn')}
              </p>
              <p className="text-sm text-gray-500">
                {t('auth.passkey.redirecting')}
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
              {getAuthenticatorIcon()}
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">{t('auth.passkey.deviceAuth')}</p>
                <p className="text-xs text-blue-700">
                  {t('auth.passkey.deviceAuthDesc')}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
              <Key className="h-5 w-5 text-green-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900">{t('auth.passkey.registeredPasskeys')}</p>
                <p className="text-xs text-green-700">
                  {t('auth.passkey.registeredPasskeysDesc')}
                </p>
              </div>
            </div>

            {error && (
              <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2 duration-300">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="font-medium">{error}</AlertDescription>
                <p className="mt-2 text-xs text-red-600">
                  {t('auth.passkey.errorHint')}
                </p>
              </Alert>
            )}

            <Button
              onClick={handleLogin}
              disabled={isAuthenticating}
              className="w-full transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              size="lg"
            >
              {isAuthenticating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  <span>{t('auth.passkey.authenticating')}</span>
                  <span className="ml-2 text-xs opacity-75">{t('auth.passkey.followPrompt')}</span>
                </>
              ) : (
                <>
                  <Fingerprint className="h-4 w-4 mr-2" />
                  <span>{t('auth.passkey.signIn')}</span>
                </>
              )}
            </Button>

            <div className="text-xs text-gray-500 space-y-1">
              <p>• {t('auth.passkey.verifiedOnDevice')}</p>
              <p>• {t('auth.passkey.noPasswordsTransmitted')}</p>
              <p>• {t('auth.passkey.worksWith')}</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default PasskeyLogin;
