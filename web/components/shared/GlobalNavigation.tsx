'use client';


import { Menu, X, Shield, User, LogOut, Vote, BarChart3, Home, Settings } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useCallback, useEffect, useRef, useState } from 'react';

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




import LanguageSelector from '@/components/shared/LanguageSelector';
import ThemeSelector from '@/components/shared/ThemeSelector';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/hooks/useI18n';
import logger from '@/lib/utils/logger';

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
  const pathname = usePathname();
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const firstMobileNavLinkRef = useRef<HTMLAnchorElement>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);
  const mobileMenuId = 'global-navigation-mobile-menu';
  const { t } = useI18n();

  // Auth integration via context
  const { user, isLoading: authLoading, logout: authSignOut } = useAuth();
  const isAuthenticated = Boolean(user);
  const isLoading = authLoading;

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen((open) => !open);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      closeMobileMenu();
      await authSignOut();
    } catch (error) {
      logger.error('Logout failed:', error);
    }
  }, [authSignOut, closeMobileMenu]);

  const isActive = useCallback(
    (path: string) => pathname === path,
    [pathname],
  );

  const navigationItems = [
    { href: '/feed', label: t('navigation.home'), icon: Home },
    { href: '/polls', label: t('navigation.polls'), icon: Vote },
    { href: '/dashboard', label: t('navigation.dashboard'), icon: BarChart3 },
  ];

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
      <nav className="bg-white shadow-sm border-b border-gray-200">
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
  if (isLoading) {
    return (
      <nav className="bg-white shadow-sm border-b border-gray-200">
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
    <div className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-200">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:rounded focus:bg-blue-600 focus:px-4 focus:py-2 focus:text-white"
      >
        {t('common.skipToContent')}
      </a>
      <nav className="bg-white" aria-label="Primary navigation">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Brand */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2" onClick={closeMobileMenu}>
                <Shield className="h-8 w-8 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">Choices</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex md:items-center md:space-x-8">
              {navigationItems.map((item) => {
                const Icon = item.icon;
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
                    className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Desktop Auth Section */}
            <div className="hidden md:flex md:items-center md:space-x-4">
              <ThemeSelector variant="compact" />
              <LanguageSelector variant="compact" />
              {user && isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  <Link
                    href="/profile"
                    className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive('/profile')
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                    }`}
                  >
                    <User className="h-4 w-4" />
                    <span>{t('navigation.profile')}</span>
                  </Link>
                  <Link
                    href="/account/privacy"
                    className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive('/account/privacy')
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                    }`}
                  >
                    <Settings className="h-4 w-4" />
                    <span>{t('navigation.settings')}</span>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                    className="flex items-center space-x-1"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>{t('navigation.logout')}</span>
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Button asChild variant="outline" size="sm">
                    <Link href="/login">{t('navigation.login')}</Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link href="/register">{t('navigation.register')}</Link>
                  </Button>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                ref={mobileMenuButtonRef}
                variant="ghost"
                size="sm"
                onClick={toggleMobileMenu}
                className="p-2"
                aria-label={
                  isMobileMenuOpen
                    ? t('navigation.mobileMenu.close')
                    : t('navigation.mobileMenu.open')
                }
                data-testid="mobile-menu"
                aria-expanded={isMobileMenuOpen}
                aria-controls="global-navigation-mobile-menu"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden" id={mobileMenuId}>
              <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t border-gray-200">
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
                      className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium transition-colors ${
                        isActive(item.href)
                          ? 'text-blue-600 bg-blue-50'
                          : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                      }`}
                      ref={index === 0 ? firstMobileNavLinkRef : undefined}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}

                <div className="pt-4 border-t border-gray-200 space-y-4">
                  <ThemeSelector />
                  <LanguageSelector />
                </div>

                {/* Mobile Auth Section */}
                <div className="pt-4 border-t border-gray-200">
                  {user && isAuthenticated ? (
                    <div className="space-y-2">
                      <Link
                        href="/profile"
                        onClick={closeMobileMenu}
                        className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium transition-colors ${
                          isActive('/profile')
                            ? 'text-blue-600 bg-blue-50'
                            : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                        }`}
                      >
                        <User className="h-5 w-5" />
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
                        <Link href="/login" onClick={closeMobileMenu}>
                          {t('navigation.login')}
                        </Link>
                      </Button>
                      <Button asChild size="sm" className="w-full">
                        <Link href="/register" onClick={closeMobileMenu}>
                          {t('navigation.register')}
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
