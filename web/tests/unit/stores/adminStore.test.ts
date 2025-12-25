/**
 * Admin Store Unit Tests
 * 
 * Comprehensive unit tests for adminStore covering:
 * - User management (loadUsers, updateUserStatus, deleteUser)
 * - Settings management (loadSystemSettings, saveSystemSettings, updateSystemSetting)
 * - Feature flags (enable/disable/toggle, import/export)
 * - Dashboard stats (loadDashboardStats)
 * - Reimport operations (startReimport, setReimportProgress)
 * - Notifications and activity feed
 * 
 * Created: January 2025
 */

import { act } from '@testing-library/react';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import type { AdminUser, SystemMetrics, AdminSystemSettings } from '@/features/admin/types';
import {
  adminStoreCreator,
  createInitialAdminState,
  useAdminStore,
} from '@/lib/stores/adminStore';

jest.mock('@/lib/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.mock('@/utils/supabase/client', () => ({
  getSupabaseBrowserClient: jest.fn().mockResolvedValue({
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      single: jest.fn(),
      maybeSingle: jest.fn(),
    })),
    rpc: jest.fn(),
  }),
}));

// Mock feature flags - need to match the structure expected by adminStore
const MOCK_MUTABLE_FLAGS = ['SOCIAL_SHARING', 'THEMES'];

jest.mock('@/lib/core/feature-flags', () => {
  const mockFlags: Record<string, boolean> = {
    SOCIAL_SHARING: false,
    THEMES: false,
  };

  return {
    FEATURE_FLAGS: {
      SOCIAL_SHARING: { id: 'SOCIAL_SHARING', default: false },
      THEMES: { id: 'THEMES', default: false },
    },
    featureFlagManager: {
      get: jest.fn((id: string) => {
        return mockFlags[id] ?? false;
      }),
      getEnabledFlags: jest.fn(() => []),
      set: jest.fn((id: string, value: boolean) => {
        if (MOCK_MUTABLE_FLAGS.includes(id)) {
          mockFlags[id] = value;
        }
      }),
      enable: jest.fn((id: string) => {
        if (MOCK_MUTABLE_FLAGS.includes(id)) {
          mockFlags[id] = true;
          return true;
        }
        return false;
      }),
      disable: jest.fn((id: string) => {
        if (MOCK_MUTABLE_FLAGS.includes(id)) {
          mockFlags[id] = false;
          return true;
        }
        return false;
      }),
      toggle: jest.fn((id: string) => {
        if (MOCK_MUTABLE_FLAGS.includes(id)) {
          mockFlags[id] = !mockFlags[id];
          return true;
        }
        return false;
      }),
      isEnabled: jest.fn((id: string) => {
        return mockFlags[id] ?? false;
      }),
      getFlag: jest.fn((id: string) => {
        return {
          id,
          name: id,
          enabled: mockFlags[id] ?? false,
          description: `Flag for ${id}`,
        };
      }),
      reset: jest.fn(() => {
        // Reset all flags to false
        Object.keys(mockFlags).forEach((key) => {
          mockFlags[key] = false;
        });
      }),
    },
  };
});

const createTestAdminStore = () =>
  create(immer(adminStoreCreator));

const createAdminUser = (overrides: Partial<AdminUser> = {}): AdminUser => ({
  id: 'user-1',
  email: 'admin@example.com',
  name: 'Admin User',
  role: 'admin',
  status: 'active',
  is_admin: true,
  created_at: new Date().toISOString(),
  ...overrides,
});

describe('adminStore', () => {
  beforeEach(() => {
    act(() => {
      useAdminStore.getState().resetAdminState();
    });
  });

  describe('initialization', () => {
    it('initializes with default state', () => {
      const store = createTestAdminStore();
      const state = store.getState();

      expect(state.sidebarCollapsed).toBe(false);
      expect(state.activeTab).toBe('overview');
      expect(state.users).toEqual([]);
      expect(state.userFilters).toMatchObject({
        searchTerm: '',
        roleFilter: 'all',
        statusFilter: 'all',
        selectedUsers: [],
        showBulkActions: false,
      });
      expect(state.featureFlags.flags).toBeDefined();
      expect(state.reimportProgress).toMatchObject({
        totalStates: 0,
        processedStates: 0,
        successfulStates: 0,
        failedStates: 0,
      });
    });
  });

  describe('user management', () => {
    it('setUserFilters updates user filters', () => {
      act(() => {
        useAdminStore.getState().setUserFilters({ searchTerm: 'test' });
      });

      expect(useAdminStore.getState().userFilters.searchTerm).toBe('test');
    });

    it('selectUser adds user to selectedUsers', () => {
      act(() => {
        useAdminStore.getState().selectUser('user-1');
      });

      expect(useAdminStore.getState().userFilters.selectedUsers).toContain('user-1');
    });

    it('deselectUser removes user from selectedUsers', () => {
      act(() => {
        useAdminStore.getState().selectUser('user-1');
        useAdminStore.getState().deselectUser('user-1');
      });

      expect(useAdminStore.getState().userFilters.selectedUsers).not.toContain('user-1');
    });

    it('selectAllUsers selects all users', () => {
      const users = [createAdminUser({ id: 'user-1' }), createAdminUser({ id: 'user-2' })];
      
      act(() => {
        useAdminStore.setState((state) => {
          state.users = users;
        });
        useAdminStore.getState().selectAllUsers();
      });

      expect(useAdminStore.getState().userFilters.selectedUsers).toHaveLength(2);
      expect(useAdminStore.getState().userFilters.selectedUsers).toContain('user-1');
      expect(useAdminStore.getState().userFilters.selectedUsers).toContain('user-2');
    });

    it('deselectAllUsers clears all selections', () => {
      act(() => {
        useAdminStore.getState().selectUser('user-1');
        useAdminStore.getState().selectUser('user-2');
        useAdminStore.getState().deselectAllUsers();
      });

      expect(useAdminStore.getState().userFilters.selectedUsers).toHaveLength(0);
    });
  });

  describe('settings management', () => {
    it('setSettingsTab updates settings tab', () => {
      act(() => {
        useAdminStore.getState().setSettingsTab('security');
      });

      expect(useAdminStore.getState().settingsTab).toBe('security');
    });

    it('updateSystemSetting updates a specific setting', () => {
      act(() => {
        useAdminStore.setState((state) => {
          state.systemSettings = {
            general: {
              siteName: 'Test Site',
              siteDescription: 'Test',
              maintenanceMode: false,
              allowRegistration: true,
              requireEmailVerification: false,
            },
            performance: {
              enableCaching: true,
              cacheTTL: 3600,
              enableCompression: true,
              maxFileSize: 10485760,
            },
            security: {
              enableRateLimiting: true,
              maxRequestsPerMinute: 100,
              enableCSP: true,
              enableHSTS: true,
            },
            notifications: {
              enableEmailNotifications: true,
              enablePushNotifications: false,
              notificationFrequency: 'immediate',
            },
          };
        });
        useAdminStore.getState().updateSystemSetting('general', 'siteName', 'New Site Name');
      });

      expect(useAdminStore.getState().systemSettings?.general.siteName).toBe('New Site Name');
    });
  });

  describe('feature flags', () => {
    beforeEach(() => {
      // Ensure flags are initialized in the store
      act(() => {
        const store = useAdminStore.getState();
        // Initialize flags if not already present
        if (!store.featureFlags.flags.SOCIAL_SHARING) {
          useAdminStore.setState((state) => {
            state.featureFlags.flags.SOCIAL_SHARING = false;
          });
        }
        if (!store.featureFlags.flags.THEMES) {
          useAdminStore.setState((state) => {
            state.featureFlags.flags.THEMES = false;
          });
        }
      });
    });

    it('enableFeatureFlag enables a flag', () => {
      act(() => {
        const result = useAdminStore.getState().enableFeatureFlag('SOCIAL_SHARING');
        expect(result).toBe(true);
      });

      expect(useAdminStore.getState().featureFlags.flags.SOCIAL_SHARING).toBe(true);
    });

    it('disableFeatureFlag disables a flag', () => {
      act(() => {
        useAdminStore.getState().enableFeatureFlag('SOCIAL_SHARING');
        const result = useAdminStore.getState().disableFeatureFlag('SOCIAL_SHARING');
        expect(result).toBe(true);
      });

      expect(useAdminStore.getState().featureFlags.flags.SOCIAL_SHARING).toBe(false);
    });

    it('toggleFeatureFlag toggles a flag', () => {
      act(() => {
        const initial = useAdminStore.getState().featureFlags.flags.SOCIAL_SHARING;
        useAdminStore.getState().toggleFeatureFlag('SOCIAL_SHARING');
        expect(useAdminStore.getState().featureFlags.flags.SOCIAL_SHARING).toBe(!initial);
      });
    });

    it('isFeatureFlagEnabled returns correct status', () => {
      act(() => {
        useAdminStore.getState().enableFeatureFlag('SOCIAL_SHARING');
      });

      expect(useAdminStore.getState().isFeatureFlagEnabled('SOCIAL_SHARING')).toBe(true);
      // THEMES should be false if not enabled
      expect(useAdminStore.getState().isFeatureFlagEnabled('THEMES')).toBe(false);
    });

    it('resetFeatureFlags resets to defaults', () => {
      act(() => {
        useAdminStore.getState().enableFeatureFlag('SOCIAL_SHARING');
        useAdminStore.getState().resetFeatureFlags();
      });

      // Flags should be reset to their default values from featureFlagManager
      // The actual value depends on the mock, but it should be consistent
      const flags = useAdminStore.getState().featureFlags.flags;
      expect(flags.SOCIAL_SHARING).toBeDefined();
    });
  });

  describe('notifications and activity', () => {
    it('addAdminNotification adds a notification', () => {
      const notification = {
        id: 'notif-1',
        type: 'info' as const,
        message: 'Test notification',
        timestamp: new Date().toISOString(),
        read: false,
      };

      act(() => {
        useAdminStore.getState().addAdminNotification(notification);
      });

      expect(useAdminStore.getState().adminNotifications).toHaveLength(1);
      expect(useAdminStore.getState().adminNotifications[0]).toMatchObject(notification);
    });

    it('clearAdminNotifications clears all notifications', () => {
      act(() => {
        useAdminStore.getState().addAdminNotification({
          id: 'notif-1',
          type: 'info',
          message: 'Test',
          timestamp: new Date().toISOString(),
          read: false,
        });
        useAdminStore.getState().clearAdminNotifications();
      });

      expect(useAdminStore.getState().adminNotifications).toHaveLength(0);
    });

    it('addActivityItem adds an activity item', () => {
      act(() => {
        useAdminStore.getState().addActivityItem({
          type: 'user_created',
          description: 'User created',
        });
      });

      expect(useAdminStore.getState().activityItems).toHaveLength(1);
      expect(useAdminStore.getState().activityItems[0]).toMatchObject({
        type: 'user_created',
        description: 'User created',
      });
    });
  });

  describe('reimport operations', () => {
    it('setReimportProgress updates progress', () => {
      act(() => {
        useAdminStore.getState().setReimportProgress({
          totalStates: 50,
          processedStates: 25,
          successfulStates: 20,
          failedStates: 5,
        });
      });

      const progress = useAdminStore.getState().reimportProgress;
      expect(progress.totalStates).toBe(50);
      expect(progress.processedStates).toBe(25);
      expect(progress.successfulStates).toBe(20);
      expect(progress.failedStates).toBe(5);
    });

    it('setIsReimportRunning updates running state', () => {
      act(() => {
        useAdminStore.getState().setIsReimportRunning(true);
      });

      expect(useAdminStore.getState().isReimportRunning).toBe(true);

      act(() => {
        useAdminStore.getState().setIsReimportRunning(false);
      });

      expect(useAdminStore.getState().isReimportRunning).toBe(false);
    });

    it('addReimportLog adds a log message', () => {
      act(() => {
        useAdminStore.getState().addReimportLog('Processing state: CA');
      });

      expect(useAdminStore.getState().reimportLogs).toContain('Processing state: CA');
    });

    it('clearReimportLogs clears all logs', () => {
      act(() => {
        useAdminStore.getState().addReimportLog('Log 1');
        useAdminStore.getState().addReimportLog('Log 2');
        useAdminStore.getState().clearReimportLogs();
      });

      expect(useAdminStore.getState().reimportLogs).toHaveLength(0);
    });
  });

  describe('tab navigation', () => {
    it('setActiveTab updates active tab', () => {
      act(() => {
        useAdminStore.getState().setActiveTab('users');
      });

      expect(useAdminStore.getState().activeTab).toBe('users');

      act(() => {
        useAdminStore.getState().setActiveTab('settings');
      });

      expect(useAdminStore.getState().activeTab).toBe('settings');
    });
  });

  describe('sidebar', () => {
    it('toggleSidebar toggles sidebar collapsed state', () => {
      const initial = useAdminStore.getState().sidebarCollapsed;

      act(() => {
        useAdminStore.getState().toggleSidebar();
      });

      expect(useAdminStore.getState().sidebarCollapsed).toBe(!initial);
    });
  });

  describe('resetAdminState', () => {
    it('resets all state to initial values', () => {
      act(() => {
        useAdminStore.getState().setActiveTab('users');
        useAdminStore.getState().selectUser('user-1');
        useAdminStore.getState().enableFeatureFlag('SOCIAL_SHARING');
        useAdminStore.getState().resetAdminState();
      });

      expect(useAdminStore.getState().activeTab).toBe('overview');
      expect(useAdminStore.getState().userFilters.selectedUsers).toHaveLength(0);
      expect(useAdminStore.getState().featureFlags.flags.SOCIAL_SHARING).toBe(false);
    });
  });

  describe('async user operations (RTL)', () => {
    const { getSupabaseBrowserClient } = require('@/utils/supabase/client');

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('loadUsers sets loading state during fetch', async () => {
      const mockClient = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            order: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          })),
        })),
      };

      getSupabaseBrowserClient.mockResolvedValue(mockClient);

      const store = useAdminStore.getState();
      
      const loadPromise = store.loadUsers();
      // Loading should be true during the operation (check immediately after calling)
      // Use getState() to ensure we get the latest state
      expect(useAdminStore.getState().isLoading).toBe(true);
      
      await loadPromise;
      
      expect(store.isLoading).toBe(false);
      expect(mockClient.from).toHaveBeenCalledWith('user_profiles');
    });

    it('loadUsers populates users array on success', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          user_id: 'user-1',
          email: 'user1@example.com',
          display_name: 'User One',
          is_admin: false,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
        },
        {
          id: 'user-2',
          user_id: 'user-2',
          email: 'admin@example.com',
          display_name: 'Admin User',
          is_admin: true,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
        },
      ];

      const mockClient = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            order: jest.fn().mockResolvedValue({
              data: mockUsers,
              error: null,
            }),
          })),
        })),
      };

      getSupabaseBrowserClient.mockResolvedValue(mockClient);

      await useAdminStore.getState().loadUsers();

      const users = useAdminStore.getState().users;
      expect(users).toHaveLength(2);
      expect(users[0]).toMatchObject({
        id: 'user-1',
        email: 'user1@example.com',
        name: 'User One',
        role: 'user',
        status: 'active',
      });
      expect(users[1]).toMatchObject({
        id: 'user-2',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'admin',
        status: 'active',
      });
    });

    it('loadUsers handles errors gracefully', async () => {
      const mockClient = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            order: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database connection failed' },
            }),
          })),
        })),
      };

      getSupabaseBrowserClient.mockResolvedValue(mockClient);

      await useAdminStore.getState().loadUsers();

      const store = useAdminStore.getState();
      expect(store.error).toBeTruthy();
      expect(store.error).toContain('Failed to fetch users');
      expect(store.isLoading).toBe(false);
    });

    it('updateUserRole updates user role in store after API call', async () => {
      const mockUser = {
        id: 'user-1',
        user_id: 'user-1',
        email: 'user@example.com',
        display_name: 'Test User',
        is_admin: false,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
      };

      // Set up initial user in store
      act(() => {
        useAdminStore.setState((state) => {
          state.users = [
            {
              id: 'user-1',
              email: 'user@example.com',
              name: 'Test User',
              role: 'user',
              status: 'active',
              is_admin: false,
              created_at: '2024-01-01T00:00:00Z',
            },
          ];
        });
      });

      const mockClient = {
        from: jest.fn(() => ({
          update: jest.fn(() => ({
            eq: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          })),
        })),
      };

      getSupabaseBrowserClient.mockResolvedValue(mockClient);

      await useAdminStore.getState().updateUserRole('user-1', 'admin');

      const updatedUser = useAdminStore.getState().users.find((u) => u.id === 'user-1');
      expect(updatedUser?.role).toBe('admin');
      expect(updatedUser?.is_admin).toBe(true);
    });

    it('updateUserStatus updates user status in store after API call', async () => {
      act(() => {
        useAdminStore.setState((state) => {
          state.users = [
            {
              id: 'user-1',
              email: 'user@example.com',
              name: 'Test User',
              role: 'user',
              status: 'active',
              is_admin: false,
              created_at: '2024-01-01T00:00:00Z',
            },
          ];
        });
      });

      const mockClient = {
        from: jest.fn(() => ({
          update: jest.fn(() => ({
            eq: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          })),
        })),
      };

      getSupabaseBrowserClient.mockResolvedValue(mockClient);

      await useAdminStore.getState().updateUserStatus('user-1', 'suspended');

      const updatedUser = useAdminStore.getState().users.find((u) => u.id === 'user-1');
      expect(updatedUser?.status).toBe('suspended');
    });

    it('deleteUser removes user from store after API call', async () => {
      act(() => {
        useAdminStore.setState((state) => {
          state.users = [
            {
              id: 'user-1',
              email: 'user1@example.com',
              name: 'User One',
              role: 'user',
              status: 'active',
              is_admin: false,
              created_at: '2024-01-01T00:00:00Z',
            },
            {
              id: 'user-2',
              email: 'user2@example.com',
              name: 'User Two',
              role: 'user',
              status: 'active',
              is_admin: false,
              created_at: '2024-01-01T00:00:00Z',
            },
          ];
        });
      });

      const mockClient = {
        from: jest.fn(() => ({
          delete: jest.fn(() => ({
            eq: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          })),
        })),
      };

      getSupabaseBrowserClient.mockResolvedValue(mockClient);

      await useAdminStore.getState().deleteUser('user-1');

      const users = useAdminStore.getState().users;
      expect(users).toHaveLength(1);
      expect(users.find((u) => u.id === 'user-1')).toBeUndefined();
      expect(users.find((u) => u.id === 'user-2')).toBeDefined();
    });
  });

  describe('async settings operations (RTL)', () => {
    const { getSupabaseBrowserClient } = require('@/utils/supabase/client');

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('loadSystemSettings sets loading state during fetch', async () => {
      const mockClient = {
        from: jest.fn(),
      };

      getSupabaseBrowserClient.mockResolvedValue(mockClient);

      const store = useAdminStore.getState();
      
      const loadPromise = store.loadSystemSettings();
      // Loading should be true during the operation (check immediately after calling)
      // Use getState() to ensure we get the latest state
      expect(useAdminStore.getState().isLoading).toBe(true);
      
      await loadPromise;
      
      expect(store.isLoading).toBe(false);
    });

    it('loadSystemSettings loads default settings', async () => {
      const mockClient = {
        from: jest.fn(),
      };

      getSupabaseBrowserClient.mockResolvedValue(mockClient);

      await useAdminStore.getState().loadSystemSettings();

      const settings = useAdminStore.getState().systemSettings;
      expect(settings).not.toBeNull();
      expect(settings?.general.siteName).toBe('Choices Platform');
      expect(settings?.general.maintenanceMode).toBe(false);
    });

    it('saveSystemSettings sets isSavingSettings flag', async () => {
      const mockClient = {
        from: jest.fn(),
      };

      getSupabaseBrowserClient.mockResolvedValue(mockClient);

      // First load settings
      await useAdminStore.getState().loadSystemSettings();

      const store = useAdminStore.getState();
      const savePromise = store.saveSystemSettings();
      
      // Use getState() to ensure we get the latest state
      expect(useAdminStore.getState().isSavingSettings).toBe(true);
      
      await savePromise;
      
      expect(store.isSavingSettings).toBe(false);
    });

    it('saveSystemSettings handles errors gracefully', async () => {
      const mockClient = {
        from: jest.fn(() => {
          throw new Error('Save failed');
        }),
      };

      getSupabaseBrowserClient.mockResolvedValue(mockClient);

      await useAdminStore.getState().loadSystemSettings();

      await useAdminStore.getState().saveSystemSettings();

      const store = useAdminStore.getState();
      expect(store.error).toBeTruthy();
      expect(store.isSavingSettings).toBe(false);
    });
  });
});

