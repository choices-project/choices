'use client';

import * as React from 'react';

import { T } from '@/lib/testing/testIds';
import { useAccessibleDialog } from '@/lib/accessibility/useAccessibleDialog';

export function PasskeyControls() {
  const [mode, setMode] = React.useState<
    'idle' | 'register' | 'login' | 'viewing' | 'crossDevice' | 'biometric'
  >('idle');
  const [credentials, setCredentials] = React.useState<Array<{ id: string; name: string }>>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const handleRegister = React.useCallback(() => {
    setMode('register');
    setError(null);
    setSuccess(null);
  }, []);

  const handleLogin = React.useCallback(() => {
    setMode('login');
    setError(null);
    setSuccess(null);
  }, []);

  const handleCompleteRegistration = React.useCallback(() => {
    setSuccess('registration-success');
    setMode('idle');
  }, []);

  const handleCompleteAuthentication = React.useCallback(() => {
    setSuccess('login-success');
    setMode('idle');
  }, []);

  const handleBiometricAuth = React.useCallback(() => {
    setMode('biometric');
    setError(null);
  }, []);

  const handleCrossDeviceAuth = React.useCallback(() => {
    setMode('crossDevice');
    setError(null);
  }, []);

  const handleViewCredentials = React.useCallback(() => {
    setMode('viewing');
  }, []);

  const handleRemoveCredential = React.useCallback(() => {
    setCredentials([]);
    setSuccess('credential-removed-success');
  }, []);

  const handleCancel = React.useCallback(() => {
    setMode('idle');
    setError('operation-cancelled');
  }, []);

  const handleNetworkError = React.useCallback(() => {
    setError('network-error');
  }, []);

  const handleServerError = React.useCallback(() => {
    setError('server-error');
  }, []);

  const registerDialogRef = React.useRef<HTMLDivElement>(null);
  const loginDialogRef = React.useRef<HTMLDivElement>(null);
  const biometricDialogRef = React.useRef<HTMLDivElement>(null);
  const registerPrimaryRef = React.useRef<HTMLButtonElement>(null);
  const loginPrimaryRef = React.useRef<HTMLButtonElement>(null);
  const biometricPrimaryRef = React.useRef<HTMLButtonElement>(null);

  const closeDialog = React.useCallback(() => {
    setMode('idle');
  }, []);

  useAccessibleDialog({
    isOpen: mode === 'register',
    dialogRef: registerDialogRef,
    ...(mode === 'register'
      ? {
          initialFocusRef: registerPrimaryRef,
          ariaLabelId: 'harness-register-title',
          liveMessage: 'Register passkey prompt opened.',
        }
      : {}),
    onClose: closeDialog,
  });

  useAccessibleDialog({
    isOpen: mode === 'login',
    dialogRef: loginDialogRef,
    ...(mode === 'login'
      ? {
          initialFocusRef: loginPrimaryRef,
          ariaLabelId: 'harness-login-title',
          liveMessage: 'Authenticate with passkey prompt opened.',
        }
      : {}),
    onClose: closeDialog,
  });

  useAccessibleDialog({
    isOpen: mode === 'biometric',
    dialogRef: biometricDialogRef,
    ...(mode === 'biometric'
      ? {
          initialFocusRef: biometricPrimaryRef,
          ariaLabelId: 'harness-biometric-title',
          liveMessage: 'Biometric authentication prompt opened.',
        }
      : {}),
    onClose: closeDialog,
  });

  return (
    <div className="space-y-4">
      <div className="space-x-2">
        <button data-testid={T.webauthn.register} className="btn" onClick={handleRegister}>
          Register a passkey
        </button>
        <button data-testid={T.webauthn.login} className="btn" onClick={handleLogin}>
          Sign in with passkey
        </button>
        <button data-testid="register-additional-passkey-button" className="btn" onClick={handleRegister}>
          Register additional passkey
        </button>
        <button data-testid="view-credentials-button" className="btn" onClick={handleViewCredentials}>
          View credentials
        </button>
      </div>

      {mode === 'register' && (
        <div
          data-testid={T.webauthn.prompt}
          role="dialog"
          aria-modal="true"
          aria-labelledby="harness-register-title"
          className="modal p-4 border rounded"
          ref={registerDialogRef}
        >
          <p id="harness-register-title">Registering passkey…</p>
          <div className="space-x-2 mt-4">
            <button data-testid={T.webauthn.biometricButton} className="btn" onClick={handleBiometricAuth}>
              Use biometrics
            </button>
            <button data-testid={T.webauthn.crossDeviceButton} className="btn" onClick={handleCrossDeviceAuth}>
              Use another device
            </button>
            <button
              data-testid="complete-registration-button"
              className="btn"
              onClick={handleCompleteRegistration}
              ref={registerPrimaryRef}
            >
              Complete registration
            </button>
            <button data-testid="cancel-webauthn-button" className="btn" onClick={handleCancel}>
              Cancel
            </button>
          </div>
          <div data-testid={T.webauthn.qr} className="qr-placeholder w-32 h-32 bg-gray-200 mt-4" />
        </div>
      )}

      {mode === 'login' && (
        <div
          data-testid={T.webauthn.authPrompt}
          role="dialog"
          aria-modal="true"
          aria-labelledby="harness-login-title"
          className="modal p-4 border rounded"
          ref={loginDialogRef}
        >
          <p id="harness-login-title">Authenticate with passkey…</p>
          <div className="space-x-2 mt-4">
            <button data-testid={T.webauthn.biometricButton} className="btn" onClick={handleBiometricAuth}>
              Use biometrics
            </button>
            <button
              data-testid="complete-authentication-button"
              className="btn"
              onClick={handleCompleteAuthentication}
              ref={loginPrimaryRef}
            >
              Complete authentication
            </button>
            <button data-testid="cancel-webauthn-button" className="btn" onClick={handleCancel}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {mode === 'biometric' && (
        <div
          data-testid={T.webauthn.biometricPrompt}
          role="dialog"
          aria-modal="true"
          aria-labelledby="harness-biometric-title"
          className="modal p-4 border rounded"
          ref={biometricDialogRef}
        >
          <p id="harness-biometric-title">Biometric authentication…</p>
          <div className="space-x-2 mt-4">
            <button
              data-testid="complete-biometric-auth-button"
              className="btn"
              onClick={handleCompleteAuthentication}
              ref={biometricPrimaryRef}
            >
              Complete biometric auth
            </button>
            <button data-testid="cancel-webauthn-button" className="btn" onClick={handleCancel}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {mode === 'crossDevice' && (
        <div className="modal p-4 border rounded">
          <p>Cross-device authentication…</p>
          <div data-testid={T.webauthn.qr} className="qr-placeholder w-32 h-32 bg-gray-200 mt-4" />
          <div className="space-x-2 mt-4">
            <button data-testid="simulate-qr-scan-button" className="btn">
              Simulate QR scan
            </button>
            <button data-testid="complete-cross-device-auth-button" className="btn" onClick={handleCompleteAuthentication}>
              Complete cross-device auth
            </button>
            <button data-testid="cancel-webauthn-button" className="btn" onClick={handleCancel}>
              Cancel
            </button>
          </div>
          <div data-testid="cross-device-prompt" className="mt-4 p-2 bg-blue-50 rounded">
            Cross-device authentication prompt
          </div>
        </div>
      )}

      {mode === 'viewing' && (
        <div className="modal p-4 border rounded">
          <h3>Manage Credentials</h3>
          <div data-testid="credential-list" className="mt-4">
            {credentials.map((cred) => (
              <div key={cred.id} data-testid="credential-item" className="p-2 border rounded mb-2">
                {cred.name}
              </div>
            ))}
            {credentials.length === 0 && <p>No credentials found</p>}
          </div>
          <div className="space-x-2 mt-4">
            <button data-testid="remove-credential-button" className="btn" onClick={handleRemoveCredential}>
              Remove credential
            </button>
            <button data-testid="confirm-removal-button" className="btn" onClick={handleRemoveCredential}>
              Confirm removal
            </button>
            <button className="btn" onClick={() => setMode('idle')}>
              Close
            </button>
          </div>
        </div>
      )}

      {error && (
        <p data-testid="webauthn-error" className="text-red-600">
          {error}
        </p>
      )}

      {success && (
        <p data-testid="webauthn-success" className="text-green-600">
          {success}
        </p>
      )}

      <div className="space-x-2">
        <button className="btn" onClick={handleNetworkError}>
          Simulate network error
        </button>
        <button className="btn" onClick={handleServerError}>
          Simulate server error
        </button>
      </div>
    </div>
  );
}
