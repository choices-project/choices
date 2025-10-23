'use client';

import dynamic from 'next/dynamic';
import { Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useIsAuthenticated, useUserStore } from '@/lib/stores';

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
  const isAuthenticated = useIsAuthenticated();
  const { isLoading } = useUserStore();
  const router = useRouter();

  // SECURITY: Redirect unauthenticated users to login
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      console.log('🚨 SECURITY: Unauthenticated user attempting to access dashboard - redirecting to login');
      router.push('/auth');
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // SECURITY: Block access if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">You must be logged in to access the dashboard.</p>
          <p className="text-sm text-gray-500 mt-2">Redirecting to login...</p>
        </div>
      </div>
    );
  }

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
