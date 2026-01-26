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

jest.mock('@/lib/utils/logger', () => {
  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
  };
  return {
    __esModule: true,
    default: mockLogger,
    logger: mockLogger,
  };
});

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
    const originalFetch = global.fetch;
    afterEach(() => {
      global.fetch = originalFetch;
    });

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

      (global.fetch as any) = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: mockUsers.map((u) => ({
            user_id: u.id,
            id: u.id,
            email: u.email,
            username: u.name,
            is_admin: u.is_admin,
            is_active: true,
            created_at: u.created_at,
          })),
          metadata: { pagination: { total: 2, limit: 50, offset: 0 } },
        }),
      });

      await store.getState().loadUsers();

      expect(store.getState().users).toHaveLength(2);
      expect(store.getState().users[0]?.email).toBe('user1@example.com');
      expect(store.getState().users[1]?.email).toBe('user2@example.com');
      expect(store.getState().isLoading).toBe(false);
    });

    it('handles user loading errors gracefully', async () => {
      (global.fetch as any) = jest.fn().mockResolvedValue({
        ok: false,
        statusText: 'Internal Server Error',
        json: async () => ({ error: 'Database error' }),
      });

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
      const mockClient = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => ({ data: {}, error: null })),
          })),
        })),
      };

      mockSupabase.getSupabaseBrowserClient.mockResolvedValue(mockClient);

      await store.getState().loadSystemSettings();

      const systemSettings = store.getState().systemSettings;
      expect(systemSettings).toBeDefined();
      expect(systemSettings?.general).toBeDefined();
      expect(systemSettings?.general.siteName).toBeDefined();
      expect(systemSettings?.performance).toBeDefined();
      expect(systemSettings?.security).toBeDefined();
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
      const countResponse = { count: 10, data: null, error: null };
      const chainWithEq = {
        select: jest.fn(() => ({
          eq: jest.fn(() => countResponse),
        })),
      };
      const chainNoEq = {
        select: jest.fn(() => countResponse),
      };
      const analyticsChain = {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            gte: jest.fn(() => ({
              order: jest.fn(() => ({ limit: jest.fn(() => ({ data: [], error: null })) })),
            })),
          })),
        })),
      };
      const mockClient = {
        from: jest.fn((table: string) => {
          if (table === 'analytics_events') return analyticsChain;
          if (table === 'polls') return chainWithEq;
          return chainNoEq;
        }),
      };

      mockSupabase.getSupabaseBrowserClient.mockResolvedValue(mockClient);

      await store.getState().loadDashboardStats();

      const stats = store.getState().dashboardStats;
      expect(stats).toBeDefined();
      expect(typeof stats?.totalUsers).toBe('number');
      expect(stats?.totalUsers).toBe(10);
      expect(typeof stats?.activePolls).toBe('number');
      expect(stats?.activePolls).toBe(10);
      expect(typeof stats?.totalVotes).toBe('number');
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
        title: 'Test Notification',
        message: 'Test message',
        type: 'info' as const,
      };

      store.getState().addNotification(notification);

      const notifications = store.getState().notifications;
      expect(notifications.length).toBeGreaterThan(0);
      const added = notifications.find((n) => n.title === 'Test Notification' && n.message === 'Test message');
      expect(added).toBeDefined();
      expect(added?.type).toBe('info');
    });

    it('marks notification as read', () => {
      store.getState().addNotification({
        title: 'Test Notification',
        message: 'Test message',
        type: 'info',
      });

      const notifications = store.getState().notifications;
      const added = notifications.find((n) => n.title === 'Test Notification');
      expect(added).toBeDefined();
      const id = added!.id;

      store.getState().markNotificationRead(id);

      const updated = store.getState().notifications.find((n) => n.id === id);
      expect(updated?.read).toBe(true);
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

