'use client';

import React from 'react';

import { logger } from '@/lib/utils/logger';

import {
  useBiometricSupported,
  useInitializeBiometricState,
  useUserActions,
} from '../lib/store';

export type FeatureWrapperProps = {
  children: React.ReactNode;
  className?: string;
  feature?: string;
  mode?: 'register' | 'authenticate';
  onComplete?: () => Promise<void>;
  onCancel?: () => void;
  onError?: (error: Error) => void;
};

export const FeatureWrapper: React.FC<FeatureWrapperProps> = ({
  children,
  className = '',
  feature,
  mode = 'authenticate',
  onComplete,
  onCancel,
  onError,
}) => {
  const [isLoading, setIsLoading] = React.useState(false);

  useInitializeBiometricState({ fetchCredentials: mode === 'register' });

  const isSupported = useBiometricSupported();
  const { setBiometricError, setBiometricSuccess, setBiometricCredentials } = useUserActions();

  const handleWebAuthnAction = React.useCallback(async () => {
    if (!isSupported) {
      const error = new Error('WebAuthn not supported on this device');
      setBiometricError(error.message);
      onError?.(error);
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'register') {
        await handleRegistration(feature, setBiometricError, setBiometricSuccess, setBiometricCredentials);
      } else {
        await handleAuthentication(feature, setBiometricError);
      }
      await onComplete?.();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      setBiometricError(err.message);
      onError?.(err);
    } finally {
      setIsLoading(false);
    }
  }, [
    feature,
    isSupported,
    mode,
    onComplete,
    onError,
    setBiometricCredentials,
    setBiometricError,
    setBiometricSuccess,
  ]);

  return (
    <div className={`feature-wrapper ${className}`}>
      {children}
      {feature && (
        <div className="mt-4 rounded-lg border bg-gray-50 p-4">
          <h3 className="mb-2 font-semibold text-gray-900">
            WebAuthn {mode === 'register' ? 'Registration' : 'Authentication'}
          </h3>
          <p className="mb-3 text-sm text-gray-600">
            {isSupported
              ? `Secure ${mode} using your device's biometric or security key`
              : 'WebAuthn is not supported on this device'}
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleWebAuthnAction}
              disabled={!isSupported || isLoading}
              className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {isLoading ? 'Processing...' : mode === 'register' ? 'Register' : 'Authenticate'}
            </button>
            <button
              onClick={onCancel}
              className="rounded bg-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

async function handleRegistration(
  feature: string | undefined,
  setBiometricError: (message: string | null) => void,
  setBiometricSuccess: (success: boolean) => void,
  setBiometricCredentials: (hasCredentials: boolean) => void
) {
  try {
    const { beginRegister } = await import('@/features/auth/lib/webauthn/client');
    const result = await beginRegister();

    if (result.error) {
      throw new Error(result.error);
    }

    setBiometricError(null);
    setBiometricSuccess(true);
    setBiometricCredentials(true);
    logger.info('WebAuthn registration completed for feature:', { feature });
  } catch (error) {
    logger.error(
      'WebAuthn registration failed:',
      error instanceof Error ? error : new Error(String(error))
    );
    throw error;
  }
}

async function handleAuthentication(
  feature: string | undefined,
  setBiometricError: (message: string | null) => void
) {
  try {
    const { beginAuthenticate } = await import('@/features/auth/lib/webauthn/client');
    const result = await beginAuthenticate();

    if (result.error) {
      throw new Error(result.error);
    }

    setBiometricError(null);
    logger.info('WebAuthn authentication completed for feature:', { feature });
  } catch (error) {
    logger.error(
      'WebAuthn authentication failed:',
      error instanceof Error ? error : new Error(String(error))
    );
    throw error;
  }
}

export default FeatureWrapper;
