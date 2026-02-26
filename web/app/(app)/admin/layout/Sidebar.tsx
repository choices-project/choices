'use client';

import {
  LayoutDashboard,
  BarChart3,
  Settings,
  Shield,
  X,
  MessageCircle,
  Activity,
  Users,
  Zap,
  Flag,
  Contact,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';

import { useSystemMetrics } from '@/features/admin/lib/hooks';
import { useFeatureFlag } from '@/features/pwa/hooks/useFeatureFlags';

import { useAdminSidebarCollapsed, useAdminActions } from '@/lib/stores';
import { useSidebarActiveSection } from '@/lib/stores/appStore';

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
    section: 'admin-dashboard',
  },
  {
    name: 'Users',
    href: '/admin/users',
    icon: Users,
    section: 'admin-users',
  },
  {
    name: 'Feedback',
    href: '/admin/feedback',
    icon: MessageCircle,
    section: 'admin-feedback',
  },
  {
    name: 'Contact System',
    href: '/admin/contact',
    icon: Contact,
    section: 'admin-contact',
  },
  {
    name: 'Moderation',
    href: '/admin/moderation',
    icon: Shield,
    section: 'admin-moderation',
  },
  {
    name: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
    section: 'admin-analytics',
  },
  {
    name: 'Performance',
    href: '/admin/performance',
    icon: Zap,
    section: 'admin-performance',
  },
  {
    name: 'System',
    href: '/admin/system',
    icon: Settings,
    section: 'admin-system',
  },
  {
    name: 'Site Messages',
    href: '/admin/site-messages',
    icon: MessageCircle,
    section: 'admin-site-messages',
  },
  {
    name: 'Feature Flags',
    href: '/admin/feature-flags',
    icon: Flag,
    section: 'admin-feature-flags',
  },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const activeSection = useSidebarActiveSection();
  const sidebarCollapsed = useAdminSidebarCollapsed();
  const { toggleSidebar } = useAdminActions();
  const { data: metrics } = useSystemMetrics();
  const sidebarNavigationId = 'admin-sidebar-navigation';
  const { enabled: contactSystemEnabled } = useFeatureFlag('CONTACT_INFORMATION_SYSTEM');

  // CRITICAL: Guard usePathname() usage to prevent hydration mismatch
  // usePathname() can return different values on server vs client
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  // Filter navigation items based on feature flags
  const visibleNavigationItems = React.useMemo(() => {
    return navigationItems.filter((item) => {
      // Hide Contact System if feature flag is disabled
      if (item.section === 'admin-contact' && !contactSystemEnabled) {
        return false;
      }
      return true;
    });
  }, [contactSystemEnabled]);

  return (
    <>
      {/* Mobile overlay */}
      {!sidebarCollapsed && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={toggleSidebar}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              toggleSidebar()
            }
          }}
          tabIndex={0}
          role="button"
          aria-label="Close sidebar"
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-200 ease-in-out ${
          sidebarCollapsed ? '-translate-x-full lg:translate-x-0 lg:w-16' : 'translate-x-0'
        }`}
        role="complementary"
        aria-label="Admin sidebar"
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
          {!sidebarCollapsed && (
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Choices Admin</h1>
          )}
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 rounded-md text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label={sidebarCollapsed ? 'Open sidebar navigation' : 'Close sidebar navigation'}
            aria-expanded={!sidebarCollapsed}
            aria-controls={sidebarNavigationId}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav
          id={sidebarNavigationId}
          aria-label="Admin navigation"
          className="mt-6 px-3"
        >
          <ul className="space-y-2">
            {visibleNavigationItems.map((item: { name: string; href: string; icon: React.ComponentType; section?: string }) => {
              const matchesSection = activeSection && item.section
                ? item.section === activeSection
                : false;
              // Only check pathname after mount to prevent hydration mismatch
              const isActive = matchesSection || (isMounted && pathname === item.href);
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    prefetch={false}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
                    }`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <item.icon aria-hidden="true" />
                    {!sidebarCollapsed && <span className="ml-3">{item.name}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Quick stats */}
        {!sidebarCollapsed && (
          <div className="mt-8 px-3">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h2 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Quick Stats</h2>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <BarChart3 className="w-4 h-4" aria-hidden="true" />
                  <span>Topics:</span>
                  <span className="font-medium">{metrics?.total_topics ?? 0}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <BarChart3 className="w-4 h-4" aria-hidden="true" />
                  <span>Polls:</span>
                  <span className="font-medium">{metrics?.total_polls ?? 0}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <Activity className="w-4 h-4" aria-hidden="true" />
                  <span>Active:</span>
                  <span className="font-medium">{metrics?.active_polls ?? 0}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
