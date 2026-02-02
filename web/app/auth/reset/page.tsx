'use client';

import Link from 'next/link';
import React from 'react';

import { getSupabaseBrowserClient } from '@/utils/supabase/client';

import { useI18n } from '@/hooks/useI18n';

export const dynamic = 'force-dynamic';

export default function ResetPasswordPage() {
  const { t } = useI18n();
  const [email, setEmail] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const supabase = await getSupabaseBrowserClient();
      if (!supabase) {
        setError(t('auth.errors.serviceUnavailable') || 'Service unavailable');
        setIsSubmitting(false);
        return;
      }

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/reset/confirm`,
      });

      if (resetError) {
        setError(resetError.message || t('auth.reset.error'));
        setIsSuccess(false); // Explicitly clear success state on error
        setIsSubmitting(false);
        return;
      }

      // Success - clear any previous errors and set success state
      setError(null);
      setIsSuccess(true);
      setIsSubmitting(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : t('auth.reset.error');
      setError(message || t('auth.reset.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t('auth.reset.heading')}</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{t('auth.reset.subheading')}</p>
        </div>

        {isSuccess ? (
          <div className="rounded-md border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/30 p-4" role="status" aria-live="polite">
            <p className="text-sm font-medium text-green-800 dark:text-green-200">{t('auth.reset.successTitle')}</p>
            <p className="mt-1 text-sm text-green-700 dark:text-green-300">{t('auth.reset.successBody')}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error ? (
              <div className="rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 p-4" role="alert" aria-live="assertive">
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            ) : null}

            <div>
              <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('auth.reset.emailLabel')}
              </label>
              <input
                id="reset-email"
                type="email"
                name="email"
                required
                value={email}
                onChange={(event) => setEmail(event.currentTarget.value)}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                placeholder={t('auth.reset.emailPlaceholder')}
                autoComplete="email"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? t('auth.reset.working') : t('auth.reset.submit')}
            </button>
          </form>
        )}

        <div className="text-center">
          <Link
            href="/auth"
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 rounded"
          >
            {t('auth.reset.backToSignIn')}
          </Link>
        </div>
      </div>
    </div>
  );
}
