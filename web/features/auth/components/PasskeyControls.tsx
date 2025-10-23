'use client';
import * as React from 'react';

import { T } from '@/tests/registry/testIds';

export function PasskeyControls() {
  const [mode, setMode] = React.useState<'idle'|'register'|'login'|'viewing'|'crossDevice'|'biometric'>('idle');
  const [credentials, setCredentials] = React.useState<Array<{id: string, name: string}>>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const handleRegister = async () => {
    setMode('register');
    setError(null);
    setSuccess(null);
  };

  const handleLogin = async () => {
    setMode('login');
    setError(null);
    setSuccess(null);
  };

  const handleCompleteRegistration = async () => {
    // Mock successful registration
    setSuccess('registration-success');
    setMode('idle');
  };

  const handleCompleteAuthentication = async () => {
    // Mock successful authentication
    setSuccess('login-success');
    setMode('idle');
  };

  const handleBiometricAuth = async () => {
    setMode('biometric');
    setError(null);
  };

  const handleCrossDeviceAuth = async () => {
    setMode('crossDevice');
    setError(null);
  };

  const handleViewCredentials = () => {
    setMode('viewing');
  };

  const handleRemoveCredential = async () => {
    setCredentials([]);
    setSuccess('credential-removed-success');
  };

  const handleCancel = () => {
    setMode('idle');
    setError('operation-cancelled');
  };

  const handleNetworkError = () => {
    setError('network-error');
  };

  const handleServerError = () => {
    setError('server-error');
  };

  return (
    <div className="space-y-4">
      {/* Main buttons */}
      <div className="space-x-2">
        <button 
          data-testid={T.webauthn.register} 
          className="btn" 
          onClick={handleRegister}
        >
          Register a passkey
        </button>
        <button 
          data-testid={T.webauthn.login} 
          className="btn" 
          onClick={handleLogin}
        >
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

      {/* Registration prompt */}
      {mode === 'register' && (
        <div data-testid={T.webauthn.prompt} role="dialog" aria-modal="true" className="modal p-4 border rounded">
          <p>Registering passkey…</p>
          <div className="space-x-2 mt-4">
            <button data-testid={T.webauthn.biometricButton} className="btn" onClick={handleBiometricAuth}>
              Use biometrics
            </button>
            <button data-testid={T.webauthn.crossDeviceButton} className="btn" onClick={handleCrossDeviceAuth}>
              Use another device
            </button>
            <button data-testid="complete-registration-button" className="btn" onClick={handleCompleteRegistration}>
              Complete registration
            </button>
            <button data-testid="cancel-webauthn-button" className="btn" onClick={handleCancel}>
              Cancel
            </button>
          </div>
          <div data-testid={T.webauthn.qr} className="qr-placeholder w-32 h-32 bg-gray-200 mt-4" />
        </div>
      )}

      {/* Authentication prompt */}
      {mode === 'login' && (
        <div data-testid={T.webauthn.authPrompt} role="dialog" aria-modal="true" className="modal p-4 border rounded">
          <p>Authenticate with passkey…</p>
          <div className="space-x-2 mt-4">
            <button data-testid={T.webauthn.biometricButton} className="btn" onClick={handleBiometricAuth}>
              Use biometrics
            </button>
            <button data-testid="complete-authentication-button" className="btn" onClick={handleCompleteAuthentication}>
              Complete authentication
            </button>
            <button data-testid="cancel-webauthn-button" className="btn" onClick={handleCancel}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Biometric prompt */}
      {mode === 'biometric' && (
        <div data-testid={T.webauthn.biometricPrompt} role="dialog" aria-modal="true" className="modal p-4 border rounded">
          <p>Biometric authentication…</p>
          <div className="space-x-2 mt-4">
            <button data-testid="complete-biometric-auth-button" className="btn" onClick={handleCompleteAuthentication}>
              Complete biometric auth
            </button>
            <button data-testid="cancel-webauthn-button" className="btn" onClick={handleCancel}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Cross-device authentication */}
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

      {/* Credential management */}
      {mode === 'viewing' && (
        <div className="modal p-4 border rounded">
          <h3>Manage Credentials</h3>
          <div data-testid="credential-list" className="mt-4">
            {credentials.map((cred) => (
              <div key={cred.id} data-testid="credential-item" className="p-2 border rounded mb-2">
                {cred.name}
              </div>
            ))}
            {credentials.length === 0 && (
              <p>No credentials found</p>
            )}
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

      {/* Success messages */}
      {success === 'registration-success' && (
        <div data-testid="registration-success" className="p-4 bg-green-50 border border-green-200 rounded">
          Registration successful!
        </div>
      )}
      {success === 'login-success' && (
        <div data-testid="login-success" className="p-4 bg-green-50 border border-green-200 rounded">
          Login successful!
        </div>
      )}
      {success === 'biometric-success' && (
        <div data-testid="biometric-success" className="p-4 bg-green-50 border border-green-200 rounded">
          Biometric authentication successful!
        </div>
      )}
      {success === 'cross-device-success' && (
        <div data-testid="cross-device-success" className="p-4 bg-green-50 border border-green-200 rounded">
          Cross-device authentication successful!
        </div>
      )}
      {success === 'credential-removed-success' && (
        <div data-testid="credential-removed-success" className="p-4 bg-green-50 border border-green-200 rounded">
          Credential removed successfully!
        </div>
      )}

      {/* Error messages */}
      {error === 'operation-cancelled' && (
        <div data-testid="operation-cancelled" className="p-4 bg-yellow-50 border border-yellow-200 rounded">
          Operation cancelled
        </div>
      )}
      {error === 'operation-timeout' && (
        <div data-testid="operation-timeout" className="p-4 bg-red-50 border border-red-200 rounded">
          Operation timed out
        </div>
      )}
      {error === 'authentication-error' && (
        <div data-testid="authentication-error" className="p-4 bg-red-50 border border-red-200 rounded">
          No credentials found
        </div>
      )}
      {error === 'network-error' && (
        <div data-testid={T.webauthn.networkError} className="p-4 bg-red-50 border border-red-200 rounded">
          Network error
        </div>
      )}
      {error === 'server-error' && (
        <div data-testid={T.webauthn.serverError} className="p-4 bg-red-50 border border-red-200 rounded">
          Server error
        </div>
      )}

      {/* Test buttons for error simulation */}
      <div className="space-x-2 mt-4">
        <button className="btn btn-sm" onClick={handleNetworkError}>
          Simulate Network Error
        </button>
        <button className="btn btn-sm" onClick={handleServerError}>
          Simulate Server Error
        </button>
        <button className="btn btn-sm" onClick={() => setError('operation-timeout')}>
          Simulate Timeout
        </button>
      </div>
    </div>
  );
}

export default PasskeyControls;
