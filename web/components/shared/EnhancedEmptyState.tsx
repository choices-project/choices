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

import { Button } from '@/components/ui/button';

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
  const defaultIcon = icon || <Search className="h-12 w-12 text-muted-foreground" />;

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

      <h2 className="text-xl font-semibold text-foreground mb-2">
        {title}
      </h2>

      <p className="text-muted-foreground mb-4 max-w-md">
        {description}
      </p>

      {tip && (
        <div className="mb-6 p-3 bg-primary/10 border border-border rounded-lg max-w-md">
          <div className="flex items-start gap-2">
            <HelpCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-sm text-primary text-left">
              {tip}
            </p>
          </div>
        </div>
      )}

      {isFiltered && onResetFilters && (
        <div className="mb-4">
          <Button
            type="button"
            variant="link"
            onClick={onResetFilters}
            className="inline-flex items-center min-h-[44px] text-sm text-primary hover:text-primary/90"
            aria-label="Clear filters to see all items"
          >
            Clear filters to see all items
          </Button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
        {primaryAction && (
          <>
            {primaryAction.href ? (
              <Button asChild>
                <Link
                  href={primaryAction.href}
                  className="inline-flex items-center min-h-[44px] px-4 py-2"
                  aria-label={primaryAction.label}
                >
                  {primaryAction.icon || <Plus className="h-4 w-4 mr-2" aria-hidden="true" />}
                  {primaryAction.label}
                  <ArrowRight className="h-4 w-4 ml-2" aria-hidden="true" />
                </Link>
              </Button>
            ) : (
              <Button
                type="button"
                onClick={primaryAction.onClick}
                aria-label={primaryAction.label}
              >
                {primaryAction.icon || <Plus className="h-4 w-4 mr-2" aria-hidden="true" />}
                {primaryAction.label}
                <ArrowRight className="h-4 w-4 ml-2" aria-hidden="true" />
              </Button>
            )}
          </>
        )}

        {secondaryAction && (
          <>
            {secondaryAction.href ? (
              <Button asChild variant="outline">
                <Link
                  href={secondaryAction.href}
                  className="inline-flex items-center min-h-[44px] px-4 py-2"
                  aria-label={secondaryAction.label}
                >
                  {secondaryAction.label}
                </Link>
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={secondaryAction.onClick}
                aria-label={secondaryAction.label}
              >
                {secondaryAction.label}
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
