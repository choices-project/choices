/**
 * Admin Store RTL (React Testing Library) Tests
 *
 * RTL tests for admin store hooks and actions:
 * - useAdminActions, useAdminUserActions, useAdminSystemSettingsActions
 * - useAdminUsers, useAdminSystemSettings, useAdminDashboardStats
 *
 * Created: January 2025
 */

import '@testing-library/jest-dom';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { act, renderHook } from '@testing-library/react';

import {
  useAdminStore,
  useAdminUsers,
  useAdminUserActions,
  useAdminActions,
  useAdminSystemSettings,
  useAdminSystemSettingsActions,
  useAdminDashboardActions,
  useAdminDashboardStats,
} from '@/lib/stores/adminStore';

jest.mock('@/lib/utils/logger', () => {
  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
  };
  return { __esModule: true, default: mockLogger, logger: mockLogger };
});

jest.mock('@/utils/supabase/client', () => ({
  getSupabaseBrowserClient: jest.fn(),
}));

describe('Admin Store RTL Tests', () => {
  beforeEach(() => {
    useAdminStore.getState().resetAdminState();
  });

  describe('Admin store hooks', () => {
    it('useAdminActions exposes actions', () => {
      const { result } = renderHook(() => useAdminActions());
      expect(result.current.loadUsers).toBeDefined();
      expect(typeof result.current.loadUsers).toBe('function');
      expect(result.current.loadDashboardStats).toBeDefined();
      expect(result.current.resetAdminState).toBeDefined();
    });

    it('useAdminUserActions exposes user actions', () => {
      const { result } = renderHook(() => useAdminUserActions());
      expect(result.current.setUserFilters).toBeDefined();
      expect(result.current.selectUser).toBeDefined();
      expect(typeof result.current.updateUserRole).toBe('function');
    });

    it('useAdminSystemSettingsActions exposes settings actions', () => {
      const { result } = renderHook(() => useAdminSystemSettingsActions());
      expect(result.current.loadSystemSettings).toBeDefined();
      expect(result.current.saveSystemSettings).toBeDefined();
      expect(typeof result.current.updateSystemSetting).toBe('function');
    });

    it('useAdminDashboardActions exposes dashboard actions', () => {
      const { result } = renderHook(() => useAdminDashboardActions());
      expect(result.current.setActiveTab).toBeDefined();
      expect(result.current.loadDashboardStats).toBeDefined();
    });
  });

  describe('Admin store selectors', () => {
    it('useAdminUsers returns users array', () => {
      const { result } = renderHook(() => useAdminUsers());
      expect(Array.isArray(result.current)).toBe(true);
      expect(result.current).toHaveLength(0);
    });

    it('useAdminSystemSettings returns null initially', () => {
      const { result } = renderHook(() => useAdminSystemSettings());
      expect(result.current).toBeNull();
    });

    it('useAdminDashboardStats returns null initially', () => {
      const { result } = renderHook(() => useAdminDashboardStats());
      expect(result.current).toBeNull();
    });
  });

  describe('Admin store state updates', () => {
    it('setActiveTab updates active tab', () => {
      const { result: actionsResult } = renderHook(() => useAdminDashboardActions());
      const { result: tabResult } = renderHook(() => useAdminStore((s) => s.activeTab));

      expect(tabResult.current).toBe('overview');

      act(() => {
        actionsResult.current.setActiveTab('users');
      });

      expect(tabResult.current).toBe('users');
    });
  });
});
