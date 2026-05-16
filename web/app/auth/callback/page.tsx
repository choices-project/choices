'use client';

import { Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { Suspense } from 'react';

import { getSupabaseBrowserClient } from '@/utils/supabase/client';

import {
  normalizePostAuthRedirectPath,
  pickRedirectQueryParam,
} from '@/lib/auth/normalize-post-auth-redirect';

function CallbackLoading({ message }: { message: string }) {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
      <p className="text-sm text-muted-foreground">{message}</p>
    </main>
  );
}

function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = React.useState('Completing sign-in…');

  React.useEffect(() => {
    let cancelled = false;

    const finish = async () => {
      const oauthError = searchParams.get('error');
      const oauthErrorDescription = searchParams.get('error_description');
      if (oauthError) {
        router.replace(
          `/auth?error=${encodeURIComponent(oauthErrorDescription ?? oauthError)}`,
        );
        return;
      }

      const redirectTarget = normalizePostAuthRedirectPath(
        pickRedirectQueryParam(searchParams) ?? '/feed',
      );

      try {
        const supabase = await getSupabaseBrowserClient();
        const code = searchParams.get('code');

        if (code) {
          setMessage('Verifying with provider…');
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            router.replace(`/auth?error=${encodeURIComponent(exchangeError.message)}`);
            return;
          }
        }

        setMessage('Securing your session…');
        const syncResponse = await fetch('/api/auth/sync-session', {
          method: 'POST',
          credentials: 'include',
        });

        if (!syncResponse.ok) {
          const body = (await syncResponse.json().catch(() => ({}))) as { error?: string };
          router.replace(
            `/auth?error=${encodeURIComponent(body.error ?? 'Could not establish session')}`,
          );
          return;
        }

        if (cancelled) {
          return;
        }

        window.location.assign(redirectTarget);
      } catch (err) {
        const text = err instanceof Error ? err.message : 'Sign-in failed';
        router.replace(`/auth?error=${encodeURIComponent(text)}`);
      }
    };

    void finish();

    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  return <CallbackLoading message={message} />;
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<CallbackLoading message="Completing sign-in…" />}>
      <AuthCallbackInner />
    </Suspense>
  );
}
