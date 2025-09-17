/**
 * Core Authentication Types
 * 
 * Comprehensive type definitions for authentication and security modules.
 * This file provides proper TypeScript types to replace `any` usage throughout
 * the authentication system.
 * 
 * @author Choices Platform
 * @version 1.0.0
 * @since 2025-01-16
 */

import type { User, Session } from '@supabase/supabase-js'

// ============================================================================
// User and Session Types
// ============================================================================

export type UserSession = {
  user: User | null
  session: Session | null
}

export type AuthContext = {
  user: User | null
  session: Session | null
  loading: boolean
}

// ============================================================================
// Device Flow Types
// ============================================================================

export type DeviceFlowRequest = {
  provider: 'google' | 'github' | 'facebook' | 'twitter' | 'linkedin' | 'discord'
  redirectTo?: string
  scopes?: string[]
}

export type DeviceFlowResponse = {
  success: boolean
  deviceCode?: string
  userCode?: string
  verificationUri?: string
  expiresIn?: number
  interval?: number
  error?: string
}

export type DeviceFlowVerification = {
  success: boolean
  userId?: string
  session?: Session
  error?: string
}

export type DeviceFlowState = {
  deviceCode: string
  userCode: string
  verificationUri: string
  expiresIn: number
  interval: number
  status: 'pending' | 'completed' | 'expired' | 'error'
  userId?: string
  provider: 'google' | 'github' | 'facebook' | 'twitter' | 'linkedin' | 'discord'
  createdAt: Date
  expiresAt: Date
}

// ============================================================================
// Database Types
// ============================================================================

export type DeviceFlowRecord = {
  device_code: string
  user_code: string
  provider: string
  status: string
  expires_at: string
  client_ip: string
  redirect_to: string
  scopes: string[]
  user_id?: string
  completed_at?: string
  created_at: string
  updated_at: string
}

// ============================================================================
// Middleware Types
// ============================================================================

export type MiddlewareContext = {
  req: Request
  res: Response
  user?: User
}

export type RateLimitConfig = {
  maxRequests: number
  windowMs: number
  key: string
}

// ============================================================================
// Error Types
// ============================================================================

export type AuthError = {
  message: string
  code?: string
  statusCode?: number
}

export type ValidationError = {
  field: string
  message: string
  value?: unknown
}

// ============================================================================
// API Response Types
// ============================================================================

export type ApiResponse<T = unknown> = {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export type PaginatedResponse<T = unknown> = {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
} & ApiResponse<T[]>

// ============================================================================
// Security Types
// ============================================================================

export type SecurityHeaders = {
  'Content-Security-Policy'?: string
  'X-Frame-Options'?: string
  'X-Content-Type-Options'?: string
  'Referrer-Policy'?: string
  'Permissions-Policy'?: string
}

export type RateLimitInfo = {
  limit: number
  remaining: number
  reset: number
  retryAfter?: number
}

// ============================================================================
// Utility Types
// ============================================================================

export type ProviderType = 'google' | 'github' | 'facebook' | 'twitter' | 'linkedin' | 'discord'

export type DeviceFlowStatus = 'pending' | 'completed' | 'expired' | 'error'

export type AuthMethod = 'password' | 'oauth' | 'webauthn' | 'device_flow'

// ============================================================================
// Type Guards
// ============================================================================

export function isUserSession(value: unknown): value is UserSession {
  return (
    typeof value === 'object' &&
    value !== null &&
    ('user' in value || 'session' in value)
  )
}

export function isDeviceFlowRequest(value: unknown): value is DeviceFlowRequest {
  return (
    typeof value === 'object' &&
    value !== null &&
    'provider' in value &&
    typeof (value as DeviceFlowRequest).provider === 'string'
  )
}

export function isAuthError(value: unknown): value is AuthError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'message' in value &&
    typeof (value as AuthError).message === 'string'
  )
}
