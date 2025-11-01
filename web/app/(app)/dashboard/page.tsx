'use client';


import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import React, { Suspense, useEffect, useState } from 'react';

// Use PersonalDashboard as the main dashboard component
const PersonalDashboard = dynamic(() => import('@/features/dashboard').then(mod => ({ default: mod.PersonalDashboard })), {
  loading: () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600" />
    </div>
  ),
  ssr: false // Disable SSR due to client-side dependencies (browser APIs, localStorage, etc.)
});

export default function DashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Server-side authentication check using profile API
  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        console.log('🔍 Dashboard: Checking server-side authentication...');
        
        const response = await fetch('/api/profile', {
          credentials: 'include',
        });
        
        if (response.ok) {
          const profileData = await response.json();
          const hasProfile = !!profileData.profile;
          console.log('🔍 Dashboard: Server auth result:', { hasProfile, userId: profileData.profile?.user_id });
          
          setIsAuthenticated(hasProfile);
          setIsLoading(false);
          
          if (!hasProfile) {
            console.log('🚨 Dashboard: No profile found - redirecting to login');
            router.push('/auth');
          }
        } else {
          console.log('🚨 Dashboard: Profile API failed - redirecting to login');
          setIsAuthenticated(false);
          setIsLoading(false);
          router.push('/auth');
        }
      } catch (error) {
        console.log('❌ Dashboard: Authentication check failed:', error);
        setIsAuthenticated(false);
        setIsLoading(false);
        router.push('/auth');
      }
    };

    checkAuthentication();
  }, [router]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600" />
      </div>
    );
  }

  // SECURITY: Block access if not authenticated
  if (isAuthenticated === false) {
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
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600" />
      </div>
    }>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PersonalDashboard />
      </div>
    </Suspense>
  );
}
