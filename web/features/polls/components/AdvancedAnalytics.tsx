/**
 * Advanced Analytics Component
 *
 * Provides advanced analytics for closed polls with rate limiting:
 * - Regular users: 3 requests per week
 * - Admins: Unlimited
 * - Only available for closed polls (non-admins)
 *
 * Uses existing /api/analytics/unified/[id] endpoint via wrapper.
 *
 * Created: January 2025
 */

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BarChart3, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { useCallback } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import type { AnalyticsType } from '@/lib/analytics/rate-limiter';
import { useUser } from '@/lib/stores';
import { logger } from '@/lib/utils/logger';

type AdvancedAnalyticsProps = {
  pollId: string;
  pollStatus: 'active' | 'closed' | 'draft' | 'archived';
  className?: string;
};

type AnalyticsResult = {
  data: any;
  analyticsType: AnalyticsType;
  remaining: number;
  resetDate: string;
};

const ANALYTICS_TYPES: Array<{ type: AnalyticsType; label: string; description: string }> = [
  {
    type: 'demographics',
    label: 'Demographics',
    description: 'Age, education, political affiliation breakdown',
  },
  {
    type: 'geographic',
    label: 'Geographic',
    description: 'Vote distribution by location',
  },
  {
    type: 'trust_tier',
    label: 'Trust Tier',
    description: 'Analysis by user trust levels',
  },
  {
    type: 'temporal',
    label: 'Temporal',
    description: 'Voting patterns over time',
  },
  {
    type: 'funnel',
    label: 'Funnel',
    description: 'Complete engagement funnel analysis',
  },
];

type StatusData = { remaining: number | null; resetDate: Date | null; isAdmin: boolean };

const STATUS_QUERY_KEY = ['advanced-analytics-status'] as const;

export default function AdvancedAnalytics({
  pollId,
  pollStatus,
  className = '',
}: AdvancedAnalyticsProps) {
  const user = useUser();
  const queryClient = useQueryClient();

  const { data: statusData } = useQuery({
    queryKey: [...STATUS_QUERY_KEY, pollId, user?.id],
    queryFn: async (): Promise<StatusData> => {
      const response = await fetch(`/api/polls/${pollId}/advanced-analytics?type=demographics`);
      if (!response.ok) return { remaining: null, resetDate: null, isAdmin: false };
      const json = await response.json();
      if (!json.success || !json.data) return { remaining: null, resetDate: null, isAdmin: false };
      return {
        remaining: json.data.remaining ?? null,
        resetDate: json.data.resetDate ? new Date(json.data.resetDate) : null,
        isAdmin: json.data.isAdmin === true,
      };
    },
    enabled: !!user?.id && !!pollId,
  });

  const remaining = statusData?.remaining ?? null;
  const resetDate = statusData?.resetDate ?? null;
  const isAdmin = statusData?.isAdmin ?? false;

  const runMutation = useMutation({
    mutationFn: async (analyticsType: AnalyticsType) => {
      const response = await fetch(`/api/polls/${pollId}/advanced-analytics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analyticsType,
          aiProvider: 'rule-based',
        }),
      });
      const json = await response.json();
      if (!response.ok) {
        const err = new Error(json.error || json.message || 'Failed to run analytics') as Error & {
          remaining?: number;
          resetDate?: string;
        };
        err.remaining = json.remaining;
        err.resetDate = json.resetDate;
        throw err;
      }
      if (!json.success || !json.data) throw new Error('Invalid response from analytics API');
      return {
        data: json.data,
        analyticsType,
        remaining: json.remaining ?? 0,
        resetDate: json.resetDate,
      } as AnalyticsResult;
    },
    onSuccess: (_data, analyticsType) => {
      logger.info('Advanced analytics completed', { pollId, analyticsType });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: [...STATUS_QUERY_KEY, pollId, user?.id] });
    },
  });

  const runAnalytics = useCallback(
    (analyticsType: AnalyticsType) => {
      if (pollStatus !== 'closed' && !isAdmin) return;
      runMutation.mutate(analyticsType);
    },
    [pollId, pollStatus, isAdmin, runMutation]
  );

  const results = runMutation.data ?? null;
  const loading = runMutation.isPending;
  const error = runMutation.error?.message ?? null;
  const hasRemaining = remaining !== null && (remaining > 0 || isAdmin);
  const isDisabled = pollStatus !== 'closed' && !isAdmin;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Advanced Analytics
        </CardTitle>
        <CardDescription>
          Deep insights into poll engagement and voter demographics
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Banner */}
        {pollStatus === 'active' && !isAdmin && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Advanced analytics are available after the poll closes.
            </AlertDescription>
          </Alert>
        )}

        {remaining !== null && !isAdmin && (
          <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <span className="text-sm font-medium text-blue-900 dark:text-blue-300">
              Remaining this week:
            </span>
            <Badge variant={remaining > 0 ? 'default' : 'destructive'} className="text-sm">
              {remaining} / 3
            </Badge>
            {resetDate && remaining === 0 && (
              <span className="text-xs text-blue-700 dark:text-blue-400 ml-2">
                Resets: {resetDate.toLocaleDateString()}
              </span>
            )}
          </div>
        )}

        {isAdmin && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              Admin access: Unlimited advanced analytics available.
            </AlertDescription>
          </Alert>
        )}

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Analytics Type Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {ANALYTICS_TYPES.map(({ type, label, description }) => (
            <Button
              key={type}
              onClick={() => runAnalytics(type)}
              disabled={loading || isDisabled || (!hasRemaining && !isAdmin)}
              variant="outline"
              className="h-auto py-3 flex flex-col items-start"
            >
              <div className="flex items-center gap-2 w-full">
                <span className="font-semibold">{label}</span>
                {loading && (
                  <Loader2 className="h-4 w-4 animate-spin ml-auto" />
                )}
              </div>
              <span className="text-xs text-muted-foreground mt-1 text-left">
                {description}
              </span>
            </Button>
          ))}
        </div>

        {/* Results Display */}
        {results && (
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold">
                {ANALYTICS_TYPES.find((t) => t.type === results.analyticsType)?.label} Analysis
              </h4>
              <Badge variant="outline">
                {results.remaining} remaining
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              <p className="mb-2">Analytics data loaded successfully.</p>
              <p className="text-xs">
                Note: Full visualization of this data will be implemented in a future update.
                For now, the data is available via the API.
              </p>
            </div>
            {/* TODO: Add proper chart visualization using Recharts */}
            <pre className="mt-4 p-3 bg-background rounded text-xs overflow-auto max-h-64">
              {JSON.stringify(results.data, null, 2)}
            </pre>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 text-sm text-muted-foreground">Generating analytics...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
