/**
 * TypeScript types for idempotency_keys table
 * Auto-generated from migration: 20251106_atomic_idempotency.sql
 *
 * Date: November 6, 2025
 */

export type IdempotencyKeyStatus = 'processing' | 'completed' | 'failed'

export type IdempotencyKeyRow = {
  id: string // UUID
  key: string // Unique idempotency key
  status: IdempotencyKeyStatus
  started_at: string // ISO timestamp
  completed_at: string | null // ISO timestamp or null
  expires_at: string // ISO timestamp
  data: unknown // JSONB - result data
  error_message: string | null
  created_at: string // ISO timestamp
  updated_at: string // ISO timestamp
}

export type IdempotencyKeyInsert = {
  id?: string // Optional - auto-generated if not provided
  key: string
  status?: IdempotencyKeyStatus // Defaults to 'processing'
  started_at?: string // Defaults to NOW()
  completed_at?: string | null
  expires_at: string // Required
  data?: unknown
  error_message?: string | null
  created_at?: string // Defaults to NOW()
  updated_at?: string // Defaults to NOW()
}

export type IdempotencyKeyUpdate = {
  id?: never // Cannot update id
  key?: never // Cannot update key (unique constraint)
  status?: IdempotencyKeyStatus
  started_at?: never // Should not be updated
  completed_at?: string | null
  expires_at?: string
  data?: unknown
  error_message?: string | null
  created_at?: never // Should not be updated
  updated_at?: string
}

export type IdempotencyMonitorRow = {
  status: IdempotencyKeyStatus
  count: number
  avg_duration_seconds: number
  max_duration_seconds: number
  stuck_count: number
}

// Database function return types
export type CleanupIdempotencyKeysResult = {
  deleted_count: number
}

// For Supabase client typing
export type Database = {
  public: {
    Tables: {
      idempotency_keys: {
        Row: IdempotencyKeyRow
        Insert: IdempotencyKeyInsert
        Update: IdempotencyKeyUpdate
      }
    }
    Views: {
      idempotency_monitor: {
        Row: IdempotencyMonitorRow
      }
    }
    Functions: {
      cleanup_idempotency_keys: {
        Args: Record<string, never>
        Returns: number
      }
    }
  }
}

