'use client';

import React from 'react';

import logger from '@/lib/utils/logger';

import { useInitializeBiometricState, useUserActions } from '../lib/store';

type PrivacyStatus = {
  status: 'active' | 'partial' | 'inactive';
  badge: {
    color: 'green' | 'yellow' | 'red';
    label: string;
  };
};

export function WebAuthnPrivacyBadge() {
  const [status, setStatus] = React.useState<PrivacyStatus | null>(null);
  const [loading, setLoading] = React.useState(true);

  useInitializeBiometricState({ fetchCredentials: false });

  const { setBiometricError } = useUserActions();

  React.useEffect(() => {
    let active = true;

    const loadPrivacyStatus = async () => {
      try {
        const { getPrivacyStatus } = await import('@/features/auth/lib/webauthn/client');
        const privacyStatus = await getPrivacyStatus();
        if (!active) return;
        setStatus(privacyStatus);
      } catch (error) {
        if (!active) return;
        logger.error('Failed to load privacy status:', error);
        setBiometricError('Failed to verify WebAuthn privacy status');
        setStatus(null);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadPrivacyStatus();

    return () => {
      active = false;
    };
  }, [setBiometricError]);

  if (loading) {
    return (
      <span className="flex items-center gap-1 rounded bg-gray-500 px-2 py-1 text-xs text-white">
        <span>⏳</span>
        <span>Checking...</span>
      </span>
    );
  }

  if (!status) {
    return (
      <span className="flex items-center gap-1 rounded bg-red-600 px-2 py-1 text-xs text-white">
        <span>🚨</span>
        <span>Privacy protections: ERROR</span>
      </span>
    );
  }

  const { color, label } = status.badge;
  const icon = color === 'green' ? '🛡️' : color === 'yellow' ? '⚠️' : '🚨';
  const bgColor =
    color === 'green' ? 'bg-green-600' : color === 'yellow' ? 'bg-amber-500' : 'bg-red-600';

  return (
    <span className={`flex items-center gap-1 rounded px-2 py-1 text-xs text-white ${bgColor}`}>
      <span>{icon}</span>
      <span>{label}</span>
    </span>
  );
}

export function EnhancedPrivacyIndicator() {
  return (
    <div className="flex items-center gap-2">
      <WebAuthnPrivacyBadge />
    </div>
  );
}
