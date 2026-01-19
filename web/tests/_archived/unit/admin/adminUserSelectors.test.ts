/**
 * @jest-environment jsdom
 */
import { act } from '@testing-library/react';

import type { AdminUser } from '@/features/admin/types';
import {
  selectFilteredAdminUsers,
  useAdminStore,
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
        role: 'user',
        status: 'suspended',
        is_admin: false,
      }),
    ];

    seedAdminUsers(users);

    const initialState = useAdminStore.getState();

    expect(initialState.userFilters.searchTerm).toBe('');
    expect(selectFilteredAdminUsers(initialState)).toHaveLength(3);

    act(() => {
      useAdminStore.getState().setUserFilters({ searchTerm: 'maya' });
    });

    let currentState = useAdminStore.getState();
    let filteredUsers = selectFilteredAdminUsers(currentState);

    expect(filteredUsers).toHaveLength(1);
    expect(filteredUsers[0]?.id).toBe('moderator-1');

    act(() => {
      useAdminStore.getState().setUserFilters({ searchTerm: '', roleFilter: 'user' });
    });

    currentState = useAdminStore.getState();
    filteredUsers = selectFilteredAdminUsers(currentState);

    expect(filteredUsers).toHaveLength(1);
    expect(filteredUsers[0]?.id).toBe('support-1');

    act(() => {
      useAdminStore.getState().setUserFilters({ statusFilter: 'inactive' });
    });

    currentState = useAdminStore.getState();
    filteredUsers = selectFilteredAdminUsers(currentState);

    expect(filteredUsers).toHaveLength(0);

    act(() => {
      useAdminStore.getState().setUserFilters({ roleFilter: 'moderator', statusFilter: 'inactive' });
    });

    currentState = useAdminStore.getState();
    filteredUsers = selectFilteredAdminUsers(currentState);

    expect(filteredUsers).toHaveLength(1);
    expect(filteredUsers[0]?.id).toBe('moderator-1');
  });

  it('tracks selected users and bulk action visibility', () => {
    const users: AdminUser[] = [
      createAdminUser({ id: 'admin-1', name: 'Alex Admin' }),
      createAdminUser({ id: 'admin-2', name: 'Casey Civic', email: 'casey@example.com', role: 'moderator' }),
      createAdminUser({ id: 'admin-3', name: 'Jordan Justice', email: 'jordan@example.com', role: 'support' }),
    ];

    seedAdminUsers(users);

    let state = useAdminStore.getState();

    expect(state.users.length).toBe(3);
    expect(state.userFilters.selectedUsers).toEqual([]);
    expect(state.userFilters.showBulkActions).toBe(false);

    act(() => {
      useAdminStore.getState().selectUser('admin-1');
    });

    state = useAdminStore.getState();
    expect(state.userFilters.selectedUsers).toEqual(['admin-1']);
    expect(state.userFilters.showBulkActions).toBe(true);

    act(() => {
      useAdminStore.getState().selectUser('admin-2');
    });

    state = useAdminStore.getState();
    expect(state.userFilters.selectedUsers).toEqual(['admin-1', 'admin-2']);
    expect(state.userFilters.showBulkActions).toBe(true);

    act(() => {
      useAdminStore.getState().deselectUser('admin-1');
    });

    state = useAdminStore.getState();
    expect(state.userFilters.selectedUsers).toEqual(['admin-2']);
    expect(state.userFilters.showBulkActions).toBe(true);

    act(() => {
      useAdminStore.getState().deselectAllUsers();
    });

    state = useAdminStore.getState();
    expect(state.userFilters.selectedUsers).toEqual([]);
    expect(state.userFilters.showBulkActions).toBe(false);

    act(() => {
      useAdminStore.getState().selectAllUsers();
    });

    state = useAdminStore.getState();
    expect(state.userFilters.selectedUsers).toEqual(['admin-1', 'admin-2', 'admin-3']);
    expect(state.userFilters.showBulkActions).toBe(true);
  });
});

