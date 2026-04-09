'use client';

import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

import { getSupabaseBrowserClient } from '@/utils/supabase/client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
        const base = resetError.message || t('auth.reset.error');
        const rateLimited = base.toLowerCase().includes('rate limit');
        setError(
          rateLimited
            ? `${base} Wait before trying again, or in Supabase Dashboard → Authentication → Rate Limits review email quotas for this project.`
            : base,
        );
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-background dark:via-background dark:to-muted flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">{t('auth.reset.heading')}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t('auth.reset.subheading')}</p>
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
              <label htmlFor="reset-email" className="block text-sm font-medium text-foreground/80 mb-1">
                {t('auth.reset.emailLabel')}
              </label>
              <Input
                id="reset-email"
                type="email"
                name="email"
                required
                value={email}
                onChange={(event) => setEmail(event.currentTarget.value)}
                className="w-full"
                placeholder={t('auth.reset.emailPlaceholder')}
                autoComplete="email"
              />
            </div>

            <Button
              type="submit"
              className="w-full min-h-[44px] gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {isSubmitting ? t('auth.reset.working') : t('auth.reset.submit')}
            </Button>
          </form>
        )}

        <div className="text-center">
          <Link
            href="/auth"
            className="text-sm text-primary hover:text-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-background rounded"
          >
            {t('auth.reset.backToSignIn')}
          </Link>
        </div>
      </div>
    </div>
  );
}
