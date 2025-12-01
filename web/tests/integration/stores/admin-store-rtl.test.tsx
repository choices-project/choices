/* eslint-disable @typescript-eslint/no-var-requires */
/**
 * Admin Store RTL (React Testing Library) Tests
 * 
 * RTL tests for admin pages using adminStore:
 * - UserManagement component integration
 * - SystemSettings component integration
 * - AdminDashboard integration
 * 
 * Created: January 2025
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';

import { useAdminStore, useAdminActions, useAdminUsers } from '@/lib/stores/adminStore';

// Mock admin components
jest.mock('@/features/admin/components/UserManagement', () => ({
  __esModule: true,
  default: function UserManagement() {
    const users = useAdminUsers();
    const { loadUsers, updateUserStatus, deleteUser } = useAdminActions();

    React.useEffect(() => {
      void loadUsers();
    }, [loadUsers]);

    return (
      <div data-testid="user-management">
        <h1>User Management</h1>
        <button
          data-testid="load-users"
          onClick={() => void loadUsers()}
        >
          Load Users
        </button>
        <div data-testid="users-count">
          {users.length} users
        </div>
        {users.map((user) => (
          <div key={user.id} data-testid={`user-${user.id}`}>
            <span>{user.email}</span>
            <button
              data-testid={`suspend-${user.id}`}
              onClick={() => void updateUserStatus(user.id, 'suspended')}
            >
              Suspend
            </button>
            <button
              data-testid={`delete-${user.id}`}
              onClick={() => void deleteUser(user.id)}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    );
  },
}));

jest.mock('@/features/admin/components/SystemSettings', () => ({
  __esModule: true,
  default: function SystemSettings() {
    const settings = useAdminStore((state) => state.systemSettings);
    const { loadSystemSettings, saveSystemSettings } = useAdminActions();

    React.useEffect(() => {
      void loadSystemSettings();
    }, [loadSystemSettings]);

    return (
      <div data-testid="system-settings">
        <h1>System Settings</h1>
        <button
          data-testid="load-settings"
          onClick={() => void loadSystemSettings()}
        >
          Load Settings
        </button>
        {settings && (
          <div data-testid="settings-content">
            <p data-testid="site-name">{settings.siteName}</p>
            <p data-testid="maintenance-mode">
              Maintenance: {settings.maintenanceMode ? 'On' : 'Off'}
            </p>
          </div>
        )}
      </div>
    );
  },
}));

jest.mock('@/utils/supabase/client', () => ({
  getSupabaseBrowserClient: jest.fn(),
}));

describe('Admin Store RTL Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAdminStore.getState().resetAdminState();
  });

  describe('UserManagement Integration', () => {
    it('renders user management component with adminStore', () => {
      const UserManagement = require('@/features/admin/components/UserManagement').default;
      render(<UserManagement />);

      expect(screen.getByTestId('user-management')).toBeInTheDocument();
      expect(screen.getByText('User Management')).toBeInTheDocument();
    });

    it('loads users on mount and displays count', async () => {
      const { getSupabaseBrowserClient } = require('@/utils/supabase/client');
      const mockUsers = [
        {
          id: 'user-1',
          email: 'user1@example.com',
          role: 'user',
          status: 'active',
          createdAt: new Date().toISOString(),
        },
      ];

      getSupabaseBrowserClient.mockResolvedValue({
        from: () => ({
          select: () => ({
            eq: () => ({
              order: () => ({
                range: () => ({
                  data: mockUsers,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      const UserManagement = require('@/features/admin/components/UserManagement').default;
      render(<UserManagement />);

      await waitFor(() => {
        expect(screen.getByTestId('users-count')).toHaveTextContent('1 users');
      });
    });

    it('handles user suspension', async () => {
      const { getSupabaseBrowserClient } = require('@/utils/supabase/client');
      const mockUser = {
        id: 'user-1',
        email: 'user1@example.com',
        role: 'user',
        status: 'active',
        createdAt: new Date().toISOString(),
      };

      getSupabaseBrowserClient.mockResolvedValue({
        from: () => ({
          select: () => ({
            eq: () => ({
              order: () => ({
                range: () => ({
                  data: [mockUser],
                  error: null,
                }),
              }),
            }),
          }),
          update: () => ({
            eq: () => ({
              data: { ...mockUser, status: 'suspended' },
              error: null,
            }),
          }),
        }),
      });

      useAdminStore.getState().setUsers([mockUser]);

      const UserManagement = require('@/features/admin/components/UserManagement').default;
      render(<UserManagement />);

      const suspendButton = await screen.findByTestId('suspend-user-1');
      fireEvent.click(suspendButton);

      await waitFor(() => {
        const user = useAdminStore.getState().users.find((u) => u.id === 'user-1');
        expect(user?.status).toBe('suspended');
      });
    });
  });

  describe('SystemSettings Integration', () => {
    it('renders system settings component with adminStore', () => {
      const SystemSettings = require('@/features/admin/components/SystemSettings').default;
      render(<SystemSettings />);

      expect(screen.getByTestId('system-settings')).toBeInTheDocument();
      expect(screen.getByText('System Settings')).toBeInTheDocument();
    });

    it('loads and displays system settings', async () => {
      const { getSupabaseBrowserClient } = require('@/utils/supabase/client');
      const mockSettings = {
        siteName: 'Test Site',
        maintenanceMode: false,
        allowRegistrations: true,
        maxPollDuration: 30,
      };

      getSupabaseBrowserClient.mockResolvedValue({
        from: () => ({
          select: () => ({
            single: () => ({
              data: mockSettings,
              error: null,
            }),
          }),
        }),
      });

      const SystemSettings = require('@/features/admin/components/SystemSettings').default;
      render(<SystemSettings />);

      await waitFor(() => {
        expect(screen.getByTestId('site-name')).toHaveTextContent('Test Site');
        expect(screen.getByTestId('maintenance-mode')).toHaveTextContent('Off');
      });
    });
  });
});

/* eslint-enable @typescript-eslint/no-var-requires */


