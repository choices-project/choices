'use client';

/**
 * Enhanced Empty State Component
 *
 * Provides a professional, helpful empty state with clear guidance and CTAs.
 * Designed for organizations and users who need clear next steps.
 */

import { ArrowRight, HelpCircle, Search, Plus } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

export type EnhancedEmptyStateProps = {
  /** Icon to display (defaults to Search) */
  icon?: React.ReactNode;
  /** Main heading */
  title: string;
  /** Descriptive text explaining why it's empty */
  description: string;
  /** Optional helpful tip or guidance */
  tip?: string;
  /** Primary action button */
  primaryAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
    icon?: React.ReactNode;
  };
  /** Secondary action button */
  secondaryAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  /** Whether this is due to filters/search */
  isFiltered?: boolean;
  /** Optional filter reset action */
  onResetFilters?: () => void;
  /** Additional className */
  className?: string;
};

export function EnhancedEmptyState({
  icon,
  title,
  description,
  tip,
  primaryAction,
  secondaryAction,
  isFiltered = false,
  onResetFilters,
  className = '',
}: EnhancedEmptyStateProps) {
  const defaultIcon = icon || <Search className="h-12 w-12 text-gray-400" />;

  return (
    <div
      className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="mb-6" aria-hidden="true">
        {defaultIcon}
      </div>

      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
        {title}
      </h2>

      <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-md">
        {description}
      </p>

      {tip && (
        <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg max-w-md">
          <div className="flex items-start gap-2">
            <HelpCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-sm text-blue-800 dark:text-blue-200 text-left">
              {tip}
            </p>
          </div>
        </div>
      )}

      {isFiltered && onResetFilters && (
        <div className="mb-4">
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center min-h-[44px] text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 rounded"
            aria-label="Clear filters to see all items"
          >
            Clear filters to see all items
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
        {primaryAction && (
          <>
            {primaryAction.href ? (
              <Link
                href={primaryAction.href}
                className="inline-flex items-center min-h-[44px] px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                aria-label={primaryAction.label}
              >
                {primaryAction.icon || <Plus className="h-4 w-4 mr-2" aria-hidden="true" />}
                {primaryAction.label}
                <ArrowRight className="h-4 w-4 ml-2" aria-hidden="true" />
              </Link>
            ) : (
              <button
                type="button"
                onClick={primaryAction.onClick}
                className="inline-flex items-center min-h-[44px] px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                aria-label={primaryAction.label}
              >
                {primaryAction.icon || <Plus className="h-4 w-4 mr-2" aria-hidden="true" />}
                {primaryAction.label}
                <ArrowRight className="h-4 w-4 ml-2" aria-hidden="true" />
              </button>
            )}
          </>
        )}

        {secondaryAction && (
          <>
            {secondaryAction.href ? (
              <Link
                href={secondaryAction.href}
                className="inline-flex items-center min-h-[44px] px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                aria-label={secondaryAction.label}
              >
                {secondaryAction.label}
              </Link>
            ) : (
              <button
                type="button"
                onClick={secondaryAction.onClick}
                className="inline-flex items-center min-h-[44px] px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                aria-label={secondaryAction.label}
              >
                {secondaryAction.label}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
