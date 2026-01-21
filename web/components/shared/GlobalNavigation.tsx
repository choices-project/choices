'use client';

import { Menu, X, Shield, User, LogOut, Vote, BarChart3, Home, Settings } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import LanguageSelector from '@/components/shared/LanguageSelector';
import ThemeSelector from '@/components/shared/ThemeSelector';
import { Button } from '@/components/ui/button';

import { useSession, useUser as useUserStore, useIsAuthenticated as useIsAuthenticatedStore } from '@/lib/stores';
import logger from '@/lib/utils/logger';

import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/hooks/useI18n';

/**
 * @fileoverview Global Navigation Component
 *
 * Global navigation component providing site navigation, user authentication,
 * and responsive mobile menu functionality.
 *
 * @author Choices Platform Team
 * @created 2025-10-24
 * @version 2.0.0
 * @since 1.0.0
 */

/**
 * Global Navigation Component
 *
 * @returns {JSX.Element} Global navigation component
 *
 * @example
 * <GlobalNavigation />
 */
export default function GlobalNavigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [_hasError, _setHasError] = useState(false);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const firstMobileNavLinkRef = useRef<HTMLAnchorElement>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);
  const mobileMenuId = 'global-navigation-mobile-menu';
  const { t } = useI18n();

  // Use ref for stable t function
  const tRef = useRef(t);
  useEffect(() => { tRef.current = t; }, [t]);

  // CRITICAL: Guard usePathname() usage with isMounted to prevent hydration mismatch
  // usePathname() can return different values on server vs client
  // We must call the hook at the top level, but guard its usage in isActive()
  // Store pathname in state to ensure it's only used after mount
  const [isMountedForNavRender, setIsMountedForNavRender] = useState(false);
  const [pathname, setPathname] = useState<string>('');
  const pathnameFromHook = usePathname();

  useEffect(() => {
    setIsMountedForNavRender(true);
    setPathname(pathnameFromHook);
  }, [pathnameFromHook]);

  // Auth integration via context
  // Note: useAuth will throw if not within AuthProvider, but that's expected
  // and should be caught by ErrorBoundary in the layout
  const { user, isLoading: authLoading, logout: authSignOut } = useAuth();
  const storeSession = useSession();
  const storeUser = useUserStore();
  const storeIsAuthenticated = useIsAuthenticatedStore();
  const authUser = user ?? storeUser ?? storeSession?.user ?? null;
  // Use store's isAuthenticated as primary source, fallback to checking authUser
  // This ensures we're using the canonical authentication state
  const isAuthenticated = storeIsAuthenticated || Boolean(authUser);
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // Add timeout fallback to prevent infinite loading state
  useEffect(() => {
    if (!authLoading) {
      setLoadingTimeout(false);
      return;
    }
    const timeout = setTimeout(() => {
      setLoadingTimeout(true);
    }, 5000); // 5 second timeout - allow navigation to render even if auth is slow
    return () => clearTimeout(timeout);
  }, [authLoading]);

  // Don't block on loading if timeout has passed or if bypass flag is set
  const shouldBypassLoading = loadingTimeout || (typeof window !== 'undefined' &&
    window.localStorage.getItem('e2e-dashboard-bypass') === '1');
  const isLoading = authLoading && !shouldBypassLoading;

  // DIAGNOSTIC: Log GlobalNavigation render state for debugging
  useEffect(() => {
    if (process.env.DEBUG_DASHBOARD === '1' || (typeof window !== 'undefined' && window.localStorage.getItem('e2e-dashboard-bypass') === '1')) {
      logger.debug('🚨 GlobalNavigation: Render state', {
        authLoading,
        loadingTimeout,
        shouldBypassLoading,
        isLoading,
        isAuthenticated,
        user: authUser ? { id: authUser.id, email: authUser.email ? `${authUser.email.split('@')[0]}@***` : null } : null,
        pathname,
        bypassFlag: typeof window !== 'undefined' ? window.localStorage.getItem('e2e-dashboard-bypass') : 'SSR',
      });
    }
  }, [authLoading, loadingTimeout, shouldBypassLoading, isLoading, isAuthenticated, authUser, pathname]);

  // Use ref for stable authSignOut callback
  const authSignOutRef = useRef(authSignOut);
  useEffect(() => { authSignOutRef.current = authSignOut; }, [authSignOut]);

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen((open) => !open);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      closeMobileMenu();
      // Call signOut which will handle the redirect internally
      // Don't await - let it handle redirect in its own time
      void authSignOutRef.current();
    } catch (error) {
      logger.error('Logout failed:', error);
      // Fallback redirect if signOut throws synchronously
      if (typeof window !== 'undefined') {
        window.location.replace('/landing');
      }
    }
  }, [closeMobileMenu]); // Removed authSignOut - using authSignOutRef

  // CRITICAL: Only check active state after mount to prevent hydration mismatch
  // During SSR, all links should appear inactive (consistent structure)
  // This ensures the same DOM structure on server and client during initial render
  const isActive = useCallback(
    (path: string) => {
      if (!isMountedForNavRender) {
        return false; // During SSR/initial render, no links are active
      }
      return pathname === path;
    },
    [pathname, isMountedForNavRender],
  );

  const navigationItems = useMemo(
    () => [
      { href: '/feed', label: tRef.current('navigation.home'), icon: Home },
      { href: '/polls', label: tRef.current('navigation.polls'), icon: Vote },
      { href: '/civics', label: tRef.current('navigation.civics'), icon: Shield },
      { href: '/dashboard', label: tRef.current('navigation.dashboard'), icon: BarChart3 },
    ],
    [], // Empty deps - using tRef
  );

  // DIAGNOSTIC: Log when rendering full navigation (must be after navigationItems but before early returns)
  useEffect(() => {
    if (!isLoading && !_hasError) {
      if (process.env.DEBUG_DASHBOARD === '1' || (typeof window !== 'undefined' && window.localStorage.getItem('e2e-dashboard-bypass') === '1')) {
        logger.debug('🚨 GlobalNavigation: Rendering full navigation', {
          navigationItemsCount: navigationItems.length,
          dashboardNavItem: navigationItems.find(item => item.href === '/dashboard'),
        isAuthenticated,
        user: authUser ? { id: authUser.id, email: authUser.email } : null,
          pathname,
        });
      }
    }
  }, [isLoading, _hasError, navigationItems, isAuthenticated, authUser, pathname]);

  useEffect(() => {
    if (isMobileMenuOpen) {
      previouslyFocusedElementRef.current = document.activeElement as HTMLElement | null;
      const focusTimeout = window.setTimeout(() => {
        firstMobileNavLinkRef.current?.focus();
      }, 0);
      return () => window.clearTimeout(focusTimeout);
    }

    if (previouslyFocusedElementRef.current) {
      previouslyFocusedElementRef.current.focus();
      previouslyFocusedElementRef.current = null;
    }

    return undefined;
  }, [isMobileMenuOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isMobileMenuOpen) {
        event.preventDefault();
        closeMobileMenu();
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [closeMobileMenu, isMobileMenuOpen]);

  // Error boundary for component
  if (_hasError) {
    return (
      <nav className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-gray-200 rounded" />
            </div>
            <div className="flex items-center space-x-4">
              <div className="h-8 w-20 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      </nav>
    );
  }

  // Show loading state if user data is still loading or if we're not authenticated yet
  // CRITICAL: Guard with isMountedForNavRender to prevent structure changes during hydration
  if (isMountedForNavRender && isLoading) {
    // DIAGNOSTIC: Log when showing loading skeleton
    if (process.env.DEBUG_DASHBOARD === '1' || (typeof window !== 'undefined' && window.localStorage.getItem('e2e-dashboard-bypass') === '1')) {
      logger.debug('🚨 GlobalNavigation: Showing loading skeleton', {
        authLoading,
        loadingTimeout,
        shouldBypassLoading,
        isLoading,
        bypassFlag: typeof window !== 'undefined' ? window.localStorage.getItem('e2e-dashboard-bypass') : 'SSR',
      });
    }
    return (
      <nav className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700" data-testid="global-nav-loading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-gray-200 animate-pulse rounded" />
            </div>
            <div className="flex items-center space-x-4">
              <div className="h-8 w-20 bg-gray-200 animate-pulse rounded" />
            </div>
          </div>
        </div>
      </nav>
    );
  }


  return (
    <div className="sticky top-0 z-50 bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700" data-testid="global-navigation">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:rounded focus:bg-blue-600 focus:px-4 focus:py-2 focus:text-white"
      >
        {t('common.skipToContent')}
      </a>
      <nav className="bg-white dark:bg-gray-900" aria-label="Primary navigation">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Brand */}
            <div className="flex items-center">
              <Link
                href={isAuthenticated ? '/feed' : '/'}
                prefetch={false}
                className="flex items-center space-x-2"
                onClick={closeMobileMenu}
              >
                <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                <span className="text-xl font-bold text-gray-900 dark:text-gray-100">Choices</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex md:items-center md:space-x-8">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isDashboardNav = item.href === '/dashboard';
                // DIAGNOSTIC: Log dashboard nav rendering
                if (isDashboardNav && (process.env.DEBUG_DASHBOARD === '1' || (typeof window !== 'undefined' && window.localStorage.getItem('e2e-dashboard-bypass') === '1'))) {
                  logger.debug('🚨 GlobalNavigation: Rendering dashboard nav link', {
                    href: item.href,
                    label: item.label,
                    isActive: isActive(item.href),
                    testId: 'dashboard-nav',
                  });
                }
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    data-testid={
                      item.href === '/polls'
                        ? 'polls-nav'
                        : item.href === '/dashboard'
                          ? 'dashboard-nav'
                          : item.href === '/'
                            ? 'home-nav'
                            : undefined
                    }
                    className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      isActive(item.href)
                        ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                    aria-current={isActive(item.href) ? 'page' : undefined}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Desktop Auth Section */}
            <div className="hidden md:flex md:items-center md:space-x-4">
              <ThemeSelector variant="compact" />
              <LanguageSelector variant="compact" />
              {isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  <Link
                    href="/profile"
                    className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      isActive('/profile')
                        ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                    aria-current={isActive('/profile') ? 'page' : undefined}
                  >
                    <User className="h-4 w-4" aria-hidden="true" />
                    <span>{t('navigation.profile')}</span>
                  </Link>
                  <Link
                    href="/account/privacy"
                    className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      isActive('/account/privacy')
                        ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                    aria-current={isActive('/account/privacy') ? 'page' : undefined}
                  >
                    <Settings className="h-4 w-4" aria-hidden="true" />
                    <span>{t('navigation.settings')}</span>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                    className="flex items-center space-x-1"
                    data-testid="logout-button"
                    aria-label={t('navigation.logout')}
                  >
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                    <span>{t('navigation.logout')}</span>
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Button asChild variant="outline" size="sm">
                    <Link href="/login" prefetch={false}>{t('navigation.login')}</Link>
                  </Button>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <Button
                ref={mobileMenuButtonRef}
                variant="ghost"
                size="sm"
                onClick={toggleMobileMenu}
                className="p-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label={
                  isMobileMenuOpen
                    ? t('navigation.mobileMenu.close')
                    : t('navigation.mobileMenu.open')
                }
                data-testid="mobile-menu-button"
                aria-expanded={isMobileMenuOpen}
                aria-controls="global-navigation-mobile-menu"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" aria-hidden="true" /> : <Menu className="h-6 w-6" aria-hidden="true" />}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden" id={mobileMenuId}>
              <div className="px-2 pt-2 pb-3 space-y-1 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                {/* Mobile Navigation Items */}
                {navigationItems.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={closeMobileMenu}
                      data-testid={
                        item.href === '/polls'
                          ? 'polls-nav'
                          : item.href === '/dashboard'
                            ? 'dashboard-nav'
                            : item.href === '/'
                              ? 'home-nav'
                              : undefined
                      }
                      className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        isActive(item.href)
                          ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400'
                          : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                      ref={index === 0 ? firstMobileNavLinkRef : undefined}
                      aria-current={isActive(item.href) ? 'page' : undefined}
                    >
                      <Icon className="h-5 w-5" aria-hidden="true" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
                  <ThemeSelector />
                  <LanguageSelector />
                </div>

                {/* Mobile Auth Section */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              {isAuthenticated ? (
                    <div className="space-y-2">
                      <Link
                        href="/profile"
                        onClick={closeMobileMenu}
                        className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                          isActive('/profile')
                            ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400'
                            : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                        aria-current={isActive('/profile') ? 'page' : undefined}
                      >
                        <User className="h-5 w-5" aria-hidden="true" />
                        <span>{t('navigation.profile')}</span>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleLogout}
                        className="flex w-full items-center space-x-2"
                        data-testid="logout-button"
                      >
                        <LogOut className="h-5 w-5" />
                        <span>{t('navigation.logout')}</span>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Button asChild variant="outline" size="sm" className="w-full">
                        <Link href="/login" prefetch={false} onClick={closeMobileMenu}>
                          {t('navigation.login')}
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>
  </div>
  );
}
