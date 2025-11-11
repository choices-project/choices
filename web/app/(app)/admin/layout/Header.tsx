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

import { useUser, useUserActions } from '@/lib/stores';
import {
  useAdminActions,
  useAdminNotifications,
} from '@/lib/stores';
import { logger } from '@/lib/utils/logger';
import { getSupabaseBrowserClient } from '@/utils/supabase/client';

export const Header: React.FC = () => {
  const router = useRouter();
  const user = useUser();
  const { signOut: resetUserState } = useUserActions();
  const notifications = useAdminNotifications();
  const { toggleSidebar, markNotificationRead } = useAdminActions();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const unreadNotifications = notifications.filter((n: { read: boolean }) => !n.read);

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
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6">
      {/* Left side */}
      <div className="flex items-center space-x-4">
        <button
          onClick={toggleSidebar}
          className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
        >
          <Menu className="h-5 w-5" />
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
          <button className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 relative">
            <Bell className="h-5 w-5" />
            {unreadNotifications.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {unreadNotifications.length}
              </span>
            )}
          </button>

          {/* Notifications dropdown */}
          {notifications.length > 0 && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg border border-gray-200 z-50">
              <div className="p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Notifications</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {notifications.slice(0, 5).map((notification: { id: string; title: string; message: string; read: boolean; timestamp: string }) => (
                    <div
                      key={notification.id}
                      className={`p-3 rounded-md cursor-pointer transition-colors ${
                        notification.read
                          ? 'bg-gray-50 hover:bg-gray-100'
                          : 'bg-blue-50 hover:bg-blue-100'
                      }`}
                      onClick={() => markNotificationRead(notification.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          markNotificationRead(notification.id)
                        }
                      }}
                      tabIndex={0}
                      role="button"
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
                    </div>
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
          >
            <User className="h-5 w-5" />
            <span className="hidden md:block text-sm font-medium text-gray-700">
              {user?.email ?? 'Admin'}
            </span>
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
              <div className="py-1">
                <button
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                  onClick={closeUserMenu}
                >
                  <User className="h-4 w-4 mr-3" />
                  Profile
                </button>
                <button
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                  onClick={closeUserMenu}
                >
                  <Settings className="h-4 w-4 mr-3" />
                  Settings
                </button>
                <hr className="my-1" />
                <button
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-3" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
