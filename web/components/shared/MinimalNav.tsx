'use client';

import { LogOut, Plus, User, Vote } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useState } from 'react';

import ThemeSelector from '@/components/shared/ThemeSelector';
import { Button } from '@/components/ui/button';

import { isNavItemActive } from '@/lib/navigation/is-nav-active';

import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/hooks/useI18n';

const NAV_ITEMS: Array<{
  href: string;
  labelKey: string;
  fallback: string;
  testId: string;
  isCreate?: boolean;
}> = [
  { href: '/polls', labelKey: 'navigation.polls', fallback: 'Polls', testId: 'polls-nav' },
  { href: '/polls/create', labelKey: 'navigation.create', fallback: 'Create', testId: 'create-nav', isCreate: true },
  { href: '/profile', labelKey: 'navigation.profile', fallback: 'Profile', testId: 'profile-nav' },
];

export default function MinimalNav() {
  const { t } = useI18n();
  const pathname = usePathname() ?? '';
  const { user, isLoading, logout } = useAuth();
  const isAuthenticated = Boolean(user);
  const [loggingOut, setLoggingOut] = useState(false);

  const isActive = useCallback((path: string) => isNavItemActive(pathname, path), [pathname]);

  const handleLogout = useCallback(async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
    }
  }, [loggingOut, logout]);

  if (isLoading) {
    return (
      <nav className="bg-card shadow-sm border-b border-border" data-testid="minimal-nav-loading">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center">
          <div className="h-8 w-8 bg-muted animate-pulse rounded" />
        </div>
      </nav>
    );
  }

  return (
    <>
      <header className="sticky top-0 z-[60] bg-card shadow-sm border-b border-border" data-testid="minimal-navigation">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Primary navigation">
          <div className="flex items-center justify-between h-14">
            <Link href={isAuthenticated ? '/polls' : '/'} prefetch={false} className="flex items-center gap-2 shrink-0">
              <Vote className="h-7 w-7 text-primary" aria-hidden="true" />
              <span className="text-lg font-bold text-foreground hidden sm:inline">Choices</span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={false}
                  data-testid={item.testId}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'text-primary bg-primary/10'
                      : 'text-muted-foreground hover:text-primary hover:bg-muted'
                  }`}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                >
                  {t(item.labelKey) || item.fallback}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <ThemeSelector variant="compact" />
              {isAuthenticated ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void handleLogout()}
                  disabled={loggingOut}
                  data-testid="logout-button"
                  aria-label={t('navigation.logout')}
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                </Button>
              ) : (
                <Button asChild variant="default" size="sm">
                  <Link href="/auth" prefetch={false}>
                    {t('navigation.login') || 'Sign in'}
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </nav>
      </header>

      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-[60] bg-card border-t border-border safe-area-bottom"
        aria-label="Mobile navigation"
        data-testid="mobile-bottom-nav"
      >
        <div className="flex items-stretch justify-around h-14">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            const Icon = item.isCreate ? Plus : item.href === '/profile' ? User : Vote;
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                data-testid={`mobile-${item.testId}`}
                className={`flex flex-col items-center justify-center flex-1 min-w-0 py-1 ${
                  active ? 'text-primary' : 'text-muted-foreground'
                }`}
                aria-current={active ? 'page' : undefined}
              >
                {item.isCreate ? (
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                ) : (
                  <>
                    <Icon className="h-5 w-5" aria-hidden="true" />
                    <span className="text-[10px] mt-0.5">{t(item.labelKey) || item.fallback}</span>
                  </>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
