import { act } from '@testing-library/react';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import {
  defaultNotificationSettings,
  notificationStoreCreator,
  type NotificationStore
} from '@/lib/stores/notificationStore';
import logger from '@/lib/utils/logger';

const expectDefined = <T>(value: T | undefined, context: string): T => {
  if (value === undefined) {
    throw new Error(`Expected ${context} to be defined`);
  }
  return value;
};

const createTestNotificationStore = () =>
  create<NotificationStore>()(immer(notificationStoreCreator));

describe('notificationStore', () => {
  let warnSpy: jest.SpyInstance;
  let infoSpy: jest.SpyInstance;
  let notificationStore: ReturnType<typeof createTestNotificationStore>;

  beforeEach(() => {
    jest.useFakeTimers();

    // Logging is observed via spies; implementations are intentionally no-ops
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    infoSpy = jest.spyOn(logger, 'info').mockImplementation(() => undefined);

    notificationStore = createTestNotificationStore();

    act(() => {
      const state = notificationStore.getState();
      state.clearAll();
      state.clearAllAdminNotifications();
      state.resetSettings();
      state.clearError();
      state.setAdding(false);
      state.setRemoving(false);
    });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();

    warnSpy.mockRestore();
    infoSpy.mockRestore();

    notificationStore?.destroy?.();
  });

  it('strips undefined fields when adding a notification', () => {
    act(() => {
      notificationStore.getState().addNotification({
        type: 'info',
        title: 'Welcome',
        message: 'Thanks for signing up!',
        duration: undefined,
        actions: undefined
      } as any);
    });

    const [notification] = notificationStore.getState().notifications;
    const storedNotification = expectDefined(notification, 'notification');

    expect(storedNotification.id).toMatch(/^notification_/);
    expect(typeof storedNotification.timestamp).toBe('string');
    expect(storedNotification.read).toBe(false);
    expect(storedNotification).not.toHaveProperty('actions');
    expect(storedNotification).not.toHaveProperty('duration');
  });

  it('resets settings back to defaults after overrides', () => {
    act(() => {
      notificationStore.getState().updateSettings({ enableSound: false, duration: 2500 });
    });

    expect(notificationStore.getState().settings.enableSound).toBe(false);
    expect(notificationStore.getState().settings.duration).toBe(2500);

    act(() => {
      notificationStore.getState().resetSettings();
    });

    const settings = notificationStore.getState().settings;
    expect(settings.enableSound).toBe(defaultNotificationSettings.enableSound);
    expect(settings.duration).toBe(defaultNotificationSettings.duration);
  });

  it('auto-dismisses notifications when enableAutoDismiss is true', () => {
    act(() => {
      notificationStore.getState().addNotification({
        type: 'info',
        title: 'Auto dismiss',
        message: 'This should disappear automatically.'
      });
    });

    expect(notificationStore.getState().notifications).toHaveLength(1);

    act(() => {
      jest.advanceTimersByTime(defaultNotificationSettings.duration);
    });

    expect(notificationStore.getState().notifications).toHaveLength(0);
  });

  it('does not auto-dismiss notifications when duration is zero', () => {
    act(() => {
      notificationStore.getState().addNotification({
        type: 'error',
        title: 'Persistent',
        message: 'Should remain until manually cleared.',
        duration: 0
      });
    });

    act(() => {
      jest.advanceTimersByTime(defaultNotificationSettings.duration * 2);
    });

    expect(notificationStore.getState().notifications).toHaveLength(1);
  });

  it('enforces maxNotifications when stacking is enabled', () => {
    act(() => {
      notificationStore.getState().updateSettings({ maxNotifications: 2 });
    });

    act(() => {
      notificationStore.getState().addNotification({
        type: 'info',
        title: 'First',
        message: 'First notification'
      });
      notificationStore.getState().addNotification({
        type: 'info',
        title: 'Second',
        message: 'Second notification'
      });
      notificationStore.getState().addNotification({
        type: 'info',
        title: 'Third',
        message: 'Third notification'
      });
    });

    const notifications = notificationStore.getState().notifications;
    expect(notifications).toHaveLength(2);
    expect(notifications[0]?.title).toBe('Third');
    expect(notifications[1]?.title).toBe('Second');
  });

  it('replaces notifications when stacking is disabled', () => {
    act(() => {
      notificationStore.getState().updateSettings({ enableStacking: false });
    });

    act(() => {
      notificationStore.getState().addNotification({
        type: 'info',
        title: 'Initial',
        message: 'Initial notification'
      });
      notificationStore.getState().addNotification({
        type: 'info',
        title: 'Replacement',
        message: 'Newest notification'
      });
    });

    const notifications = notificationStore.getState().notifications;
    expect(notifications).toHaveLength(1);
    expect(notifications[0]?.title).toBe('Replacement');
  });

  it('auto-dismisses admin notifications when eligible', () => {
    act(() => {
      notificationStore.getState().updateSettings({ maxNotifications: 3 });
      notificationStore.getState().addAdminNotification({
        type: 'success',
        title: 'Admin success',
        message: 'Transient admin message'
      });
    });

    expect(notificationStore.getState().adminNotifications).toHaveLength(1);

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(notificationStore.getState().adminNotifications).toHaveLength(0);
  });

  it('keeps admin error notifications when auto-dismiss is skipped', () => {
    act(() => {
      notificationStore.getState().addAdminNotification({
        type: 'error',
        title: 'Admin error',
        message: 'Needs user attention'
      });
    });

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(notificationStore.getState().adminNotifications).toHaveLength(1);
  });
});


