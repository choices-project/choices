'use client';

import { RefreshCw } from 'lucide-react';
import React, { useEffect } from 'react';

import { EnhancedErrorDisplay } from '@/components/shared/EnhancedErrorDisplay';

import { logger } from '@/lib/utils/logger';

export default function PollRouteError({ error }: { error: Error & { digest?: string } }) {
  // Log error to console for debugging (development only)
  if (process.env.NODE_ENV === 'development') {
    logger.error('Poll route error:', error);
  }

  // Use existing error logging system
  useEffect(() => {
    // Log error using existing logger system
    logger.error('Poll route error occurred', error, {
      component: 'PollRouteError',
      errorBoundary: 'poll-route',
      category: 'poll',
      severity: 'high',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      metadata: {
        errorName: error.name,
        errorConstructor: error.constructor.name,
        digest: error.digest,
        timestamp: new Date().toISOString()
      }
    });
  }, [error]);

  return (
    <div
      data-testid="poll-error"
      className="container mx-auto px-4 py-8"
    >
      <div className="max-w-2xl mx-auto">
        <EnhancedErrorDisplay
          title="Error Loading Poll"
          message="Something went wrong loading this poll. Please try again."
          details={error.message || 'An unexpected error occurred while loading the poll data.'}
          tip="This might be a temporary network issue. Try reloading the page or navigating back to the polls list."
          canRetry={true}
          onRetry={() => window.location.reload()}
          primaryAction={{
            label: 'Reload Page',
            onClick: () => window.location.reload(),
            icon: <RefreshCw className="h-4 w-4" />,
          }}
          secondaryAction={{
            label: 'Back to Polls',
            href: '/polls',
          }}
        />
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-4 text-sm text-gray-600">
            <summary className="cursor-pointer font-medium hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded">
              Error Details (Development Only)
            </summary>
            <pre className="mt-2 p-3 bg-gray-100 rounded overflow-auto text-xs">
              {error.message}
              {error.digest && `\nDigest: ${error.digest}`}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
