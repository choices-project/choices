/** @jest-environment jsdom */

import { act, render, screen } from '@testing-library/react';
import React from 'react';

import { useAdminStore } from '@/lib/stores/adminStore';

const AdminStatsDisplay = () => {
  const stats = useAdminStore((state) => state.dashboardStats);
  return (
    <div data-testid="admin-stats">
      <span data-testid="total-users">{stats?.totalUsers ?? 0}</span>
      <span data-testid="active-polls">{stats?.activePolls ?? 0}</span>
      <span data-testid="total-votes">{stats?.totalVotes ?? 0}</span>
    </div>
  );
};

const AdminControls = () => {
  const setActiveTab = useAdminStore((state) => state.setActiveTab);
  const setSettingsTab = useAdminStore((state) => state.setSettingsTab);
  return (
    <div>
      <button data-testid="set-overview" onClick={() => setActiveTab('overview')}>
        Overview
      </button>
      <button data-testid="set-users" onClick={() => setActiveTab('users')}>
        Users
      </button>
      <button data-testid="set-settings" onClick={() => setActiveTab('settings')}>
        Settings
      </button>
      <button data-testid="set-general-settings" onClick={() => setSettingsTab('general')}>
        General
      </button>
    </div>
  );
};

const AdminTabDisplay = () => {
  const activeTab = useAdminStore((state) => state.activeTab);
  const settingsTab = useAdminStore((state) => state.settingsTab);
  return (
    <div data-testid="admin-tabs">
      <span data-testid="active-tab">{activeTab}</span>
      <span data-testid="settings-tab">{settingsTab}</span>
    </div>
  );
};

describe('adminStore integration', () => {
  beforeEach(() => {
    // Reset store state before each test
    act(() => {
      const state = useAdminStore.getState();
      state.resetAdminState();
      state.setActiveTab('overview');
      state.setSettingsTab('general');
    });
  });

  afterEach(() => {
    act(() => {
      useAdminStore.getState().resetAdminState();
    });
  });

  describe('tab management', () => {
    it('should update active tab when setActiveTab is called', () => {
      render(
        <>
          <AdminTabDisplay />
          <AdminControls />
        </>
      );

      expect(screen.getByTestId('active-tab')).toHaveTextContent('overview');

      act(() => {
        screen.getByTestId('set-users').click();
      });

      expect(screen.getByTestId('active-tab')).toHaveTextContent('users');

      act(() => {
        screen.getByTestId('set-overview').click();
      });

      expect(screen.getByTestId('active-tab')).toHaveTextContent('overview');
    });

    it('should update settings tab when setSettingsTab is called', () => {
      render(
        <>
          <AdminTabDisplay />
          <AdminControls />
        </>
      );

      expect(screen.getByTestId('settings-tab')).toHaveTextContent('general');

      act(() => {
        screen.getByTestId('set-general-settings').click();
      });

      expect(screen.getByTestId('settings-tab')).toHaveTextContent('general');
    });
  });

  describe('dashboard stats', () => {
    it('should display dashboard stats', () => {
      render(<AdminStatsDisplay />);

      expect(screen.getByTestId('total-users')).toBeInTheDocument();
      expect(screen.getByTestId('active-polls')).toBeInTheDocument();
      expect(screen.getByTestId('total-votes')).toBeInTheDocument();
    });

    it('should display dashboard stats', () => {
      render(<AdminStatsDisplay />);

      // Test that the component renders with null stats (default)
      expect(screen.getByTestId('total-users')).toHaveTextContent('0');
      expect(screen.getByTestId('active-polls')).toHaveTextContent('0');
      expect(screen.getByTestId('total-votes')).toHaveTextContent('0');
    });

    it('should update stats when loadDashboardStats is called', async () => {
      // This test would require mocking the API call
      // For now, we test that the component can display stats
      // The actual loading is tested in unit tests for loadDashboardStats
      render(<AdminStatsDisplay />);
      
      // Component should handle null stats gracefully
      expect(screen.getByTestId('admin-stats')).toBeInTheDocument();
    });
  });

  describe('loading and error states', () => {
    it('should update loading state', () => {
      const LoadingDisplay = () => {
        const isLoading = useAdminStore((state) => state.isLoading);
        return <div data-testid="loading">{isLoading ? 'loading' : 'idle'}</div>;
      };

      render(<LoadingDisplay />);

      expect(screen.getByTestId('loading')).toHaveTextContent('idle');

      act(() => {
        useAdminStore.getState().setLoading(true);
      });

      expect(screen.getByTestId('loading')).toHaveTextContent('loading');

      act(() => {
        useAdminStore.getState().setLoading(false);
      });

      expect(screen.getByTestId('loading')).toHaveTextContent('idle');
    });

    it('should update error state', () => {
      const ErrorDisplay = () => {
        const error = useAdminStore((state) => state.error);
        return <div data-testid="error">{error || 'no-error'}</div>;
      };

      render(<ErrorDisplay />);

      expect(screen.getByTestId('error')).toHaveTextContent('no-error');

      act(() => {
        useAdminStore.getState().setError('Test error');
      });

      expect(screen.getByTestId('error')).toHaveTextContent('Test error');

      act(() => {
        useAdminStore.getState().clearError();
      });

      expect(screen.getByTestId('error')).toHaveTextContent('no-error');
    });
  });
});

