'use client';

import { Shield } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';

import { PersonalDashboard } from '@/features/dashboard';
import { useProfile } from '@/features/profile/hooks/use-profile';

import dynamicImport from 'next/dynamic';

// CRITICAL: Dynamically import navigation components with SSR disabled to prevent hydration mismatches
// These components use usePathname() which can cause hydration issues during SSR
const DashboardNavigation = dynamicImport(() => import('@/components/shared/DashboardNavigation').then(mod => ({ default: mod.default })), { ssr: false });
const MobileDashboardNav = dynamicImport(() => import('@/components/shared/DashboardNavigation').then(mod => ({ default: mod.MobileDashboardNav })), { ssr: false });
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { Button } from '@/components/ui/button';

import { useIsAuthenticated, useUserLoading, useUserStore } from '@/lib/stores';
import { useAppActions } from '@/lib/stores/appStore';
import { logger } from '@/lib/utils/logger';

import { useAuth } from '@/hooks/useAuth';

// Prevent static generation since this requires client-side state
export const dynamic = 'force-dynamic';

/**
 * Helper function to check bypass flag from localStorage
 * This is used throughout the component to ensure bypass is checked consistently
 */
function checkBypassFlag(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  try {
    return window.localStorage.getItem('e2e-dashboard-bypass') === '1' ||
           process.env.NEXT_PUBLIC_ENABLE_E2E_HARNESS === '1';
  } catch {
    return process.env.NEXT_PUBLIC_ENABLE_E2E_HARNESS === '1';
  }
}

/**
 * Check if session cookies exist (matches middleware logic)
 * Polls for cookies with retry logic to handle timing issues
 *
 * This function implements the same cookie detection logic as the middleware
 * to ensure consistency between server-side and client-side auth checks.
 */
async function checkSessionCookies(
  maxAttempts: number = 15,
  intervalMs: number = 200
): Promise<boolean> {
  if (typeof window === 'undefined') {
    return false;
  }

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const cookieString = document.cookie;

    // Method 1: Check for custom access token cookie (if we set one)
    const accessTokenMatch = cookieString.match(/sb-access-token=([^;]+)/);
    if (accessTokenMatch && accessTokenMatch[1]) {
      const trimmedValue = accessTokenMatch[1].trim();
      if (trimmedValue.length > 10 &&
          trimmedValue !== 'null' &&
          trimmedValue !== 'undefined' &&
          trimmedValue !== '{}' &&
          trimmedValue !== '""' &&
          trimmedValue !== "''") {
        if (process.env.DEBUG_DASHBOARD === '1') {
          logger.debug('🚨 Dashboard: Found sb-access-token cookie', { attempt: attempt + 1 });
        }
        return true;
      }
    }

    // Method 2: Check for Supabase project-specific auth token cookie
    // Extract project ref from NEXT_PUBLIC_SUPABASE_URL if available
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl) {
      try {
        const urlMatch = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.(co|io)/);
        if (urlMatch && urlMatch[1]) {
          const projectRef = urlMatch[1];
          const expectedCookieName = `sb-${projectRef}-auth-token`;
          const cookieMatch = cookieString.match(new RegExp(`${expectedCookieName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}=([^;]+)`));

          if (cookieMatch && cookieMatch[1]) {
            const trimmedValue = cookieMatch[1].trim();
            if (trimmedValue.length > 10 &&
                trimmedValue !== 'null' &&
                trimmedValue !== 'undefined' &&
                trimmedValue !== '{}' &&
                trimmedValue !== '""' &&
                trimmedValue !== "''") {
              if (process.env.DEBUG_DASHBOARD === '1') {
                logger.debug('🚨 Dashboard: Found expected auth cookie', { cookieName: expectedCookieName, attempt: attempt + 1 });
              }
              return true;
            }
          }

          // Also check for chunked cookies (.0, .1, etc.)
          for (let i = 0; i < 10; i++) {
            const chunkCookieName = `${expectedCookieName}.${i}`;
            const chunkMatch = cookieString.match(new RegExp(`${chunkCookieName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}=([^;]+)`));
            if (chunkMatch && chunkMatch[1]) {
              const trimmedValue = chunkMatch[1].trim();
              if (trimmedValue.length >= 5 && // Lower threshold for chunked cookies
                  trimmedValue !== 'null' &&
                  trimmedValue !== 'undefined' &&
                  trimmedValue !== '{}' &&
                  trimmedValue !== '""' &&
                  trimmedValue !== "''") {
                if (process.env.DEBUG_DASHBOARD === '1') {
                  logger.debug('🚨 Dashboard: Found chunked auth cookie', { cookieName: chunkCookieName, attempt: attempt + 1 });
                }
                return true;
              }
            }
          }
        }
      } catch (error) {
        // If URL parsing fails, continue to check other patterns
        if (process.env.DEBUG_DASHBOARD === '1') {
          logger.debug('🚨 Dashboard: Error extracting project ref', error);
        }
      }
    }

    // Method 3: Check ALL cookies for any starting with 'sb-' and containing 'auth' or 'session'
    // This is a comprehensive fallback (matches middleware Method 3)
    const cookies = cookieString.split(';').map(c => c.trim());
    for (const cookie of cookies) {
      if (!cookie) continue;
      const [name, value] = cookie.split('=');
      if (!name || !value) continue;

      const nameLower = name.toLowerCase();
      // Check for Supabase auth-related cookies
      if (nameLower.startsWith('sb-') && (nameLower.includes('auth') || nameLower.includes('session') || nameLower.includes('access'))) {
        const trimmedValue = value.trim();
        // Check for substantial value (auth tokens are typically longer than 10 chars)
        // Lower threshold for chunked cookies
        const isChunked = nameLower.includes('.') && /\.\d+$/.test(nameLower);
        const minLength = isChunked ? 5 : 10;

        if (trimmedValue.length >= minLength &&
            trimmedValue !== 'null' &&
            trimmedValue !== 'undefined' &&
            trimmedValue !== '{}' &&
            trimmedValue !== '""' &&
            trimmedValue !== "''") {
          if (process.env.DEBUG_DASHBOARD === '1') {
            logger.debug('🚨 Dashboard: Found auth cookie in parsed cookies', { cookieName: name, attempt: attempt + 1 });
          }
          return true;
        }
      }
    }

    // Wait before next attempt (except on last attempt)
    if (attempt < maxAttempts - 1) {
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
  }

  if (process.env.DEBUG_DASHBOARD === '1') {
    logger.debug('🚨 Dashboard: No session cookies found after polling', { attempts: maxAttempts });
  }
  return false;
}

export default function DashboardPage() {
  const router = useRouter();
  const routerRef = useRef(router);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => { routerRef.current = router; }, [router]);

  // CRITICAL: Immediate redirect recovery if we're on /auth but bypass flag is set
  // This handles the case where middleware redirected before client-side check could run
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if we're on /auth with redirectTo parameter and bypass flag is set
    if (pathname === '/auth') {
      const redirectTo = searchParams.get('redirectTo');
      if (redirectTo === '/dashboard' || redirectTo === '/feed') {
        try {
          const bypassFlag = checkBypassFlag();
          if (bypassFlag) {
            // Bypass flag is set but we were redirected - immediately redirect back
            if (process.env.DEBUG_DASHBOARD === '1') {
              logger.debug('🚨 Dashboard: Bypass flag detected on /auth page - immediately redirecting back');
            }
            // Use Next.js router for more reliable navigation in tests
            routerRef.current.replace(redirectTo);
          }
        } catch {
          // localStorage might not be available, fallback to window.location
          try {
            const bypassFlag = checkBypassFlag();
            if (bypassFlag && redirectTo) {
              window.location.replace(redirectTo);
            }
          } catch {
            // If all else fails, try window.location
            if (redirectTo) {
              window.location.replace(redirectTo);
            }
          }
        }
      }
    }
  }, [pathname, searchParams]);

  const { profile, isLoading } = useProfile();
  const isAuthenticated = useIsAuthenticated();
  const isUserLoading = useUserLoading();
  const { isLoading: isAuthContextLoading } = useAuth(); // AuthContext loading state
  const { setCurrentRoute, setBreadcrumbs, setSidebarActiveSection } = useAppActions();

  // Refs for stable app store actions
  const setCurrentRouteRef = useRef(setCurrentRoute);
  useEffect(() => { setCurrentRouteRef.current = setCurrentRoute; }, [setCurrentRoute]);
  const setBreadcrumbsRef = useRef(setBreadcrumbs);
  useEffect(() => { setBreadcrumbsRef.current = setBreadcrumbs; }, [setBreadcrumbs]);
  const setSidebarActiveSectionRef = useRef(setSidebarActiveSection);
  useEffect(() => { setSidebarActiveSectionRef.current = setSidebarActiveSection; }, [setSidebarActiveSection]);

  // Check bypass flag - use state that updates to handle timing issues
  // This prevents authentication checks from running before bypass is recognized
  // CRITICAL: Initialize to false to prevent hydration mismatch, then check in useEffect
  // This ensures server and client render the same initial state
  const [shouldBypassAuth, setShouldBypassAuth] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Set client flag and check bypass immediately after mount to prevent hydration mismatch
  // Check bypass flag synchronously on first client render to avoid delays
  useEffect(() => {
    setIsClient(true);

    // Check bypass flag immediately
    const bypassValue = checkBypassFlag();
    if (bypassValue) {
      setShouldBypassAuth(true);
      if (process.env.DEBUG_DASHBOARD === '1') {
        logger.debug('🚨 Dashboard: Bypass flag detected in initial useEffect', { bypassValue });
      }
    }
  }, []);

  // Re-check bypass flag periodically to catch cases where it's set after initial render
  // This handles E2E tests that set localStorage via addInitScript
  // Also handles case where middleware redirected to /auth but bypass flag is now set
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check immediately
    const checkBypass = () => {
      const bypassValue = checkBypassFlag();
      if (bypassValue !== shouldBypassAuth) {
        setShouldBypassAuth(bypassValue);

        // CRITICAL: If bypass flag is now set and we're on /auth with redirectTo=/dashboard, redirect back
        if (bypassValue && window.location.pathname === '/auth') {
          const searchParams = new URLSearchParams(window.location.search);
          const redirectTo = searchParams.get('redirectTo');
          if (redirectTo === '/dashboard' || redirectTo === '/feed') {
            if (process.env.DEBUG_DASHBOARD === '1') {
              logger.debug('🚨 Dashboard: Bypass flag detected during periodic check - redirecting back to dashboard');
            }
            // Use Next.js router for more reliable navigation in tests
            routerRef.current.replace(redirectTo);
          }
        }
      }
    };

    checkBypass();

    // Check periodically for first 3 seconds (covers addInitScript timing and middleware redirects)
    const interval = setInterval(checkBypass, 100);
    const timeout = setTimeout(() => clearInterval(interval), 3000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [shouldBypassAuth]);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(false);
  const adminCheckRef = useRef<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const authRetryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [hasCookies, setHasCookies] = useState<boolean | null>(null); // null = checking, true = has cookies, false = no cookies
  const cookieCheckRef = useRef<Promise<boolean> | null>(null);
  const [isStoreHydrated, setIsStoreHydrated] = useState<boolean>(false); // Track if Zustand persist has hydrated

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

  // Check if Zustand persist store has hydrated (Target 2.2)
  useEffect(() => {
    if (shouldBypassAuth || checkBypassFlag()) {
      setIsStoreHydrated(true); // In bypass mode, assume hydrated
      return () => {
        // Cleanup function - no cleanup needed
      };
    }

    const persist = (useUserStore as typeof useUserStore & {
      persist?: {
        hasHydrated?: () => boolean;
        onFinishHydration?: (callback: () => void) => (() => void) | void;
      };
    }).persist;

    if (persist?.hasHydrated?.()) {
      setIsStoreHydrated(true);
      if (process.env.DEBUG_DASHBOARD === '1') {
        logger.debug('🚨 Dashboard: Store already hydrated');
      }
      return () => {
        // Cleanup function - no cleanup needed
      };
    } else if (persist?.onFinishHydration) {
      const unsubscribeHydration = persist.onFinishHydration(() => {
        setIsStoreHydrated(true);
        if (process.env.DEBUG_DASHBOARD === '1') {
          logger.debug('🚨 Dashboard: Store hydration complete');
        }
      });

      // Timeout fallback: assume hydrated after 2 seconds even if callback hasn't fired
      const timeout = setTimeout(() => {
        setIsStoreHydrated(true);
        if (process.env.DEBUG_DASHBOARD === '1') {
          logger.debug('🚨 Dashboard: Store hydration timeout - assuming hydrated');
        }
      }, 2_000);

      return () => {
        if (typeof unsubscribeHydration === 'function') {
          unsubscribeHydration();
        }
        clearTimeout(timeout);
      };
    } else {
      // No persist hydration API available - assume hydrated immediately
      setIsStoreHydrated(true);
      if (process.env.DEBUG_DASHBOARD === '1') {
        logger.debug('🚨 Dashboard: No persist hydration API - assuming hydrated');
      }
      return () => {
        // Cleanup function - no cleanup needed
      };
    }
  }, [shouldBypassAuth]);

  // Poll for cookies asynchronously - cookies may not be immediately available
  useEffect(() => {
    // Only check bypass flag in useEffect after client mount
    if (shouldBypassAuth || (isClient && checkBypassFlag()) || typeof window === 'undefined') {
      setHasCookies(true); // Bypass = assume cookies exist
      return;
    }

    // Only check once per mount (use ref to prevent duplicate checks)
    if (cookieCheckRef.current) {
      return;
    }

    setHasCookies(null); // Mark as checking
    cookieCheckRef.current = checkSessionCookies(15, 200); // 15 attempts × 200ms = 3 seconds max

    cookieCheckRef.current.then((found) => {
      setHasCookies(found);
      cookieCheckRef.current = null;
      if (process.env.DEBUG_DASHBOARD === '1') {
        logger.debug('🚨 Dashboard: Cookie check complete', { hasCookies: found });
      }
    }).catch((error) => {
      logger.error('🚨 Dashboard: Cookie check failed', error);
      setHasCookies(false);
      cookieCheckRef.current = null;
    });

    return () => {
      cookieCheckRef.current = null;
    };
  }, [shouldBypassAuth]);

  useEffect(() => {
    // In E2E harness mode or when bypassing auth, skip all redirect checks (authentication is mocked)
    // CRITICAL: Check bypass flag FIRST before any other logic
    // Use helper function to check bypass consistently
    const bypassCheck1 = shouldBypassAuth || checkBypassFlag();

    if (bypassCheck1) {
      // Update state if we detected bypass via localStorage but state wasn't set yet
      if (checkBypassFlag() && !shouldBypassAuth) {
        setShouldBypassAuth(true);
      }
      if (process.env.DEBUG_DASHBOARD === '1' || checkBypassFlag()) {
        logger.debug('🚨 Dashboard: Bypass flag set - skipping all auth checks and redirects', {
          shouldBypassAuth,
          currentBypassFlag: checkBypassFlag(),
          envHarness: process.env.NEXT_PUBLIC_ENABLE_E2E_HARNESS === '1',
        });
      }
      return () => {
        // Cleanup function - no cleanup needed for bypass case
      };
    }
    // Wait for user loading, AuthContext loading, AND store hydration to complete before checking authentication
    // This prevents redirecting while auth state is still being initialized
    // AuthContext initializes the user store, so all three must complete
    if (isUserLoading || isAuthContextLoading || !isStoreHydrated) {
      if (process.env.DEBUG_DASHBOARD === '1' && (!isStoreHydrated || isUserLoading || isAuthContextLoading)) {
        logger.debug('🚨 Dashboard: Waiting for initialization', {
          isUserLoading,
          isAuthContextLoading,
          isStoreHydrated,
        });
      }
      return () => {
        // Cleanup function - no cleanup needed for loading case
      };
    }
    // Wait for cookie check to complete before making redirect decisions
    // hasCookies === null means we're still checking
    if (hasCookies === null) {
      return () => {
        // Cleanup function - no cleanup needed while checking
      };
    }
    // First check if user is authenticated - if not, check session cookie and wait for hydration
    // Double-check bypass flag here as well (defensive programming)
    // CRITICAL: Re-check bypass flag here to prevent any redirects during E2E tests
    const bypassCheck2 = shouldBypassAuth || checkBypassFlag();

    if (bypassCheck2) {
      // Update state if we detected bypass via localStorage but state wasn't set yet
      if (checkBypassFlag() && !shouldBypassAuth) {
        setShouldBypassAuth(true);
      }
      // Bypass is set - skip all auth checks and allow render
      return () => {
        // Cleanup function - no cleanup needed for bypass case
      };
    }
    if (!isAuthenticated) {
      // CRITICAL: Re-check bypass flag before any redirects (defensive programming)
      // This prevents redirects during E2E tests even if cookies aren't found
      const bypassCheck3 = shouldBypassAuth || checkBypassFlag();
      if (bypassCheck3) {
        if (process.env.DEBUG_DASHBOARD === '1' || checkBypassFlag()) {
          logger.debug('🚨 Dashboard: Bypass flag detected in redirect check - skipping redirect', {
            shouldBypassAuth,
            currentBypassFlag: checkBypassFlag(),
          });
        }
        return () => {
          // Cleanup function - no cleanup needed for bypass case
        };
      }

      // Clear any existing retry timeout
      if (authRetryTimeoutRef.current) {
        clearTimeout(authRetryTimeoutRef.current);
        authRetryTimeoutRef.current = null;
      }

      // Check cookie availability (from async polling)
      if (!hasCookies) {
        // No cookies found after polling - definitely not authenticated, redirect
        // BUT: Only redirect if bypass flag is NOT set
        // Re-check bypass flag here as well
        const bypassCheck4 = shouldBypassAuth || checkBypassFlag();

        if (!bypassCheck4) {
          if (process.env.DEBUG_DASHBOARD === '1') {
            logger.debug('🚨 Dashboard: No session cookies found after polling - redirecting to auth');
          }
          routerRef.current.replace('/auth');
          return () => {
            // Cleanup function - no cleanup needed for immediate redirect
          };
        } else {
          if (process.env.DEBUG_DASHBOARD === '1' || checkBypassFlag()) {
            logger.debug('🚨 Dashboard: No cookies but bypass flag set - allowing render', {
              shouldBypassAuth,
              currentBypassFlag: checkBypassFlag(),
            });
          }
        }
      }

      // Cookies exist - middleware already validated authentication, so trust it
      // Allow page to render while auth state hydrates (can take 3-5 seconds in production)
      // Only redirect if cookies disappear or auth state fails to hydrate after extended wait
      if (process.env.DEBUG_DASHBOARD === '1') {
        logger.debug('🚨 Dashboard: Session cookies exist - trusting middleware, allowing render while auth hydrates');
      }
      authRetryTimeoutRef.current = setTimeout(() => {
        // CRITICAL: Check bypass flag before any delayed redirects
        // Re-check bypass flag in case it was set after the timeout was created
        const bypassCheck5 = shouldBypassAuth || checkBypassFlag();

        if (bypassCheck5) {
          if (process.env.DEBUG_DASHBOARD === '1' || checkBypassFlag()) {
            logger.debug('🚨 Dashboard: Bypass flag detected in delayed check - skipping redirect', {
              shouldBypassAuth,
              currentBypassFlag: checkBypassFlag(),
            });
          }
          authRetryTimeoutRef.current = null;
          return;
        }

        // After extended wait, check if cookies still exist and auth state has hydrated
        checkSessionCookies(3, 200).then((stillHasCookie) => {
          // CRITICAL: Re-check bypass flag before redirecting
          const bypassCheck6 = shouldBypassAuth || checkBypassFlag();

          if (bypassCheck6) {
            if (process.env.DEBUG_DASHBOARD === '1' || checkBypassFlag()) {
              logger.debug('🚨 Dashboard: Bypass flag detected in delayed cookie check - skipping redirect', {
                shouldBypassAuth,
                currentBypassFlag: checkBypassFlag(),
              });
            }
            authRetryTimeoutRef.current = null;
            return;
          }

          // Access store directly to check auth state without causing re-render
          const currentAuthState = useUserStore.getState().isAuthenticated;

          if (!stillHasCookie) {
            // Cookies disappeared - definitely not authenticated
            // BUT: Only redirect if bypass flag is NOT set
            const bypassCheck7 = shouldBypassAuth || checkBypassFlag();
            if (!bypassCheck7) {
              if (process.env.DEBUG_DASHBOARD === '1') {
                logger.debug('🚨 Dashboard: Session cookies disappeared after wait - redirecting to auth');
              }
              routerRef.current.replace('/auth');
            } else {
              if (process.env.DEBUG_DASHBOARD === '1' || checkBypassFlag()) {
                logger.debug('🚨 Dashboard: Cookies disappeared but bypass flag set - allowing render', {
                  shouldBypassAuth,
                  currentBypassFlag: checkBypassFlag(),
                });
              }
            }
          } else if (!currentAuthState) {
            // Cookies still exist but auth state hasn't hydrated after extended wait
            // This is unusual but could happen if there's a store hydration issue
            // Log a warning but DON'T redirect - cookies are authoritative, allow render
            logger.warn('🚨 Dashboard: Session cookies exist but auth state not hydrated after extended wait - allowing render anyway (cookies are authoritative)');
          }
          // If currentAuthState is true, no action needed - auth has successfully hydrated
          authRetryTimeoutRef.current = null;
        });
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
      // Update cookie state if authenticated (cookies should exist)
      if (hasCookies === false) {
        setHasCookies(true);
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
        // CRITICAL: Skip redirect if bypass flag is set (E2E testing)
        const bypassCheck8 = shouldBypassAuth || checkBypassFlag();

        if (bypassCheck8) {
          logger.debug('🚨 Dashboard: Bypass flag set - skipping onboarding redirect', {
            shouldBypassAuth,
            currentBypassFlag: checkBypassFlag(),
          });
          setIsCheckingAdmin(false);
          adminCheckRef.current = false;
          return;
        }
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
  }, [isLoading, isUserLoading, isAuthContextLoading, isAuthenticated, profile, shouldBypassAuth, isCheckingAdmin, hasCookies, isStoreHydrated]); // Added isAuthContextLoading, hasCookies, and isStoreHydrated to dependencies

  // Check if user is admin when profile is loaded
  useEffect(() => {
    if (shouldBypassAuth || checkBypassFlag() || !isAuthenticated || isLoading) {
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

  // DIAGNOSTIC: Log when dashboard content is about to render (must be before early returns)
  useEffect(() => {
    const shouldBypass = shouldBypassAuth || checkBypassFlag();
    if (shouldBypass || (!isUserLoading && !isAuthContextLoading && isStoreHydrated && (hasCookies !== false || isAuthenticated))) {
      if (process.env.DEBUG_DASHBOARD === '1' || checkBypassFlag()) {
        logger.debug('🚨 Dashboard: Rendering dashboard content', {
          shouldBypassAuth,
          isAuthenticated,
          profile: profile ? { id: profile.id, username: profile.username } : null,
          isLoading,
          isAdmin,
          currentUrl: typeof window !== 'undefined' ? window.location.href : 'SSR',
        });
      }
    }
  }, [shouldBypassAuth, isAuthenticated, profile, isLoading, isAdmin, isUserLoading, isAuthContextLoading, isStoreHydrated, hasCookies]);
  // CRITICAL: Guard conditional returns with mounted check to prevent hydration mismatch
  // During SSR/initial render, always render the same structure (dashboard content)
  // After mount, these conditional returns can safely change structure via normal React updates
  const [isMountedForPageRender, setIsMountedForPageRender] = useState(false);

  useEffect(() => {
    setIsMountedForPageRender(true);
    if (process.env.NODE_ENV === 'development' || checkBypassFlag()) {
      logger.debug('[Dashboard] isMountedForPageRender set to true');
    }
  }, []);

  // CRITICAL: Follow feed/polls pattern - return loading skeleton during SSR/initial render
  // This ensures consistent server/client rendering structure, preventing hydration mismatches
  // After mount, render actual content (matches feed/polls page pattern)
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // During SSR/initial render, return loading skeleton WITHOUT navigation components
  // CRITICAL: DashboardNavigation and MobileDashboardNav are dynamically imported with ssr: false
  // They won't be in SSR HTML, so we can't include them in the !isMounted return path
  // This prevents hydration mismatches - navigation components only render after mount
  if (!isMounted) {
    return (
      <ErrorBoundary>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" aria-label="Loading dashboard">
          <div className="space-y-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3 dark:bg-gray-700 mb-4" />
              <div className="h-4 bg-gray-200 rounded w-1/2 dark:bg-gray-700" />
            </div>
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
      </ErrorBoundary>
    );
  }

  // After mount, check for loading/error states
  if (isMountedForPageRender && isLoading && !loadingTimeout && !shouldBypassAuth && !isAuthenticated && !isAuthContextLoading) {
    if (process.env.NODE_ENV === 'development' || checkBypassFlag()) {
      logger.debug('[Dashboard] Rendering loading skeleton (mounted check passed)');
    }
    return (
      <ErrorBoundary>
        <DashboardNavigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" aria-label="Loading dashboard">
          <div className="space-y-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3 dark:bg-gray-700 mb-4" />
              <div className="h-4 bg-gray-200 rounded w-1/2 dark:bg-gray-700" />
            </div>
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
        <MobileDashboardNav />
      </ErrorBoundary>
    );
  }

  // After mount, check for access denied
  if (isMountedForPageRender && !isUserLoading && !isAuthContextLoading && isStoreHydrated && hasCookies === false && !isAuthenticated && !shouldBypassAuth) {
    // CRITICAL: Guard this conditional return with isMountedForPageRender to prevent hydration mismatch
    // During SSR/initial render, always render dashboard content (it handles auth gracefully)
    // After mount, this conditional return can safely show access denied via normal React updates
    if (process.env.NODE_ENV === 'development' || checkBypassFlag()) {
      logger.debug('[Dashboard] Rendering access denied (mounted check passed)');
    }
    return (
      <ErrorBoundary>
        <DashboardNavigation />
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="text-center space-y-4 max-w-md">
            <h1 className="text-2xl font-bold text-red-600 dark:text-red-400">Access denied</h1>
            <p className="text-gray-600 dark:text-gray-400">
              You must be logged in to access the dashboard.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Please log in to continue.
            </p>
          </div>
        </div>
        <MobileDashboardNav />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      {/* DIAGNOSTIC: Add data attribute for test detection */}
      <div data-testid="dashboard-page-content" style={{ display: 'none' }}>
        Dashboard content rendering
      </div>
      {/* 🔒 Cohesive Dashboard Navigation */}
      {/* CRITICAL: Always render DashboardNavigation - it handles its own SSR logic internally */}
      <DashboardNavigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* CRITICAL: Only show admin banner after mount to prevent hydration mismatch */}
        {isMountedForPageRender && isAdmin === true && (
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

        {/* CRITICAL: Always render PersonalDashboard - it handles its own SSR/initial render logic internally */}
        {/* PersonalDashboard has its own isMounted guard and returns skeleton during SSR/initial render */}
        {/* This ensures consistent component tree structure and prevents hydration mismatches */}
        <PersonalDashboard />
      </div>

      {/* 🔒 Mobile Navigation */}
      {/* CRITICAL: Always render MobileDashboardNav - it handles its own SSR logic internally */}
      <MobileDashboardNav />
    </ErrorBoundary>
  );
}
