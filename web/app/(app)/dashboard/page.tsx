'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';

// Enhanced Dashboard is now the default dashboard (no feature flag needed)
const EnhancedDashboard = dynamic(() => import('@/components/EnhancedDashboard'), {
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
      <EnhancedDashboard />
    </Suspense>
  );
}
