'use client';

import { useRouter } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';

import { hydrateBrowserSessionFromServer } from '@/lib/auth/browser-session';
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
 * UX gate for protected UI. Middleware enforces httpOnly cookies; this hydrates
 * the browser Supabase client from `/api/auth/session` before denying access.
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
  const [hydrating, setHydrating] = useState(false);
  const hydrateAttemptedRef = useRef(false);

  useEffect(() => {
    routerRef.current = router;
  }, [router]);

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

  const stillLoading = (isLoading || hydrating) && !loadingTimedOut;

  useEffect(() => {
    if (stillLoading || isAuthenticated || loadingTimedOut || hydrateAttemptedRef.current) {
      return;
    }
    hydrateAttemptedRef.current = true;
    setHydrating(true);
    void hydrateBrowserSessionFromServer()
      .then((session) => {
        if (!session) {
          logger.warn('AuthGuard - Unauthenticated user blocked, redirecting to login');
          routerRef.current.push(redirectTo);
        }
      })
      .finally(() => {
        setHydrating(false);
      });
  }, [isAuthenticated, stillLoading, loadingTimedOut, redirectTo]);

  if (stillLoading) {
    return <>{fallback}</>;
  }

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
