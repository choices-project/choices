'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Use PersonalDashboard as the main dashboard component
const PersonalDashboard = dynamic(() => import('@/features/dashboard').then(mod => ({ default: mod.PersonalDashboard })), {
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PersonalDashboard />
      </div>
    </Suspense>
  );
}
