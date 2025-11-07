import { act } from '@testing-library/react';

import { useNotificationStore } from '@/lib/stores/notificationStore';
import logger from '@/lib/utils/logger';

describe('notificationStore', () => {
  let warnSpy: jest.SpyInstance;
  let infoSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers();

    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    infoSpy = jest.spyOn(logger, 'info').mockImplementation(() => {});

    act(() => {
      const store = useNotificationStore.getState();
      store.clearAll();
      store.clearAllAdminNotifications();
      store.resetSettings();
      store.setError(null);
      store.setAdding(false);
      store.setRemoving(false);
    });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    warnSpy.mockRestore();
    infoSpy.mockRestore();

    act(() => {
      const store = useNotificationStore.getState();
      store.clearAll();
      store.clearAllAdminNotifications();
      store.resetSettings();
      store.setError(null);
    });
  });

  it('strips undefined fields when adding a notification', () => {
    act(() => {
      useNotificationStore.getState().addNotification({
        type: 'info',
        title: 'Welcome',
        message: 'Thanks for signing up!',
        duration: undefined,
        actions: undefined,
      } as any);
    });

    const [notification] = useNotificationStore.getState().notifications;

    expect(notification).toBeDefined();
    expect(notification.id).toMatch(/^notification_/);
    expect(typeof notification.timestamp).toBe('string');
    expect(notification.read).toBe(false);
    expect(notification).not.toHaveProperty('actions');
    expect(notification).not.toHaveProperty('duration');
  });

  it('resets settings back to defaults after overrides', () => {
    act(() => {
      useNotificationStore.getState().updateSettings({ enableSound: false, duration: 2500 });
    });

    expect(useNotificationStore.getState().settings.enableSound).toBe(false);
    expect(useNotificationStore.getState().settings.duration).toBe(2500);

    act(() => {
      useNotificationStore.getState().resetSettings();
    });

    const settings = useNotificationStore.getState().settings;
    expect(settings.enableSound).toBe(true);
    expect(settings.duration).toBe(5000);
  });
});


