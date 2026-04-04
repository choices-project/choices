'use client';

import { RefreshCw } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { useI18n } from '@/hooks/useI18n';

type UsePullToRefreshOptions = {
  onRefresh: () => Promise<void>;
  disabled?: boolean;
  threshold?: number;
  maxPull?: number;
};

/**
 * Pull-to-refresh for window/document scroll (Instagram/Twitter pattern).
 * Attach ref to the scrollable content container; touch handlers detect pull at top.
 */
export function usePullToRefresh({
  onRefresh,
  disabled = false,
  threshold = 80,
  maxPull = 120,
}: UsePullToRefreshOptions) {
  const { t } = useI18n();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const startY = useRef(0);
  const pullDistanceRef = useRef(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);

  const handleRefresh = useCallback(async () => {
    if (disabled || isRefreshing) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefresh, disabled, isRefreshing]);

  useEffect(() => {
    if (disabled || !containerRef.current) return;

    const container = containerRef.current;

    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0 && e.touches[0]) {
        startY.current = e.touches[0].clientY;
        pullDistanceRef.current = 0;
        setIsPulling(true);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (window.scrollY > 0) {
        setIsPulling(false);
        setPullDistance(0);
        return;
      }

      const touch = e.touches[0];
      if (!touch) return;

      const currentY = touch.clientY;
      const distance = currentY - startY.current;

      if (distance > 0 && distance <= maxPull) {
        pullDistanceRef.current = distance;
        setPullDistance(distance);
        e.preventDefault();
      }
    };

    const handleTouchEnd = () => {
      if (pullDistanceRef.current >= threshold) {
        void handleRefresh();
      }
      pullDistanceRef.current = 0;
      setIsPulling(false);
      setPullDistance(0);
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [disabled, threshold, maxPull, handleRefresh]);

  const pullLabel =
    pullDistance >= threshold
      ? t('polls.pullToRefresh.release', { defaultValue: 'Release to refresh' })
      : t('polls.pullToRefresh.pull', { defaultValue: 'Pull to refresh' });

  const indicator = (isPulling || isRefreshing) && (
    <div
      className="pointer-events-none fixed left-1/2 top-0 z-50 -translate-x-1/2 transition-transform duration-150"
      style={{
        transform: `translate(-50%, ${isRefreshing ? 12 : Math.min(pullDistance - 36, 60)}px)`,
      }}
      role="status"
      aria-live="polite"
      aria-label={isRefreshing ? 'Refreshing' : pullLabel}
    >
      <div
        className={
          pullDistance >= threshold
            ? 'flex items-center gap-2 rounded-full px-4 py-2 shadow-lg bg-primary text-primary-foreground'
            : 'flex items-center gap-2 rounded-full px-4 py-2 shadow-lg bg-card border border-border text-muted-foreground'
        }
      >
        <RefreshCw
          className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
          aria-hidden
        />
        <span className="text-sm font-medium">
          {isRefreshing
            ? t('polls.pullToRefresh.refreshing', { defaultValue: 'Refreshing…' })
            : pullLabel}
        </span>
      </div>
    </div>
  );

  return { containerRef, indicator, isRefreshing };
}
