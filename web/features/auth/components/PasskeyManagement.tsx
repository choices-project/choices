'use client';

import React, { useState, useEffect } from 'react';


// Dynamic imports to avoid build-time decorator issues
// import { beginRegister } from '@/features/auth/lib/webauthn/client';
import { logger } from '@/lib/utils/logger';


import { WebAuthnPrivacyBadge } from './WebAuthnPrivacyBadge';

type Passkey = {
  id: string;
  device_label: string | null;
  last_used_at: string | null;
  device_info: any;
  created_at: string;
}

export function PasskeyManagement() {
  const [passkeys, setPasskeys] = useState<Passkey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPasskeys();
  }, []);

  const loadPasskeys = async () => {
    try {
      // Load passkeys via API endpoint
      const response = await fetch('/api/v1/auth/webauthn/credentials');
      if (response.ok) {
        const data = await response.json();
        setPasskeys(data.credentials || []);
      } else {
        setError('Failed to load passkeys');
      }
    } catch {
      setError('Failed to load passkeys');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPasskey = async () => {
    try {
      setError(null);
      // Dynamic import to avoid build-time decorator issues
      const { beginRegister } = await import('@/features/auth/lib/webauthn/client');
      const result = await beginRegister();
      if (result.success) {
        await loadPasskeys();
      } else {
        setError('Failed to add passkey');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add passkey');
    }
  };

  const handleRenamePasskey = async (id: string, newLabel: string) => {
    try {
      // Implement rename functionality
      logger.info('Rename passkey', { id, newLabel });
    } catch {
      setError('Failed to rename passkey');
    }
  };

  const handleRevokePasskey = async (id: string) => {
    try {
      // Implement revoke functionality
      logger.info('Revoke passkey', { id });
      await loadPasskeys();
    } catch {
      setError('Failed to revoke passkey');
    }
  };

  if (loading) {
    return (
      <div className="passkey-management">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Your Passkeys</h3>
          <WebAuthnPrivacyBadge />
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-2 text-gray-600">Loading passkeys...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="passkey-management">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Your Passkeys</h3>
        <WebAuthnPrivacyBadge />
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {passkeys.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-4">🔐</div>
          <p className="text-gray-600 mb-4">
            No passkeys yet. Add one from this device—biometrics stay on your device.
          </p>
          <button
            onClick={handleAddPasskey}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
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
            className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-600 hover:border-gray-400 transition-colors"
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
  const [isEditing, setIsEditing] = useState(false);
  const [newLabel, setNewLabel] = useState(passkey.device_label || 'Unnamed Device');

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
                autoFocus
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
              <h4 className="font-medium">{passkey.device_label || 'Unnamed Device'}</h4>
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
