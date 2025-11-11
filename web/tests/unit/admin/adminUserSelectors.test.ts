/**
 * @jest-environment jsdom
 */
import { act, renderHook } from '@testing-library/react';

import type { AdminUser } from '@/features/admin/types';
import {
  useAdminActions,
  useAdminSelectedUsers,
  useAdminShowBulkActions,
  useAdminStore,
  useAdminUserFilters,
  useAdminUserCount,
  useFilteredAdminUsers,
} from '@/lib/stores';

const createAdminUser = (overrides: Partial<AdminUser> = {}): AdminUser => ({
  id: 'admin-user-1',
  email: 'alex@example.com',
  name: 'Alex Admin',
  role: 'admin',
  status: 'active',
  is_admin: true,
  created_at: new Date('2025-01-01T00:00:00Z').toISOString(),
  ...overrides,
});

const seedAdminUsers = (users: AdminUser[]) => {
  act(() => {
    useAdminStore.getState().resetAdminState();
    useAdminStore.setState((state) => {
      state.users = users;
    });
  });
};

describe('adminStore selectors', () => {
  beforeEach(() => {
    act(() => {
      useAdminStore.getState().resetAdminState();
    });
  });

  it('returns all users by default and filters by search term, role, and status', () => {
    const users: AdminUser[] = [
      createAdminUser({ id: 'admin-1', email: 'alex@example.com', name: 'Alex Admin', role: 'admin' }),
      createAdminUser({
        id: 'moderator-1',
        email: 'maya.moderator@example.com',
        name: 'Maya Moderator',
        role: 'moderator',
        status: 'inactive',
        is_admin: false,
      }),
      createAdminUser({
        id: 'support-1',
        email: 'sam.support@example.com',
        name: 'Sam Support',
        role: 'support',
        status: 'suspended',
        is_admin: false,
      }),
    ];

    seedAdminUsers(users);

    const { result: filtered } = renderHook(() => useFilteredAdminUsers());
    const { result: filters } = renderHook(() => useAdminUserFilters());

    expect(filters.current.searchTerm).toBe('');
    expect(filtered.current).toHaveLength(3);

    act(() => {
      useAdminStore.getState().setUserFilters({ searchTerm: 'maya' });
    });

    expect(filtered.current).toHaveLength(1);
    expect(filtered.current[0]?.id).toBe('moderator-1');

    act(() => {
      useAdminStore.getState().setUserFilters({ searchTerm: '', roleFilter: 'support' });
    });

    expect(filtered.current).toHaveLength(1);
    expect(filtered.current[0]?.id).toBe('support-1');

    act(() => {
      useAdminStore.getState().setUserFilters({ statusFilter: 'inactive' });
    });

    expect(filtered.current).toHaveLength(0);

    act(() => {
      useAdminStore.getState().setUserFilters({ roleFilter: 'moderator', statusFilter: 'inactive' });
    });

    expect(filtered.current).toHaveLength(1);
    expect(filtered.current[0]?.id).toBe('moderator-1');
  });

  it('tracks selected users and bulk action visibility', () => {
    const users: AdminUser[] = [
      createAdminUser({ id: 'admin-1', name: 'Alex Admin' }),
      createAdminUser({ id: 'admin-2', name: 'Casey Civic', email: 'casey@example.com', role: 'moderator' }),
      createAdminUser({ id: 'admin-3', name: 'Jordan Justice', email: 'jordan@example.com', role: 'support' }),
    ];

    seedAdminUsers(users);

    const { result: selected } = renderHook(() => useAdminSelectedUsers());
    const { result: showBulk } = renderHook(() => useAdminShowBulkActions());
    const { result: total } = renderHook(() => useAdminUserCount());
    const { result: adminActions } = renderHook(() => useAdminActions());

    expect(total.current).toBe(3);
    expect(selected.current).toEqual([]);
    expect(showBulk.current).toBe(false);

    act(() => {
      adminActions.current.selectUser('admin-1');
    });

    expect(selected.current).toEqual(['admin-1']);
    expect(showBulk.current).toBe(true);

    act(() => {
      adminActions.current.selectUser('admin-2');
    });

    expect(selected.current).toEqual(['admin-1', 'admin-2']);
    expect(showBulk.current).toBe(true);

    act(() => {
      adminActions.current.deselectUser('admin-1');
    });

    expect(selected.current).toEqual(['admin-2']);
    expect(showBulk.current).toBe(true);

    act(() => {
      adminActions.current.deselectAllUsers();
    });

    expect(selected.current).toEqual([]);
    expect(showBulk.current).toBe(false);

    act(() => {
      adminActions.current.selectAllUsers();
    });

    expect(selected.current).toEqual(['admin-1', 'admin-2', 'admin-3']);
    expect(showBulk.current).toBe(true);
  });
});

