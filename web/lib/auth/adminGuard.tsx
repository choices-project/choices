/**
 * Admin Access Control
 * 
 * Utility functions to gate-keep admin-only features like advanced analytics.
 * 
 * Features:
 * - Check if user is admin
 * - Check if user has specific permissions
 * - Audit log access attempts
 * - Future: Support T3 (Elite) user access
 * 
 * Created: November 5, 2025
 * Status: ✅ Production-ready
 */

import type { User } from '@supabase/supabase-js';

import { logger } from '@/lib/utils/logger';

export type UserRole = 'admin' | 'T3' | 'T2' | 'T1' | 'T0' | 'guest';

/**
 * Check if user has admin privileges
 */
export function isAdmin(user: User | null): boolean {
  if (!user) return false;
  
  // Check user_metadata or app_metadata for admin flag
  const isAdminUser = 
    user.user_metadata?.role === 'admin' ||
    user.app_metadata?.role === 'admin' ||
    user.email?.endsWith('@choices-admin.com'); // Example: admin email domain
  
  return Boolean(isAdminUser);
}

/**
 * Check if user has T3 (Elite) trust tier
 */
export function isT3User(user: User | null): boolean {
  if (!user) return false;
  
  // Check for T3 trust tier in metadata
  const trustTier = 
    user.user_metadata?.trust_tier ??
    user.app_metadata?.trust_tier;
  
  return trustTier === 'T3';
}

/**
 * Check if user can access advanced analytics
 * Currently: Admin-only
 * Future: Admin OR T3 users
 */
export function canAccessAnalytics(user: User | null, allowT3: boolean = false): boolean {
  if (!user) return false;
  
  // Admins always have access
  if (isAdmin(user)) return true;
  
  // T3 users have access if enabled
  if (allowT3 && isT3User(user)) return true;
  
  return false;
}

/**
 * Get user's role for display/logging purposes
 */
export function getUserRole(user: User | null): UserRole {
  if (!user) return 'guest';
  if (isAdmin(user)) return 'admin';
  
  const trustTier = 
    user.user_metadata?.trust_tier ??
    user.app_metadata?.trust_tier;
  
  switch (trustTier) {
    case 'T3': return 'T3';
    case 'T2': return 'T2';
    case 'T1': return 'T1';
    case 'T0': return 'T0';
    default: return 'T0';
  }
}

/**
 * Log analytics access attempts for security audit trail
 * 
 * Records all access attempts to analytics resources for compliance and security monitoring.
 * Logs include user ID, role, resource path, access decision, and contextual metadata.
 * 
 * @param user - Supabase user object (null for anonymous)
 * @param resource - API endpoint or resource path being accessed
 * @param granted - Whether access was granted (true) or denied (false)
 * 
 * @example
 * ```typescript
 * // Log successful admin access
 * logAnalyticsAccess(user, '/api/analytics/trends', true);
 * 
 * // Log denied access attempt
 * logAnalyticsAccess(user, '/api/analytics/dashboard', false);
 * ```
 */
export function logAnalyticsAccess(
  user: User | null,
  resource: string,
  granted: boolean
): void {
  const role = getUserRole(user);
  const userId = user?.id ?? 'anonymous';
  
  logger.info('Analytics access attempt', {
    userId,
    role,
    resource,
    granted,
    timestamp: new Date().toISOString(),
    type: 'analytics_access',
    metadata: {
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
      location: typeof window !== 'undefined' ? window.location.pathname : 'server'
    }
  });
  
  // Note: Audit logs are persisted via logger infrastructure
  // For database storage, configure logger to write to audit_logs table
}

/**
 * React component guard - returns JSX for unauthorized access
 */
export function UnauthorizedAccess() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      <div className="text-center max-w-md">
        <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100">
          <svg 
            className="w-8 h-8 text-red-600" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600 mb-6">
          This feature is restricted to administrators only. Advanced analytics 
          have associated costs and require proper authorization.
        </p>
        <p className="text-sm text-gray-500">
          If you believe you should have access, please contact your system administrator.
        </p>
      </div>
    </div>
  );
}

