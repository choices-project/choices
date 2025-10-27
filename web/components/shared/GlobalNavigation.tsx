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

'use client'

import { 
  Menu, 
  X, 
  Shield, 
  User, 
  LogOut, 
  Vote,
  BarChart3,
  Home,
  Settings
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { useUser, useUserActions, useUserLoading, useIsAuthenticated } from '@/lib/stores'
import { useI18n } from '@/hooks/useI18n'
import LanguageSelector from '@/components/shared/LanguageSelector'

/**
 * Global Navigation Component
 * 
 * @returns {JSX.Element} Global navigation component
 * 
 * @example
 * <GlobalNavigation />
 */
export default function GlobalNavigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [hasError, setHasError] = useState(false)
  const pathname = usePathname()

  // Error boundary for component
  if (hasError) {
    return (
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-gray-200 rounded"></div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="h-8 w-20 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </nav>
    );
  }
  
  // Safe user hook with error handling and loading state
  let user: any = null;
  let signOut: (() => Promise<void>) | null = null;
  let isLoading = false;
  let isAuthenticated = false;
  
  // Try each hook individually to isolate issues
  try {
    user = useUser();
  } catch (error) {
    console.warn('useUser hook failed:', error);
    user = null;
    setHasError(true);
  }
  
  try {
    const userActions = useUserActions();
    signOut = userActions?.signOut ? async () => {
      try {
        userActions.signOut();
      } catch (error) {
        console.error('SignOut error:', error);
      }
    } : null;
  } catch (error) {
    console.warn('useUserActions hook failed:', error);
    signOut = null;
    setHasError(true);
  }
  
  try {
    isLoading = useUserLoading() || false;
  } catch (error) {
    console.warn('useUserLoading hook failed:', error);
    isLoading = false;
    setHasError(true);
  }
  
  try {
    isAuthenticated = useIsAuthenticated() || false;
  } catch (error) {
    console.warn('useIsAuthenticated hook failed:', error);
    isAuthenticated = false;
    setHasError(true);
  }
  
  // Safe i18n hook with error handling
  let t: (key: string) => string;
  try {
    const i18n = useI18n();
    t = i18n.t;
  } catch (error) {
    console.warn('i18n hook failed, using fallback:', error);
    t = (key: string) => key; // Fallback to key as translation
  }

  // Show loading state if user data is still loading or if we're not authenticated yet
  if (isLoading || (!isAuthenticated && !user)) {
    return (
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-gray-200 animate-pulse rounded"></div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="h-8 w-20 bg-gray-200 animate-pulse rounded"></div>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  const handleLogout = async () => {
    try {
      if (signOut) {
        const result = signOut()
        if (result instanceof Promise) {
          await result
        }
      }
      closeMobileMenu()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const isActive = (path: string) => {
    return pathname === path
  }

  const navigationItems = [
    { href: '/feed', label: t('navigation.home'), icon: Home },
    { href: '/polls', label: t('navigation.polls'), icon: Vote },
    { href: '/dashboard', label: t('navigation.dashboard'), icon: BarChart3 },
  ]

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
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
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  data-testid={item.href === '/polls' ? 'polls-nav' : item.href === '/dashboard' ? 'dashboard-nav' : item.href === '/' ? 'home-nav' : undefined}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>

          {/* Desktop Auth Section */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            {/* Language Selector */}
            <div data-testid="language-selector">
              <LanguageSelector />
            </div>
            
            {user ? (
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
              variant="ghost"
              size="sm"
              onClick={toggleMobileMenu}
              className="p-2"
              aria-label="Toggle mobile menu"
              data-testid="mobile-menu"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t border-gray-200">
              {/* Mobile Navigation Items */}
              {navigationItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMobileMenu}
                    data-testid={item.href === '/polls' ? 'polls-nav' : item.href === '/dashboard' ? 'dashboard-nav' : item.href === '/' ? 'home-nav' : undefined}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium transition-colors ${
                      isActive(item.href)
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}

              {/* Mobile Auth Section */}
              <div className="pt-4 border-t border-gray-200">
                {user ? (
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
                      <span>Profile</span>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleLogout}
                      className="w-full justify-start flex items-center space-x-2"
                      data-testid="logout-button"
                    >
                      <LogOut className="h-5 w-5" />
                      <span>Logout</span>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Button asChild variant="outline" size="sm" className="w-full">
                      <Link href="/login" onClick={closeMobileMenu}>Sign In</Link>
                    </Button>
                    <Button asChild size="sm" className="w-full">
                      <Link href="/register" onClick={closeMobileMenu}>Get Started</Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}