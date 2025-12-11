/**
 * Device Flow Verification Page
 * 
 * Page where users enter their user code to complete device authorization.
 */

'use client';

import { CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import { getSupabaseBrowserClient } from '@/utils/supabase/client';

import { logger } from '@/lib/utils/logger';

export default function DeviceFlowVerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [userCode, setUserCode] = useState('');
  const [provider] = useState<string>(
    searchParams.get('provider') || 'google'
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [needsAuth, setNeedsAuth] = useState(false);

  // Check authentication status on mount and handle OAuth callback
  useEffect(() => {
    async function checkAuth() {
      try {
        const supabase = await getSupabaseBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();
        const wasAuthenticated = !!user;

        // If user just authenticated via OAuth callback, retrieve stored user code
        if (wasAuthenticated && !userCode && typeof window !== 'undefined') {
          const storedCode = sessionStorage.getItem('device_flow_user_code');
          const storedProvider = sessionStorage.getItem('device_flow_provider');
          
          if (storedCode && storedProvider === provider) {
            // User came back from OAuth - set the code and auto-verify
            const formattedCode = storedCode.length === 8 
              ? `${storedCode.slice(0, 4)}-${storedCode.slice(4)}` 
              : storedCode;
            setUserCode(formattedCode);
            
            // Clear stored values
            sessionStorage.removeItem('device_flow_user_code');
            sessionStorage.removeItem('device_flow_provider');
            
            // Auto-submit after a brief delay to ensure state is set
            setTimeout(() => {
              const form = document.querySelector('form');
              if (form) {
                form.requestSubmit();
              }
            }, 100);
          }
        }
      } catch (err) {
        logger.error('Failed to check auth status', { error: err });
      }
    }
    checkAuth();
  }, [provider, searchParams, userCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Normalize user code (remove dashes, uppercase)
      const normalizedCode = userCode.replace(/-/g, '').toUpperCase();

      const response = await fetch('/api/auth/device-flow/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userCode: normalizedCode,
          provider,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        // Check if authentication is required
        if (data.error === 'authentication_required' || data.data?.error === 'authentication_required') {
          setNeedsAuth(true);
          // Trigger OAuth sign-in
          await handleOAuthSignIn();
          return;
        }
        throw new Error(data.error || data.data?.errorDescription || data.errorDescription || 'Verification failed');
      }

      if (data.success && data.data) {
        setSuccess(true);
        // Redirect after a short delay
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      }
    } catch (err) {
      logger.error('Device flow verification error', { error: err });
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeChange = (value: string) => {
    // Remove non-alphabetic characters and convert to uppercase
    const cleaned = value.replace(/[^A-Za-z]/g, '').toUpperCase();
    
    // Format as XXXX-XXXX
    let formatted = cleaned;
    if (cleaned.length > 4) {
      formatted = `${cleaned.slice(0, 4)}-${cleaned.slice(4, 8)}`;
    }
    
    setUserCode(formatted);
  };

  const handleOAuthSignIn = async () => {
    try {
      const supabase = await getSupabaseBrowserClient();
      // Store user code in sessionStorage to retrieve after OAuth callback
      sessionStorage.setItem('device_flow_user_code', userCode.replace(/-/g, ''));
      sessionStorage.setItem('device_flow_provider', provider);
      
      const redirectTo = `${window.location.origin}/auth/device-flow/verify`;
      
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: provider as 'google' | 'github' | 'facebook' | 'twitter' | 'linkedin' | 'discord',
        options: {
          redirectTo,
        },
      });

      if (oauthError) {
        logger.error('OAuth sign-in error', { error: oauthError });
        setError('Failed to initiate sign-in. Please try again.');
        setNeedsAuth(false);
      }
    } catch (err) {
      logger.error('OAuth sign-in failed', { error: err });
      setError('Failed to initiate sign-in. Please try again.');
      setNeedsAuth(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Authorization Complete!</h1>
            <p className="mt-2 text-sm text-gray-600">
              You can now return to your device.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="mt-6 text-center text-4xl font-extrabold text-gray-900">
            Enter Your Code
          </h1>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter the code displayed on your device to complete authorization.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <label htmlFor="userCode" className="block text-sm font-medium text-gray-700 mb-2">
              User Code
            </label>
            <input
              id="userCode"
              name="userCode"
              type="text"
              required
              value={userCode}
              onChange={(e) => handleCodeChange(e.target.value)}
              placeholder="XXXX-XXXX"
              maxLength={9}
              className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 text-center text-2xl font-mono tracking-wider"
              autoComplete="off"
            />
            <p className="mt-2 text-xs text-gray-500 text-center">
              Enter the 8-character code from your device
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}

          {needsAuth && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-blue-500" />
                <div className="flex-1">
                  <p className="text-sm text-blue-800 font-medium mb-2">
                    Sign in required
                  </p>
                  <p className="text-xs text-blue-700 mb-3">
                    You need to sign in with {provider} to complete device authorization.
                  </p>
                  <button
                    onClick={handleOAuthSignIn}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                  >
                    Sign in with {provider.charAt(0).toUpperCase() + provider.slice(1)}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading || userCode.length < 8}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              ) : (
                <>
                  Verify Code
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            Don&rsquo;t have a code?{' '}
            <a href="/auth" className="text-blue-600 hover:text-blue-700 underline">
              Sign in normally
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

