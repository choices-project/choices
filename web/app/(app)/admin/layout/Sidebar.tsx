'use client';

import {
  LayoutDashboard,
  BarChart3,
  Settings,
  X,
  MessageCircle,
  Activity,
  Users,
  Zap,
  Flag,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';

import { useSystemMetrics } from '@/features/admin/lib/hooks';
import { useAdminSidebarCollapsed, useAdminActions } from '@/lib/stores';

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    name: 'Users',
    href: '/admin/users',
    icon: Users,
  },
  {
    name: 'Feedback',
    href: '/admin/feedback',
    icon: MessageCircle,
  },
  {
    name: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
  },
  {
    name: 'Performance',
    href: '/admin/performance',
    icon: Zap,
  },
  {
    name: 'System',
    href: '/admin/system',
    icon: Settings,
  },
  {
    name: 'Site Messages',
    href: '/admin/site-messages',
    icon: MessageCircle,
  },
  {
    name: 'Feature Flags',
    href: '/admin/feature-flags',
    icon: Flag,
  },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const sidebarCollapsed = useAdminSidebarCollapsed();
  const { toggleSidebar } = useAdminActions();
  const { data: metrics } = useSystemMetrics();
  const sidebarNavigationId = 'admin-sidebar-navigation';

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
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out ${
          sidebarCollapsed ? '-translate-x-full lg:translate-x-0 lg:w-16' : 'translate-x-0'
        }`}
        role="complementary"
        aria-label="Admin sidebar"
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          {!sidebarCollapsed && (
            <h1 className="text-xl font-bold text-gray-900">Choices Admin</h1>
          )}
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
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
            {navigationItems.map((item: { name: string; href: string; icon: React.ComponentType }) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
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
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Quick Stats</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <BarChart3 className="w-4 h-4" aria-hidden="true" />
                  <span>Topics:</span>
                  <span className="font-medium">{metrics?.total_topics ?? 0}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <BarChart3 className="w-4 h-4" aria-hidden="true" />
                  <span>Polls:</span>
                  <span className="font-medium">{metrics?.total_polls ?? 0}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
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
