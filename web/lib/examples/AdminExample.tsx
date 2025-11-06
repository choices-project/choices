/**
 * Example Component: Admin Dashboard with React Query
 *
 * Shows best practices for:
 * - Multiple parallel queries
 * - Background refetching
 * - Conditional queries
 * - Loading skeletons
 *
 * Created: November 6, 2025
 * Status: ✅ EXAMPLE CODE
 */

'use client';

import { useHealth, useFeedbackList } from '@/lib/hooks/useApi';

export default function AdminExample() {
  // Multiple queries in parallel - React Query handles them efficiently
  const healthQuery = useHealth('database', {
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const feedbackQuery = useFeedbackList(
    { status: 'open', type: 'bug' },
    {
      refetchOnWindowFocus: true, // Refetch when tab regains focus
    }
  );

  // Derived loading state
  const isLoading = healthQuery.isLoading || feedbackQuery.isLoading;
  const hasError = healthQuery.error || feedbackQuery.error;

  // Show loading skeleton
  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded" />
          <div className="h-4 bg-gray-200 rounded w-5/6" />
        </div>
      </div>
    );
  }

  // Show error
  if (hasError) {
    return (
      <div className="p-4">
        <div className="bg-red-100 text-red-700 p-4 rounded">
          Error loading admin data
        </div>
      </div>
    );
  }

  const health = healthQuery.data;
  const feedback = feedbackQuery.data || [];

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>

      {/* Health Status */}
      <div className="bg-white shadow rounded p-4 mb-4">
        <h2 className="text-lg font-semibold mb-2">System Health</h2>
        <div className="space-y-2">
          <p>
            <strong>Status:</strong>{' '}
            <span className={health?.status === 'healthy' ? 'text-green-600' : 'text-red-600'}>
              {health?.status || 'unknown'}
            </span>
          </p>
          {health?.performance && (
            <>
              <p>
                <strong>Avg Response Time:</strong> {health.performance.queryStats?.averageQueryTime}ms
              </p>
              <p>
                <strong>Optimization Enabled:</strong>{' '}
                {health.performance.optimizationEnabled ? 'Yes' : 'No'}
              </p>
            </>
          )}
          <p className="text-xs text-gray-500">
            Auto-refreshing every 30 seconds...
          </p>
        </div>
      </div>

      {/* Feedback */}
      <div className="bg-white shadow rounded p-4">
        <h2 className="text-lg font-semibold mb-2">Open Bug Reports ({feedback.length})</h2>
        <div className="space-y-2">
          {feedback.length === 0 ? (
            <p className="text-gray-500">No open bug reports</p>
          ) : (
            feedback.slice(0, 5).map((item: any) => (
              <div key={item.id} className="border-l-4 border-red-500 pl-3 py-2">
                <p className="font-medium">{item.title}</p>
                <p className="text-sm text-gray-600">{item.description}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {item.sentiment} · {item.priority} priority
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* React Query DevTools Info */}
      <div className="mt-4 p-4 bg-gray-100 rounded">
        <h3 className="font-bold mb-2">React Query Features Demo:</h3>
        <ul className="text-sm space-y-1">
          <li>✅ Multiple queries fetched in parallel</li>
          <li>✅ Health auto-refetches every 30s</li>
          <li>✅ Feedback refetches on window focus</li>
          <li>✅ All data cached and shared across components</li>
          <li>✅ Loading skeletons while fetching</li>
          <li>✅ Error handling built-in</li>
        </ul>
      </div>
    </div>
  );
}

