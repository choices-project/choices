/**
 * Authentication Audit Logging
 *
 * Specialized audit logging helpers for authentication events.
 * Provides convenient wrappers for common auth event patterns.
 *
 * Features:
 * - Login attempt logging (success/failure)
 * - Logout logging
 * - Registration logging
 * - Password change logging
 * - MFA event logging
 * - Session management logging
 *
 * Created: November 7, 2025
 * Status: Production-ready
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import { createAuditLogService } from '@/lib/services/audit-log-service';

/**
 * Log login attempt
 *
 * @param supabase - Supabase client
 * @param userId - User ID (null for failed attempts)
 * @param email - Email address attempting login
 * @param success - Whether login succeeded
 * @param method - Authentication method (email, webauthn, oauth, etc.)
 * @param ipAddress - Client IP address
 * @param userAgent - Client user agent
 * @param metadata - Additional context
 *
 * @example
 * ```typescript
 * await logLoginAttempt(supabase, user.id, email, true, 'email', ip, ua);
 * ```
 */
export async function logLoginAttempt(
  supabase: SupabaseClient,
  userId: string | null,
  email: string,
  success: boolean,
  method: string,
  ipAddress?: string,
  userAgent?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const audit = createAuditLogService(supabase);

  await audit.logAuth(
    userId,
    success ? 'User Login Success' : 'User Login Failed',
    success,
    method,
    {
      ipAddress,
      userAgent,
      metadata: {
        ...metadata,
        email,
        method,
        timestamp: new Date().toISOString()
      },
      severity: success ? 'info' : 'warning'
    }
  );
}

/**
 * Log logout event
 *
 * @param supabase - Supabase client
 * @param userId - User ID
 * @param ipAddress - Client IP address
 * @param userAgent - Client user agent
 */
export async function logLogout(
  supabase: SupabaseClient,
  userId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  const audit = createAuditLogService(supabase);

  await audit.logAuth(
    userId,
    'User Logout',
    true,
    'logout',
    {
      ipAddress,
      userAgent,
      severity: 'info'
    }
  );
}

/**
 * Log user registration
 *
 * @param supabase - Supabase client
 * @param userId - New user ID
 * @param email - User email
 * @param method - Registration method
 * @param ipAddress - Client IP address
 * @param userAgent - Client user agent
 */
export async function logRegistration(
  supabase: SupabaseClient,
  userId: string,
  email: string,
  method: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  const audit = createAuditLogService(supabase);

  await audit.logAuth(
    userId,
    'User Registration',
    true,
    method,
    {
      ipAddress,
      userAgent,
      metadata: {
        email,
        method,
        registration_date: new Date().toISOString()
      },
      severity: 'info'
    }
  );
}

/**
 * Log password change
 *
 * @param supabase - Supabase client
 * @param userId - User ID
 * @param success - Whether change succeeded
 * @param ipAddress - Client IP address
 * @param userAgent - Client user agent
 */
export async function logPasswordChange(
  supabase: SupabaseClient,
  userId: string,
  success: boolean,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  const audit = createAuditLogService(supabase);

  await audit.logAuth(
    userId,
    success ? 'Password Changed' : 'Password Change Failed',
    success,
    'password_change',
    {
      ipAddress,
      userAgent,
      severity: success ? 'info' : 'warning'
    }
  );
}

/**
 * Log MFA/WebAuthn event
 *
 * @param supabase - Supabase client
 * @param userId - User ID
 * @param eventType - Type of MFA event (enabled, disabled, verified, failed)
 * @param method - MFA method (webauthn, totp, sms, etc.)
 * @param success - Whether operation succeeded
 * @param ipAddress - Client IP address
 * @param userAgent - Client user agent
 */
export async function logMFAEvent(
  supabase: SupabaseClient,
  userId: string,
  eventType: 'enabled' | 'disabled' | 'verified' | 'failed',
  method: string,
  success: boolean,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  const audit = createAuditLogService(supabase);

  await audit.logAuth(
    userId,
    `MFA ${eventType} - ${method}`,
    success,
    method,
    {
      ipAddress,
      userAgent,
      metadata: {
        mfa_method: method,
        event_type: eventType
      },
      severity: success ? 'info' : 'warning'
    }
  );
}

/**
 * Log session event
 *
 * @param supabase - Supabase client
 * @param userId - User ID
 * @param eventType - Type of session event (created, refreshed, expired, invalidated)
 * @param sessionId - Session ID
 * @param ipAddress - Client IP address
 * @param userAgent - Client user agent
 */
export async function logSessionEvent(
  supabase: SupabaseClient,
  userId: string,
  eventType: 'created' | 'refreshed' | 'expired' | 'invalidated',
  sessionId?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  const audit = createAuditLogService(supabase);

  await audit.logAuth(
    userId,
    `Session ${eventType}`,
    true,
    'session',
    {
      ipAddress,
      userAgent,
      metadata: {
        session_id: sessionId,
        event_type: eventType
      },
      severity: 'info'
    }
  );
}

/**
 * Log account deletion
 *
 * @param supabase - Supabase client
 * @param userId - User ID being deleted
 * @param email - User email
 * @param deletedBy - ID of user/admin who initiated deletion
 * @param reason - Reason for deletion
 * @param ipAddress - Client IP address
 * @param userAgent - Client user agent
 */
export async function logAccountDeletion(
  supabase: SupabaseClient,
  userId: string,
  email: string,
  deletedBy: string,
  reason: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  const audit = createAuditLogService(supabase);

  const isSelfDeletion = userId === deletedBy;

  await audit.log(
    isSelfDeletion ? 'user_action' : 'admin_action',
    'Account Deleted',
    `/api/auth/delete-account`,
    'delete',
    true,
    {
      ipAddress,
      userAgent,
      metadata: {
        deleted_user_id: userId,
        deleted_user_email: email,
        deleted_by: deletedBy,
        self_deletion: isSelfDeletion,
        reason,
        timestamp: new Date().toISOString()
      },
      severity: 'warning'
    }
  );
}

/**
 * Log failed authentication attempt (rate limiting, suspicious activity)
 *
 * @param supabase - Supabase client
 * @param email - Email attempting authentication
 * @param reason - Reason for failure
 * @param ipAddress - Client IP address
 * @param userAgent - Client user agent
 * @param metadata - Additional context (attempt count, etc.)
 */
export async function logAuthSecurityEvent(
  supabase: SupabaseClient,
  email: string,
  reason: string,
  ipAddress?: string,
  userAgent?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const audit = createAuditLogService(supabase);

  await audit.logSecurityEvent(
    `Authentication Security Event: ${reason}`,
    'warning',
    '/api/auth',
    {
      ipAddress,
      userAgent,
      metadata: {
        ...metadata,
        email,
        reason,
        timestamp: new Date().toISOString()
      }
    }
  );
}

