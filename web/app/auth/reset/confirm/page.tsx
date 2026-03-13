'use client';

import { Eye, EyeOff, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import React from 'react';

import { getSupabaseBrowserClient } from '@/utils/supabase/client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-background dark:via-background dark:to-muted flex items-center justify-center text-sm text-muted-foreground">
        {t('auth.reset.confirm.loading') || t('auth.reset.confirm.working') || t('auth.reset.working')}
      </div>
    );
  }

  if (error && !isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-background dark:via-background dark:to-muted flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full space-y-4 text-center">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          <Link
            href="/auth/reset"
            className="text-sm text-primary hover:text-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-background rounded"
          >
            {t('auth.reset.confirm.requestNewLink')}
          </Link>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-background dark:via-background dark:to-muted flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full space-y-4 text-center">
          <h1 className="text-2xl font-semibold text-foreground">{t('auth.reset.confirm.successTitle')}</h1>
          <p className="text-sm text-muted-foreground">{t('auth.reset.confirm.successBody')}</p>
          <Button
            type="button"
            onClick={() => router.push('/auth')}
            className="min-h-[44px]"
          >
            {t('auth.reset.backToSignIn')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-background dark:via-background dark:to-muted flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">{t('auth.reset.confirm.heading')}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t('auth.reset.confirm.subheading')}</p>
        </div>

        <form onSubmit={handleUpdate} className="space-y-4">
          {error ? (
            <div className="rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 p-4" role="alert" aria-live="assertive">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          ) : null}

          <div>
            <label htmlFor="reset-password" className="block text-sm font-medium text-foreground/80 mb-1">
              {t('auth.reset.confirm.newPasswordLabel')}
            </label>
            <div className="relative">
              <Input
                id="reset-password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(event) => setPassword(event.currentTarget.value)}
                className="w-full pr-10"
                placeholder={t('auth.reset.confirm.newPasswordPlaceholder')}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="reset-confirm-password" className="block text-sm font-medium text-foreground/80 mb-1">
              {t('auth.reset.confirm.confirmPasswordLabel')}
            </label>
            <div className="relative">
              <Input
                id="reset-confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.currentTarget.value)}
                className="w-full pr-10"
                placeholder={t('auth.form.passwordPlaceholder')}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full min-h-[44px] gap-2"
            disabled={isUpdating}
          >
            {isUpdating && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {isUpdating ? t('auth.reset.confirm.working') : t('auth.reset.confirm.updateButton')}
          </Button>
        </form>
      </div>
    </div>
  );
}
