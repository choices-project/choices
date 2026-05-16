'use client';

import { Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { Suspense } from 'react';

import { getSupabaseBrowserClient } from '@/utils/supabase/client';

import {
  normalizePostAuthRedirectPath,
  pickRedirectQueryParam,
} from '@/lib/auth/normalize-post-auth-redirect';
import { syncServerSessionCookies } from '@/lib/auth/sync-server-session';

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
  const handledRef = React.useRef(false);

  React.useEffect(() => {
    if (handledRef.current) {
      return;
    }
    handledRef.current = true;

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

        let {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session && code) {
          setMessage('Verifying with provider…');
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            // Code may already be consumed; recover if a session exists anyway.
            ({
              data: { session },
            } = await supabase.auth.getSession());
            if (!session) {
              router.replace(`/auth?error=${encodeURIComponent(exchangeError.message)}`);
              return;
            }
          } else {
            session = data.session;
          }

          const params = new URLSearchParams(searchParams.toString());
          params.delete('code');
          const query = params.toString();
          const cleanUrl = query
            ? `${window.location.pathname}?${query}`
            : window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
        }

        if (!session) {
          router.replace(
            `/auth?error=${encodeURIComponent('Sign-in did not complete. Please try again.')}`,
          );
          return;
        }

        setMessage('Securing your session…');
        const synced = await syncServerSessionCookies();

        if (!synced) {
          router.replace(
            `/auth?error=${encodeURIComponent('Could not establish session. Please try again.')}`,
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
