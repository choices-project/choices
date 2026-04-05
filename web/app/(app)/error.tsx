'use client';

import Link from 'next/link';
import React from 'react';

/**
 * Catches render errors in (app)/layout and nested routes (except deeper error.tsx files).
 * Prevents bubbling to root global-error when the failure is inside the authenticated shell.
 */
export default function AppSegmentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-background p-4"
      role="alert"
      aria-live="assertive"
      data-testid="app-segment-error"
    >
      <div className="mx-auto max-w-md">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
          <h2 className="mb-2 text-xl font-semibold text-red-900 dark:text-red-300">App Error</h2>
          <p className="mb-4 text-sm text-red-800 dark:text-red-200">
            {error.message || 'Something went wrong loading this section. You can try again or go home.'}
          </p>
          {error.digest ? (
            <p className="mb-4 font-mono text-xs text-muted-foreground">Digest: {error.digest}</p>
          ) : null}
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={reset}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Try again
            </button>
            <Link
              href="/feed"
              className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              Go to feed
            </Link>
            <Link
              href="/"
              className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
