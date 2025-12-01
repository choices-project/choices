'use client';

import { Eye, EyeOff, Lock, Mail, CheckCircle2, AlertCircle } from 'lucide-react';
import dynamicImport from 'next/dynamic';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';

import { loginWithPassword, registerUser } from '@/features/auth/lib/api';
import {
  useUserError,
  useUserLoading,
  useUserActions,
  useUserStore,
} from '@/features/auth/lib/store';
import { useI18n } from '@/hooks/useI18n';
import { logger } from '@/lib/utils/logger';
import { getSupabaseBrowserClient } from '@/utils/supabase/client';

// Prevent static generation for auth page
export const dynamic = 'force-dynamic';

// Safe fallback component that doesn't use hooks
const PasskeyLoadingFallback = () => {
  return <div className="text-center text-sm text-gray-500">Loading authentication options...</div>;
};

const PasskeyControls = dynamicImport(() => import('@/features/auth/components/PasskeyControls'), {
  ssr: false,
  loading: () => <PasskeyLoadingFallback />,
});

export default function AuthPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Initialize i18n safely after mount
  const i18n = useI18n();
  const t = i18n.t;

  const userError = useUserError();
  const isLoading = useUserLoading();
  const {
    setLoading: setAuthLoading,
    setError: setAuthError,
    clearError: clearAuthError,
  } = useUserActions();
  const initializeAuth = useUserStore((state) => state.initializeAuth);

  // Ensure component is mounted before using client-side features
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Initialize auth state on mount
  useEffect(() => {
    if (!isMounted) return;

    const initAuth = async () => {
      try {
        const supabase = await getSupabaseBrowserClient();
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          logger.warn('Failed to get session on auth page init', { error });
          initializeAuth(null, null, false);
          return;
        }

        const user = session?.user ?? null;
        initializeAuth(user, session, Boolean(user));
      } catch (error) {
        logger.error('Failed to initialize auth', { error });
        initializeAuth(null, null, false);
      }
    };

    initAuth();
  }, [isMounted, initializeAuth]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    clearAuthError();
    setMessage(null);
    setAuthLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (!email || !password) {
      setAuthError(t('auth.errors.missingFields'));
      setAuthLoading(false);
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      setAuthError(t('auth.errors.passwordMismatch'));
      setAuthLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        const username = email.split('@')[0] || `user_${Date.now()}`;
        const result = await registerUser({
          email,
          password,
          username,
          context: {
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
          },
        });
        if (result.ok) {
          setMessage(t('auth.success.registered'));
          setTimeout(() => {
            router.push('/onboarding');
          }, 2000);
        } else {
          setAuthError(result.error || t('auth.errors.registrationFailed'));
        }
      } else {
        try {
          await loginWithPassword({ email, password });
          // loginAction redirects on success, so we won't reach here
          // But if we do, it means no redirect happened
          setMessage(t('auth.success.loggedIn'));
          setTimeout(() => {
            router.push('/dashboard');
          }, 1000);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : t('auth.errors.loginFailed');
          setAuthError(errorMessage);
        }
      }
    } catch (error) {
      logger.error('Auth action failed', { error });
      setAuthError(t('auth.errors.generic'));
    } finally {
      setAuthLoading(false);
    }
  };

  // Show loading state until mounted
  if (!isMounted) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            {isSignUp ? t('auth.title.signUp') : t('auth.title.signIn')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isSignUp
              ? t('auth.subtitle.signUp')
              : t('auth.subtitle.signIn')}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {message && (
            <div className="rounded-md bg-green-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <CheckCircle2 className="h-5 w-5 text-green-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">{message}</p>
                </div>
              </div>
            </div>
          )}

          {userError && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">{userError}</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                {t('auth.form.email')}
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  data-testid="login-email"
                  className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder={t('auth.form.emailPlaceholder')}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                {t('auth.form.password')}
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  required
                  data-testid="login-password"
                  className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder={t('auth.form.passwordPlaceholder')}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? t('auth.form.hidePassword') : t('auth.form.showPassword')}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            {isSignUp && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  {t('auth.form.confirmPassword')}
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    data-testid="auth-confirm-password"
                    className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder={t('auth.form.confirmPasswordPlaceholder')}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? t('auth.form.hidePassword') : t('auth.form.showPassword')}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div>
            <button
              type="submit"
              data-testid="login-submit"
              disabled={isLoading}
              className="group relative flex w-full justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading
                ? t('auth.form.submitting')
                : isSignUp
                  ? t('auth.form.signUp')
                  : t('auth.form.signIn')}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              data-testid="auth-toggle"
              onClick={() => {
                setIsSignUp(!isSignUp);
                clearAuthError();
                setMessage(null);
              }}
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              {isSignUp
                ? t('auth.form.alreadyHaveAccount')
                : t('auth.form.needAccount')}
            </button>
          </div>
        </form>

        <div className="mt-6">
          <PasskeyControls />
        </div>
      </div>
    </div>
  );
}
