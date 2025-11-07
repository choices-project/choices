'use client';

import React, { useState, useEffect } from 'react';

import { beginRegister, beginAuthenticate, isWebAuthnSupported } from '@/features/auth/lib/webauthn/client';
import { T } from '@/lib/testing/testIds';
import { logger } from '@/lib/utils/logger';

type PasskeyButtonProps = {
  mode: 'register' | 'authenticate';
  primary?: boolean;
  disabled?: boolean;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  className?: string;
}

export function PasskeyButton({ 
  mode, 
  primary = false, 
  disabled = false,
  onSuccess,
  onError,
  className = ''
}: PasskeyButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render during SSR
  if (!mounted) {
    return null;
  }

  // Check if WebAuthn is supported
  if (!isWebAuthnSupported()) {
    return null; // Don't show button if not supported
  }

  const handleClick = async () => {
    if (loading || disabled) return;

    setLoading(true);
    setError(null);

    try {
      let result;
      if (mode === 'register') {
        result = await beginRegister();
      } else {
        result = await beginAuthenticate();
      }

      if (result.success) {
        onSuccess?.();
      } else {
        const errorMsg = result.error ?? 'Operation failed';
        setError(errorMsg);
        onError?.(errorMsg);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Something went wrong';
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const getButtonText = () => {
    if (loading) {
      return mode === 'register' ? 'Creating...' : 'Signing in...';
    }
    
    if (mode === 'register') {
      return 'Create Passkey';
    } else {
      return 'Use Passkey (fast, no password)';
    }
  };

  const getIcon = () => {
    if (loading) {
      return '⏳';
    }
    return '🔐';
  };

  const baseClasses = primary 
    ? 'bg-blue-600 text-white hover:bg-blue-700' 
    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50';

  return (
    <div className={className}>
      <button
        data-testid={mode === 'register' ? T.webauthn.register : T.webauthn.login}
        onClick={handleClick}
        disabled={loading || disabled}
        className={`
          w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium
          transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed
          ${baseClasses}
        `}
      >
        <span>{getIcon()}</span>
        <span>{getButtonText()}</span>
      </button>
      
      {error && (
        <div className="mt-2 p-2 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
          {error}
        </div>
      )}
      
      {mode === 'register' && (
        <p className="mt-2 text-xs text-gray-600">
          Passkeys live on your device. We never see your fingerprint, face, or a reusable secret—only a public key.
        </p>
      )}
    </div>
  );
}

export function EmailLinkButton({ 
  primary = false, 
  disabled = false,
  onSuccess,
  onError,
  className = ''
}: Omit<PasskeyButtonProps, 'mode'>) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (loading || disabled) return;

    setLoading(true);
    try {
      // Implement email link functionality
      logger.debug('Email link clicked');
      onSuccess?.();
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Email link failed');
    } finally {
      setLoading(false);
    }
  };

  const baseClasses = primary 
    ? 'bg-blue-600 text-white hover:bg-blue-700' 
    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50';

  return (
    <button
      onClick={handleClick}
      disabled={loading || disabled}
      className={`
        w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium
        transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed
        ${baseClasses} ${className}
      `}
    >
      <span>📧</span>
      <span>{loading ? 'Sending...' : 'Email Link (secure login)'}</span>
    </button>
  );
}
