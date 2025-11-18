/**
 * Device Flow Authentication Component
 * 
 * Displays user code and handles polling for device authorization completion.
 * Implements OAuth 2.0 Device Authorization Grant UX (RFC 8628).
 */

'use client';

import { CheckCircle2, Clock, AlertCircle, Copy } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState, useCallback } from 'react';

import type { DeviceFlowResponse } from '@/lib/core/auth/types';
import { logger } from '@/lib/utils/logger';

type DeviceFlowAuthProps = {
  provider: 'google' | 'github' | 'facebook' | 'twitter' | 'linkedin' | 'discord';
  redirectTo?: string;
  scopes?: string[];
  onComplete?: (userId: string) => void;
  onError?: (error: string) => void;
};

type PollStatus = {
  status: 'pending' | 'completed' | 'expired' | 'error';
  userId?: string;
  error?: string;
  errorDescription?: string;
};

export function DeviceFlowAuth({
  provider,
  redirectTo,
  scopes = [],
  onComplete,
  onError,
}: DeviceFlowAuthProps) {
  const router = useRouter();
  const [deviceFlow, setDeviceFlow] = useState<DeviceFlowResponse | null>(null);
  const [pollStatus, setPollStatus] = useState<PollStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  // Initialize device flow
  useEffect(() => {
    let mounted = true;

    async function initializeDeviceFlow() {
      try {
        const response = await fetch('/api/auth/device-flow', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            provider,
            redirectTo,
            scopes,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to initialize device flow');
        }

        const data = await response.json();
        if (data.success && data.data) {
          if (mounted) {
            setDeviceFlow(data.data);
            setTimeRemaining(data.data.expiresIn || 1800);
            setIsLoading(false);
          }
        } else {
          throw new Error(data.error || 'Failed to initialize device flow');
        }
      } catch (err) {
        logger.error('Device flow initialization error', { error: err });
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to initialize device flow');
          setIsLoading(false);
          onError?.(err instanceof Error ? err.message : 'Failed to initialize device flow');
        }
      }
    }

    initializeDeviceFlow();

    return () => {
      mounted = false;
    };
  }, [provider, redirectTo, scopes, onError]);

  // Poll for completion
  const pollForCompletion = useCallback(async () => {
    if (!deviceFlow?.deviceCode) return;

    try {
      const response = await fetch('/api/auth/device-flow/poll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceCode: deviceFlow.deviceCode,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Polling failed');
      }

      const data = await response.json();
      if (data.success && data.data) {
        const status: PollStatus = data.data;

        setPollStatus(status);

        if (status.status === 'completed') {
          // Success! Session is managed by Supabase Auth cookies
          onComplete?.(status.userId || '');
          if (redirectTo) {
            router.push(redirectTo);
          } else {
            router.push('/dashboard');
          }
          return;
        }

        if (status.status === 'expired' || status.status === 'error') {
          setError(status.errorDescription || status.error || 'Authorization failed');
          onError?.(status.errorDescription || status.error || 'Authorization failed');
          return;
        }
      }
    } catch (err) {
      logger.error('Device flow polling error', { error: err });
      // Don't set error on polling failures - just continue polling
    }
  }, [deviceFlow, onComplete, onError, redirectTo, router]);

  // Start polling when device flow is initialized
  useEffect(() => {
    if (!deviceFlow?.deviceCode || !deviceFlow?.interval) return;

    const intervalMs = deviceFlow.interval * 1000;
    const pollInterval = setInterval(pollForCompletion, intervalMs);

    // Poll immediately
    pollForCompletion();

    return () => {
      clearInterval(pollInterval);
    };
  }, [deviceFlow, pollForCompletion]);

  // Countdown timer
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [timeRemaining]);

  // Copy user code to clipboard
  const handleCopyCode = async () => {
    if (!deviceFlow?.userCode) return;

    try {
      await navigator.clipboard.writeText(deviceFlow.userCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      logger.error('Failed to copy user code', { error: err });
    }
  };

  // Format time remaining
  const formatTimeRemaining = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        <p className="text-sm text-gray-600">Initializing device authorization...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h3 className="text-lg font-semibold text-gray-900">Authorization Error</h3>
        <p className="text-sm text-gray-600 text-center">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!deviceFlow) {
    return null;
  }

  const isExpired = timeRemaining !== null && timeRemaining <= 0;
  const isCompleted = pollStatus?.status === 'completed';

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-6 max-w-md mx-auto">
      {/* Status Icon */}
      {isCompleted ? (
        <CheckCircle2 className="h-16 w-16 text-green-500" />
      ) : isExpired ? (
        <AlertCircle className="h-16 w-16 text-red-500" />
      ) : (
        <Clock className="h-16 w-16 text-blue-500 animate-pulse" />
      )}

      {/* Title */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">
          {isCompleted
            ? 'Authorization Complete!'
            : isExpired
            ? 'Code Expired'
            : 'Enter This Code'}
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          {isCompleted
            ? 'You can now return to your device.'
            : isExpired
            ? 'This code has expired. Please request a new one.'
            : `Go to ${deviceFlow.verificationUri || 'the verification page'} and enter:`}
        </p>
      </div>

      {/* User Code Display */}
      {!isExpired && !isCompleted && (
        <div className="w-full space-y-4">
          <div className="relative">
            <div className="bg-gray-50 border-2 border-blue-500 rounded-lg p-6 text-center">
              <p className="text-xs uppercase text-gray-500 mb-2">Your Code</p>
              <p className="text-4xl font-mono font-bold text-gray-900 tracking-wider">
                {deviceFlow.userCode}
              </p>
            </div>
            <button
              onClick={handleCopyCode}
              className="absolute top-2 right-2 p-2 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              aria-label="Copy code"
            >
              {copied ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <Copy className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* Time Remaining */}
          {timeRemaining !== null && (
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Code expires in: <span className="font-semibold">{formatTimeRemaining(timeRemaining)}</span>
              </p>
            </div>
          )}

          {/* Verification Link */}
          {deviceFlow.verificationUri && (
            <div className="text-center">
              <a
                href={deviceFlow.verificationUri}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 underline text-sm"
              >
                Open verification page →
              </a>
            </div>
          )}

          {/* Polling Status */}
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 text-sm text-gray-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
              <span>Waiting for authorization...</span>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {pollStatus?.status === 'error' && pollStatus.errorDescription && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 w-full">
          <p className="text-sm text-red-800">{pollStatus.errorDescription}</p>
        </div>
      )}
    </div>
  );
}

