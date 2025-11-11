'use client';

import * as React from 'react';

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

  return (
    <div className="space-y-4">
      <div className="space-x-2">
        <button data-testid="webauthn-register" className="btn" onClick={handleRegister}>
          Register a passkey
        </button>
        <button data-testid="webauthn-login" className="btn" onClick={handleLogin}>
          Sign in with passkey
        </button>
        <button
          data-testid="register-additional-passkey-button"
          className="btn"
          onClick={handleRegister}
        >
          Register additional passkey
        </button>
        <button
          data-testid="view-credentials-button"
          className="btn"
          onClick={handleViewCredentials}
        >
          View credentials
        </button>
      </div>

      {mode === 'register' && (
        <div
          data-testid="webauthn-prompt"
          role="dialog"
          aria-modal="true"
          className="modal rounded border p-4"
        >
          <p>Registering passkey…</p>
          <div className="mt-4 space-x-2">
            <button
              data-testid="webauthn-biometric-button"
              className="btn"
              onClick={handleBiometricAuth}
            >
              Use biometrics
            </button>
            <button
              data-testid="webauthn-cross-device-button"
              className="btn"
              onClick={handleCrossDeviceAuth}
            >
              Use another device
            </button>
            <button
              data-testid="complete-registration-button"
              className="btn"
              onClick={handleCompleteRegistration}
            >
              Complete registration
            </button>
            <button data-testid="cancel-webauthn-button" className="btn" onClick={handleCancel}>
              Cancel
            </button>
          </div>
          <div data-testid="webauthn-qr" className="qr-placeholder mt-4 h-32 w-32 bg-gray-200" />
        </div>
      )}

      {mode === 'login' && (
        <div
          data-testid="webauthn-auth-prompt"
          role="dialog"
          aria-modal="true"
          className="modal rounded border p-4"
        >
          <p>Authenticate with passkey…</p>
          <div className="mt-4 space-x-2">
            <button
              data-testid="webauthn-biometric-button"
              className="btn"
              onClick={handleBiometricAuth}
            >
              Use biometrics
            </button>
            <button
              data-testid="complete-authentication-button"
              className="btn"
              onClick={handleCompleteAuthentication}
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
          data-testid="webauthn-biometric-prompt"
          role="dialog"
          aria-modal="true"
          className="modal rounded border p-4"
        >
          <p>Biometric authentication…</p>
          <div className="mt-4 space-x-2">
            <button
              data-testid="complete-biometric-auth-button"
              className="btn"
              onClick={handleCompleteAuthentication}
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
        <div className="modal rounded border p-4">
          <p>Cross-device authentication…</p>
          <div data-testid="webauthn-qr" className="qr-placeholder mt-4 h-32 w-32 bg-gray-200" />
          <div className="mt-4 space-x-2">
            <button data-testid="simulate-qr-scan-button" className="btn">
              Simulate QR scan
            </button>
            <button
              data-testid="complete-cross-device-auth-button"
              className="btn"
              onClick={handleCompleteAuthentication}
            >
              Complete cross-device auth
            </button>
            <button data-testid="cancel-webauthn-button" className="btn" onClick={handleCancel}>
              Cancel
            </button>
          </div>
          <div data-testid="cross-device-prompt" className="mt-4 rounded bg-blue-50 p-2">
            Cross-device authentication prompt
          </div>
        </div>
      )}

      {mode === 'viewing' && (
        <div className="modal rounded border p-4">
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
            <button
              data-testid="remove-credential-button"
              className="btn"
              onClick={handleRemoveCredential}
            >
              Remove credential
            </button>
            <button
              data-testid="confirm-removal-button"
              className="btn"
              onClick={handleRemoveCredential}
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
    </div>
  );
}

export default PasskeyControls;
