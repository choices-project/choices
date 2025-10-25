/**
 * Role-Based Access Control (RBAC) Utilities
 * 
 * @created: October 24, 2025
 * @updated: October 24, 2025
 * @purpose: Professional RBAC system for multi-role admin management
 */

import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database';

type SupabaseClient = ReturnType<typeof createClient>;

export interface UserRole {
  role_name: string;
  role_level: number;
  assigned_at: string;
}

export interface UserPermission {
  permission_name: string;
  resource: string;
  action: string;
}

export class RBACService {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * Check if user has a specific role
   */
  async hasRole(userId: string, roleName: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.rpc('has_role', {
        user_id: userId,
        role_name: roleName
      });

      if (error) {
        console.error('Error checking role:', error);
        return false;
      }

      return data === true;
    } catch (error) {
      console.error('Error in hasRole:', error);
      return false;
    }
  }

  /**
   * Check if user has a specific permission
   */
  async hasPermission(userId: string, permissionName: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.rpc('has_permission', {
        user_id: userId,
        permission_name: permissionName
      });

      if (error) {
        console.error('Error checking permission:', error);
        return false;
      }

      return data === true;
    } catch (error) {
      console.error('Error in hasPermission:', error);
      return false;
    }
  }

  /**
   * Check if user is any type of admin
   */
  async isAdmin(userId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.rpc('is_admin', {
        user_id: userId
      });

      if (error) {
        console.error('Error checking admin status:', error);
        return false;
      }

      return data === true;
    } catch (error) {
      console.error('Error in isAdmin:', error);
      return false;
    }
  }

  /**
   * Get all roles for a user
   */
  async getUserRoles(userId: string): Promise<UserRole[]> {
    try {
      const { data, error } = await this.supabase.rpc('get_user_roles', {
        user_id: userId
      });

      if (error) {
        console.error('Error getting user roles:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserRoles:', error);
      return [];
    }
  }

  /**
   * Get all permissions for a user
   */
  async getUserPermissions(userId: string): Promise<UserPermission[]> {
    try {
      const { data, error } = await this.supabase.rpc('get_user_permissions', {
        user_id: userId
      });

      if (error) {
        console.error('Error getting user permissions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserPermissions:', error);
      return [];
    }
  }

  /**
   * Check if user has permission to perform action on resource
   */
  async canPerformAction(
    userId: string, 
    resource: string, 
    action: string
  ): Promise<boolean> {
    const permissionName = `${resource}.${action}`;
    return this.hasPermission(userId, permissionName);
  }

  /**
   * Get user's highest role level
   */
  async getUserRoleLevel(userId: string): Promise<number> {
    const roles = await this.getUserRoles(userId);
    if (roles.length === 0) return 0;
    
    return Math.max(...roles.map(role => role.role_level));
  }

  /**
   * Check if user has minimum role level
   */
  async hasMinimumRoleLevel(userId: string, minLevel: number): Promise<boolean> {
    const userLevel = await this.getUserRoleLevel(userId);
    return userLevel >= minLevel;
  }
}

/**
 * Convenience functions for common RBAC checks
 */
export class RBACHelpers {
  private rbac: RBACService;

  constructor(supabase: SupabaseClient) {
    this.rbac = new RBACService(supabase);
  }

  /**
   * Check if user can manage users
   */
  async canManageUsers(userId: string): Promise<boolean> {
    return this.rbac.hasPermission(userId, 'users.create') ||
           this.rbac.hasPermission(userId, 'users.update') ||
           this.rbac.hasPermission(userId, 'users.delete');
  }

  /**
   * Check if user can moderate content
   */
  async canModerateContent(userId: string): Promise<boolean> {
    return this.rbac.hasPermission(userId, 'content.moderate') ||
           this.rbac.hasPermission(userId, 'polls.moderate');
  }

  /**
   * Check if user can view analytics
   */
  async canViewAnalytics(userId: string): Promise<boolean> {
    return this.rbac.hasPermission(userId, 'analytics.view');
  }

  /**
   * Check if user can configure system
   */
  async canConfigureSystem(userId: string): Promise<boolean> {
    return this.rbac.hasPermission(userId, 'system.configure');
  }

  /**
   * Check if user is super admin
   */
  async isSuperAdmin(userId: string): Promise<boolean> {
    return this.rbac.hasRole(userId, 'super_admin');
  }

  /**
   * Check if user is regular admin
   */
  async isRegularAdmin(userId: string): Promise<boolean> {
    return this.rbac.hasRole(userId, 'admin');
  }

  /**
   * Check if user is moderator
   */
  async isModerator(userId: string): Promise<boolean> {
    return this.rbac.hasRole(userId, 'moderator');
  }

  /**
   * Check if user is support agent
   */
  async isSupportAgent(userId: string): Promise<boolean> {
    return this.rbac.hasRole(userId, 'support');
  }
}

/**
 * React hook for RBAC functionality
 */
export function useRBAC() {
  const supabase = createClient();
  const rbac = new RBACService(supabase);
  const helpers = new RBACHelpers(supabase);

  return {
    rbac,
    helpers,
    // Convenience methods
    hasRole: rbac.hasRole.bind(rbac),
    hasPermission: rbac.hasPermission.bind(rbac),
    isAdmin: rbac.isAdmin.bind(rbac),
    getUserRoles: rbac.getUserRoles.bind(rbac),
    getUserPermissions: rbac.getUserPermissions.bind(rbac),
    canPerformAction: rbac.canPerformAction.bind(rbac),
    // Helper methods
    canManageUsers: helpers.canManageUsers.bind(helpers),
    canModerateContent: helpers.canModerateContent.bind(helpers),
    canViewAnalytics: helpers.canViewAnalytics.bind(helpers),
    canConfigureSystem: helpers.canConfigureSystem.bind(helpers),
    isSuperAdmin: helpers.isSuperAdmin.bind(helpers),
    isRegularAdmin: helpers.isRegularAdmin.bind(helpers),
    isModerator: helpers.isModerator.bind(helpers),
    isSupportAgent: helpers.isSupportAgent.bind(helpers)
  };
}

/**
 * Server-side RBAC utilities for API routes
 */
export class ServerRBAC {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * Middleware for checking admin access
   */
  async requireAdmin(userId: string): Promise<boolean> {
    const rbac = new RBACService(this.supabase);
    return rbac.isAdmin(userId);
  }

  /**
   * Middleware for checking specific permission
   */
  async requirePermission(userId: string, permission: string): Promise<boolean> {
    const rbac = new RBACService(this.supabase);
    return rbac.hasPermission(userId, permission);
  }

  /**
   * Middleware for checking minimum role level
   */
  async requireRoleLevel(userId: string, minLevel: number): Promise<boolean> {
    const rbac = new RBACService(this.supabase);
    return rbac.hasMinimumRoleLevel(userId, minLevel);
  }
}

export default RBACService;

