/**
 * Lazy-loaded User Management Component
 *
 * This component provides comprehensive user management functionality.
 * It's loaded only when needed to reduce initial bundle size.
 */

import React, { useEffect, useRef } from 'react';

import type { AdminUser } from '@/features/admin/types';

import { performanceMetrics } from '@/lib/performance/performance-metrics';
import {
  useAdminUserFilters,
  useAdminUserActions,
  useAdminLoading,
  useAdminError,
  useAdminActions,
  useFilteredAdminUsers,
  useAdminSelectedUsers,
  useAdminShowBulkActions,
  useAdminUserCount,
} from '@/lib/stores';
import logger from '@/lib/utils/logger';

type UserManagementProps = {
  onUserUpdate?: (user: AdminUser) => void;
  onUserDelete?: (userId: string) => void;
}

export default function UserManagement({ onUserUpdate, onUserDelete }: UserManagementProps) {
  // Get state from adminStore
  const { searchTerm, roleFilter, statusFilter } = useAdminUserFilters();
  const filteredUsers = useFilteredAdminUsers();
  const selectedUsers = useAdminSelectedUsers();
  const showBulkActions = useAdminShowBulkActions();
  const totalUsers = useAdminUserCount();
  const loading = useAdminLoading();
  const error = useAdminError();

  // Get actions from adminStore
  const {
    setUserFilters,
    updateUserRole,
    updateUserStatus,
    deleteUser,
    selectUser,
    deselectUser,
    selectAllUsers,
    deselectAllUsers,
  } = useAdminUserActions();

  const { loadUsers, setError } = useAdminActions();
  const loadUsersRef = useRef(loadUsers);
  const setErrorRef = useRef(setError);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    loadUsersRef.current = loadUsers;
    setErrorRef.current = setError;
  }, [loadUsers, setError]);

  useEffect(() => {
    if (hasLoadedRef.current) {
      return;
    }
    hasLoadedRef.current = true;
    const startTime = performance.now();

    const loadUsersData = async () => {
      try {
        await loadUsersRef.current();

        const loadTime = performance.now() - startTime;
        performanceMetrics.addMetric('user-management-load', loadTime);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load users';
        setErrorRef.current(errorMessage);
        performanceMetrics.addMetric('user-management-error', 1);
        logger.error('User management load error:', err);
      }
    };

    loadUsersData();
  }, []);

  const handleUserSelect = (userId: string) => {
    const alreadySelected = selectedUsers.includes(userId);
    if (alreadySelected) {
      deselectUser(userId);
    } else {
      selectUser(userId);
    }
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      deselectAllUsers();
    } else {
      const allUserIds = filteredUsers.map((user: AdminUser) => user.id);
      if (allUserIds.length === totalUsers) {
        selectAllUsers();
      } else {
        setUserFilters({ selectedUsers: allUserIds, showBulkActions: allUserIds.length > 0 });
      }
    }
  };

  const handleBulkAction = (action: 'activate' | 'deactivate' | 'suspend' | 'delete') => {
    const selectedUserIds = [...selectedUsers];

    switch (action) {
      case 'activate':
        selectedUserIds.forEach(userId => updateUserStatus(userId, 'active'));
        break;
      case 'deactivate':
        selectedUserIds.forEach(userId => updateUserStatus(userId, 'inactive'));
        break;
      case 'suspend':
        selectedUserIds.forEach(userId => updateUserStatus(userId, 'suspended'));
        break;
      case 'delete':
        selectedUserIds.forEach((id: any) => {
          deleteUser(id as string);
          onUserDelete?.(id as string);
        });
        break;
    }

    deselectAllUsers();
    performanceMetrics.addMetric('user-bulk-action', 1);
  };

  const handleUserRoleChange = (userId: string, newRole: AdminUser['role']) => {
    const existingUser = filteredUsers.find((user: AdminUser) => user.id === userId);
    updateUserRole(userId, newRole);
    if (existingUser) {
      onUserUpdate?.({ ...existingUser, role: newRole });
    }
    performanceMetrics.addMetric('user-role-change', 1);
  };

  const getStatusColor = (status: AdminUser['status']) => {
    switch (status) {
      case 'active': return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30';
      case 'inactive': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30';
      case 'suspended': return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700';
    }
  };

  const getRoleColor = (role: AdminUser['role']) => {
    switch (role) {
      case 'admin': return 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30';
      case 'moderator': return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30';
      case 'user': return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6" data-testid="user-management-loading">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6" />
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/6" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/6" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/6" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <div className="flex items-center">
          <svg className="w-6 h-6 text-red-600 dark:text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="text-lg font-medium text-red-800 dark:text-red-300">Error Loading Users</h3>
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="user-management">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100" data-testid="user-management-title">User Management</h2>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {filteredUsers.length} of {totalUsers} users
          </span>
          <button className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
            Add User
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Search</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setUserFilters({ searchTerm: e.target.value })}
              placeholder="Search by email..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Role</label>
            <select
              value={roleFilter}
              onChange={(e) => setUserFilters({ roleFilter: e.target.value as typeof roleFilter })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="moderator">Moderator</option>
              <option value="user">User</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setUserFilters({ statusFilter: e.target.value as typeof statusFilter })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setUserFilters({ searchTerm: '', roleFilter: 'all', statusFilter: 'all' });
              }}
              className="w-full px-4 py-2 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {showBulkActions && (
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
              {selectedUsers.length} user(s) selected
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => handleBulkAction('activate')}
                className="px-3 py-1 text-sm bg-green-600 dark:bg-green-700 text-white rounded hover:bg-green-700 dark:hover:bg-green-600"
              >
                Activate
              </button>
              <button
                onClick={() => handleBulkAction('deactivate')}
                className="px-3 py-1 text-sm bg-yellow-600 dark:bg-yellow-700 text-white rounded hover:bg-yellow-700 dark:hover:bg-yellow-600"
              >
                Deactivate
              </button>
              <button
                onClick={() => handleBulkAction('suspend')}
                className="px-3 py-1 text-sm bg-red-600 dark:bg-red-700 text-white rounded hover:bg-red-700 dark:hover:bg-red-600"
              >
                Suspend
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="px-3 py-1 text-sm bg-red-800 dark:bg-red-900 text-white rounded hover:bg-red-900 dark:hover:bg-red-800"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-blue-600 dark:text-blue-400 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredUsers.map((user: AdminUser) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => handleUserSelect(user.id)}
                      className="h-4 w-4 text-blue-600 dark:text-blue-400 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Joined {new Date(user.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={user.role}
                      onChange={(e) => handleUserRoleChange(user.id, e.target.value)}
                      className={`text-xs font-medium px-2 py-1 rounded-full bg-transparent ${getRoleColor(user.role)}`}
                    >
                      <option value="user">User</option>
                      <option value="moderator">Moderator</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.status)}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300">Edit</button>
                      <button className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No users found</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Try adjusting your search or filter criteria.
          </p>
        </div>
      )}
    </div>
  );
}
