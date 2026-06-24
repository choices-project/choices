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
import React, { useState, useRef, useEffect, useCallback } from 'react';

import { getSupabaseBrowserClient } from '@/utils/supabase/client';

import { Input } from '@/components/ui/input';

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

export const Header: React.FC = () => {
  const router = useRouter();
  const routerRef = useRef(router);
  useEffect(() => { routerRef.current = router; }, [router]);
  const user = useUser();
  const { signOut: resetUserState } = useUserActions();
  const resetUserStateRef = useRef(resetUserState);
  useEffect(() => { resetUserStateRef.current = resetUserState; }, [resetUserState]);
  const notifications = useNotificationAdminNotifications();
  const unreadCount = useNotificationAdminUnreadCount();
  const { toggleSidebar } = useAdminActions();
  const { markAdminNotificationAsRead } = useNotificationActions();
  const markAdminNotificationAsReadRef = useRef(markAdminNotificationAsRead);
  useEffect(() => { markAdminNotificationAsReadRef.current = markAdminNotificationAsRead; }, [markAdminNotificationAsRead]);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const sidebarCollapsed = useAdminSidebarCollapsed();
  const userMenuRef = useRef<HTMLDivElement>(null);

  const handleLogout = useCallback(async () => {
    try {
      const supabase = await getSupabaseBrowserClient();
      await supabase.auth.signOut();
    } catch (error) {
      logger.error('Failed to sign out:', error instanceof Error ? error : new Error(String(error)));
    } finally {
      resetUserStateRef.current();
      routerRef.current.push('/auth');
    }
  }, []);  

  const toggleUserMenu = useCallback(() => {
    setIsUserMenuOpen((prev) => !prev);
  }, []);

  const closeUserMenu = useCallback(() => {
    setIsUserMenuOpen(false);
  }, []);

  // Handle click outside and Escape key for accessibility
  useEffect(() => {
    if (!isUserMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        closeUserMenu();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeUserMenu();
      }
    };

    // Use capture phase to catch events before they bubble
    document.addEventListener('mousedown', handleClickOutside, true);
    document.addEventListener('keydown', handleEscape, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
      document.removeEventListener('keydown', handleEscape, true);
    };
  }, [isUserMenuOpen, closeUserMenu]);

  return (
    <header
      className="bg-background border-b border-border h-16 flex items-center justify-between px-6"
      role="banner"
    >
      {/* Left side */}
      <div className="flex items-center space-x-4">
        <button
          onClick={toggleSidebar}
          className="lg:hidden p-2 rounded-md text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="Toggle sidebar navigation"
          aria-expanded={!sidebarCollapsed}
          aria-controls="admin-sidebar-navigation"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>

        {/* Search */}
        <div className="hidden md:flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
            <Input
              type="text"
              placeholder="Search..."
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <div className="relative">
          <button
            className="relative p-2 rounded-md text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
            aria-haspopup="true"
            aria-expanded={false}
          >
            <Bell className="h-5 w-5" aria-hidden="true" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-700 text-white text-xs font-semibold rounded-full h-5 w-5 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications dropdown */}
          {notifications.length > 0 && (
            <div className="absolute right-0 mt-2 w-80 bg-card rounded-md shadow-lg border border-border z-50">
              <div className="p-4">
                <h3 className="text-sm font-medium text-foreground mb-3">Notifications</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {notifications.slice(0, 5).map((notification) => (
                    <button
                      key={notification.id}
                      type="button"
                      className={`w-full text-left p-3 rounded-md transition-colors ${
                        notification.read
                          ? 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                          : 'bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50'
                      }`}
                      onClick={() => markAdminNotificationAsReadRef.current(notification.id)}
                      aria-label={`Mark notification "${notification.title}" as read`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
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
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={toggleUserMenu}
            className="flex items-center space-x-2 p-2 rounded-md text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="User menu"
            aria-haspopup="true"
            aria-expanded={isUserMenuOpen}
          >
            <User className="h-5 w-5" aria-hidden="true" />
            <span className="hidden md:block text-sm font-medium text-foreground/80">
              {user?.email ?? 'Admin'}
            </span>
          </button>

          {isUserMenuOpen && (
            <div
              className="absolute right-0 mt-2 w-48 bg-card rounded-md shadow-lg border border-border z-50"
              role="menu"
              aria-label="Account options"
            >
              <div role="none">
                <button
                  className="flex w-full items-center px-4 py-2 text-left text-sm text-foreground/80 hover:bg-muted"
                  onClick={closeUserMenu}
                  role="menuitem"
                >
                  <User className="h-4 w-4 mr-3" aria-hidden="true" />
                  Profile
                </button>
              </div>
              <div role="none">
                <button
                  className="flex w-full items-center px-4 py-2 text-left text-sm text-foreground/80 hover:bg-muted"
                  onClick={closeUserMenu}
                  role="menuitem"
                >
                  <Settings className="h-4 w-4 mr-3" aria-hidden="true" />
                  Settings
                </button>
              </div>
              <div role="separator" className="my-1 border-t border-border" />
              <div role="none">
                <button
                  className="flex w-full items-center px-4 py-2 text-left text-sm text-foreground/80 hover:bg-muted"
                  onClick={handleLogout}
                  role="menuitem"
                >
                  <LogOut className="h-4 w-4 mr-3" aria-hidden="true" />
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
