'use client';

import { BarChart3, Sparkles, TrendingUp, Vote } from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { AnimatedCard } from '@/components/shared/AnimatedCard';
import { PrefetchLink } from '@/components/shared/PrefetchLink';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

import { usePolls, useAnalyticsStore } from '@/lib/stores';
import type { AnalyticsEvent } from '@/lib/stores/analyticsStore';

const EMPTY_EVENTS: AnalyticsEvent[] = [];

export default function EngagementSummary() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => { setIsMounted(true); }, []);

  const polls = usePolls();

  const analyticsStoreData = useAnalyticsStore(
    useShallow((state) => {
      try {
        return { events: state.events ?? EMPTY_EVENTS };
      } catch {
        return { events: EMPTY_EVENTS };
      }
    })
  );

  const analyticsEvents = useMemo(() => {
    if (!isMounted) return EMPTY_EVENTS;
    if (!Array.isArray(analyticsStoreData?.events) || analyticsStoreData.events.length === 0) {
      return EMPTY_EVENTS;
    }
    return analyticsStoreData.events;
  }, [isMounted, analyticsStoreData?.events]);

  const thirtyDaysAgo = useMemo(() => {
    if (!isMounted) return null;
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  }, [isMounted]);

  const votesLast30Days = useMemo(() => {
    if (!isMounted || !thirtyDaysAgo || analyticsEvents === EMPTY_EVENTS) return 0;
    return analyticsEvents.filter((event) => {
      const rec = event as Record<string, unknown>;
      return rec?.event_type === 'poll_voted' &&
        typeof rec?.created_at === 'string' &&
        new Date(rec.created_at) >= thirtyDaysAgo;
    }).length;
  }, [isMounted, analyticsEvents, thirtyDaysAgo]);

  const pollsCreatedLast30Days = useMemo(() => {
    if (!isMounted || !thirtyDaysAgo || analyticsEvents === EMPTY_EVENTS) return 0;
    return analyticsEvents.filter((event) => {
      const rec = event as Record<string, unknown>;
      return rec?.event_type === 'poll_created' &&
        typeof rec?.created_at === 'string' &&
        new Date(rec.created_at) >= thirtyDaysAgo;
    }).length;
  }, [isMounted, analyticsEvents, thirtyDaysAgo]);

  const fmtRef = useRef<Intl.NumberFormat | null>(null);
  if (isMounted && !fmtRef.current) {
    fmtRef.current = new Intl.NumberFormat('en-US');
  }
  const fmt = (n: number) => fmtRef.current?.format(n) ?? String(n);

  if (!isMounted) return null;

  const totalPolls = polls?.length ?? 0;
  const allZero = votesLast30Days === 0 && pollsCreatedLast30Days === 0 && totalPolls === 0;

  const metrics = [
    { label: 'Votes (30d)', value: votesLast30Days, icon: Vote, color: 'text-blue-500 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: 'Polls Created', value: pollsCreatedLast30Days, icon: BarChart3, color: 'text-green-500 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20' },
    { label: 'Total Polls', value: totalPolls, icon: TrendingUp, color: 'text-purple-500 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  ];

  if (allZero) {
    return (
      <AnimatedCard index={0}>
      <Card className="mb-6" data-testid="engagement-summary">
        <CardContent className="py-4 px-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 shrink-0">
              <Sparkles className="h-5 w-5 text-blue-500 dark:text-blue-400" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">Welcome to Choices!</p>
              <p className="text-xs text-muted-foreground">Vote on polls to start tracking your civic engagement.</p>
            </div>
            <Button asChild size="sm" className="shrink-0">
              <PrefetchLink href="/polls">Explore Polls</PrefetchLink>
            </Button>
          </div>
        </CardContent>
      </Card>
      </AnimatedCard>
    );
  }

  return (
    <AnimatedCard index={0}>
    <Card className="mb-6" data-testid="engagement-summary">
      <CardContent className="py-3 px-4">
        <div className="grid grid-cols-3 gap-3">
          {metrics.map((m, index) => (
            <AnimatedCard key={m.label} index={index}>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`p-1.5 rounded-md ${m.bg} shrink-0`}>
                <m.icon className={`h-4 w-4 ${m.color}`} aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-lg font-bold text-foreground leading-tight">{fmt(m.value)}</p>
                <p className="text-[11px] text-muted-foreground truncate">{m.label}</p>
              </div>
            </div>
            </AnimatedCard>
          ))}
        </div>
      </CardContent>
    </Card>
    </AnimatedCard>
  );
}
