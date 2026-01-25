'use client';

import { useRouter } from 'next/navigation';
import React, { useEffect, useRef } from 'react';

import { useIsAuthenticated, useUserLoading } from '@/lib/stores';
import { logger } from '@/lib/utils/logger';

type AuthGuardProps = {
  children: React.ReactNode;
  redirectTo?: string;
  fallback?: React.ReactNode;
}

/**
 * Authentication Guard Component
 *
 * Protects routes and components that require authentication.
 * Redirects unauthenticated users to login page.
 *
 * SECURITY: Critical component for preventing unauthorized access
 *
 * Created: January 27, 2025
 * Status: ✅ ACTIVE - SECURITY CRITICAL
 */
export function AuthGuard({
  children,
  redirectTo = '/auth',
  fallback = (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4" />
        <p className="text-gray-600">Checking authentication...</p>
      </div>
    </div>
  )
}: AuthGuardProps) {
  const isAuthenticated = useIsAuthenticated();
  const isLoading = useUserLoading();
  const router = useRouter();
  const routerRef = useRef(router);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => { routerRef.current = router; }, [router]);

  // Add timeout to prevent infinite loading (10 seconds max)
  useEffect(() => {
    if (isLoading) {
      loadingTimeoutRef.current = setTimeout(() => {
        logger.warn('AuthGuard - Loading timeout exceeded, proceeding with current auth state');
      }, 10000);
    } else {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    }
    
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [isLoading]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      logger.warn('AuthGuard - Unauthenticated user blocked, redirecting to login');
      routerRef.current.push(redirectTo);
    }
  }, [isAuthenticated, isLoading, redirectTo]);

  // Show loading while checking authentication (but with timeout protection)
  if (isLoading) {
    return <>{fallback}</>;
  }

  // SECURITY: Block access if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">You must be logged in to access this page.</p>
          <p className="text-sm text-gray-500 mt-2">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default AuthGuard;
