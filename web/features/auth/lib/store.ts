import { useEffect } from 'react';

import {
  useUserStore,
  useUserActions,
  useUser,
  useSession,
  useIsAuthenticated,
  useUserLoading,
  useUserError,
  useBiometric,
  useBiometricSupported,
  useBiometricAvailable,
  useBiometricCredentials,
  useBiometricRegistering,
  useBiometricError,
  useBiometricSuccess,
} from '@/lib/stores';

type InitializeBiometricOptions = {
  /**
   * Whether to fetch stored credentials; disable when only support status is needed.
   * Defaults to true.
   */
  fetchCredentials?: boolean;
};

export {
  useUserStore,
  useUserActions,
  useUser,
  useSession,
  useIsAuthenticated,
  useUserLoading,
  useUserError,
  useBiometric,
  useBiometricSupported,
  useBiometricAvailable,
  useBiometricCredentials,
  useBiometricRegistering,
  useBiometricError,
  useBiometricSuccess,
};

/**
 * Ensure biometric-related state is initialized in the user store.
 */
export function useInitializeBiometricState(options?: InitializeBiometricOptions) {
  const { fetchCredentials = true } = options ?? {};

  const isSupported = useBiometricSupported();
  const isAvailable = useBiometricAvailable();
  const hasCredentials = useBiometricCredentials();
  const { 
    setBiometricSupported,
    setBiometricAvailable,
    setBiometricCredentials,
    setBiometricError,
  } = useUserActions();

  useEffect(() => {
    let active = true;

    async function initialize() {
      if (typeof window === 'undefined') {
        return;
      }

      try {
        const {
          isWebAuthnSupported,
          isBiometricAvailable,
          getUserCredentials,
        } = await import('@/features/auth/lib/webauthn/client');

        if (!active) {
          return;
        }

        if (isSupported === null) {
          setBiometricSupported(isWebAuthnSupported());
        }

        if (isAvailable === null) {
          const available = await isBiometricAvailable();
          if (!active) {
            return;
          }
          setBiometricAvailable(available);
        }

        const shouldFetchCredentials =
          fetchCredentials &&
          hasCredentials === null &&
          (isAvailable ?? false);

        if (shouldFetchCredentials) {
          const credentials = await getUserCredentials();
          if (!active) {
            return;
          }
          setBiometricCredentials(Array.isArray(credentials) && credentials.length > 0);
        }
      } catch (error) {
        if (!active) {
          return;
        }
        const message =
          error instanceof Error
            ? error.message
            : 'Failed to initialize biometric state';
        setBiometricError(message);
      }
    }

    const needsInitialization =
      typeof window !== 'undefined' &&
      (isSupported === null ||
        isAvailable === null ||
        (fetchCredentials && hasCredentials === null));

    if (needsInitialization) {
      void initialize();
    }

    return () => {
      active = false;
    };
  }, [
    fetchCredentials,
    hasCredentials,
    isAvailable,
    isSupported,
    setBiometricAvailable,
    setBiometricCredentials,
    setBiometricError,
    setBiometricSupported,
  ]);
}

