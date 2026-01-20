'use client';

import { Shield } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type IntegritySummary = {
  window_days: number;
  integrity_threshold: number;
  total_scored_votes: number;
  included_votes: number;
  excluded_votes: number;
};

export default function IntegrityDashboardPage() {
  const [summary, setSummary] = useState<IntegritySummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch('/api/integrity/summary', { cache: 'no-store' });
        if (!response.ok) {
          throw new Error('Failed to load integrity summary');
        }
        const payload = await response.json();
        if (!cancelled) {
          setSummary(payload?.data ?? null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load integrity summary');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-6 w-6 text-blue-600" />
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Integrity Dashboard</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Transparent integrity metrics for poll participation.
          </p>
        </div>
      </div>

      {error && (
        <Card>
          <CardContent className="py-4 text-sm text-red-600">{error}</CardContent>
        </Card>
      )}

      {summary && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Total scored votes</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{summary.total_scored_votes.toLocaleString()}</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Included votes</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold text-emerald-600">
              {summary.included_votes.toLocaleString()}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Excluded votes</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold text-amber-600">
              {summary.excluded_votes.toLocaleString()}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Integrity threshold</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{summary.integrity_threshold}</CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>How to interpret this</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
          <p>Votes are never weighted. We only filter out suspicious activity from displayed results.</p>
          <p>Raw vote data is still retained for audit and advanced analytics.</p>
          <p>Advanced detection signals are only collected after explicit opt-in.</p>
        </CardContent>
      </Card>
    </div>
  );
}
