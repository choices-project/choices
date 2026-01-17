'use client';

import { useSearchParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';


import { clearRateLimit } from '@/app/actions/admin/monitoring';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

import { useExtendedHealth, useMonitoring } from '@/lib/hooks/useApi';

type MonitoringContentClientProps = {
  initialMonitoringData?: any;
  initialHealthData?: any;
};

/**
 * Client component for monitoring page with React Query
 * Provides client-side refresh, retry, and caching capabilities
 */
export function MonitoringContentClient({
  initialMonitoringData,
  initialHealthData,
}: MonitoringContentClientProps) {
  const searchParams = useSearchParams();
  const range = (searchParams.get('range') as '1h' | '24h' | '7d') ?? '24h';
  const endpointFilter = searchParams.get('endpoint') ?? '';

  // Use React Query hooks with initial data for better UX
  const {
    data: monitoringData,
    isLoading: monitoringLoading,
    error: monitoringError,
    refetch: refetchMonitoring,
  } = useMonitoring(
    { range, endpoint: endpointFilter },
    {
      initialData: initialMonitoringData,
      staleTime: 30000, // 30 seconds
      gcTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  const {
    data: healthData,
    isLoading: healthLoading,
    error: healthError,
    refetch: refetchHealth,
  } = useExtendedHealth({
    initialData: initialHealthData,
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  // get() from apiClient automatically unwraps { success: true, data: {...} }
  // monitoringData is already the unwrapped data payload
  // initialMonitoringData from SSR is still wrapped, need to unwrap it
  const data = monitoringData ?? (initialMonitoringData?.success ? initialMonitoringData?.data : initialMonitoringData);
  const health = healthData ?? initialHealthData;

  // Guard Date.now() usage to prevent hydration mismatches
  // Following established pattern: use useState + useEffect for client-only calculations
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    // Only calculate after mount to prevent hydration mismatch
    setNow(Date.now());
  }, []);

  // Build time buckets and filter with guarded timestamp (only after mount)
  const cutoff = now !== null
    ? (range === '1h' ? now - 60 * 60 * 1000 : range === '7d' ? now - 7 * 24 * 60 * 60 * 1000 : now - 24 * 60 * 60 * 1000)
    : 0; // Safe fallback during SSR

  const recent = now !== null
    ? (data?.recentViolations ?? []).filter(
        (v: any) => v.timestamp > cutoff && (!endpointFilter || v.endpoint === endpointFilter)
      )
    : []; // Empty array during SSR to prevent hydration mismatch

  // Build time buckets for chart (only after mount)
  const bucketMs = range === '1h' ? 10 * 60 * 1000 : 60 * 60 * 1000;
  const bucketCount = range === '1h' ? 6 : range === '7d' ? 7 * 24 : 24;
  const buckets = now !== null
    ? Array.from({ length: bucketCount }, (_, i) => now - (bucketCount - 1 - i) * bucketMs)
    : [];
  // Calculate bucket values only after mount (prevent hydration mismatch)
  const bucketValues = now !== null && buckets.length > 0
    ? buckets.map((start) => {
        const end = start + bucketMs;
        return recent.filter((v: any) => v.timestamp >= start && v.timestamp < end).length;
      })
    : [];
  const maxVal = bucketValues.length > 0 ? Math.max(1, ...bucketValues) : 1;

  const handleRefresh = async () => {
    await Promise.all([refetchMonitoring(), refetchHealth()]);
  };

  // Show loading skeletons if data is being refreshed
  const isRefreshing = monitoringLoading || healthLoading;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          Security & System Monitoring
        </h1>
        <Button
          onClick={handleRefresh}
          disabled={isRefreshing}
          variant="outline"
          size="sm"
          aria-label="Refresh monitoring data"
        >
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* System Health Section */}
      {(healthLoading && !health) ? (
        <section className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800">
          <Skeleton className="h-32 w-full" />
        </section>
      ) : health && (
        <section className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">System Health</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 bg-white dark:bg-gray-900">
              <div className="text-xs text-gray-500 dark:text-gray-400">Overall Status</div>
              <div className={`text-2xl font-bold ${
                health.status === 'healthy' ? 'text-green-600 dark:text-green-400' :
                health.status === 'degraded' ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {health.status?.toUpperCase() ?? 'UNKNOWN'}
              </div>
            </div>
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 bg-white dark:bg-gray-900">
              <div className="text-xs text-gray-500 dark:text-gray-400">Database</div>
              <div className={`text-2xl font-bold ${
                health.checks?.database?.status === 'healthy' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {health.checks?.database?.status?.toUpperCase() ?? 'UNKNOWN'}
              </div>
              {health.checks?.database?.responseTime && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {health.checks.database.responseTime}ms
                </div>
              )}
            </div>
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 bg-white dark:bg-gray-900">
              <div className="text-xs text-gray-500 dark:text-gray-400">Supabase</div>
              <div className={`text-2xl font-bold ${
                health.checks?.supabase?.status === 'healthy' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {health.checks?.supabase?.status?.toUpperCase() ?? 'UNKNOWN'}
              </div>
            </div>
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 bg-white dark:bg-gray-900">
              <div className="text-xs text-gray-500 dark:text-gray-400">Memory Usage</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {health.system?.memory?.used ?? 0}MB
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                of {health.system?.memory?.total ?? 0}MB
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Error Display */}
      {monitoringError && (
        <div className="rounded-lg border border-red-200 dark:border-red-700 p-4 bg-red-50 dark:bg-red-900/20" role="alert">
          <p className="text-sm text-red-800 dark:text-red-200">
            Failed to load monitoring data. <button onClick={() => refetchMonitoring()} className="underline">Try again</button>
          </p>
        </div>
      )}

      {healthError && (
        <div className="rounded-lg border border-red-200 dark:border-red-700 p-4 bg-red-50 dark:bg-red-900/20" role="alert">
          <p className="text-sm text-red-800 dark:text-red-200">
            Failed to load health data. <button onClick={() => refetchHealth()} className="underline">Try again</button>
          </p>
        </div>
      )}

      {/* Rate Limiting Metrics Section */}
      {monitoringLoading && !data ? (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </section>
      ) : (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Violations</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{data?.metrics?.totalViolations ?? 0}</div>
          </div>
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
            <div className="text-sm text-gray-500 dark:text-gray-400">Violations (Last Hour)</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{data?.metrics?.violationsLastHour ?? 0}</div>
          </div>
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
            <div className="text-sm text-gray-500 dark:text-gray-400">Violations (Last 24h)</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{data?.metrics?.violationsLast24Hours ?? 0}</div>
          </div>
        </section>
      )}

      {/* Top IPs Section */}
      {monitoringLoading && !data ? (
        <section className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
          <Skeleton className="h-32 w-full" />
        </section>
      ) : (
        <section className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
          <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Top IPs</h2>
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {(data?.metrics?.topViolatingIPs ?? []).map((item: { ip: string; count: number }) => (
              <li key={item.ip} className="py-2 flex items-center justify-between">
                <span className="font-mono text-gray-900 dark:text-gray-100">{item.ip}</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">{item.count}</span>
              </li>
            ))}
            {(!data?.metrics?.topViolatingIPs || data.metrics.topViolatingIPs.length === 0) && (
              <li className="py-4 text-sm text-gray-500 dark:text-gray-400 text-center">No violations recorded</li>
            )}
          </ul>
        </section>
      )}

      {/* Violations Trend Section */}
      {monitoringLoading && !data ? (
        <section className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
          <Skeleton className="h-32 w-full" />
        </section>
      ) : (
        <section className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
          <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Violations Trend</h2>
          <div className="flex items-end gap-1 h-20">
            {bucketValues.map((v, i) => (
              <div
                key={i}
                className="bg-blue-500 dark:bg-blue-600 transition-all duration-200"
                style={{ width: '6px', height: `${(v / maxVal) * 100}%`, minHeight: '2px' }}
                aria-label={`${v} violations in bucket ${i + 1}`}
              />
            ))}
          </div>
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Showing {range === '1h' ? '10-minute' : 'hourly'} buckets for {range}
          </div>
        </section>
      )}

      {/* Filters and Violations by Endpoint Section */}
      <section className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
        <form
          className="flex flex-wrap items-end gap-3 mb-4"
          action=""
          method="get"
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const params = new URLSearchParams();
            params.set('range', formData.get('range') as string || '24h');
            const endpoint = formData.get('endpoint') as string;
            if (endpoint) params.set('endpoint', endpoint);
            window.location.search = params.toString();
          }}
        >
          <div>
            <label htmlFor="range" className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              Timeframe
            </label>
            <select
              id="range"
              name="range"
              defaultValue={range}
              className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="1h">Last hour</option>
              <option value="24h">Last 24h</option>
              <option value="7d">Last 7d</option>
            </select>
          </div>
          <div>
            <label htmlFor="endpoint" className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              Endpoint
            </label>
            <input
              id="endpoint"
              name="endpoint"
              defaultValue={endpointFilter}
              placeholder="/api/feeds"
              className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm min-w-[200px] bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>
          <div>
            <button
              type="submit"
              className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Apply
            </button>
          </div>
        </form>
        <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Violations by Endpoint</h2>
        {monitoringLoading && !data ? (
          <Skeleton className="h-48 w-full" />
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {Object.entries(data?.metrics?.violationsByEndpoint ?? {})
              .filter(([endpoint]) => !endpointFilter || endpoint === endpointFilter)
              .map(([endpoint, count]) => {
                const violationCount = typeof count === 'number' ? count : 0;
                return (
                  <li key={endpoint} className="py-2 flex items-center justify-between">
                    <span className="font-mono text-gray-900 dark:text-gray-100">{endpoint}</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">{violationCount}</span>
                  </li>
                );
              })}
            {(!data?.metrics?.violationsByEndpoint || Object.keys(data.metrics.violationsByEndpoint).length === 0) && (
              <li className="py-4 text-sm text-gray-500 dark:text-gray-400 text-center">No violations recorded</li>
            )}
          </ul>
        )}
      </section>

      {/* System Performance Metrics */}
      {health?.system && (
        <section className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">System Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Memory Usage</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {health.system.memory?.used ?? 0} MB / {health.system.memory?.total ?? 0} MB
              </div>
              <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-500 dark:bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, ((health.system.memory?.used ?? 0) / (health.system.memory?.total ?? 1)) * 100)}%`
                  }}
                  role="progressbar"
                  aria-valuenow={health.system.memory?.used ?? 0}
                  aria-valuemin={0}
                  aria-valuemax={health.system.memory?.total ?? 0}
                />
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Uptime</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {health.uptime ? `${Math.floor(health.uptime / 60)}m ${Math.floor(health.uptime % 60)}s` : 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Environment</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">{health.environment ?? 'unknown'}</div>
            </div>
          </div>
        </section>
      )}

      {/* Recent Violations Table */}
      <section className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
        <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">Recent Violations (last 24h)</h2>
        {monitoringLoading && !data ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b border-gray-200 dark:border-gray-700">
                  <th className="py-2 pr-4 text-gray-900 dark:text-gray-100">Time</th>
                  <th className="py-2 pr-4 text-gray-900 dark:text-gray-100">IP</th>
                  <th className="py-2 pr-4 text-gray-900 dark:text-gray-100">Endpoint</th>
                  <th className="py-2 pr-4 text-gray-900 dark:text-gray-100">Count</th>
                  <th className="py-2 pr-4 text-gray-900 dark:text-gray-100">Action</th>
                </tr>
              </thead>
              <tbody>
                {recent.slice(0, 50).map((v: any, idx: number) => (
                  <tr key={idx} className="border-t border-gray-200 dark:border-gray-700">
                    <td className="py-2 pr-4 text-gray-900 dark:text-gray-100">
                      {new Date(v.timestamp).toLocaleString()}
                    </td>
                    <td className="py-2 pr-4 font-mono text-gray-900 dark:text-gray-100">{v.ip}</td>
                    <td className="py-2 pr-4 font-mono text-gray-900 dark:text-gray-100">{v.endpoint}</td>
                    <td className="py-2 pr-4 text-gray-900 dark:text-gray-100">{v.count}</td>
                    <td className="py-2 pr-4">
                      <ClearLimitButton
                        ip={v.ip}
                        endpoint={v.endpoint}
                        onCleared={() => refetchMonitoring()}
                      />
                    </td>
                  </tr>
                ))}
                {recent.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                      No recent violations recorded
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

/**
 * Button component for clearing rate limits
 */
function ClearLimitButton({ ip, endpoint, onCleared }: { ip: string; endpoint: string; onCleared: () => void }) {
  const [isClearing, setIsClearing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClear = async () => {
    setIsClearing(true);
    setError(null);
    try {
      const result = await clearRateLimit(ip, endpoint);
      if (result.success) {
        onCleared();
      } else {
        setError(result.error ?? 'Failed to clear limit');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear limit');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <Button
        onClick={handleClear}
        disabled={isClearing}
        size="sm"
        variant="outline"
        className="text-xs"
      >
        {isClearing ? 'Clearing...' : 'Clear'}
      </Button>
      {error && (
        <span className="text-xs text-red-600 dark:text-red-400" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

