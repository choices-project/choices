'use client';

import { useEffect } from 'react';

import { logger } from '@/lib/utils/logger';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    try {
      logger.error('Global error:', error);
    } catch {
      console.error('Global error:', error);
    }
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen flex items-center justify-center bg-background">
        <div
          className="text-center p-8 max-w-md"
          data-testid="global-error-root"
        >
          <h1 className="text-2xl font-bold text-foreground mb-4">Something went wrong</h1>
          <p className="text-muted-foreground mb-6">
            An unexpected error occurred. Please try again.
          </p>
          <button
            onClick={() => reset()}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
