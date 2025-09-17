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

export interface UserSession {
  user: User | null
  session: Session | null
}

export interface AuthContext {
  user: User | null
  session: Session | null
  loading: boolean
}

// ============================================================================
// Device Flow Types
// ============================================================================

export interface DeviceFlowRequest {
  provider: 'google' | 'github' | 'facebook' | 'twitter' | 'linkedin' | 'discord'
  redirectTo?: string
  scopes?: string[]
}

export interface DeviceFlowResponse {
  success: boolean
  deviceCode?: string
  userCode?: string
  verificationUri?: string
  expiresIn?: number
  interval?: number
  error?: string
}

export interface DeviceFlowVerification {
  success: boolean
  userId?: string
  session?: Session
  error?: string
}

export interface DeviceFlowState {
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

export interface DeviceFlowRecord {
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

export interface MiddlewareContext {
  req: Request
  res: Response
  user?: User
}

export interface RateLimitConfig {
  maxRequests: number
  windowMs: number
  key: string
}

// ============================================================================
// Error Types
// ============================================================================

export interface AuthError {
  message: string
  code?: string
  statusCode?: number
}

export interface ValidationError {
  field: string
  message: string
  value?: unknown
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T = unknown> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// ============================================================================
// Security Types
// ============================================================================

export interface SecurityHeaders {
  'Content-Security-Policy'?: string
  'X-Frame-Options'?: string
  'X-Content-Type-Options'?: string
  'Referrer-Policy'?: string
  'Permissions-Policy'?: string
}

export interface RateLimitInfo {
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
