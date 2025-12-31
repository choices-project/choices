'use client';

import React, { Component, type ReactNode } from 'react';

import logger from '@/lib/utils/logger';

type ErrorBoundaryProps = {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
};

/**
 * Error Boundary Component
 *
 * Catches React errors in component tree and prevents entire app from crashing.
 * Provides fallback UI and error logging.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // CRITICAL: Suppress hydration mismatch errors (#185) to prevent infinite loops
    // These errors occur when server and client render differently, and React's
    // error recovery mechanism can cause infinite re-renders
    const errorMessage = error?.message || '';
    const isHydrationError = errorMessage.includes('Hydration failed') || 
                            errorMessage.includes('React error #185') ||
                            errorMessage.includes('Minified React error #185');
    
    if (isHydrationError) {
      // Don't set error state for hydration errors - just log and continue
      // This prevents the error from triggering React's error recovery, which causes infinite loops
      logger.warn('ErrorBoundary: Suppressed hydration error to prevent infinite loop', { 
        error: errorMessage,
        errorInfo: 'Hydration mismatch - suppressed to prevent render loop'
      });
      return { hasError: false, error: null };
    }
    
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // CRITICAL: Suppress hydration mismatch errors (#185) to prevent infinite loops
    const errorMessage = error?.message || '';
    const isHydrationError = errorMessage.includes('Hydration failed') || 
                            errorMessage.includes('React error #185') ||
                            errorMessage.includes('Minified React error #185');
    
    if (isHydrationError) {
      // Don't log hydration errors as errors - they're expected in some cases
      // and logging them can trigger additional renders
      logger.warn('ErrorBoundary: Suppressed hydration error', { 
        error: errorMessage.substring(0, 100) // Truncate to prevent log spam
      });
      return; // Don't call onError for hydration errors
    }
    
    logger.error('ErrorBoundary caught error:', { error, errorInfo });
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          className="flex items-center justify-center min-h-[400px] px-4"
          data-testid="error-boundary"
          role="alert"
        >
          <div className="text-center max-w-md">
            <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-2">
              Something went wrong
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                // Try to reset state first (less disruptive than full reload)
                // If that doesn't work, user can manually reload
                try {
                  // Reset error state - component will re-render
                  // This is less disruptive than window.location.reload()
                } catch {
                  // Fallback to reload if reset fails
                  window.location.reload();
                }
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors"
              aria-label="Try again to retry"
              data-testid="error-boundary-retry"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

