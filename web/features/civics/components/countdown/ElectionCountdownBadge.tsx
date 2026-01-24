import { CalendarClock } from 'lucide-react';
import React, { useMemo } from 'react';

import { Badge } from '@/components/ui/badge';

import { cn } from '@/lib/utils';

import { useI18n } from '@/hooks/useI18n';

import { formatElectionDateStable } from '../../utils/civicsCountdownUtils';

import type { CivicElection } from '@/types/civic';


export type ElectionCountdownBadgeProps = {
  className?: string;
  loading?: boolean;
  error?: string | null;
  nextElection?: CivicElection | null;
  daysUntil?: number | null;
  totalUpcoming?: number;
  threshold?: number;
  showDate?: boolean;
  showAdditionalCount?: boolean;
  emptyMessage?: string;
  loadingMessage?: string;
  errorMessage?: string;
};

const DEFAULT_THRESHOLD = 90;

const getCountdownMessage = (
  daysUntil: number | null | undefined,
  translate: ReturnType<typeof useI18n>['t'],
) => {
  if (daysUntil == null) {
    return null;
  }

  if (daysUntil <= 0) {
    return translate('civics.countdown.badge.countdown.today');
  }

  if (daysUntil === 1) {
    return translate('civics.countdown.badge.countdown.tomorrow');
  }

  return translate('civics.countdown.badge.countdown.inDays', { count: daysUntil });
};

export function ElectionCountdownBadge({
  className,
  loading,
  error,
  nextElection,
  daysUntil,
  totalUpcoming = 0,
  threshold = DEFAULT_THRESHOLD,
  showDate = true,
  showAdditionalCount = true,
  emptyMessage: _emptyMessage,
  loadingMessage: _loadingMessage,
  errorMessage: _errorMessage
}: ElectionCountdownBadgeProps) {
  const { t } = useI18n();
  const state = useMemo<'loading' | 'error' | 'empty' | 'active' | 'upcoming'>(() => {
    if (loading) return 'loading';
    if (error) return 'error';
    if (!nextElection) return 'empty';
    if (daysUntil != null && daysUntil <= threshold) return 'active';
    return 'upcoming';
  }, [daysUntil, error, loading, nextElection, threshold]);

  if (state === 'loading' || state === 'error' || state === 'empty') {
    return null;
  }

  const countdownMessage = getCountdownMessage(daysUntil, t);
  const additionalCount =
    showAdditionalCount && totalUpcoming > 1
      ? t('civics.countdown.badge.additional', { count: totalUpcoming - 1 })
      : null;

  const ariaLiveProps =
    state === 'active'
      ? ({
          role: 'status',
          'aria-live': 'polite'
        } as const)
      : undefined;

  return (
    <Badge
      {...ariaLiveProps}
      className={cn(
        'flex items-center gap-1 rounded-full border-blue-100 shadow-sm',
        state === 'active'
          ? 'bg-blue-600/10 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:text-blue-100 dark:border-blue-700'
          : 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-100',
        className
      )}
    >
      <CalendarClock className="h-3 w-3" aria-hidden="true" />
      {nextElection?.name && (
        <span className="truncate max-w-[160px]">{nextElection.name}</span>
      )}
      {showDate && nextElection?.election_day && (
        <span className="text-blue-600/80">
          · {formatElectionDateStable(nextElection.election_day)}
        </span>
      )}
      {additionalCount && (
        <span className="text-blue-500/70 dark:text-blue-200/70">{additionalCount}</span>
      )}
      {countdownMessage && (
        <span className="font-medium text-blue-700/90 dark:text-blue-100">{countdownMessage}</span>
      )}
    </Badge>
  );
}


