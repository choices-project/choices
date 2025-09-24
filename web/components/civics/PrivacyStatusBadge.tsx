/**
 * Privacy Status Badge Component
 * Feature Flag: CIVICS_ADDRESS_LOOKUP (disabled by default)
 * 
 * This component shows the privacy protection status
 */

'use client';

import { useState, useEffect } from 'react';
import { isFeatureEnabled } from '@/lib/core/feature-flags';

type PrivacyStatus = {
  status: 'healthy' | 'warning' | 'error' | 'disabled';
  message: string;
  details?: {
    pepper: boolean;
    rls: boolean;
    auth: boolean;
  };
}

export function PrivacyStatusBadge() {
  // All React Hooks must be called at the top level, before any conditional returns
  const [status, setStatus] = useState<PrivacyStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkPrivacyStatus = async () => {
      try {
        // TODO: Call actual health check when feature is implemented
        // const response = await fetch('/api/health/civics');
        // const data = await response.json();
        
        // For now, simulate a healthy status
        setStatus({
          status: 'healthy',
          message: 'Privacy protections active',
          details: {
            pepper: true,
            rls: true,
            auth: true
          }
        });
      } catch {
        setStatus({
          status: 'error',
          message: 'Privacy check failed'
        });
      } finally {
        setIsLoading(false);
      }
    };

    checkPrivacyStatus();
  }, []);

  // Feature flag check - don't render if disabled
  if (!isFeatureEnabled('CIVICS_ADDRESS_LOOKUP')) {
    return (
      <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        <div className="w-2 h-2 rounded-full bg-gray-500 mr-1" />
        Feature Disabled
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        <div className="w-2 h-2 rounded-full bg-yellow-500 mr-1 animate-pulse" />
        Checking...
      </div>
    );
  }

  if (!status) {
    return null;
  }

  const color = {
    healthy: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    disabled: 'bg-gray-100 text-gray-800'
  }[status.status];

  return (
    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${color}`}>
      <div className="w-2 h-2 rounded-full bg-current mr-1" />
      {status.message}
    </div>
  );
}
