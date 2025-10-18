'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Use SuperiorMobileFeed as the main dashboard component with memory optimization
const SuperiorMobileFeed = dynamic(() => import('@/features/feeds').then(mod => ({ default: mod.SuperiorMobileFeed })), {
  loading: () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
    </div>
  ),
  ssr: false // Disable SSR to reduce server bundle size and memory usage
});

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    }>
      <SuperiorMobileFeed />
    </Suspense>
  );
}
