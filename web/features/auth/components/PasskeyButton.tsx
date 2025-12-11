'use client';

import React from 'react';

import { T } from '@/tests/registry/testIds';

import { logger } from '@/lib/utils/logger';

import WebAuthnPrompt from './WebAuthnPrompt';
import {
  useBiometricError,
  useBiometricRegistering,
  useBiometricSupported,
  useInitializeBiometricState,
  useUserActions,
} from '../lib/store';


type PasskeyButtonProps = {
  mode: 'register' | 'authenticate';
  primary?: boolean;
  disabled?: boolean;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  className?: string;
};

export function PasskeyButton({
  mode,
  primary = false,
  disabled = false,
  onSuccess,
  onError,
  className = '',
}: PasskeyButtonProps) {
  const [localLoading, setLocalLoading] = React.useState(false);
  const [showPrompt, setShowPrompt] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  useInitializeBiometricState({ fetchCredentials: mode === 'register' });

  const isSupported = useBiometricSupported();
  const storeRegistering = useBiometricRegistering();
  const storeError = useBiometricError();

  const {
    setBiometricRegistering,
    setBiometricError,
    setBiometricSuccess,
    setBiometricCredentials,
  } = useUserActions();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const loading = mode === 'register' ? storeRegistering || localLoading : localLoading;
  const error = storeError;

  const handleClick = React.useCallback(() => {
    if (loading || disabled) return;
    setShowPrompt(true);
  }, [disabled, loading]);

  const handlePromptComplete = React.useCallback(async () => {
    setLocalLoading(true);
    if (mode === 'register') {
      setBiometricRegistering(true);
      setBiometricError(null);
      setBiometricSuccess(false);
    }

    try {
      const { beginRegister, beginAuthenticate } = await import('@/features/auth/lib/webauthn/client');

      const result = mode === 'register' ? await beginRegister() : await beginAuthenticate();

      if (result.success) {
        if (mode === 'register') {
          setBiometricSuccess(true);
          setBiometricCredentials(true);
        }
        onSuccess?.();
      } else {
        const errorMsg = result.error ?? 'Operation failed';
        if (mode === 'register') {
          setBiometricError(errorMsg);
        }
        onError?.(errorMsg);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Something went wrong';
      if (mode === 'register') {
        setBiometricError(errorMsg);
      }
      onError?.(errorMsg);
    } finally {
      setLocalLoading(false);
      if (mode === 'register') {
        setBiometricRegistering(false);
      }
      setShowPrompt(false);
    }
  }, [
    mode,
    onError,
    onSuccess,
    setBiometricCredentials,
    setBiometricError,
    setBiometricRegistering,
    setBiometricSuccess,
  ]);

  const handlePromptCancel = React.useCallback(() => {
    setShowPrompt(false);
  }, []);

  const getButtonText = React.useCallback(() => {
    if (loading) {
      return mode === 'register' ? 'Creating...' : 'Signing in...';
    }

    return mode === 'register' ? 'Create Passkey' : 'Use Passkey (fast, no password)';
  }, [loading, mode]);

  const getIcon = React.useCallback(() => {
    if (loading) {
      return '⏳';
    }
    return '🔐';
  }, [loading]);

  const baseClasses = primary
    ? 'bg-blue-600 text-white hover:bg-blue-700'
    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50';

  if (!mounted || isSupported === null) {
    return null;
  }

  if (!isSupported) {
    return null;
  }

  return (
    <div className={className}>
      <button
        data-testid={
          mode === 'register' ? T.WEBAUTHN.WEBAUTHN_REGISTER : T.WEBAUTHN.WEBAUTHN_AUTHENTICATE
        }
        onClick={handleClick}
        disabled={loading || disabled}
        className={`
          w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium
          transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed
          ${baseClasses}
        `}
      >
        <span>{getIcon()}</span>
        <span>{getButtonText()}</span>
      </button>

      {error && mode === 'register' && (
        <div className="mt-2 rounded border border-red-400 bg-red-100 p-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {mode === 'register' && (
        <p className="mt-2 text-xs text-gray-600">
          Passkeys live on your device. We never see your fingerprint, face, or a reusable secret—only
          a public key.
        </p>
      )}

      {showPrompt && (
        <div className="mt-4" data-testid={T.WEBAUTHN.authPrompt}>
          <WebAuthnPrompt
            mode={mode}
            onComplete={handlePromptComplete}
            onCancel={handlePromptCancel}
            onError={(promptError) => {
              const errorMessage =
                promptError instanceof Error ? promptError.message : String(promptError);
              if (mode === 'register') {
                setBiometricError(errorMessage);
              }
              onError?.(errorMessage);
            }}
          >
            <div className="webauthn-prompt-content">
              <p>Please complete the authentication process...</p>
            </div>
          </WebAuthnPrompt>
        </div>
      )}
    </div>
  );
}

export function EmailLinkButton({
  primary = false,
  disabled = false,
  onSuccess,
  onError,
  className = '',
}: Omit<PasskeyButtonProps, 'mode'>) {
  const [loading, setLoading] = React.useState(false);

  const handleClick = React.useCallback(async () => {
    if (loading || disabled) return;

    setLoading(true);
    try {
      logger.info('Email link clicked');
      onSuccess?.();
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Email link failed');
    } finally {
      setLoading(false);
    }
  }, [disabled, loading, onError, onSuccess]);

  const baseClasses = primary
    ? 'bg-blue-600 text-white hover:bg-blue-700'
    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50';

  return (
    <button
      onClick={handleClick}
      disabled={loading || disabled}
      className={`
        w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium
        transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed
        ${baseClasses} ${className}
      `}
    >
      <span>📧</span>
      <span>{loading ? 'Sending...' : 'Email Link (secure login)'}</span>
    </button>
  );
}
