'use client';

import { useEffect, useRef } from 'react';
import { Toaster, toast } from 'sonner';

import { useNotificationStore } from '@/lib/stores/notificationStore';

export default function GlobalToastProvider() {
  const shownIdsRef = useRef(new Set<string>());

  useEffect(() => {
    const unsubscribe = useNotificationStore.subscribe((state, prevState) => {
      const prev = prevState?.notifications ?? [];
      const next = state.notifications;

      for (const notification of next) {
        if (shownIdsRef.current.has(notification.id)) continue;
        if (prev.some((p) => p.id === notification.id)) continue;

        shownIdsRef.current.add(notification.id);

        const opts = {
          id: notification.id,
          description: notification.message,
          duration: notification.persistent ? Infinity : (notification.duration ?? 5000),
          onDismiss: () => {
            state.removeNotification(notification.id);
          },
        };

        switch (notification.type) {
          case 'success':
            toast.success(notification.title, opts);
            break;
          case 'error':
            toast.error(notification.title, opts);
            break;
          case 'warning':
            toast.warning(notification.title, opts);
            break;
          case 'info':
          default:
            toast.info(notification.title, opts);
            break;
        }
      }

      for (const prev_notification of prev) {
        if (!next.some((n) => n.id === prev_notification.id)) {
          shownIdsRef.current.delete(prev_notification.id);
          toast.dismiss(prev_notification.id);
        }
      }
    });

    return unsubscribe;
  }, []);

  return (
    <Toaster
      position="top-right"
      toastOptions={{
        className: 'text-sm',
        duration: 5000,
      }}
      richColors
      closeButton
      expand={false}
      visibleToasts={5}
    />
  );
}
