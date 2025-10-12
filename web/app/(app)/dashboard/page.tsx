'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Use SuperiorMobileFeed as the main dashboard component
const SuperiorMobileFeed = dynamic(() => import('@/features/feeds').then(mod => ({ default: mod.SuperiorMobileFeed })), {
  loading: () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
    </div>
  ),
  ssr: true // Enable SSR for proper hydration
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
