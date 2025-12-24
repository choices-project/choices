'use client';

import Link from 'next/link';
import React from 'react';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div 
      className="min-h-screen bg-gray-50 flex items-center justify-center p-4" 
      role="alert" 
      aria-live="assertive"
    >
      <div className="max-w-md mx-auto">
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
              <h2 className="text-xl font-semibold text-red-900 mb-2">Admin Error</h2>
              <p className="text-red-700 mb-4">
                {error.message || 'An error occurred in the admin panel. Please try again.'}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={reset}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  aria-label="Retry loading admin panel"
                >
                  Try Again
                </button>
                <Link
                  href="/dashboard"
                  className="px-4 py-2 bg-white border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  aria-label="Go back to dashboard"
                >
                  Back to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

