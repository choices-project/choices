/**
 * Admin Store Integration Tests
 * 
 * Integration tests for adminStore covering:
 * - User management integration (loadUsers, updateUserStatus, deleteUser)
 * - Settings management integration (loadSystemSettings, saveSystemSettings)
 * - Feature flags integration (enable/disable/toggle)
 * - Dashboard stats integration
 * - Reimport operations integration
 * - Notifications integration
 * 
 * Created: January 2025
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

import {
  adminStoreCreator,
  createInitialAdminState,
  useAdminStore,
} from '@/lib/stores/adminStore';
import type { AdminUser, SystemMetrics, AdminSystemSettings } from '@/features/admin/types';

jest.mock('@/lib/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.mock('@/utils/supabase/client', () => ({
  getSupabaseBrowserClient: jest.fn(),
}));

const mockSupabase = jest.requireMock('@/utils/supabase/client') as {
  getSupabaseBrowserClient: jest.Mock;
};

describe('Admin Store Integration Tests', () => {
  let store: ReturnType<typeof adminStoreCreator>;

  beforeEach(() => {
    jest.clearAllMocks();
    store = adminStoreCreator();
  });

  afterEach(() => {
    store.getState().resetAdminState();
  });

  describe('User Management Integration', () => {
    it('loads users from API and updates store state', async () => {
      const mockUsers: AdminUser[] = [
        {
          id: 'user-1',
          email: 'user1@example.com',
          role: 'user',
          status: 'active',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'user-2',
          email: 'user2@example.com',
          role: 'admin',
          status: 'active',
          createdAt: new Date().toISOString(),
        },
      ];

      const mockClient = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              order: jest.fn(() => ({
                range: jest.fn(() => ({
                  data: mockUsers,
                  error: null,
                })),
              })),
            })),
          })),
        })),
      };

      mockSupabase.getSupabaseBrowserClient.mockResolvedValue(mockClient);

      await store.getState().loadUsers();

      expect(store.getState().users).toEqual(mockUsers);
      expect(store.getState().loading).toBe(false);
    });

    it('handles user loading errors gracefully', async () => {
      const mockClient = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              order: jest.fn(() => ({
                range: jest.fn(() => ({
                  data: null,
                  error: { message: 'Database error' },
                })),
              })),
            })),
          })),
        })),
      };

      mockSupabase.getSupabaseBrowserClient.mockResolvedValue(mockClient);

      await store.getState().loadUsers();

      expect(store.getState().users).toEqual([]);
      expect(store.getState().error).toBeTruthy();
    });

    it('updates user status and refreshes user list', async () => {
      const mockUser: AdminUser = {
        id: 'user-1',
        email: 'user1@example.com',
        role: 'user',
        status: 'active',
        createdAt: new Date().toISOString(),
      };

      const updateMock = {
        data: { ...mockUser, status: 'suspended' },
        error: null,
      };

      const mockClient = {
        from: jest.fn(() => ({
          update: jest.fn(() => ({
            eq: jest.fn(() => updateMock),
          })),
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              order: jest.fn(() => ({
                range: jest.fn(() => ({
                  data: [updateMock.data],
                  error: null,
                })),
              })),
            })),
          })),
        })),
      };

      mockSupabase.getSupabaseBrowserClient.mockResolvedValue(mockClient);

      store.getState().setUsers([mockUser]);
      await store.getState().updateUserStatus('user-1', 'suspended');

      const updatedUser = store.getState().users.find((u) => u.id === 'user-1');
      expect(updatedUser?.status).toBe('suspended');
    });

    it('deletes user and removes from store', async () => {
      const mockUser: AdminUser = {
        id: 'user-1',
        email: 'user1@example.com',
        role: 'user',
        status: 'active',
        createdAt: new Date().toISOString(),
      };

      const mockClient = {
        from: jest.fn(() => ({
          delete: jest.fn(() => ({
            eq: jest.fn(() => ({
              data: null,
              error: null,
            })),
          })),
        })),
      };

      mockSupabase.getSupabaseBrowserClient.mockResolvedValue(mockClient);

      store.getState().setUsers([mockUser]);
      await store.getState().deleteUser('user-1');

      expect(store.getState().users.find((u) => u.id === 'user-1')).toBeUndefined();
    });
  });

  describe('Settings Management Integration', () => {
    it('loads system settings from API', async () => {
      const mockSettings: AdminSystemSettings = {
        siteName: 'Test Site',
        maintenanceMode: false,
        allowRegistrations: true,
        maxPollDuration: 30,
      };

      const mockClient = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => ({
              data: mockSettings,
              error: null,
            })),
          })),
        })),
      };

      mockSupabase.getSupabaseBrowserClient.mockResolvedValue(mockClient);

      await store.getState().loadSystemSettings();

      expect(store.getState().systemSettings).toEqual(mockSettings);
    });

    it('saves system settings to API', async () => {
      const mockSettings: AdminSystemSettings = {
        siteName: 'Updated Site',
        maintenanceMode: true,
        allowRegistrations: false,
        maxPollDuration: 60,
      };

      const mockClient = {
        from: jest.fn(() => ({
          upsert: jest.fn(() => ({
            data: mockSettings,
            error: null,
          })),
        })),
      };

      mockSupabase.getSupabaseBrowserClient.mockResolvedValue(mockClient);

      await store.getState().saveSystemSettings(mockSettings);

      expect(store.getState().systemSettings).toEqual(mockSettings);
    });

    it('updates individual system setting', async () => {
      const mockClient = {
        from: jest.fn(() => ({
          update: jest.fn(() => ({
            eq: jest.fn(() => ({
              data: { maintenanceMode: true },
              error: null,
            })),
          })),
        })),
      };

      mockSupabase.getSupabaseBrowserClient.mockResolvedValue(mockClient);

      await store.getState().updateSystemSetting('maintenanceMode', true);

      expect(store.getState().systemSettings?.maintenanceMode).toBe(true);
    });
  });

  describe('Feature Flags Integration', () => {
    it('enables feature flag via API integration', async () => {
      const result = store.getState().enableFeatureFlag('SOCIAL_SHARING');

      expect(result).toBe(true);
      expect(store.getState().featureFlags.SOCIAL_SHARING).toBe(true);
    });

    it('disables feature flag via API integration', async () => {
      store.getState().enableFeatureFlag('SOCIAL_SHARING');
      const result = store.getState().disableFeatureFlag('SOCIAL_SHARING');

      expect(result).toBe(true);
      expect(store.getState().featureFlags.SOCIAL_SHARING).toBe(false);
    });

    it('toggles feature flag via API integration', async () => {
      const initialValue = store.getState().featureFlags.SOCIAL_SHARING;
      const result = store.getState().toggleFeatureFlag('SOCIAL_SHARING');

      expect(result).toBe(true);
      expect(store.getState().featureFlags.SOCIAL_SHARING).toBe(!initialValue);
    });
  });

  describe('Dashboard Stats Integration', () => {
    it('loads dashboard stats from API', async () => {
      const mockStats = {
        totalUsers: 100,
        activeUsers: 80,
        totalPolls: 50,
        activePolls: 30,
      };

      const mockClient = {
        rpc: jest.fn(() => ({
          data: mockStats,
          error: null,
        })),
      };

      mockSupabase.getSupabaseBrowserClient.mockResolvedValue(mockClient);

      await store.getState().loadDashboardStats();

      expect(store.getState().dashboardStats).toEqual(mockStats);
    });
  });

  describe('Reimport Operations Integration', () => {
    it('starts reimport operation', async () => {
      store.getState().startReimport('polls');

      expect(store.getState().reimportProgress.isRunning).toBe(true);
      expect(store.getState().reimportProgress.type).toBe('polls');
    });

    it('updates reimport progress', async () => {
      store.getState().startReimport('polls');
      store.getState().setReimportProgress({
        current: 50,
        total: 100,
        status: 'processing',
      });

      expect(store.getState().reimportProgress.current).toBe(50);
      expect(store.getState().reimportProgress.total).toBe(100);
      expect(store.getState().reimportProgress.status).toBe('processing');
    });

    it('completes reimport operation', async () => {
      store.getState().startReimport('polls');
      store.getState().setReimportProgress({
        current: 100,
        total: 100,
        status: 'completed',
      });
      store.getState().setIsReimportRunning(false);

      expect(store.getState().reimportProgress.isRunning).toBe(false);
      expect(store.getState().reimportProgress.status).toBe('completed');
    });
  });

  describe('Notifications Integration', () => {
    it('adds notification and updates state', () => {
      const notification = {
        id: 'notif-1',
        title: 'Test Notification',
        message: 'Test message',
        type: 'info' as const,
        createdAt: new Date().toISOString(),
        read: false,
      };

      store.getState().addNotification(notification);

      expect(store.getState().notifications).toContainEqual(notification);
    });

    it('marks notification as read', () => {
      const notification = {
        id: 'notif-1',
        title: 'Test Notification',
        message: 'Test message',
        type: 'info' as const,
        createdAt: new Date().toISOString(),
        read: false,
      };

      store.getState().addNotification(notification);
      store.getState().markNotificationRead('notif-1');

      const updatedNotification = store.getState().notifications.find((n) => n.id === 'notif-1');
      expect(updatedNotification?.read).toBe(true);
    });
  });

  describe('Async Return Usage', () => {
    it('all async operations return promises', async () => {
      const mockClient = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              order: jest.fn(() => ({
                range: jest.fn(() => ({
                  data: [],
                  error: null,
                })),
              })),
            })),
          })),
        })),
      };

      mockSupabase.getSupabaseBrowserClient.mockResolvedValue(mockClient);

      const loadUsersPromise = store.getState().loadUsers();
      expect(loadUsersPromise).toBeInstanceOf(Promise);

      const loadSettingsPromise = store.getState().loadSystemSettings();
      expect(loadSettingsPromise).toBeInstanceOf(Promise);

      const loadStatsPromise = store.getState().loadDashboardStats();
      expect(loadStatsPromise).toBeInstanceOf(Promise);

      await Promise.all([loadUsersPromise, loadSettingsPromise, loadStatsPromise]);
    });
  });
});

