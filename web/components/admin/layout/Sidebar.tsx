'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAdminStore } from '../../../lib/admin-store';
import { useSystemMetrics } from '../../../lib/admin-hooks';
import {
  LayoutDashboard,
  TrendingUp,
  BarChart3,
  Settings,
  Menu,
  X,
  Newspaper,
  MessageCircle,
  Activity,
} from 'lucide-react';

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    name: 'Breaking News',
    href: '/admin/breaking-news',
    icon: Newspaper,
  },
  {
    name: 'Trending Topics',
    href: '/admin/trending-topics',
    icon: TrendingUp,
  },
  {
    name: 'Generated Polls',
    href: '/admin/generated-polls',
    icon: BarChart3,
  },
  {
    name: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
  },
  {
    name: 'Feedback',
    href: '/admin/feedback',
    icon: MessageCircle,
  },
  {
    name: 'Settings',
    href: '/admin/settings',
    icon: Settings,
  },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useAdminStore();
  const { data: metrics } = useSystemMetrics();

  return (
    <>
      {/* Mobile overlay */}
      {!sidebarCollapsed && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out ${
          sidebarCollapsed ? '-translate-x-full lg:translate-x-0 lg:w-16' : 'translate-x-0'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          {!sidebarCollapsed && (
            <h1 className="text-xl font-bold text-gray-900">Choices Admin</h1>
          )}
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="mt-6 px-3">
          <ul className="space-y-2">
            {navigationItems.map((item: any) => {
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
                  >
                    <item.icon className="h-5 w-5 mr-3" />
                    {!sidebarCollapsed && <span>{item.name}</span>}
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
                  <BarChart3 className="w-4 h-4" />
                  <span>Topics:</span>
                  <span className="font-medium">{metrics?.total_topics || 0}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <BarChart3 className="w-4 h-4" />
                  <span>Polls:</span>
                  <span className="font-medium">{metrics?.total_polls || 0}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Activity className="w-4 h-4" />
                  <span>Active:</span>
                  <span className="font-medium">{metrics?.active_polls || 0}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

