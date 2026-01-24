import {
  CheckCircle2,
  Clock3,
} from 'lucide-react';
import React, { useMemo } from 'react';

import { cn } from '@/lib/utils';

import { useI18n } from '@/hooks/useI18n';

import { ElectionCountdownBadge } from './ElectionCountdownBadge';
import { formatElectionDateStable } from '../../utils/civicsCountdownUtils';

import type { CivicElection } from '@/types/civic';


export type ElectionCountdownCardProps = {
  className?: string;
  title?: string;
  description?: string;
  loading?: boolean;
  error?: string | null;
  elections: CivicElection[];
  nextElection: CivicElection | null;
  daysUntilNextElection: number | null;
  ariaLabel?: string;
  totalUpcoming?: number;
  threshold?: number;
  maxItems?: number;
};

const DEFAULT_MAX_ITEMS = 3;

export function ElectionCountdownCard({
  className,
  title,
  description,
  loading,
  error,
  elections,
  nextElection,
  daysUntilNextElection,
  totalUpcoming,
  threshold,
  maxItems = DEFAULT_MAX_ITEMS,
  ariaLabel
}: ElectionCountdownCardProps) {
  const { t } = useI18n();
  const resolvedTitle = title ?? t('civics.countdown.card.title');
  const resolvedDescription = description ?? t('civics.countdown.card.description');
  const hasElections = elections.length > 0 && nextElection;
  const items = hasElections ? elections.slice(0, maxItems) : [];
  const remaining = hasElections ? elections.length - items.length : 0;
  const remainingLabel = useMemo(() => {
    if (remaining <= 0) {
      return null;
    }

    return t('civics.countdown.card.remaining', { count: remaining });
  }, [remaining, t]);

  const isLoading = loading ?? false;
  const hasError = Boolean(error);

  if (isLoading || hasError || !hasElections) {
    return null;
  }

  return (
    <section
      aria-label={ariaLabel ?? resolvedTitle}
      className={cn(
        'rounded-lg border border-blue-100 bg-blue-50/80 p-4 text-sm text-blue-800 shadow-sm dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-100',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-200">
            <Clock3 className="h-4 w-4" aria-hidden="true" />
            <span className="font-semibold uppercase tracking-wide text-[11px]">
              {resolvedTitle}
            </span>
          </div>
          <p className="mt-1 text-xs text-blue-700/80 dark:text-blue-200/80">{resolvedDescription}</p>
        </div>

        <ElectionCountdownBadge
          className="flex-shrink-0"
          loading={loading ?? false}
          error={error ?? null}
          nextElection={nextElection ?? null}
          daysUntil={daysUntilNextElection ?? null}
          totalUpcoming={totalUpcoming ?? elections.length}
          {...(threshold != null ? { threshold } : {})}
        />
      </div>

      <div className="mt-4 space-y-2">
        <ul className="space-y-1 text-blue-800">
          {items.map((election) => (
            <li
              key={election.election_id}
              className="flex items-center gap-2 rounded-md bg-white/70 px-3 py-2 shadow-sm dark:bg-blue-900/40"
            >
              <CheckCircle2 className="h-4 w-4 text-blue-500 dark:text-blue-200" aria-hidden="true" />
              <div className="flex flex-col">
                <span className="font-medium text-blue-900 dark:text-blue-100">
                  {election.name}
                </span>
                <span className="text-xs text-blue-600 dark:text-blue-200/80">
                  {formatElectionDateStable(election.election_day)}
                </span>
              </div>
            </li>
          ))}
        </ul>

        {remainingLabel && (
          <p className="text-xs font-medium text-blue-700 dark:text-blue-200">
            {remainingLabel}
          </p>
        )}
      </div>
    </section>
  );
}


