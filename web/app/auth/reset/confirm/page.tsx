'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import React from 'react';

import { getSupabaseBrowserClient } from '@/utils/supabase/client';

import { useI18n } from '@/hooks/useI18n';

export const dynamic = 'force-dynamic';

export default function ResetPasswordConfirmPage() {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');

  React.useEffect(() => {
    let isMounted = true;
    const exchangeSession = async () => {
      try {
        const supabase = await getSupabaseBrowserClient();
        if (!supabase) {
          setError(t('auth.errors.serviceUnavailable') || 'Service unavailable');
          setIsLoading(false);
          return;
        }

        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const code = searchParams?.get('code');

        if (accessToken && refreshToken) {
          const { error: setSessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (setSessionError) {
            setError(setSessionError.message || t('auth.reset.confirm.invalidLink'));
          } else {
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        } else if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            setError(exchangeError.message || t('auth.reset.confirm.invalidLink'));
          }
        } else {
          setError(t('auth.reset.confirm.invalidLink'));
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : t('auth.reset.confirm.invalidLink');
        setError(message || t('auth.reset.confirm.invalidLink'));
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    exchangeSession();
    return () => {
      isMounted = false;
    };
  }, [searchParams, t]);

  const handleUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError(t('auth.errors.passwordTooShort'));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('auth.errors.passwordsMismatch'));
      return;
    }

    setIsUpdating(true);
    try {
      const supabase = await getSupabaseBrowserClient();
      if (!supabase) {
        setError(t('auth.errors.serviceUnavailable') || 'Service unavailable');
        setIsUpdating(false);
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(updateError.message || t('auth.reset.error'));
        setIsUpdating(false);
        return;
      }

      setIsSuccess(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : t('auth.reset.error');
      setError(message || t('auth.reset.error'));
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center text-sm text-gray-600 dark:text-gray-400">
        {t('auth.reset.confirm.loading') || t('auth.reset.confirm.working') || t('auth.reset.working')}
      </div>
    );
  }

  if (error && !isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full space-y-4 text-center">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          <Link
            href="/auth/reset"
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 rounded"
          >
            {t('auth.reset.confirm.requestNewLink')}
          </Link>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full space-y-4 text-center">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{t('auth.reset.confirm.successTitle')}</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">{t('auth.reset.confirm.successBody')}</p>
          <button
            type="button"
            onClick={() => router.push('/auth')}
            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
          >
            {t('auth.reset.backToSignIn')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t('auth.reset.confirm.heading')}</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{t('auth.reset.confirm.subheading')}</p>
        </div>

        <form onSubmit={handleUpdate} className="space-y-4">
          {error ? (
            <div className="rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 p-4" role="alert" aria-live="assertive">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          ) : null}

          <div>
            <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('auth.reset.confirm.newPasswordLabel')}
            </label>
            <input
              id="new-password"
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.currentTarget.value)}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              placeholder={t('auth.reset.confirm.newPasswordPlaceholder')}
              autoComplete="new-password"
            />
          </div>

          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('auth.reset.confirm.confirmPasswordLabel')}
            </label>
            <input
              id="confirm-password"
              type="password"
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.currentTarget.value)}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              placeholder={t('auth.form.passwordPlaceholder')}
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 disabled:opacity-50"
            disabled={isUpdating}
          >
            {isUpdating ? t('auth.reset.confirm.working') : t('auth.reset.confirm.updateButton')}
          </button>
        </form>
      </div>
    </div>
  );
}
