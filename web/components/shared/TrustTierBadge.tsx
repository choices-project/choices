'use client';

import { Shield } from 'lucide-react';
import React from 'react';

import { Badge } from '@/components/ui/badge';

import { getTrustTierLabel, normalizeTrustTier } from '@/lib/trust/trust-tiers';
import { cn } from '@/lib/utils';

import type { TrustTier } from '@/types/features/analytics';

type TrustTierBadgeProps = {
  tier: TrustTier | string | null | undefined;
  /** Show "(passkey verified)" for T2 */
  showPasskeyHint?: boolean;
  /** Size variant */
  size?: 'sm' | 'md';
  className?: string;
};

const TIER_VARIANTS: Record<TrustTier, string> = {
  T0: 'bg-muted text-muted-foreground border-border',
  T1: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800',
  T2: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800',
  T3: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-800',
  T4: 'bg-violet-100 dark:bg-violet-900/30 text-violet-800 dark:text-violet-200 border-violet-200 dark:border-violet-800',
};

export function TrustTierBadge({
  tier,
  showPasskeyHint = true,
  size = 'md',
  className,
}: TrustTierBadgeProps) {
  const normalized = normalizeTrustTier(tier ?? 'T0') as TrustTier;
  const label = getTrustTierLabel(normalized);
  const isT2 = normalized === 'T2';

  return (
    <Badge
      variant="outline"
      className={cn(
        'font-medium shrink-0',
        TIER_VARIANTS[normalized],
        size === 'sm' && 'text-xs px-2 py-0',
        size === 'md' && 'text-sm px-2.5 py-0.5',
        className
      )}
      aria-label={`Trust tier: ${label}${isT2 && showPasskeyHint ? ' (passkey verified)' : ''}`}
    >
      <Shield className={cn('mr-1', size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5')} aria-hidden />
      {label}
      {isT2 && showPasskeyHint && (
        <span className="ml-1 opacity-90">(passkey)</span>
      )}
    </Badge>
  );
}
