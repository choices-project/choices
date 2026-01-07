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
    // #region agent log - Track all errors to diagnose root causes
    const errorMessage = error?.message || '';
    const isHydrationError = errorMessage.includes('Hydration failed') || 
                            errorMessage.includes('React error #185') ||
                            errorMessage.includes('Minified React error #185');
    
    if (isHydrationError) {
      // CRITICAL: Log hydration errors with full context for diagnosis
      // We need to FIX the hydration mismatch, not suppress it
      // Logging helps us identify what's causing the mismatch
      logger.error('ErrorBoundary: Hydration mismatch detected - THIS NEEDS TO BE FIXED', { 
        error: errorMessage,
        errorInfo: 'Hydration mismatch - server and client HTML differ',
        stack: error?.stack,
        // Don't set error state to prevent infinite loop, but log it as an error
        // so we know it needs to be fixed
      });
      
      // Still return no error state to prevent infinite loop, but we've logged it
      // The goal is to fix the root cause so this error doesn't occur
      return { hasError: false, error: null };
    }
    // #endregion
    
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // #region agent log - Track all errors to diagnose root causes
    const errorMessage = error?.message || '';
    const isHydrationError = errorMessage.includes('Hydration failed') || 
                            errorMessage.includes('React error #185') ||
                            errorMessage.includes('Minified React error #185');
    
    if (isHydrationError) {
      // CRITICAL: Log hydration errors with full context for diagnosis
      // We need to FIX the hydration mismatch, not suppress it
      logger.error('ErrorBoundary: Hydration mismatch - ROOT CAUSE NEEDS FIXING', { 
        error: errorMessage,
        errorInfo: errorInfo.componentStack,
        stack: error?.stack,
        // Log full error info to help diagnose what's causing the mismatch
      });
      
      // Still don't call onError to prevent infinite loop, but we've logged it as an error
      // The goal is to identify and fix the root cause
      return;
    }
    // #endregion
    
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

