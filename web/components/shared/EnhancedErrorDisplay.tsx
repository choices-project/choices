'use client';

/**
 * Enhanced Error Display Component
 *
 * Provides actionable, helpful error messages with recovery options.
 * Designed to help users understand what went wrong and how to fix it.
 */

import { AlertCircle, RefreshCw, ArrowLeft, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

export type EnhancedErrorDisplayProps = {
  /** Error title/heading */
  title?: string;
  /** Error message */
  message: string;
  /** Optional detailed explanation */
  details?: string;
  /** Optional helpful tip */
  tip?: string;
  /** Primary recovery action */
  primaryAction?: {
    label: string;
    onClick?: () => void;
    href?: string;
    icon?: React.ReactNode;
  };
  /** Secondary action (e.g., go back) */
  secondaryAction?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  /** Whether this is a retryable error */
  canRetry?: boolean;
  /** Retry handler */
  onRetry?: () => void;
  /** Additional className */
  className?: string;
  /** Error severity */
  severity?: 'error' | 'warning' | 'info';
};

export function EnhancedErrorDisplay({
  title,
  message,
  details,
  tip,
  primaryAction,
  secondaryAction,
  canRetry = false,
  onRetry,
  className = '',
  severity = 'error',
}: EnhancedErrorDisplayProps) {
  const severityStyles = {
    error: {
      container: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
      icon: 'text-red-600 dark:text-red-400',
      title: 'text-red-900 dark:text-red-100',
      text: 'text-red-700 dark:text-red-300',
      button: 'bg-red-600 hover:bg-red-700 text-white',
    },
    warning: {
      container: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
      icon: 'text-yellow-600 dark:text-yellow-400',
      title: 'text-yellow-900 dark:text-yellow-100',
      text: 'text-yellow-700 dark:text-yellow-300',
      button: 'bg-yellow-600 hover:bg-yellow-700 text-white',
    },
    info: {
      container: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
      icon: 'text-blue-600 dark:text-blue-400',
      title: 'text-blue-900 dark:text-blue-100',
      text: 'text-blue-700 dark:text-blue-300',
      button: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
  };

  const styles = severityStyles[severity];

  return (
    <div
      className={`rounded-lg border p-4 ${styles.container} ${className}`}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className={`h-5 w-5 flex-shrink-0 mt-0.5 ${styles.icon}`} aria-hidden="true" />
        <div className="flex-1 min-w-0">
          {title && (
            <p className={`font-semibold mb-1 ${styles.title}`}>
              {title}
            </p>
          )}
          <p className={`text-sm mb-2 ${styles.text}`}>
            {message}
          </p>

          {details && (
            <p className={`text-sm mb-3 ${styles.text} opacity-90`}>
              {details}
            </p>
          )}

          {tip && (
            <div className="mb-3 p-2 bg-white/50 dark:bg-black/20 rounded border border-current/20">
              <div className="flex items-start gap-2">
                <HelpCircle className={`h-4 w-4 flex-shrink-0 mt-0.5 ${styles.icon}`} aria-hidden="true" />
                <p className={`text-xs ${styles.text}`}>
                  {tip}
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2 mt-4">
            {canRetry && onRetry && (
              <button
                onClick={onRetry}
                className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded ${styles.button} transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current`}
                aria-label="Retry the operation"
              >
                <RefreshCw className="h-4 w-4 mr-1.5" aria-hidden="true" />
                Try Again
              </button>
            )}

            {primaryAction && (
              <>
                {primaryAction.href ? (
                  <Link
                    href={primaryAction.href}
                    className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded ${styles.button} transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current`}
                    aria-label={primaryAction.label}
                  >
                    {primaryAction.icon && <span className="mr-1.5">{primaryAction.icon}</span>}
                    {primaryAction.label}
                  </Link>
                ) : (
                  <button
                    onClick={primaryAction.onClick}
                    className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded ${styles.button} transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current`}
                    aria-label={primaryAction.label}
                  >
                    {primaryAction.icon && <span className="mr-1.5">{primaryAction.icon}</span>}
                    {primaryAction.label}
                  </button>
                )}
              </>
            )}

            {secondaryAction && (
              <>
                {secondaryAction.href ? (
                  <Link
                    href={secondaryAction.href}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    aria-label={secondaryAction.label}
                  >
                    <ArrowLeft className="h-4 w-4 mr-1.5" aria-hidden="true" />
                    {secondaryAction.label}
                  </Link>
                ) : (
                  <button
                    onClick={secondaryAction.onClick}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    aria-label={secondaryAction.label}
                  >
                    <ArrowLeft className="h-4 w-4 mr-1.5" aria-hidden="true" />
                    {secondaryAction.label}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
