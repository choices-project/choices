'use client';

import { useRouter } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';

import { useIsAuthenticated, useUserLoading } from '@/lib/stores';
import { logger } from '@/lib/utils/logger';

type AuthGuardProps = {
  children: React.ReactNode;
  redirectTo?: string;
  fallback?: React.ReactNode;
};

/**
 * Hard ceiling on how long this guard can sit on its loading fallback.
 *
 * Note: this is NOT a security gate. The real auth check happens server-side
 * in `web/middleware.ts` before this page is even rendered. Reaching this
 * component already means middleware has validated Supabase auth cookies.
 *
 * Without a real escape hatch here, a stalled `supabase.auth.getSession()`
 * call in AuthContext (e.g. when `navigator.locks` is wedged after a crashed
 * tab, or in Incognito mode) traps the user on "Checking authentication..."
 * forever — exactly the bug reported on May 14 and previously on Dec 20.
 */
const LOADING_HARD_TIMEOUT_MS = 10_000;

/**
 * Authentication Guard Component
 *
 * UX gate that decides whether to show the protected children, the
 * loading fallback, or a redirect to login. The actual security gate is
 * `web/middleware.ts`.
 */
export function AuthGuard({
  children,
  redirectTo = '/auth',
  fallback = (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4" />
        <p className="text-gray-600">Checking authentication...</p>
      </div>
    </div>
  ),
}: AuthGuardProps) {
  const isAuthenticated = useIsAuthenticated();
  const isLoading = useUserLoading();
  const router = useRouter();
  const routerRef = useRef(router);
  const loadingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);

  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  // Real timeout: when isLoading stays true past the ceiling, FLIP a state
  // bit so the component proceeds rather than waiting on a stuck promise.
  //
  // IMPORTANT: `loadingTimedOut` is STICKY for the lifetime of this mount.
  // Once we've decided to bypass the gate (because middleware already vetted
  // the request server-side), we MUST NOT later redirect the user to /auth
  // when isLoading eventually flips to false with isAuthenticated=false.
  // Doing so would bounce them: middleware lets them back into /feed because
  // cookies are valid, AuthContext times out again, AuthGuard redirects
  // again — an infinite redirect loop.
  useEffect(() => {
    if (!isLoading) {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
      return;
    }
    if (loadingTimedOut) return;
    loadingTimeoutRef.current = setTimeout(() => {
      logger.warn(
        `AuthGuard: auth loading exceeded ${LOADING_HARD_TIMEOUT_MS}ms — proceeding (middleware already vetted this request)`,
      );
      setLoadingTimedOut(true);
    }, LOADING_HARD_TIMEOUT_MS);

    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    };
  }, [isLoading, loadingTimedOut]);

  // While the auth bootstrap is still in flight (and hasn't exceeded the
  // hard timeout), show the loading fallback.
  const stillLoading = isLoading && !loadingTimedOut;

  useEffect(() => {
    if (!stillLoading && !isAuthenticated && !loadingTimedOut) {
      logger.warn('AuthGuard - Unauthenticated user blocked, redirecting to login');
      routerRef.current.push(redirectTo);
    }
  }, [isAuthenticated, stillLoading, loadingTimedOut, redirectTo]);

  if (stillLoading) {
    return <>{fallback}</>;
  }

  // Bootstrap completed cleanly (not via timeout) AND confirmed no session.
  // Middleware should have redirected upstream, but we double-check.
  if (!isAuthenticated && !loadingTimedOut) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">You must be logged in to access this page.</p>
          <p className="text-sm text-gray-500 mt-2">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default AuthGuard;

