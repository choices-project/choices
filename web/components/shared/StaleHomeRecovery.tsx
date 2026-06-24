'use client';

import { useEffect } from 'react';

/**
 * Recover when `/` was served stale HTML (cached middleware 307 or SW document)
 * that renders the authenticated app shell instead of the marketing home.
 */
export function StaleHomeRecovery() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.location.pathname !== '/') return;

    const hasAppShell = Boolean(document.querySelector('[data-testid="app-shell"]'));
    const hasMarketingHome = Boolean(document.querySelector('[data-testid="marketing-home"]'));

    if (!hasAppShell || hasMarketingHome) return;

    const url = new URL(window.location.href);
    if (url.searchParams.has('fresh')) return;

    url.searchParams.set('fresh', String(Date.now()));
    window.location.replace(url.toString());
  }, []);

  return null;
}
