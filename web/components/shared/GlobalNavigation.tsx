'use client';

import { Shield, User, LogOut, Vote, Home, Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import LanguageSelector from '@/components/shared/LanguageSelector';
import { PrefetchLink } from '@/components/shared/PrefetchLink';
import ThemeSelector from '@/components/shared/ThemeSelector';
import { Button } from '@/components/ui/button';

import { useSession, useUser as useUserStore, useIsAuthenticated as useIsAuthenticatedStore } from '@/lib/stores';
import logger from '@/lib/utils/logger';

import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/hooks/useI18n';

export default function GlobalNavigation() {
  const { t } = useI18n();
  const tRef = useRef(t);
  useEffect(() => { tRef.current = t; }, [t]);

  const [isMountedForNavRender, setIsMountedForNavRender] = useState(false);
  const [pathname, setPathname] = useState<string>('');
  const pathnameFromHook = usePathname();

  useEffect(() => {
    setIsMountedForNavRender(true);
    setPathname(pathnameFromHook);
  }, [pathnameFromHook]);

  const { user, isLoading: authLoading, logout: authSignOut } = useAuth();
  const storeSession = useSession();
  const storeUser = useUserStore();
  const storeIsAuthenticated = useIsAuthenticatedStore();
  const authUser = user ?? storeUser ?? storeSession?.user ?? null;
  const isAuthenticated = storeIsAuthenticated || Boolean(authUser);
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  useEffect(() => {
    if (!authLoading) { setLoadingTimeout(false); return; }
    const timeout = setTimeout(() => setLoadingTimeout(true), 5000);
    return () => clearTimeout(timeout);
  }, [authLoading]);

  const shouldBypassLoading = loadingTimeout || (typeof window !== 'undefined' &&
    window.localStorage.getItem('e2e-dashboard-bypass') === '1');
  const isLoading = authLoading && !shouldBypassLoading;

  useEffect(() => {
    if (process.env.DEBUG_DASHBOARD === '1') {
      logger.debug('GlobalNavigation: Render state', { authLoading, isLoading, isAuthenticated, pathname });
    }
  }, [authLoading, isLoading, isAuthenticated, pathname]);

  const authSignOutRef = useRef(authSignOut);
  useEffect(() => { authSignOutRef.current = authSignOut; }, [authSignOut]);

  const handleLogout = useCallback(async () => {
    try {
      void authSignOutRef.current();
    } catch (error) {
      logger.error('Logout failed:', error);
      if (typeof window !== 'undefined') window.location.replace('/landing');
    }
  }, []);

  const isActive = useCallback(
    (path: string) => {
      if (!isMountedForNavRender) return false;
      return pathname === path || (path !== '/feed' && pathname.startsWith(path));
    },
    [pathname, isMountedForNavRender],
  );

  const primaryNavItems = useMemo(() => [
    { href: '/feed', label: tRef.current('navigation.home') || 'Home', icon: Home, testId: 'home-nav' },
    { href: '/polls', label: tRef.current('navigation.polls') || 'Explore', icon: Search, testId: 'polls-nav' },
    { href: '/polls/create', label: tRef.current('navigation.create') || 'Create', icon: Plus, testId: 'create-nav', isCreate: true },
    { href: '/civics', label: tRef.current('navigation.civics') || 'Civics', icon: Shield, testId: 'civics-nav' },
    { href: '/profile', label: tRef.current('navigation.profile') || 'Profile', icon: User, testId: 'profile-nav' },
  ], []);

  if (isMountedForNavRender && isLoading) {
    return (
      <nav className="bg-card shadow-sm border-b border-border" data-testid="global-nav-loading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14">
            <div className="flex items-center"><div className="h-8 w-8 bg-muted animate-pulse rounded" /></div>
            <div className="flex items-center space-x-4"><div className="h-8 w-20 bg-muted animate-pulse rounded" /></div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <>
      {/* Desktop top nav */}
      <div className="sticky top-0 z-50 bg-card shadow-sm border-b border-border" data-testid="global-navigation">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:rounded focus:bg-primary focus:px-4 focus:py-2 focus:text-white"
        >
          {t('common.skipToContent')}
        </a>
        <nav className="bg-card" aria-label="Primary navigation">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14">
              {/* Logo */}
              <Link
                href={isAuthenticated ? '/feed' : '/'}
                prefetch={false}
                className="flex items-center space-x-2 shrink-0"
              >
                <Vote className="h-7 w-7 text-primary" />
                <span className="text-lg font-bold text-foreground hidden sm:inline">Choices</span>
              </Link>

              {/* Desktop Navigation Links */}
              <div className="hidden md:flex md:items-center md:space-x-1">
                {primaryNavItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <PrefetchLink
                      key={item.href}
                      href={item.href}
                      data-testid={item.testId}
                      className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive(item.href)
                          ? 'text-primary bg-primary/10'
                          : 'text-muted-foreground hover:text-primary hover:bg-muted'
                      }`}
                      aria-current={isActive(item.href) ? 'page' : undefined}
                    >
                      <Icon className={`h-4 w-4 ${item.isCreate ? 'text-primary' : ''}`} aria-hidden="true" />
                      <span>{item.label}</span>
                    </PrefetchLink>
                  );
                })}
              </div>

              {/* Desktop Right Section */}
              <div className="hidden md:flex md:items-center md:space-x-3">
                <ThemeSelector variant="compact" />
                <LanguageSelector variant="compact" />
                {isAuthenticated ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="text-muted-foreground hover:text-foreground"
                    data-testid="logout-button"
                    aria-label={t('navigation.logout')}
                  >
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                  </Button>
                ) : (
                  <Button asChild variant="default" size="sm">
                    <Link href="/login" prefetch={false}>{t('navigation.login') || 'Sign in'}</Link>
                  </Button>
                )}
              </div>

              {/* Mobile: show logo only; bottom nav handles navigation */}
              <div className="md:hidden flex items-center space-x-2">
                <ThemeSelector variant="compact" />
                {isAuthenticated ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="p-2 text-muted-foreground"
                    data-testid="logout-button"
                    aria-label={t('navigation.logout')}
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button asChild variant="default" size="sm">
                    <Link href="/login" prefetch={false}>{t('navigation.login') || 'Sign in'}</Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </nav>
      </div>

      {/* Mobile Bottom Navigation (Instagram-style 5-icon bar) */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-card border-t border-border safe-area-bottom"
        aria-label="Mobile navigation"
        data-testid="mobile-bottom-nav"
      >
        <div className="flex items-stretch justify-around h-14">
          {primaryNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <PrefetchLink
                key={item.href}
                href={item.href}
                data-testid={`mobile-${item.testId}`}
                className={`flex flex-col items-center justify-center flex-1 min-w-0 py-1 transition-colors ${
                  active
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                aria-current={active ? 'page' : undefined}
                aria-label={item.label}
              >
                {item.isCreate ? (
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                ) : (
                  <>
                    <Icon className={`h-5 w-5 ${active ? 'stroke-[2.5]' : ''}`} aria-hidden="true" />
                    <span className="text-[10px] mt-0.5 leading-tight">{item.label}</span>
                  </>
                )}
              </PrefetchLink>
            );
          })}
        </div>
      </nav>
    </>
  );
}
