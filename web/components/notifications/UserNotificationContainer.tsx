'use client';

import React, { useEffect, useRef } from 'react';

import ScreenReaderSupport from '@/lib/accessibility/screen-reader';
import { useNotifications, useNotificationActions } from '@/lib/stores';

type UserNotification = ReturnType<typeof useNotifications>[number];

type UserNotificationItemProps = {
  notification: UserNotification;
  onRemove: (id: string) => void;
  onMarkAsRead: (id: string) => void;
};

function UserNotificationItem({
  notification,
  onRemove,
  onMarkAsRead,
}: UserNotificationItemProps) {
  const handleDismiss = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onRemove(notification.id);
  };

  const handleClick = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
  };

  const priority: 'assertive' | 'polite' =
    notification.type === 'error' || notification.type === 'warning'
      ? 'assertive'
      : 'polite';

  return (
    <div
      className="relative rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-md"
      onClick={handleClick}
      role={priority === 'assertive' ? 'alert' : 'status'}
      aria-live={priority}
      aria-atomic="true"
    >
      <div className="flex items-start">
        <div className="flex-1">
          {notification.title && (
            <h3 className="text-sm font-medium text-slate-900">
              {notification.title}
            </h3>
          )}
          {notification.message && (
            <p className="mt-1 text-sm text-slate-700">
              {notification.message}
            </p>
          )}
        </div>
        <div className="ml-4 flex-shrink-0">
          <button
            type="button"
            onClick={handleDismiss}
            className="inline-flex text-slate-400 hover:text-slate-600 focus:outline-none"
            aria-label="Dismiss notification"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export function UserNotificationContainer() {
  const notifications = useNotifications();
  const {
    removeNotification,
    markAsRead,
    clearAll,
  } = useNotificationActions();
  const previousCountRef = useRef(0);

  useEffect(() => {
    if (notifications.length > previousCountRef.current) {
      const newest = notifications[notifications.length - 1];
      if (newest) {
        const priority: 'assertive' | 'polite' =
          newest.type === 'error' || newest.type === 'warning'
            ? 'assertive'
            : 'polite';
        const announcementParts = [newest.title, newest.message]
          .filter(Boolean)
          .map((part) => String(part));
        if (announcementParts.length) {
          ScreenReaderSupport.announce(
            announcementParts.join(': '),
            priority,
          );
        }
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
    <div
      className="pointer-events-none fixed top-4 right-4 z-40 w-96 max-w-full space-y-2"
      role="region"
      aria-live="polite"
      aria-label="Notifications"
    >
      {notifications.length > 1 && (
        <div className="pointer-events-auto flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600 shadow-sm">
          <span>{notifications.length} notifications</span>
          <button
            type="button"
            onClick={clearAll}
            className="font-medium text-slate-700 hover:text-slate-900"
          >
            Clear all
          </button>
        </div>
      )}
      <div className="space-y-2">
        {notifications.map((notification) => (
          <div key={notification.id} className="pointer-events-auto">
            <UserNotificationItem
              notification={notification}
              onRemove={removeNotification}
              onMarkAsRead={markAsRead}
            />
          </div>
        ))}
      </div>
    </div>
  );
}


