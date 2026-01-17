import React from 'react';

import { Skeleton } from '@/components/ui/skeleton';

export default function MonitoringLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <Skeleton className="h-8 w-64" /> {/* Page title */}

      {/* System Health Skeleton */}
      <section className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800">
        <Skeleton className="h-6 w-32 mb-4" /> {/* Section title */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 bg-white dark:bg-gray-900 space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-24" />
            </div>
          ))}
        </div>
      </section>

      {/* Metrics Skeleton */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-20" />
          </div>
        ))}
      </section>

      {/* Top IPs Skeleton */}
      <section className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900 space-y-4">
        <Skeleton className="h-6 w-24" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-12" />
            </div>
          ))}
        </div>
      </section>

      {/* Violations Trend Skeleton */}
      <section className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900 space-y-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-4 w-48" />
      </section>

      {/* Violations by Endpoint Skeleton */}
      <section className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900 space-y-4">
        <Skeleton className="h-6 w-48" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-12" />
            </div>
          ))}
        </div>
      </section>

      {/* Recent Violations Table Skeleton */}
      <section className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900 space-y-4">
        <Skeleton className="h-6 w-48" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="grid grid-cols-5 gap-4 py-2 border-b border-gray-200 dark:border-gray-700">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

