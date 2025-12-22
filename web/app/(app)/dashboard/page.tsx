'use client';

import { Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import { PersonalDashboard } from '@/features/dashboard';
import { useProfile } from '@/features/profile/hooks/use-profile';

import DashboardNavigation, { MobileDashboardNav } from '@/components/shared/DashboardNavigation';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { Button } from '@/components/ui/button';

import { useIsAuthenticated, useUserLoading, useUserStore } from '@/lib/stores';
import { useAppActions } from '@/lib/stores/appStore';
import { logger } from '@/lib/utils/logger';

// Prevent static generation since this requires client-side state
export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  const router = useRouter();
  const routerRef = useRef(router);
  useEffect(() => { routerRef.current = router; }, [router]);
  const { profile, isLoading } = useProfile();
  const isAuthenticated = useIsAuthenticated();
  const isUserLoading = useUserLoading();
  const { setCurrentRoute, setBreadcrumbs, setSidebarActiveSection } = useAppActions();

  // Refs for stable app store actions
  const setCurrentRouteRef = useRef(setCurrentRoute);
  useEffect(() => { setCurrentRouteRef.current = setCurrentRoute; }, [setCurrentRoute]);
  const setBreadcrumbsRef = useRef(setBreadcrumbs);
  useEffect(() => { setBreadcrumbsRef.current = setBreadcrumbs; }, [setBreadcrumbs]);
  const setSidebarActiveSectionRef = useRef(setSidebarActiveSection);
  useEffect(() => { setSidebarActiveSectionRef.current = setSidebarActiveSection; }, [setSidebarActiveSection]);

  // Use isMounted to prevent hydration mismatch when checking localStorage
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const shouldBypassAuth = useMemo(
    () => {
      // In E2E harness mode, always bypass auth checks (authentication is mocked)
      if (process.env.NEXT_PUBLIC_ENABLE_E2E_HARNESS === '1') {
        return true;
      }
      // Only check localStorage after mount to prevent hydration mismatch
      if (!isMounted) {
        return false;
      }
      // Check localStorage bypass flag for specific test scenarios
      return typeof window !== 'undefined' &&
        window.localStorage.getItem('e2e-dashboard-bypass') === '1';
    },
    [isMounted],
  );
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(false);
  const adminCheckRef = useRef<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const authRetryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setCurrentRouteRef.current('/dashboard');
    setSidebarActiveSectionRef.current('dashboard');
    setBreadcrumbsRef.current([
      { label: 'Home', href: '/' },
      { label: 'Dashboard', href: '/dashboard' },
    ]);

    return () => {
      setSidebarActiveSectionRef.current(null);
      setBreadcrumbsRef.current([]);
    };
  }, []);

  useEffect(() => {
    // In E2E harness mode or when bypassing auth, skip all redirect checks (authentication is mocked)
    if (shouldBypassAuth) {
      return () => {
        // Cleanup function - no cleanup needed for bypass case
      };
    }
    // Wait for user loading to complete before checking authentication
    // This prevents redirecting while auth state is still being initialized
    if (isUserLoading) {
      return () => {
        // Cleanup function - no cleanup needed for loading case
      };
    }
    // First check if user is authenticated - if not, check session cookie and wait for hydration
    if (!isAuthenticated) {
      // Clear any existing retry timeout
      if (authRetryTimeoutRef.current) {
        clearTimeout(authRetryTimeoutRef.current);
        authRetryTimeoutRef.current = null;
      }

      // Additional check: verify session cookie exists as fallback
      // If middleware allowed the request through, cookies exist and user IS authenticated
      // Trust the cookies and allow rendering while auth state hydrates
      const hasSessionCookie = typeof document !== 'undefined' &&
        (document.cookie.includes('sb-') ||
         document.cookie.includes('auth-token'));

      if (!hasSessionCookie) {
        // No cookies at all - definitely not authenticated, redirect immediately
        logger.debug('🚨 Dashboard: No session cookie - redirecting to auth');
        routerRef.current.replace('/auth');
        return () => {
          // Cleanup function - no cleanup needed for immediate redirect
        };
      }

      // Cookie exists - middleware already validated authentication, so trust it
      // Allow page to render while auth state hydrates (can take 3-5 seconds in production)
      // Only redirect if cookies disappear or auth state fails to hydrate after extended wait
      logger.debug('🚨 Dashboard: Session cookie exists - trusting middleware, allowing render while auth hydrates');
      authRetryTimeoutRef.current = setTimeout(() => {
        // After extended wait, check if cookies still exist and auth state has hydrated
        const stillHasCookie = typeof document !== 'undefined' &&
          (document.cookie.includes('sb-') ||
           document.cookie.includes('auth-token'));
        // Access store directly to check auth state without causing re-render
        const currentAuthState = useUserStore.getState().isAuthenticated;

        if (!stillHasCookie) {
          // Cookies disappeared - definitely not authenticated
          logger.debug('🚨 Dashboard: Session cookie disappeared after wait - redirecting to auth');
          routerRef.current.replace('/auth');
        } else if (!currentAuthState) {
          // Cookies still exist but auth state hasn't hydrated after extended wait
          // This is unusual but could happen if there's a store hydration issue
          // Log a warning but DON'T redirect - cookies are authoritative, allow render
          logger.warn('🚨 Dashboard: Session cookie exists but auth state not hydrated after extended wait - allowing render anyway (cookies are authoritative)');
        }
        // If currentAuthState is true, no action needed - auth has successfully hydrated
        authRetryTimeoutRef.current = null;
      }, 5000); // Wait 5 seconds for hydration (production can be slower)

      return () => {
        if (authRetryTimeoutRef.current) {
          clearTimeout(authRetryTimeoutRef.current);
          authRetryTimeoutRef.current = null;
        }
      };
    } else {
      // Authenticated - clear any pending retry timeout
      if (authRetryTimeoutRef.current) {
        clearTimeout(authRetryTimeoutRef.current);
        authRetryTimeoutRef.current = null;
      }
    }
    // If authenticated but no profile, check if user is admin first
    // Admin users should have profiles, but if profile is still loading or missing,
    // we should check admin status before redirecting to onboarding
    // IMPORTANT: Only redirect if profile has finished loading AND is still null after a delay
    // This prevents redirecting users while profile is still being fetched
    if (!isLoading && isAuthenticated && !profile && !isCheckingAdmin) {
      // Wait a bit longer for profile to load - sometimes it takes a moment
      // Only redirect if profile is truly missing after a reasonable delay
      const checkAdminAndRedirect = async () => {
        if (adminCheckRef.current) {
          return; // Already checking
        }
        adminCheckRef.current = true;
        setIsCheckingAdmin(true);

        // Give profile a bit more time to load (3 seconds)
        // This allows the profile fetch to complete
        await new Promise(resolve => setTimeout(resolve, 3_000));

        // Re-check if profile loaded by re-reading from the hook
        // The profile state might have updated during the wait
        // We'll check this in the render logic below

        try {
          const response = await fetch('/api/admin/health?type=status', {
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            signal: AbortSignal.timeout(5_000), // 5 second timeout
          });

          if (response.ok) {
            // User is admin - allow access to dashboard (they can navigate to admin dashboard)
            logger.debug('🚨 Dashboard: No profile but user is admin - allowing dashboard access');
            setIsCheckingAdmin(false);
            adminCheckRef.current = false;
            return; // Don't redirect
          } else if (response.status === 401 || response.status === 403) {
            // Not admin or not authenticated - redirect to onboarding
            logger.debug('🚨 Dashboard: User is not admin (401/403) - redirecting to onboarding');
          } else {
            // Other error - log but still redirect to be safe
            logger.warn('🚨 Dashboard: Admin check returned non-OK status:', response.status);
          }
        } catch (error) {
          // If admin check fails or times out, assume not admin and redirect
          logger.debug('🚨 Dashboard: Admin check failed or user is not admin - redirecting to onboarding', error);
        }

        // Not admin or check failed - redirect to onboarding
        logger.debug('🚨 Dashboard: No profile found - redirecting to onboarding');
        setIsCheckingAdmin(false);
        adminCheckRef.current = false;
        routerRef.current.replace('/onboarding');
      };

      void checkAdminAndRedirect();
    }

    // Return cleanup function for all code paths
    return () => {
      // Cleanup function - no cleanup needed for other cases
    };
  }, [isLoading, isUserLoading, isAuthenticated, profile, shouldBypassAuth, isCheckingAdmin]); // Added isCheckingAdmin to dependencies

  // Check if user is admin when profile is loaded
  useEffect(() => {
    if (shouldBypassAuth || !isAuthenticated || isLoading) {
      return;
    }

    // Check admin status if we have a profile or if we're authenticated
    const checkAdminStatus = async () => {
      try {
        const response = await fetch('/api/admin/health?type=status', {
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          signal: AbortSignal.timeout(5_000), // 5 second timeout
        });

        if (response.ok) {
          setIsAdmin(true);
          logger.debug('🚨 Dashboard: User is admin - showing admin dashboard link');
        } else {
          setIsAdmin(false);
        }
      } catch {
        // If check fails, assume not admin (don't show admin link)
        setIsAdmin(false);
      }
    };

    void checkAdminStatus();
  }, [isAuthenticated, isLoading, shouldBypassAuth]);

  // Add loading timeout to prevent infinite loading state
  // Allow dashboard to render even if profile is still loading (PersonalDashboard handles loading gracefully)
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  useEffect(() => {
    if (!isLoading) {
      setLoadingTimeout(false);
      return;
    }
    const timeout = setTimeout(() => {
      setLoadingTimeout(true);
    }, 10_000); // 10 second timeout - allow dashboard to render even if profile is slow
    return () => clearTimeout(timeout);
  }, [isLoading]);

  // Show loading skeleton only if actively loading and not timed out
  // In E2E harness mode or after timeout, allow dashboard to render (it handles missing profile gracefully)
  // Also bypass loading check if user is authenticated (profile can load in background)
  if (isLoading && !loadingTimeout && !shouldBypassAuth && !isAuthenticated) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" aria-label="Loading dashboard">
        <div className="space-y-6">
          {/* Header skeleton */}
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 dark:bg-gray-700 mb-4" />
            <div className="h-4 bg-gray-200 rounded w-1/2 dark:bg-gray-700" />
          </div>
          {/* Cards skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="h-6 bg-gray-200 rounded w-3/4 dark:bg-gray-700 mb-4" />
                <div className="h-4 bg-gray-200 rounded w-full dark:bg-gray-700 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-5/6 dark:bg-gray-700" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Only block rendering if user is definitely not authenticated AND no cookies exist
  // If cookies exist, middleware already validated authentication, so allow rendering
  // Allow page to render even if profile is still loading or missing
  // The PersonalDashboard component can handle missing profile gracefully
  // In E2E harness mode, always allow rendering (authentication is mocked)
  const hasSessionCookie = typeof window !== 'undefined' &&
    (document.cookie.includes('sb-') || document.cookie.includes('auth-token'));
  
  // Only show access denied if:
  // 1. Not bypassing auth
  // 2. Not loading
  // 3. Not authenticated in store
  // 4. AND no session cookies exist (definitely not authenticated)
  if (!shouldBypassAuth && !isUserLoading && !isAuthenticated && !hasSessionCookie) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="text-center space-y-4 max-w-md">
          <h1 className="text-2xl font-bold text-red-600 dark:text-red-400">Access denied</h1>
          <p className="text-gray-600 dark:text-gray-400">
            You must be logged in to access the dashboard.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">Redirecting to login…</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      {/* 🔒 Cohesive Dashboard Navigation */}
      <DashboardNavigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Show admin dashboard link for admin users */}
        {isAdmin === true && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100">Admin Access Available</h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    You have admin privileges. Access the admin dashboard for system management.
                  </p>
                </div>
              </div>
              <Button
                onClick={() => routerRef.current.push('/admin/dashboard')}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Shield className="h-4 w-4 mr-2" />
                Go to Admin Dashboard
              </Button>
            </div>
          </div>
        )}

        <PersonalDashboard />
      </div>

      {/* 🔒 Mobile Navigation */}
      <MobileDashboardNav />
    </ErrorBoundary>
  );
}
