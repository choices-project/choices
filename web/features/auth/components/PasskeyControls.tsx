'use client';

import * as React from 'react';

import { useAccessibleDialog } from '@/lib/accessibility/useAccessibleDialog';
import { useIsAuthenticated } from '@/lib/stores';

import PasskeyLogin from './PasskeyLogin';
import PasskeyRegister from './PasskeyRegister';
import {
  useInitializeBiometricState,
  useUserActions,
} from '../lib/store';

export function PasskeyControls() {
  // Check if user is authenticated - registration requires authentication
  const isAuthenticated = useIsAuthenticated();

  const [mode, setMode] = React.useState<
    'idle' | 'register' | 'login' | 'viewing' | 'crossDevice' | 'biometric'
  >('idle');
  const [credentials, setCredentials] = React.useState<Array<{ id: string; name: string }>>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const registerDialogRef = React.useRef<HTMLDivElement>(null);
  const loginDialogRef = React.useRef<HTMLDivElement>(null);
  const biometricDialogRef = React.useRef<HTMLDivElement>(null);
  const crossDeviceDialogRef = React.useRef<HTMLDivElement>(null);
  const credentialDialogRef = React.useRef<HTMLDivElement>(null);

  const registerPrimaryButtonRef = React.useRef<HTMLButtonElement>(null);
  const loginPrimaryButtonRef = React.useRef<HTMLButtonElement>(null);
  const biometricPrimaryButtonRef = React.useRef<HTMLButtonElement>(null);
  const crossDevicePrimaryButtonRef = React.useRef<HTMLButtonElement>(null);
  const credentialPrimaryButtonRef = React.useRef<HTMLButtonElement>(null);

  useInitializeBiometricState();

  const { setBiometricError, setBiometricSuccess, setBiometricCredentials } = useUserActions();

  const updateError = React.useCallback(
    (nextError: string | null) => {
      setError(nextError);
      setBiometricError(nextError);
    },
    [setBiometricError]
  );

  const updateSuccess = React.useCallback(
    (nextSuccess: string | null) => {
      setSuccess(nextSuccess);
      if (nextSuccess === 'registration-success') {
        setBiometricSuccess(true);
        setBiometricCredentials(true);
      } else if (nextSuccess === 'credential-removed-success') {
        setBiometricCredentials(false);
        setBiometricSuccess(false);
      } else if (!nextSuccess) {
        setBiometricSuccess(false);
      }
    },
    [setBiometricCredentials, setBiometricSuccess]
  );

  const handleRegister = React.useCallback(() => {
    setMode('register');
    updateError(null);
    updateSuccess(null);
  }, [updateError, updateSuccess]);

  const handleLogin = React.useCallback(() => {
    setMode('login');
    updateError(null);
    updateSuccess(null);
  }, [updateError, updateSuccess]);

  const handleCompleteRegistration = React.useCallback(() => {
    updateSuccess('registration-success');
    setMode('idle');
  }, [updateSuccess]);

  const handleCompleteAuthentication = React.useCallback(() => {
    updateSuccess('login-success');
    setMode('idle');
  }, [updateSuccess]);

  // Note: These handlers are kept for potential future use but currently not used
  // as we're using PasskeyRegister/PasskeyLogin components directly
  // They may be used in the biometric/crossDevice dialogs if those are re-enabled

  const handleViewCredentials = React.useCallback(() => {
    setMode('viewing');
  }, []);

  const handleRemoveCredential = React.useCallback(() => {
    setCredentials([]);
    updateSuccess('credential-removed-success');
  }, [updateSuccess]);

  const handleCancel = React.useCallback(() => {
    setMode('idle');
    updateError('operation-cancelled');
  }, [updateError]);

  const handleNetworkError = React.useCallback(() => {
    updateError('network-error');
  }, [updateError]);

  const handleServerError = React.useCallback(() => {
    updateError('server-error');
  }, [updateError]);

  const handleCloseDialog = React.useCallback(() => {
    setMode('idle');
  }, []);

  useAccessibleDialog({
    isOpen: mode === 'register',
    dialogRef: registerDialogRef,
    ...(mode === 'register' ? { initialFocusRef: registerPrimaryButtonRef, ariaLabelId: 'passkey-register-title' } : {}),
    onClose: handleCloseDialog,
    liveMessage: 'Register a new passkey dialog opened.',
  });

  useAccessibleDialog({
    isOpen: mode === 'login',
    dialogRef: loginDialogRef,
    ...(mode === 'login' ? { initialFocusRef: loginPrimaryButtonRef, ariaLabelId: 'passkey-login-title' } : {}),
    onClose: handleCloseDialog,
    liveMessage: 'Authenticate with passkey dialog opened.',
  });

  useAccessibleDialog({
    isOpen: mode === 'biometric',
    dialogRef: biometricDialogRef,
    ...(mode === 'biometric'
      ? { initialFocusRef: biometricPrimaryButtonRef, ariaLabelId: 'passkey-biometric-title' }
      : {}),
    onClose: handleCloseDialog,
    liveMessage: 'Biometric authentication dialog opened.',
  });

  useAccessibleDialog({
    isOpen: mode === 'crossDevice',
    dialogRef: crossDeviceDialogRef,
    ...(mode === 'crossDevice'
      ? { initialFocusRef: crossDevicePrimaryButtonRef, ariaLabelId: 'passkey-cross-device-title' }
      : {}),
    onClose: handleCloseDialog,
    liveMessage: 'Cross-device authentication dialog opened.',
  });

  useAccessibleDialog({
    isOpen: mode === 'viewing',
    dialogRef: credentialDialogRef,
    ...(mode === 'viewing'
      ? { initialFocusRef: credentialPrimaryButtonRef, ariaLabelId: 'passkey-credential-title' }
      : {}),
    onClose: handleCloseDialog,
    liveMessage: 'Manage passkey credentials dialog opened.',
  });

  // Use a simpler approach - show the actual components based on mode
  if (mode === 'register') {
    return (
      <div className="space-y-4">
        <PasskeyRegister
          onSuccess={() => {
            handleCompleteRegistration();
          }}
          onError={(error) => {
            updateError(error);
          }}
        />
        <button
          data-testid="cancel-webauthn"
          className="w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 rounded-md transition-colors"
          onClick={handleCancel}
        >
          Cancel
        </button>
      </div>
    );
  }

  if (mode === 'login') {
    return (
      <div className="space-y-4">
        <PasskeyLogin
          onSuccess={() => {
            handleCompleteAuthentication();
          }}
          onError={(error) => {
            updateError(error);
          }}
        />
        <button
          data-testid="cancel-webauthn"
          className="w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 rounded-md transition-colors"
          onClick={handleCancel}
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Simplified, cleaner interface */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className={`flex flex-col ${isAuthenticated ? 'sm:flex-row' : ''} gap-3`}>
          {/* Only show "Create Passkey" button if user is authenticated */}
          {isAuthenticated && (
            <button
              data-testid="webauthn-register"
              className="flex-1 px-4 py-3 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleRegister}
            >
              <span className="flex items-center justify-center gap-2">
                <span>🔐</span>
                <span>Create Passkey</span>
              </span>
            </button>
          )}
          <button
            data-testid="webauthn-login"
            className={`${isAuthenticated ? 'flex-1' : 'w-full'} px-4 py-3 text-sm font-medium text-blue-600 bg-white border border-blue-600 rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed`}
            onClick={handleLogin}
          >
            <span className="flex items-center justify-center gap-2">
              <span>🔑</span>
              <span>Sign In with Passkey</span>
            </span>
          </button>
        </div>

        {/* Helpful info text */}
        <p className="mt-3 text-xs text-gray-500 text-center">
          Use your device&apos;s fingerprint, face ID, or security key for secure, passwordless authentication
        </p>
      </div>

      {/* Advanced options - collapsible, less prominent */}
      <details className="text-sm">
        <summary className="cursor-pointer text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-2 py-1 text-xs">
          Advanced options
        </summary>
        <div className="mt-2 space-y-2 pl-4">
          <button
            data-testid="register-additional-passkey-button"
            className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            onClick={handleRegister}
          >
            Register additional passkey
          </button>
          <button
            data-testid="view-credentials-button"
            className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            onClick={handleViewCredentials}
          >
            View credentials
          </button>
        </div>
      </details>

      {mode === 'biometric' && (
        <div
          className="modal p-4 border rounded"
          role="dialog"
          aria-modal="true"
          aria-labelledby="passkey-biometric-title"
          ref={biometricDialogRef}
        >
          <p id="passkey-biometric-title" className="text-lg font-semibold">
            Biometric authentication…
          </p>
          <div className="space-x-2 mt-4">
            <button
              data-testid="complete-biometric-auth"
              className="btn"
              onClick={handleCompleteAuthentication}
              ref={biometricPrimaryButtonRef}
            >
              Complete biometric auth
            </button>
            <button data-testid="cancel-webauthn" className="btn" onClick={handleCancel}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {mode === 'crossDevice' && (
        <div
          className="modal p-4 border rounded"
          role="dialog"
          aria-modal="true"
          aria-labelledby="passkey-cross-device-title"
          ref={crossDeviceDialogRef}
        >
          <p id="passkey-cross-device-title" className="text-lg font-semibold">
            Cross-device authentication…
          </p>
          <div data-testid="webauthn-qr" className="qr-placeholder mt-4 h-32 w-32 bg-gray-200" />
          <div className="mt-4 space-x-2">
            <button data-testid="simulate-qr-scan" className="btn">
              Simulate QR scan
            </button>
            <button
              data-testid="complete-cross-device-auth"
              className="btn"
              onClick={handleCompleteAuthentication}
              ref={crossDevicePrimaryButtonRef}
            >
              Complete cross-device auth
            </button>
            <button data-testid="cancel-webauthn" className="btn" onClick={handleCancel}>
              Cancel
            </button>
          </div>
          <div data-testid="cross-device-prompt" className="mt-4 rounded bg-blue-50 p-2">
            Cross-device authentication prompt
          </div>
        </div>
      )}

      {mode === 'viewing' && (
        <div
          className="modal p-4 border rounded"
          role="dialog"
          aria-modal="true"
          aria-labelledby="passkey-credential-title"
          ref={credentialDialogRef}
        >
          <h3>Manage Credentials</h3>
          <div data-testid="credential-list" className="mt-4">
            {credentials.map((cred) => (
              <div key={cred.id} data-testid="credential-item" className="mb-2 rounded border p-2">
                {cred.name}
              </div>
            ))}
            {credentials.length === 0 && <p>No credentials found</p>}
          </div>
          <div className="mt-4 space-x-2">
            <button data-testid="remove-credential" className="btn" onClick={handleRemoveCredential}>
              Remove credential
            </button>
            <button
              data-testid="confirm-removal"
              className="btn"
              onClick={handleRemoveCredential}
              ref={credentialPrimaryButtonRef}
            >
              Confirm removal
            </button>
            <button className="btn" onClick={() => setMode('idle')}>
              Close
            </button>
          </div>
        </div>
      )}

      {success === 'registration-success' && (
        <div
          data-testid="registration-success"
          className="rounded-lg border border-green-300 bg-green-50 p-4 animate-in fade-in slide-in-from-top-2 duration-300"
        >
          <div className="flex items-center gap-2">
            <span className="text-green-600 text-xl">✓</span>
            <div>
              <p className="font-semibold text-green-800">Registration successful!</p>
              <p className="text-sm text-green-700">Your passkey has been created and saved.</p>
            </div>
          </div>
        </div>
      )}
      {success === 'login-success' && (
        <div
          data-testid="login-success"
          className="rounded-lg border border-green-300 bg-green-50 p-4 animate-in fade-in slide-in-from-top-2 duration-300"
        >
          <div className="flex items-center gap-2">
            <span className="text-green-600 text-xl">✓</span>
            <div>
              <p className="font-semibold text-green-800">Login successful!</p>
              <p className="text-sm text-green-700">You have been signed in successfully.</p>
            </div>
          </div>
        </div>
      )}
      {success === 'biometric-success' && (
        <div
          data-testid="biometric-success"
          className="rounded border border-green-200 bg-green-50 p-4"
        >
          Biometric authentication successful!
        </div>
      )}
      {success === 'cross-device-success' && (
        <div
          data-testid="cross-device-success"
          className="rounded border border-green-200 bg-green-50 p-4"
        >
          Cross-device authentication successful!
        </div>
      )}
      {success === 'credential-removed-success' && (
        <div
          data-testid="credential-removed-success"
          className="rounded border border-green-200 bg-green-50 p-4"
        >
          Credential removed successfully!
        </div>
      )}

      {error === 'operation-cancelled' && (
        <div
          data-testid="operation-cancelled"
          className="rounded-lg border border-yellow-300 bg-yellow-50 p-4 animate-in fade-in slide-in-from-top-2 duration-300"
        >
          <div className="flex items-center gap-2">
            <span className="text-yellow-600">⚠</span>
            <p className="text-sm font-medium text-yellow-800">Operation cancelled</p>
          </div>
        </div>
      )}
      {error === 'operation-timeout' && (
        <div
          data-testid="operation-timeout"
          className="rounded-lg border border-red-300 bg-red-50 p-4 animate-in fade-in slide-in-from-top-2 duration-300"
        >
          <div className="flex items-center gap-2">
            <span className="text-red-600">✗</span>
            <div>
              <p className="text-sm font-medium text-red-800">Operation timed out</p>
              <p className="text-xs text-red-700 mt-1">Please try again or use email/password authentication.</p>
            </div>
          </div>
        </div>
      )}
      {error === 'authentication-error' && (
        <div
          data-testid="authentication-error"
          className="rounded-lg border border-red-300 bg-red-50 p-4 animate-in fade-in slide-in-from-top-2 duration-300"
        >
          <div className="flex items-center gap-2">
            <span className="text-red-600">✗</span>
            <div>
              <p className="text-sm font-medium text-red-800">No credentials found</p>
              <p className="text-xs text-red-700 mt-1">Please register a passkey first or use email/password authentication.</p>
            </div>
          </div>
        </div>
      )}
      {error === 'network-error' && (
        <div
          data-testid="webauthn-network-error"
          className="rounded-lg border border-red-300 bg-red-50 p-4 animate-in fade-in slide-in-from-top-2 duration-300"
        >
          <div className="flex items-center gap-2">
            <span className="text-red-600">✗</span>
            <div>
              <p className="text-sm font-medium text-red-800">Network error</p>
              <p className="text-xs text-red-700 mt-1">Please check your connection and try again.</p>
            </div>
          </div>
        </div>
      )}
      {error === 'server-error' && (
        <div
          data-testid="webauthn-server-error"
          className="rounded-lg border border-red-300 bg-red-50 p-4 animate-in fade-in slide-in-from-top-2 duration-300"
        >
          <div className="flex items-center gap-2">
            <span className="text-red-600">✗</span>
            <div>
              <p className="text-sm font-medium text-red-800">Server error</p>
              <p className="text-xs text-red-700 mt-1">Please try again later or use email/password authentication.</p>
            </div>
          </div>
        </div>
      )}

      {/* Simulation buttons - only show in development */}
      {(process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_ENABLE_E2E_HARNESS === '1') && (
        <div className="mt-4 space-x-2">
          <button className="btn btn-sm" onClick={handleNetworkError}>
            Simulate Network Error
          </button>
          <button className="btn btn-sm" onClick={handleServerError}>
            Simulate Server Error
          </button>
          <button className="btn btn-sm" onClick={() => updateError('operation-timeout')}>
            Simulate Timeout
          </button>
        </div>
      )}
    </div>
  );
}

export default PasskeyControls;
