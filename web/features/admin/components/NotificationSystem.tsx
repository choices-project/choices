'use client';

/**
 * Notification System for Admin Feature
 *
 * Provides toast notifications and alerts for admin actions
 * with different types and auto-dismiss functionality.
 *
 * Created: December 19, 2024
 * Updated: December 19, 2024
 */

import React, { useEffect, useRef } from 'react';

import type { AdminNotification } from '@/features/admin/types';
import {
  useNotificationAdminNotifications,
  useNotificationAdminUnreadCount,
  useNotificationActions,
} from '@/lib/stores';
import ScreenReaderSupport from '@/lib/accessibility/screen-reader';

/**
 * Hook to use admin notification system
 */
export function useAdminNotificationSystem() {
  const notifications = useNotificationAdminNotifications();
  const unreadCount = useNotificationAdminUnreadCount();
  const {
    addAdminNotification,
    removeAdminNotification,
    clearAllAdminNotifications,
    markAdminNotificationAsRead
  } = useNotificationActions();

  return {
    notifications,
    unreadCount,
    actions: {
      addNotification: addAdminNotification,
      removeNotification: removeAdminNotification,
      clearAllNotifications: clearAllAdminNotifications,
      markAsRead: markAdminNotificationAsRead
    }
  };
}

// NotificationProvider is no longer needed with Zustand store

/**
 * Individual notification component
 */
type NotificationItemProps = {
  notification: AdminNotification;
  onRemove: (id: string) => void;
  onMarkAsRead: (id: string) => void;
};

function NotificationItem({ notification, onRemove, onMarkAsRead }: NotificationItemProps) {
  const handleDismiss = () => {
    onRemove(notification.id);
  };

  const handleClick = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
  };

  const priority: 'assertive' | 'polite' =
    notification.type === 'error' || notification.type === 'warning' ? 'assertive' : 'polite';

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return (
          <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'error':
        return (
          <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const getBackgroundColor = () => {
    switch (notification.type) {
      case 'success': return 'bg-green-50 border-green-200';
      case 'error': return 'bg-red-50 border-red-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      default: return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div
      className={`relative rounded-lg border p-4 shadow-sm transition-all duration-300 hover:shadow-md ${getBackgroundColor()} ${
        notification.read ? 'opacity-75' : ''
      }`}
      onClick={handleClick}
      role={priority === 'assertive' ? 'alert' : 'status'}
      aria-live={priority}
      aria-atomic="true"
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-gray-900">
            {notification.title}
          </h3>
          <p className="mt-1 text-sm text-gray-600">
            {notification.message}
          </p>
          {notification.action && (
            <div className="mt-2">
              <a
                href={notification.action.url}
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                {notification.action.label} →
              </a>
            </div>
          )}
        </div>
        <div className="ml-4 flex-shrink-0">
          <button
            onClick={(event) => {
              event.stopPropagation();
              handleDismiss();
            }}
            className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none"
            aria-label="Dismiss notification"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Notification container component
 */
export function NotificationContainer() {
  const {
    notifications,
    actions: { clearAllNotifications, removeNotification, markAsRead }
  } = useAdminNotificationSystem();
  const previousCountRef = useRef(0);

  useEffect(() => {
    if (notifications.length > previousCountRef.current) {
      const newest = notifications[notifications.length - 1];
      if (newest) {
        const priority =
          newest.type === 'error' || newest.type === 'warning' ? 'assertive' : 'polite';
        const announcementParts = [newest.title, newest.message]
          .filter(Boolean)
          .map((part) => String(part));
        ScreenReaderSupport.announce(announcementParts.join(': '), priority);
      }
    } else if (notifications.length === 0 && previousCountRef.current > 0) {
      ScreenReaderSupport.announce('All notifications cleared.', 'polite');
    }

    previousCountRef.current = notifications.length;
  }, [notifications]);

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 w-96 max-w-sm" role="region" aria-live="polite">
      <div className="space-y-2">
        {notifications.length > 1 && (
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">
              {notifications.length} notifications
            </span>
            <button
              onClick={clearAllNotifications}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear all
            </button>
          </div>
        )}
        {notifications.map(notification => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onRemove={removeNotification}
            onMarkAsRead={markAsRead}
          />
        ))}
      </div>
    </div>
  );
}
