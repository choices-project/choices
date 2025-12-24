'use client';

import React, { useEffect } from 'react';

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
      role="alert" 
      aria-live="assertive"
      className="container mx-auto px-4 py-8"
    >
      <div className="max-w-2xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <svg 
              className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-red-900 mb-2">Error Loading Poll</h2>
              <p className="text-red-700 mb-4">Something went wrong loading this poll. Please try again.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                  aria-label="Reload page to retry loading poll"
                >
                  Reload Page
                </button>
                <a
                  href="/polls"
                  className="px-4 py-2 bg-white border border-red-300 text-red-700 rounded-lg hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                  aria-label="Go back to polls list"
                >
                  Back to Polls
                </a>
              </div>
              {process.env.NODE_ENV === 'development' && (
                <details className="mt-4 text-sm text-gray-600">
                  <summary className="cursor-pointer font-medium hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded">
                    Error Details
                  </summary>
                  <pre className="mt-2 p-3 bg-gray-100 rounded overflow-auto text-xs">
                    {error.message}
                    {error.digest && `\nDigest: ${error.digest}`}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
