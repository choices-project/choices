'use client';

import React, { useEffect, useRef } from 'react';

import { hydrateBrowserSessionFromServer } from '@/lib/auth/browser-session';
import { syncClientAuthSession } from '@/lib/auth/sync-client-auth-session';
import { useIsAuthenticated } from '@/lib/stores';

type AuthGuardProps = {
  children: React.ReactNode;
  redirectTo?: string;
  fallback?: React.ReactNode;
};

/**
 * Best-effort browser session hydrate for protected UI.
 *
 * This is not a security gate. Middleware already validated httpOnly cookies
 * before the page rendered. Do not hide children behind AuthContext/store
 * loading — `getSession()` / `setSession()` can hang on `navigator.locks`.
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const isAuthenticated = useIsAuthenticated();
  const hydrateAttemptedRef = useRef(false);

  useEffect(() => {
    if (isAuthenticated || hydrateAttemptedRef.current) {
      return;
    }
    hydrateAttemptedRef.current = true;
    void hydrateBrowserSessionFromServer().then((session) => {
      if (session) {
        syncClientAuthSession(session);
      }
    });
  }, [isAuthenticated]);

  return <>{children}</>;
}

export default AuthGuard;
