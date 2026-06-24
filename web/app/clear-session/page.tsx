'use client';

import { useEffect, useState } from 'react';

import { clearAllCaches } from '@/features/pwa/lib/cache-strategies';
import { unregisterAllServiceWorkers } from '@/features/pwa/lib/service-worker-registration';

/**
 * Debug page to clear auth (including httpOnly cookies via API), service worker
 * caches, and local storage. Use when auth or cached redirects get stuck.
 */
export default function ClearSessionPage() {
  const [status, setStatus] = useState('Resetting local session...');

  useEffect(() => {
    let cancelled = false;

    async function reset() {
      try {
        localStorage.clear();
        sessionStorage.clear();

        document.cookie.split(';').forEach((cookie) => {
          const name = cookie.split('=')[0]?.trim();
          if (!name) return;
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        });

        if (!cancelled) {
          setStatus('Clearing service worker caches...');
        }

        await unregisterAllServiceWorkers();
        await clearAllCaches();

        if (!cancelled) {
          setStatus('Clearing server session...');
          window.location.replace('/api/auth/clear-session');
        }
      } catch {
        if (!cancelled) {
          window.location.replace('/api/auth/clear-session');
        }
      }
    }

    void reset();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900 mb-4">Session Reset</h1>
        <p className="text-slate-600">{status}</p>
      </div>
    </div>
  );
}
