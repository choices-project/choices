'use client';

import {
  Bell,
  Menu,
  Search,
  User,
  Settings,
  LogOut,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

import {
  useUser,
  useUserActions,
  useAdminActions,
  useAdminSidebarCollapsed,
  useNotificationActions,
  useNotificationAdminNotifications,
  useNotificationAdminUnreadCount,
} from '@/lib/stores';
import { logger } from '@/lib/utils/logger';
import { getSupabaseBrowserClient } from '@/utils/supabase/client';

export const Header: React.FC = () => {
  const router = useRouter();
  const user = useUser();
  const { signOut: resetUserState } = useUserActions();
  const notifications = useNotificationAdminNotifications();
  const unreadCount = useNotificationAdminUnreadCount();
  const { toggleSidebar } = useAdminActions();
  const { markAdminNotificationAsRead } = useNotificationActions();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const sidebarCollapsed = useAdminSidebarCollapsed();

  const handleLogout = async () => {
    try {
      const supabase = await getSupabaseBrowserClient();
      await supabase.auth.signOut();
    } catch (error) {
      logger.error('Failed to sign out:', error instanceof Error ? error : new Error(String(error)));
    } finally {
      resetUserState();
      router.push('/login');
    }
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen((prev) => !prev);
  };

  const closeUserMenu = () => {
    setIsUserMenuOpen(false);
  };

  return (
    <header
      className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6"
      role="banner"
    >
      {/* Left side */}
      <div className="flex items-center space-x-4">
        <button
          onClick={toggleSidebar}
          className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          aria-label="Toggle sidebar navigation"
          aria-expanded={!sidebarCollapsed}
          aria-controls="admin-sidebar-navigation"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>

        {/* Search */}
        <div className="hidden md:flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <div className="relative">
          <button
            className="relative p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
            aria-haspopup="true"
            aria-expanded={false}
          >
            <Bell className="h-5 w-5" aria-hidden="true" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications dropdown */}
          {notifications.length > 0 && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg border border-gray-200 z-50">
              <div className="p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Notifications</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {notifications.slice(0, 5).map((notification) => (
                    <button
                      key={notification.id}
                      type="button"
                      className={`w-full text-left p-3 rounded-md transition-colors ${
                        notification.read
                          ? 'bg-gray-50 hover:bg-gray-100'
                          : 'bg-blue-50 hover:bg-blue-100'
                      }`}
                      onClick={() => markAdminNotificationAsRead(notification.id)}
                      aria-label={`Mark notification "${notification.title}" as read`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-2">
                            {new Date(notification.timestamp).toLocaleString()}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full ml-2" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={toggleUserMenu}
            className="flex items-center space-x-2 p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            aria-label="User menu"
            aria-haspopup="true"
            aria-expanded={isUserMenuOpen}
          >
            <User className="h-5 w-5" aria-hidden="true" />
            <span className="hidden md:block text-sm font-medium text-gray-700">
              {user?.email ?? 'Admin'}
            </span>
          </button>

          {isUserMenuOpen && (
            <ul
              className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50"
              aria-label="Account options"
            >
              <li>
                <button
                  className="flex w-full items-center px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                  onClick={closeUserMenu}
                >
                  <User className="h-4 w-4 mr-3" aria-hidden="true" />
                  Profile
                </button>
              </li>
              <li>
                <button
                  className="flex w-full items-center px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                  onClick={closeUserMenu}
                >
                  <Settings className="h-4 w-4 mr-3" aria-hidden="true" />
                  Settings
                </button>
              </li>
              <li role="separator" className="my-1 border-t border-gray-200" />
              <li>
                <button
                  className="flex w-full items-center px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-3" aria-hidden="true" />
                  Sign out
                </button>
              </li>
            </ul>
          )}
        </div>
      </div>
    </header>
  );
};
