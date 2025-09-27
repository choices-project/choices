'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { isFeatureEnabled } from '@/lib/core/feature-flags';

// Dynamically import the Enhanced Dashboard component to reduce initial bundle size
const EnhancedDashboard = dynamic(() => import('@/components/EnhancedDashboard'), {
  loading: () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
    </div>
  ),
  ssr: false // Disable SSR for this component to reduce server bundle size
});

// Fallback to basic dashboard if enhanced is disabled
const BasicDashboard = dynamic(() => import('@/components/Dashboard'), {
  loading: () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
    </div>
  ),
  ssr: false
});

export default function DashboardPage() {
  const useEnhancedDashboard = isFeatureEnabled('ENHANCED_DASHBOARD');
  
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    }>
      {useEnhancedDashboard ? <EnhancedDashboard /> : <BasicDashboard />}
    </Suspense>
  );
}
