'use client';

import React from 'react';

import { logger } from '@/lib/utils/logger';

import { WebAuthnPrivacyBadge } from './WebAuthnPrivacyBadge';
import { useInitializeBiometricState, useUserActions } from '../lib/store';


type Passkey = {
  id: string;
  device_label: string | null;
  last_used_at: string | null;
  device_info: any;
  created_at: string;
};

export function PasskeyManagement() {
  const [passkeys, setPasskeys] = React.useState<Passkey[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  useInitializeBiometricState();

  const { setBiometricCredentials, setBiometricError } = useUserActions();

  const loadPasskeys = React.useCallback(async () => {
    try {
      const response = await fetch('/api/v1/auth/webauthn/credentials');
      if (response.ok) {
        const data = await response.json();
        const credentials: Passkey[] = data.credentials ?? [];
        setPasskeys(credentials);
        setBiometricCredentials(credentials.length > 0);
      } else {
        const message = 'Failed to load passkeys';
        setError(message);
        setBiometricError(message);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load passkeys';
      setError(message);
      setBiometricError(message);
    } finally {
      setLoading(false);
    }
  }, [setBiometricCredentials, setBiometricError]);

  React.useEffect(() => {
    void loadPasskeys();
  }, [loadPasskeys]);

  const handleAddPasskey = React.useCallback(async () => {
    try {
      setError(null);
      setBiometricError(null);
      const { beginRegister } = await import('@/features/auth/lib/webauthn/client');
      const result = await beginRegister();
      if (result.success) {
        await loadPasskeys();
      } else {
        const message = result.error ?? 'Failed to add passkey';
        setError(message);
        setBiometricError(message);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add passkey';
      setError(message);
      setBiometricError(message);
    }
  }, [loadPasskeys, setBiometricError]);

  const handleRenamePasskey = React.useCallback(async (id: string, newLabel: string) => {
    try {
      logger.info('Rename passkey', { id, newLabel });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to rename passkey';
      setError(message);
      setBiometricError(message);
    }
  }, [setBiometricError]);

  const handleRevokePasskey = React.useCallback(async (id: string) => {
    try {
      logger.info('Revoke passkey', { id });
      await loadPasskeys();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to revoke passkey';
      setError(message);
      setBiometricError(message);
    }
  }, [loadPasskeys, setBiometricError]);

  if (loading) {
    return (
      <div className="passkey-management">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Your Passkeys</h3>
          <WebAuthnPrivacyBadge />
        </div>
        <div className="py-8 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
          <p className="mt-2 text-gray-600">Loading passkeys...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="passkey-management">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Your Passkeys</h3>
        <WebAuthnPrivacyBadge />
      </div>

      {error && (
        <div className="mb-4 rounded border border-red-400 bg-red-100 p-3 text-red-700">
          {error}
        </div>
      )}

      {passkeys.length === 0 ? (
        <div className="py-8 text-center">
          <div className="mb-4 text-4xl text-gray-400">🔐</div>
          <p className="mb-4 text-gray-600">
            No passkeys yet. Add one from this device—biometrics stay on your device.
          </p>
          <button
            onClick={handleAddPasskey}
            className="rounded bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
          >
            Add Passkey
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {passkeys.map((passkey) => (
            <PasskeyCard
              key={passkey.id}
              passkey={passkey}
              onRename={(newLabel) => handleRenamePasskey(passkey.id, newLabel)}
              onRevoke={() => handleRevokePasskey(passkey.id)}
            />
          ))}
          <button
            onClick={handleAddPasskey}
            className="w-full rounded-lg border-2 border-dashed border-gray-300 p-4 text-gray-600 transition-colors hover:border-gray-400"
          >
            + Add Another Passkey
          </button>
        </div>
      )}
    </div>
  );
}

function PasskeyCard({
  passkey,
  onRename,
  onRevoke
}: {
  passkey: Passkey;
  onRename: (label: string) => void;
  onRevoke: () => void;
}) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [newLabel, setNewLabel] = React.useState(passkey.device_label ?? 'Unnamed Device');

  const handleSave = () => {
    onRename(newLabel);
    setIsEditing(false);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never used';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1 text-sm"
              />
              <button
                onClick={handleSave}
                className="text-green-600 hover:text-green-700 text-sm"
              >
                Save
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="text-gray-600 hover:text-gray-700 text-sm"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div>
              <h4 className="font-medium">{passkey.device_label ?? 'Unnamed Device'}</h4>
              <p className="text-sm text-gray-600">
                Last used: {formatDate(passkey.last_used_at)}
              </p>
              <p className="text-sm text-gray-600">
                Added: {formatDate(passkey.created_at)}
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              Rename
            </button>
          )}
          <button
            onClick={onRevoke}
            className="text-red-600 hover:text-red-700 text-sm"
          >
            Revoke
          </button>
        </div>
      </div>
    </div>
  );
}
