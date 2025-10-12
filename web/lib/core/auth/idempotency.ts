/**
 * Idempotency Management System
 * Prevents double-submission attacks and ensures data consistency
 * 
 * Features:
 * - UUID-based idempotency keys
 * - Redis-based storage for distributed systems
 * - Automatic cleanup of expired keys
 * - Proper error handling and logging
 */

import type { SupabaseClient } from '@supabase/supabase-js'

import { logger } from '@/lib/utils/logger'
import { withOptional } from '@/lib/utils/objects'
import { getSupabaseServerClient } from '@/utils/supabase/server'

export interface IdempotencyResult<T> {
  success: boolean
  data?: T
  error?: string
  isDuplicate: boolean
}

export interface IdempotencyOptions {
  ttl?: number // Time to live in seconds
  namespace?: string // Namespace for key isolation
}

const DEFAULT_OPTIONS: Required<IdempotencyOptions> = {
  ttl: 60 * 60 * 24, // 24 hours
  namespace: 'default'
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
 * Check if idempotency key exists and is valid
 */
export async function checkIdempotencyKey<T = unknown>(
  key: string, 
  options: IdempotencyOptions = {}
): Promise<{ exists: boolean; data?: T; error?: string }> {
  const opts = Object.assign({}, DEFAULT_OPTIONS, options)
  const fullKey = createIdempotencyKey(key, opts.namespace)

  try {
    const supabaseClient = await getSupabase()
    if (!supabaseClient) {
      return { exists: false, error: 'Failed to initialize Supabase client' }
    }
    
    const { data, error } = await supabaseClient
      .from('idempotency_keys')
      .select('*')
      .eq('key', fullKey)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      logger.error('Idempotency key check failed', error, { key: fullKey })
      return { exists: false, error: 'Database error' }
    }

    return {
      exists: !!data,
      data: data?.result_data
    }
  } catch (error) {
    logger.error('Idempotency key check exception', error instanceof Error ? error : new Error('Unknown error'), { key: fullKey })
    return { exists: false, error: 'System error' }
  }
}

/**
 * Store idempotency key with result data
 */
export async function storeIdempotencyKey<T = unknown>(
  key: string,
  resultData: T,
  options: IdempotencyOptions = {}
): Promise<{ success: boolean; error?: string }> {
  const opts = Object.assign({}, DEFAULT_OPTIONS, options)
  const fullKey = createIdempotencyKey(key, opts.namespace)
  const expiresAt = new Date(Date.now() + opts.ttl * 1000).toISOString()

  try {
    const supabaseClient = await getSupabase()
    if (!supabaseClient) {
      return { success: false, error: 'Failed to initialize Supabase client' }
    }
    
    const { error } = await supabaseClient
      .from('idempotency_keys')
      .insert({
        key: fullKey,
        result_data: resultData,
        expires_at: expiresAt,
        created_at: new Date().toISOString()
      })

    if (error) {
      logger.error('Failed to store idempotency key', error, { key: fullKey })
      return { success: false, error: 'Storage failed' }
    }

    logger.info('Idempotency key stored', { key: fullKey, expiresAt })
    return { success: true }
  } catch (error) {
    logger.error('Idempotency key storage exception', error instanceof Error ? error : new Error('Unknown error'), { key: fullKey })
    return { success: false, error: 'System error' }
  }
}

/**
 * Execute function with idempotency protection
 */
export async function withIdempotency<T>(
  key: string,
  operation: () => Promise<T>,
  options: IdempotencyOptions = {}
): Promise<IdempotencyResult<T>> {
  const opts = Object.assign({}, DEFAULT_OPTIONS, options)

  // Check if key already exists
  const checkResult = await checkIdempotencyKey<T>(key, opts)
  
  if (checkResult.error) {
    return {
      success: false,
      error: checkResult.error,
      isDuplicate: false
    }
  }

  if (checkResult.exists) {
    logger.info('Idempotency key found, returning cached result', { key })
    return withOptional({
      success: true,
      isDuplicate: true
    }, {
      data: checkResult.data
    })
  }

  // Execute operation
  try {
    const result = await operation()
    
    // Store result for future requests
    const storeResult = await storeIdempotencyKey(key, result, opts)
    
    if (!storeResult.success) {
      logger.warn('Failed to store idempotency result, but operation succeeded', { 
        key, 
        error: storeResult.error 
      })
    }

    return {
      success: true,
      data: result,
      isDuplicate: false
    }
  } catch (error) {
    logger.error('Operation failed during idempotency execution', error instanceof Error ? error : new Error('Unknown error'), { key })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Operation failed',
      isDuplicate: false
    }
  }
}

/**
 * Clean up expired idempotency keys
 */
export async function cleanupExpiredIdempotencyKeys(): Promise<{ deleted: number; error?: string }> {
  try {
    const client = await getSupabase()
    if (!client) {
      return { deleted: 0, error: 'Failed to initialize Supabase client' }
    }
    
    const { count, error } = await client
      .from('idempotency_keys')
      .delete()
      .lt('expires_at', new Date().toISOString())
      .select('*')

    if (error) {
      logger.error('Failed to cleanup expired idempotency keys', error)
      return { deleted: 0, error: 'Cleanup failed' }
    }

    logger.info('Cleaned up expired idempotency keys', { deleted: count || 0 })
    return { deleted: count || 0 }
  } catch (error) {
    logger.error('Idempotency cleanup exception', error instanceof Error ? error : new Error('Unknown error'))
    return { deleted: 0, error: 'System error' }
  }
}

/**
 * Validate idempotency key format
 */
export function validateIdempotencyKey(key: string): boolean {
  // Basic validation - should be a valid UUID or our custom format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  const customRegex = /^idem_\d+_[a-z0-9]+$/i
  
  return uuidRegex.test(key) || customRegex.test(key)
}

/**
 * Get idempotency key statistics
 */
export async function getIdempotencyStats(): Promise<{
  total: number
  expired: number
  active: number
  error?: string
}> {
  try {
    const client = await getSupabase()
    if (!client) {
      return { total: 0, expired: 0, active: 0, error: 'Failed to initialize Supabase client' }
    }
    
    const now = new Date().toISOString()
    
    const { count: total, error: totalError } = await client
      .from('idempotency_keys')
      .select('*', { count: 'exact', head: true })

    if (totalError) {
      logger.error('Failed to get total idempotency keys', totalError)
      return { total: 0, expired: 0, active: 0, error: 'Query failed' }
    }

    const { count: expired, error: expiredError } = await client
      .from('idempotency_keys')
      .select('*', { count: 'exact', head: true })
      .lt('expires_at', now)

    if (expiredError) {
      logger.error('Failed to get expired idempotency keys', expiredError)
      return { total: 0, expired: 0, active: 0, error: 'Query failed' }
    }

    const active = (total || 0) - (expired || 0)

    return {
      total: total || 0,
      expired: expired || 0,
      active: Math.max(0, active)
    }
  } catch (error) {
    logger.error('Idempotency stats exception', error instanceof Error ? error : new Error('Unknown error'))
    return { total: 0, expired: 0, active: 0, error: 'System error' }
  }
}
