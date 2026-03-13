'use client';

import { motion, useReducedMotion } from 'framer-motion';
import React from 'react';

import { cn } from '@/lib/utils';

type AnimatedVoteBarProps = {
  percentage: number;
  label: string;
  voteCount: number;
  color?: string;
  isSelected?: boolean;
  isWinner?: boolean;
};

export function AnimatedVoteBar({
  percentage,
  label,
  voteCount,
  color = 'bg-blue-500',
  isSelected = false,
  isWinner = false,
}: AnimatedVoteBarProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className={cn(
          'font-medium text-foreground',
          isSelected && 'text-primary',
          isWinner && 'font-bold'
        )}>
          {label}
          {isSelected && (
            <span className="ml-1.5 text-xs text-muted-foreground">(Your vote)</span>
          )}
        </span>
        <span className="text-muted-foreground tabular-nums">
          {percentage.toFixed(1)}% ({voteCount})
        </span>
      </div>
      <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
        {shouldReduceMotion ? (
          <div
            className={cn('absolute inset-y-0 left-0 rounded-full', color, isWinner && 'ring-2 ring-primary/30')}
            style={{ width: `${percentage}%` }}
          />
        ) : (
          <motion.div
            className={cn('absolute inset-y-0 left-0 rounded-full', color, isWinner && 'ring-2 ring-primary/30')}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.15 }}
          />
        )}
      </div>
    </div>
  );
}
