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
  useAdminStore,
  type AdminSystemSettings,
} from '@/lib/stores/adminStore';
import type { AdminUser } from '@/features/admin/types';

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
  getSupabaseBrowserClient: jest.MockedFunction<(...args: any[]) => Promise<any>>;
};

const createSystemSettings = (
  overrides: Partial<AdminSystemSettings> = {},
): AdminSystemSettings => ({
  general: {
    siteName: 'Test Site',
    siteDescription: 'Admin test settings',
    maintenanceMode: false,
    allowRegistration: true,
    requireEmailVerification: false,
  },
  performance: {
    enableCaching: true,
    cacheTTL: 300,
    enableCompression: true,
    maxFileSize: 5,
  },
  security: {
    enableRateLimiting: true,
    maxRequestsPerMinute: 60,
    enableCSP: true,
    enableHSTS: true,
  },
  notifications: {
    enableEmailNotifications: true,
    enablePushNotifications: true,
    notificationFrequency: 'daily',
  },
  ...overrides,
});

describe('Admin Store Integration Tests', () => {
  const store = useAdminStore;

  beforeEach(() => {
    jest.clearAllMocks();
    store.getState().resetAdminState();
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
          name: 'User One',
          role: 'user',
          status: 'active',
          is_admin: false,
          created_at: new Date().toISOString(),
        },
        {
          id: 'user-2',
          email: 'user2@example.com',
          name: 'User Two',
          role: 'admin',
          status: 'active',
          is_admin: true,
          created_at: new Date().toISOString(),
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
      expect(store.getState().isLoading).toBe(false);
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
        name: 'User One',
        role: 'user',
        status: 'active',
        is_admin: false,
        created_at: new Date().toISOString(),
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

      store.setState({ users: [mockUser] });
      await store.getState().updateUserStatus('user-1', 'suspended');

      const updatedUser = store.getState().users.find((u) => u.id === 'user-1');
      expect(updatedUser?.status).toBe('suspended');
    });

    it('deletes user and removes from store', async () => {
      const mockUser: AdminUser = {
        id: 'user-1',
        email: 'user1@example.com',
        name: 'User One',
        role: 'user',
        status: 'active',
        is_admin: false,
        created_at: new Date().toISOString(),
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

      store.setState({ users: [mockUser] });
      await store.getState().deleteUser('user-1');

      expect(store.getState().users.find((u) => u.id === 'user-1')).toBeUndefined();
    });
  });

  describe('Settings Management Integration', () => {
    it('loads system settings from API', async () => {
      const mockSettings = createSystemSettings();

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
      const mockSettings = createSystemSettings({
        general: {
          siteName: 'Updated Site',
          siteDescription: 'Updated description',
          maintenanceMode: true,
          allowRegistration: false,
          requireEmailVerification: true,
        },
      });

      const mockClient = {
        from: jest.fn(() => ({
          upsert: jest.fn(() => ({
            data: mockSettings,
            error: null,
          })),
        })),
      };

      mockSupabase.getSupabaseBrowserClient.mockResolvedValue(mockClient);

      store.getState().setSystemSettings(mockSettings);
      await store.getState().saveSystemSettings();

      expect(store.getState().systemSettings).toEqual(mockSettings);
    });

    it('updates individual system setting', async () => {
      store.getState().setSystemSettings(createSystemSettings());

      store.getState().updateSystemSetting('general', 'maintenanceMode', true);

      expect(store.getState().systemSettings?.general.maintenanceMode).toBe(true);
    });
  });

  describe('Feature Flags Integration', () => {
    it('enables feature flag via API integration', async () => {
      const result = store.getState().enableFeatureFlag('SOCIAL_SHARING');

      expect(result).toBe(true);
      expect(store.getState().featureFlags.flags.SOCIAL_SHARING).toBe(true);
    });

    it('disables feature flag via API integration', async () => {
      store.getState().enableFeatureFlag('SOCIAL_SHARING');
      const result = store.getState().disableFeatureFlag('SOCIAL_SHARING');

      expect(result).toBe(true);
      expect(store.getState().featureFlags.flags.SOCIAL_SHARING).toBe(false);
    });

    it('toggles feature flag via API integration', async () => {
      const initialValue = store.getState().featureFlags.flags.SOCIAL_SHARING;
      const result = store.getState().toggleFeatureFlag('SOCIAL_SHARING');

      expect(result).toBe(true);
      expect(store.getState().featureFlags.flags.SOCIAL_SHARING).toBe(!initialValue);
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
      const startPromise = store.getState().startReimport();

      expect(store.getState().isReimportRunning).toBe(true);
      await startPromise;
      expect(store.getState().isReimportRunning).toBe(false);
    });

    it('updates reimport progress', async () => {
      await store.getState().startReimport();
      store.getState().setReimportProgress({
        processedStates: 5,
        totalStates: 10,
        successfulStates: 4,
        failedStates: 1,
      });

      expect(store.getState().reimportProgress.processedStates).toBe(5);
      expect(store.getState().reimportProgress.totalStates).toBe(10);
      expect(store.getState().reimportProgress.failedStates).toBe(1);
    });

    it('completes reimport operation', async () => {
      await store.getState().startReimport();
      store.getState().setReimportProgress({
        processedStates: 10,
        totalStates: 10,
        successfulStates: 10,
      });
      store.getState().setIsReimportRunning(false);

      expect(store.getState().isReimportRunning).toBe(false);
      expect(store.getState().reimportProgress.totalStates).toBe(10);
    });
  });

  describe('Notifications Integration', () => {
    it('adds notification and updates state', () => {
      const notification = {
        id: 'notif-1',
        title: 'Test Notification',
        message: 'Test message',
        type: 'info' as const,
        created_at: new Date().toISOString(),
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
        created_at: new Date().toISOString(),
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

