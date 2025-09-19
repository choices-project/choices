'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the Dashboard component to reduce initial bundle size
const Dashboard = dynamic(() => import('@/components/Dashboard'), {
  loading: () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
    </div>
  ),
  ssr: false // Disable SSR for this component to reduce server bundle size
});

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    }>
      <Dashboard />
    </Suspense>
  );
}
