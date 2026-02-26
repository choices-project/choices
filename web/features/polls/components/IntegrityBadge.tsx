'use client';

import { Info, Shield } from 'lucide-react';
import React, { useState } from 'react';

import { cn } from '@/lib/utils';

export type IntegrityBadgeInfo = {
  mode: 'all' | 'verified';
  threshold: number;
  raw_total_votes: number;
  excluded_votes: number;
  scored_votes: number;
  unscored_votes: number;
};

type IntegrityBadgeProps = {
  integrity: IntegrityBadgeInfo;
  /** Format numbers with locale (disable during SSR to avoid hydration mismatch) */
  formatNumbers?: boolean;
  className?: string;
};

function getConfidenceTier(excludedPercent: number): { label: string; variant: 'high' | 'medium' | 'low' } {
  if (excludedPercent < 5) return { label: 'High confidence', variant: 'high' };
  if (excludedPercent < 15) return { label: 'Medium confidence', variant: 'medium' };
  return { label: 'Review applied', variant: 'low' };
}

export function IntegrityBadge({ integrity, formatNumbers = true, className }: IntegrityBadgeProps) {
  const [expanded, setExpanded] = useState(false);
  const excludedPercent =
    integrity.raw_total_votes > 0
      ? Math.round((integrity.excluded_votes / integrity.raw_total_votes) * 100)
      : 0;
  const tier = getConfidenceTier(excludedPercent);

  const format = (n: number) => (formatNumbers ? n.toLocaleString() : String(n));

  return (
    <div
      className={className}
      role="region"
      aria-label="Poll integrity information"
    >
      <div className="rounded-lg border border-border/40 bg-muted/20 overflow-hidden">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/30 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg"
          aria-expanded={expanded}
          aria-controls="integrity-badge-details"
        >
          <div className="rounded-full bg-primary/20 p-2 shrink-0">
            <Shield className="h-5 w-5 text-primary" aria-hidden />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">
              {integrity.excluded_votes > 0
                ? `${integrity.excluded_votes} votes excluded (${excludedPercent}%)`
                : 'All votes included'}
            </p>
            <p className="text-xs text-foreground/70">
              {tier.label} • Threshold: {integrity.threshold}
            </p>
          </div>
          <Info
            className={cn(
              'h-4 w-4 text-foreground/50 shrink-0 transition-transform',
              expanded && 'rotate-180'
            )}
            aria-hidden
          />
        </button>
        <div
          id="integrity-badge-details"
          role="region"
          aria-label="Integrity details"
          className={cn(
            'border-t border-border/40 transition-all',
            expanded ? 'block' : 'hidden'
          )}
        >
          <div className="p-4 space-y-2 text-sm text-foreground/80">
            <p>
              <strong>Raw total:</strong> {format(integrity.raw_total_votes)} votes
            </p>
            <p>
              <strong>Scored:</strong> {format(integrity.scored_votes)} •{' '}
              <strong>Unscored:</strong> {format(integrity.unscored_votes)}
            </p>
            {integrity.excluded_votes > 0 && (
              <p>
                Votes below the integrity threshold ({integrity.threshold}) are excluded from displayed
                results to reduce manipulation. This helps ensure results reflect genuine participation.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
