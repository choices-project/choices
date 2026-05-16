'use client';

import { useSearchParams } from 'next/navigation';
import React from 'react';

import { completeSignIn } from '@/lib/auth/complete-sign-in';
import {
  normalizePostAuthRedirectPath,
  pickRedirectQueryParam,
} from '@/lib/auth/normalize-post-auth-redirect';

/**
 * Client step after server OAuth callback: hydrate the browser Supabase client
 * from httpOnly cookies, then navigate. Required for PWA standalone where a bare
 * middleware redirect to /feed can leave the client store empty.
 */
export default function AuthFinishClient() {
  const searchParams = useSearchParams();
  const startedRef = React.useRef(false);

  const redirectTarget = React.useMemo(() => {
    const raw = pickRedirectQueryParam(searchParams) ?? '/feed';
    return normalizePostAuthRedirectPath(raw);
  }, [searchParams]);

  React.useEffect(() => {
    if (startedRef.current) {
      return;
    }
    startedRef.current = true;
    void completeSignIn(redirectTarget).then((ok) => {
      if (!ok && typeof window !== 'undefined') {
        const params = new URLSearchParams({
          error:
            'Sign-in could not be completed in this app. Try Update Now on the banner, or sign in again. If it keeps failing, remove and reinstall the Choices app.',
          redirectTo: redirectTarget,
        });
        window.location.replace(`/auth?${params.toString()}`);
      }
    });
  }, [redirectTarget]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
          <div
          className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"
          role="status"
          aria-live="polite"
          aria-label="Finishing sign-in"
        />
        <p className="mt-4 text-gray-600">Finishing sign-in…</p>
      </div>
    </div>
  );
}
