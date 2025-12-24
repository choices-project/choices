'use client';

import React from 'react';

export default function OnboardingError() {
  return (
    <div
      className="min-h-screen bg-gray-50 flex items-center justify-center"
      role="alert"
      aria-live="assertive"
      data-testid="onb-error"
    >
      <div className="max-w-md mx-auto text-center">
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
            <div className="flex-1 text-left">
              <h2 className="text-xl font-semibold text-red-900 mb-2">Something went wrong</h2>
              <p className="text-red-700 mb-4">Failed to load onboarding flow. Please try again.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  aria-label="Reload page to retry onboarding"
                >
                  Try Again
                </button>
                <a
                  href="/auth"
                  className="px-4 py-2 bg-white border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  aria-label="Go back to authentication"
                >
                  Back to Login
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
