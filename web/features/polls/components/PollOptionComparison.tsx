'use client';

import { GitCompare } from 'lucide-react';
import React from 'react';

import { cn } from '@/lib/utils';

import { useI18n } from '@/hooks/useI18n';

type Option = {
  optionId?: string;
  option?: string;
  label?: string;
  voteCount?: number;
  votes?: number;
  votePercentage?: number;
  percentage?: number;
};

type PollOptionComparisonProps = {
  options: Option[];
  totalVotes: number;
  className?: string;
};

/**
 * Side-by-side comparison of the top two poll options.
 * Per docs/ROADMAP.md §3.5 Comparison views.
 */
export function PollOptionComparison({
  options,
  totalVotes,
  className = '',
}: PollOptionComparisonProps) {
  const { t } = useI18n();
  const topTwo = options.slice(0, 2);

  if (topTwo.length < 2 || totalVotes === 0) {
    return null;
  }

  const getVotes = (o: Option) => o.voteCount ?? o.votes ?? 0;
  const getPct = (o: Option) => (o.votePercentage ?? o.percentage ?? 0).toFixed(1);
  const getLabel = (o: Option) => o.label ?? o.option ?? '';

  return (
    <section
      className={cn('rounded-lg border border-border bg-muted/30 p-4', className)}
      aria-labelledby="poll-comparison-heading"
    >
      <h3
        id="poll-comparison-heading"
        className="flex items-center gap-2 text-sm font-semibold text-foreground/90 mb-4"
      >
        <GitCompare className="h-4 w-4" aria-hidden />
        {t('polls.view.comparison.heading', { defaultValue: 'Compare top options' })}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {topTwo.map((opt, i) => (
          <div
            key={opt.optionId ?? opt.option ?? i}
            className="rounded-lg border border-border bg-card p-4"
          >
            <p className="text-sm font-medium text-foreground/80 mb-1">
              {t('polls.view.comparison.optionLabel', { index: i + 1, defaultValue: `Option ${i + 1}` })}
            </p>
            <p className="font-semibold text-foreground mb-2">{getLabel(opt)}</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-primary">
                {getVotes(opt).toLocaleString()}
              </span>
              <span className="text-sm text-muted-foreground">
                ({getPct(opt)}%)
              </span>
            </div>
            <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary/70 transition-all duration-500"
                style={{ width: `${getPct(opt)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
