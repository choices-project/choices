'use client';

import * as React from 'react';

import { useAccessibleDialog } from '@/lib/accessibility/useAccessibleDialog';

import {
  useInitializeBiometricState,
  useUserActions,
} from '../lib/store';

export function PasskeyControls() {
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

  const handleBiometricAuth = React.useCallback(() => {
    setMode('biometric');
    updateError(null);
  }, [updateError]);

  const handleCrossDeviceAuth = React.useCallback(() => {
    setMode('crossDevice');
    updateError(null);
  }, [updateError]);

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

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <button 
          data-testid="webauthn-register" 
          className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors" 
          onClick={handleRegister}
        >
          Register a passkey
        </button>
        <button 
          data-testid="webauthn-login" 
          className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors" 
          onClick={handleLogin}
        >
          Sign in with passkey
        </button>
      </div>
      
      {/* Advanced options - collapsible */}
      <details className="text-sm">
        <summary className="cursor-pointer text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-2 py-1">
          Advanced options
        </summary>
        <div className="mt-2 space-y-2 pl-4">
          <button
            data-testid="register-additional-passkey-button"
            className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            onClick={handleRegister}
          >
            Register additional passkey
          </button>
          <button
            data-testid="view-credentials-button"
            className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            onClick={handleViewCredentials}
          >
            View credentials
          </button>
        </div>
      </details>

      {mode === 'register' && (
        <div
          className="modal p-4 border rounded"
          role="dialog"
          aria-modal="true"
          aria-labelledby="passkey-register-title"
          ref={registerDialogRef}
        >
          <p id="passkey-register-title" className="text-lg font-semibold">
            Registering passkey…
          </p>
          <div className="space-x-2 mt-4">
            <button data-testid="webauthn-biometric" className="btn" onClick={handleBiometricAuth}>
              Use biometrics
            </button>
            <button data-testid="webauthn-cross-device" className="btn" onClick={handleCrossDeviceAuth}>
              Use another device
            </button>
            <button
              data-testid="complete-registration"
              className="btn"
              onClick={handleCompleteRegistration}
              ref={registerPrimaryButtonRef}
            >
              Complete registration
            </button>
            <button data-testid="cancel-webauthn" className="btn" onClick={handleCancel}>
              Cancel
            </button>
          </div>
          <div data-testid="webauthn-qr" className="qr-placeholder mt-4 h-32 w-32 bg-gray-200" />
        </div>
      )}

      {mode === 'login' && (
        <div
          className="modal p-4 border rounded"
          role="dialog"
          aria-modal="true"
          aria-labelledby="passkey-login-title"
          ref={loginDialogRef}
        >
          <p id="passkey-login-title" className="text-lg font-semibold">
            Authenticate with passkey…
          </p>
          <div className="space-x-2 mt-4">
            <button data-testid="webauthn-biometric" className="btn" onClick={handleBiometricAuth}>
              Use biometrics
            </button>
            <button
              data-testid="complete-authentication"
              className="btn"
              onClick={handleCompleteAuthentication}
              ref={loginPrimaryButtonRef}
            >
              Complete authentication
            </button>
            <button data-testid="cancel-webauthn" className="btn" onClick={handleCancel}>
              Cancel
            </button>
          </div>
        </div>
      )}

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
          className="rounded border border-green-200 bg-green-50 p-4"
        >
          Registration successful!
        </div>
      )}
      {success === 'login-success' && (
        <div
          data-testid="login-success"
          className="rounded border border-green-200 bg-green-50 p-4"
        >
          Login successful!
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
          className="rounded border border-yellow-200 bg-yellow-50 p-4"
        >
          Operation cancelled
        </div>
      )}
      {error === 'operation-timeout' && (
        <div
          data-testid="operation-timeout"
          className="rounded border border-red-200 bg-red-50 p-4"
        >
          Operation timed out
        </div>
      )}
      {error === 'authentication-error' && (
        <div
          data-testid="authentication-error"
          className="rounded border border-red-200 bg-red-50 p-4"
        >
          No credentials found
        </div>
      )}
      {error === 'network-error' && (
        <div
          data-testid="webauthn-network-error"
          className="rounded border border-red-200 bg-red-50 p-4"
        >
          Network error
        </div>
      )}
      {error === 'server-error' && (
        <div
          data-testid="webauthn-server-error"
          className="rounded border border-red-200 bg-red-50 p-4"
        >
          Server error
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
