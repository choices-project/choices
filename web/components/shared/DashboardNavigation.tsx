/**
 * Dashboard Navigation Component
 * 
 * Cohesive navigation between all user dashboard sections
 * Ensures consistent UX across all dashboard areas
 * 
 * Features:
 * - Unified navigation for dashboard, profile, privacy
 * - Active state indicators
 * - Mobile responsive
 * - Privacy-first design
 * 
 * Created: November 5, 2025
 * Status: ✅ ACTIVE
 */

'use client';

import {
  LayoutDashboard,
  User,
  Shield,
  Settings,
  Vote,
  Hash
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import { cn } from '@/lib/utils';

import { useI18n } from '@/hooks/useI18n';

type NavItem = {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  description: string;
  badge?: string;
};

export default function DashboardNavigation() {
  const { t } = useI18n();
  // CRITICAL: Store pathname in state to prevent hydration mismatch
  // usePathname() can return different values during SSR vs client hydration
  // Store in state and only update after mount to ensure stable initial value
  const [isMounted, setIsMounted] = useState(false);
  const [pathname, setPathname] = useState<string>('');
  const pathnameFromHook = usePathname();

  useEffect(() => {
    setIsMounted(true);
    setPathname(pathnameFromHook);
  }, [pathnameFromHook]);

  // During SSR/initial render, don't use pathname (render all items as inactive)
  // This ensures consistent server/client rendering
  const effectivePathname = isMounted ? pathname : null;

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: t('dashboard.nav.dashboard'),
      href: '/dashboard',
      icon: LayoutDashboard,
      description: t('dashboard.nav.dashboardDescription')
    },
    {
      id: 'profile',
      label: t('dashboard.nav.profile'),
      href: '/profile',
      icon: User,
      description: t('dashboard.nav.profileDescription')
    },
    {
      id: 'privacy',
      label: t('dashboard.nav.privacy'),
      href: '/account/privacy',
      icon: Shield,
      description: t('dashboard.nav.privacyDescription'),
      badge: t('dashboard.nav.privacyBadge')
    },
    {
      id: 'polls',
      label: t('dashboard.nav.myPolls'),
      href: '/polls',
      icon: Vote,
      description: t('dashboard.nav.myPollsDescription')
    },
    {
      id: 'hashtags',
      label: t('dashboard.nav.hashtags'),
      href: '/hashtags',
      icon: Hash,
      description: t('dashboard.nav.hashtagsDescription')
    },
    {
      id: 'preferences',
      label: t('dashboard.nav.preferences'),
      href: '/profile/preferences',
      icon: Settings,
      description: t('dashboard.nav.preferencesDescription')
    }
  ];

  return (
    <nav className="bg-background border-b border-border" data-testid="dashboard-navigation">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            // Only check active state after mount to prevent hydration mismatch
            const isActive = effectivePathname
              ? (effectivePathname === item.href || effectivePathname.startsWith(item.href + '/'))
              : false;

            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap',
                  isActive
                    ? 'border-primary text-primary font-medium'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                )}
                data-testid={`nav-${item.id}`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm">{item.label}</span>
                {item.badge && (
                  <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

/**
 * Mobile Dashboard Navigation (Bottom Nav)
 */
export function MobileDashboardNav() {
  // CRITICAL: Store pathname in state to prevent hydration mismatch
  // usePathname() can return different values during SSR vs client hydration
  // Store in state and only update after mount to ensure stable initial value
  const [isMounted, setIsMounted] = useState(false);
  const [pathname, setPathname] = useState<string>('');
  const pathnameFromHook = usePathname();

  useEffect(() => {
    setIsMounted(true);
    setPathname(pathnameFromHook);
  }, [pathnameFromHook]);

  // During SSR/initial render, don't use pathname (render all items as inactive)
  const effectivePathname = isMounted ? pathname : null;

  const mobileNavItems = [
    {
      id: 'dashboard',
      label: 'Home',
      href: '/dashboard',
      icon: LayoutDashboard
    },
    {
      id: 'polls',
      label: 'Polls',
      href: '/polls',
      icon: Vote
    },
    {
      id: 'profile',
      label: 'Profile',
      href: '/profile',
      icon: User
    },
    {
      id: 'privacy',
      label: 'Privacy',
      href: '/account/privacy',
      icon: Shield
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border md:hidden z-50">
      <div className="flex items-center justify-around">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          // Only check active state after mount to prevent hydration mismatch
          const isActive = effectivePathname
            ? (effectivePathname === item.href || effectivePathname.startsWith(item.href + '/'))
            : false;

          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 py-3 px-4 flex-1',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

