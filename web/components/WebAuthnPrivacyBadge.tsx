'use client';

import { useState, useEffect } from 'react';
import { getPrivacyStatus } from '@/lib/webauthn/client';

type PrivacyStatus = {
  status: 'active' | 'partial' | 'inactive';
  badge: {
    color: 'green' | 'yellow' | 'red';
    label: string;
  };
}

export function WebAuthnPrivacyBadge() {
  const [status, setStatus] = useState<PrivacyStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPrivacyStatus()
      .then(setStatus)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <span className="text-white text-xs px-2 py-1 rounded bg-gray-500 flex items-center gap-1">
        <span>⏳</span>
        <span>Checking...</span>
      </span>
    );
  }

  if (!status) {
    return (
      <span className="text-white text-xs px-2 py-1 rounded bg-red-600 flex items-center gap-1">
        <span>🚨</span>
        <span>Privacy protections: ERROR</span>
      </span>
    );
  }

  const { color, label } = status.badge;
  const icon = color === 'green' ? '🛡️' : color === 'yellow' ? '⚠️' : '🚨';
  const bgColor = color === 'green' ? 'bg-green-600' : color === 'yellow' ? 'bg-amber-500' : 'bg-red-600';

  return (
    <span className={`text-white text-xs px-2 py-1 rounded ${bgColor} flex items-center gap-1`}>
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
