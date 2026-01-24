/**
 * Atomic Idempotency Management System
 *
 * IMPROVED VERSION with race-condition protection via database constraints
 * Uses UNIQUE constraint on idempotency key to prevent double-execution
 *
 * Features:
 * - Atomic insert with ON CONFLICT handling
 * - No race conditions under high concurrency
 * - Proper status tracking (processing/completed/failed)
 * - Stuck operation detection
 *
 * Migration Required: 20251106_atomic_idempotency.sql
 *
 * Created: November 6, 2025
 */

import { getSupabaseServerClient } from '@/utils/supabase/server'

import {
  IDEMPOTENCY_KEYS_SELECT_COLUMNS,
  IDEMPOTENCY_MONITOR_SELECT_COLUMNS,
} from '@/lib/api/response-builders'
import { logger } from '@/lib/utils/logger'

import type { SupabaseClient } from '@supabase/supabase-js'


export type IdempotencyResult<T> = {
  success: boolean
  data?: T
  error?: string
  isDuplicate: boolean
  wasWaiting?: boolean // True if we waited for another request to finish
}

export type IdempotencyOptions = {
  ttl?: number // Time to live in seconds
  namespace?: string // Namespace for key isolation
  maxWaitTime?: number // Max time to wait for duplicate requests (ms)
  pollInterval?: number // How often to check if operation completed (ms)
}

const DEFAULT_OPTIONS: Required<IdempotencyOptions> = {
  ttl: 60 * 60 * 24, // 24 hours
  namespace: 'default',
  maxWaitTime: 30000, // 30 seconds
  pollInterval: 100 // 100ms
}

// Initialize Supabase client for idempotency storage
let supabase: SupabaseClient | null = null

const getSupabase = async () => {
  if (!supabase) {
    supabase = await getSupabaseServerClient()
  }
  return supabase
}

/**
 * Generate a unique idempotency key
 */
export function generateIdempotencyKey(): string {
  return `idem_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
}

/**
 * Create idempotency key with namespace
 */
export function createIdempotencyKey(key: string, namespace: string = DEFAULT_OPTIONS.namespace): string {
  return `${namespace}:${key}`
}

/**
 * Execute function with atomic idempotency protection
 *
 * This version uses database-level atomicity to prevent race conditions:
 * 1. Try to INSERT key with status='processing' (fails if key exists)
 * 2. If insert succeeds, we have the lock - execute operation
 * 3. If insert fails (duplicate key), wait for operation to complete
 * 4. Update key status to 'completed' when done
 */
export async function withAtomicIdempotency<T>(
  key: string,
  operation: () => Promise<T>,
  options: IdempotencyOptions = {}
): Promise<IdempotencyResult<T>> {
  const opts = Object.assign({}, DEFAULT_OPTIONS, options)
  const fullKey = createIdempotencyKey(key, opts.namespace)
  const expiresAt = new Date(Date.now() + opts.ttl * 1000).toISOString()

  try {
    const supabaseClient = await getSupabase()
    if (!supabaseClient) {
      return {
        success: false,
        error: 'Failed to initialize Supabase client',
        isDuplicate: false
      }
    }

    // Try to atomically insert the key
    // This will fail with error code 23505 (unique_violation) if key already exists
    const { data: insertData, error: insertError } = await supabaseClient
      .from('idempotency_keys')
      .insert({
        key: fullKey,
        status: 'processing',
        started_at: new Date().toISOString(),
        expires_at: expiresAt,
        data: null // Will be updated when operation completes
      })
      .select('key')
      .single()

    // Case 1: Insert succeeded - we got the lock!
    if (!insertError && insertData) {
      logger.info('Idempotency key claimed, executing operation', { key: fullKey })

      try {
        // Execute the operation
        const result = await operation()

        // Mark as completed
        const { error: updateError } = await supabaseClient
          .from('idempotency_keys')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            data: result
          })
          .eq('key', fullKey)

        if (updateError) {
          logger.warn('Failed to mark idempotency key as completed', {
            key: fullKey,
            error: updateError
          })
        }

        return {
          success: true,
          data: result,
          isDuplicate: false,
          wasWaiting: false
        }
      } catch (operationError) {
        // Mark as failed
        const errorMessage = operationError instanceof Error
          ? operationError.message
          : 'Unknown error'

        await supabaseClient
          .from('idempotency_keys')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
            error_message: errorMessage
          })
          .eq('key', fullKey)

        logger.error('Operation failed during idempotency execution',
          operationError instanceof Error ? operationError : new Error('Unknown error'),
          { key: fullKey }
        )

        return {
          success: false,
          error: errorMessage,
          isDuplicate: false,
          wasWaiting: false
        }
      }
    }

    // Case 2: Insert failed due to duplicate key - another request is processing
    if (insertError && insertError.code === '23505') {
      logger.info('Idempotency key already exists, waiting for completion', { key: fullKey })

      // Wait for the other request to complete
      const result = await waitForCompletion<T>(supabaseClient, fullKey, opts)

      if (result.success) {
        return {
          success: true,
          ...(result.data !== undefined ? { data: result.data } : {}),
          isDuplicate: true,
          wasWaiting: true
        }
      }

      // If waiting failed, return error
      return {
        success: false,
        ...(result.error ? { error: result.error } : {}),
        isDuplicate: true,
        wasWaiting: true
      }
    }

    // Case 3: Some other database error
    logger.error('Unexpected error inserting idempotency key',
      insertError || new Error('Unknown error'),
      { key: fullKey }
    )

    return {
      success: false,
      error: insertError?.message || 'Failed to insert idempotency key',
      isDuplicate: false,
      wasWaiting: false
    }

  } catch (error) {
    logger.error('Critical error in atomic idempotency',
      error instanceof Error ? error : new Error('Unknown error'),
      { key: fullKey }
    )

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Critical idempotency error',
      isDuplicate: false,
      wasWaiting: false
    }
  }
}

/**
 * Wait for another request to complete the operation
 */
async function waitForCompletion<T>(
  supabaseClient: SupabaseClient,
  key: string,
  opts: Required<IdempotencyOptions>
): Promise<{ success: boolean; data?: T; error?: string }> {
  const startTime = Date.now()
  const maxTime = opts.maxWaitTime

  while (Date.now() - startTime < maxTime) {
    // Check current status
    const { data, error } = await supabaseClient
      .from('idempotency_keys')
      .select(IDEMPOTENCY_KEYS_SELECT_COLUMNS)
      .eq('key', key)
      .single()

    if (error) {
      return {
        success: false,
        error: `Failed to check idempotency status: ${error.message}`
      }
    }

    if (!data) {
      return {
        success: false,
        error: 'Idempotency key disappeared during wait'
      }
    }

    // Check if completed
    if (data.status === 'completed') {
      logger.info('Operation completed by another request', {
        key,
        waitTime: Date.now() - startTime
      })

      return {
        success: true,
        data: data.data as T
      }
    }

    // Check if failed
    if (data.status === 'failed') {
      return {
        success: false,
        error: data.error_message || 'Operation failed in another request'
      }
    }

    // Check if stuck (processing for too long)
    const startedAt = new Date(data.started_at).getTime()
    if (Date.now() - startedAt > 300000) { // 5 minutes
      return {
        success: false,
        error: 'Operation appears to be stuck'
      }
    }

    // Still processing, wait and retry
    await new Promise(resolve => setTimeout(resolve, opts.pollInterval))
  }

  // Timeout
  return {
    success: false,
    error: `Timeout waiting for operation to complete (${maxTime}ms)`
  }
}

/**
 * Clean up expired idempotency keys
 * Should be called periodically via cron job
 */
export async function cleanupExpiredIdempotencyKeys(): Promise<{ deleted: number; error?: string }> {
  try {
    const supabaseClient = await getSupabase()
    if (!supabaseClient) {
      return { deleted: 0, error: 'Failed to initialize Supabase client' }
    }

    // Call the database function that handles cleanup
    const { data, error } = await supabaseClient.rpc('cleanup_idempotency_keys')

    if (error) {
      logger.error('Idempotency cleanup failed', error)
      return { deleted: 0, error: error.message }
    }

    logger.info('Idempotency cleanup completed', { deleted: data })
    return { deleted: data || 0 }

  } catch (error) {
    logger.error('Critical error in idempotency cleanup',
      error instanceof Error ? error : new Error('Unknown error')
    )
    return {
      deleted: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get idempotency monitoring stats
 */
export async function getIdempotencyStats(): Promise<{
  processing: number
  completed: number
  failed: number
  stuck: number
  avgDuration: number
  maxDuration: number
} | null> {
  try {
    const supabaseClient = await getSupabase()
    if (!supabaseClient) {
      return null
    }

    const { data, error } = await supabaseClient
      .from('idempotency_monitor')
      .select(IDEMPOTENCY_MONITOR_SELECT_COLUMNS)

    if (error || !data) {
      logger.error('Failed to get idempotency stats', error)
      return null
    }

    // Aggregate stats
    const stats = {
      processing: 0,
      completed: 0,
      failed: 0,
      stuck: 0,
      avgDuration: 0,
      maxDuration: 0
    }

    data.forEach((row: any) => {
      if (row.status === 'processing') stats.processing = row.count
      if (row.status === 'completed') stats.completed = row.count
      if (row.status === 'failed') stats.failed = row.count
      if (row.stuck_count) stats.stuck = row.stuck_count
      if (row.avg_duration_seconds > stats.avgDuration) {
        stats.avgDuration = row.avg_duration_seconds
      }
      if (row.max_duration_seconds > stats.maxDuration) {
        stats.maxDuration = row.max_duration_seconds
      }
    })

    return stats

  } catch (error) {
    logger.error('Critical error getting idempotency stats',
      error instanceof Error ? error : new Error('Unknown error')
    )
    return null
  }
}

// Export for backwards compatibility
export { withAtomicIdempotency as withIdempotency }

