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

type NavItem = {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  description: string;
  badge?: string;
};

export default function DashboardNavigation() {
  const pathname = usePathname();
  // CRITICAL: Follow feed/polls pattern - ensure pathname is only used after mount
  // usePathname() can return different values on server vs client, causing hydration mismatches
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // During SSR/initial render, don't use pathname (render all items as inactive)
  // This ensures consistent server/client rendering
  const effectivePathname = isMounted ? pathname : null;

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      description: 'Your personal hub'
    },
    {
      id: 'profile',
      label: 'Profile',
      href: '/profile',
      icon: User,
      description: 'Manage your profile'
    },
    {
      id: 'privacy',
      label: 'Privacy & Data',
      href: '/account/privacy',
      icon: Shield,
      description: '🔒 Your data, your control',
      badge: 'Privacy'
    },
    {
      id: 'polls',
      label: 'My Polls',
      href: '/polls',
      icon: Vote,
      description: 'Polls you created'
    },
    {
      id: 'hashtags',
      label: 'Hashtags',
      href: '/hashtags',
      icon: Hash,
      description: 'Your interests'
    },
    {
      id: 'preferences',
      label: 'Preferences',
      href: '/profile/preferences',
      icon: Settings,
      description: 'App settings'
    }
  ];

  return (
    <nav className="bg-white border-b" data-testid="dashboard-navigation">
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
                    ? 'border-blue-600 text-blue-600 font-medium'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                )}
                data-testid={`nav-${item.id}`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm">{item.label}</span>
                {item.badge && (
                  <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
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
  const pathname = usePathname();
  // CRITICAL: Follow feed/polls pattern - ensure pathname is only used after mount
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t md:hidden z-50">
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
                  ? 'text-blue-600'
                  : 'text-gray-600'
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

