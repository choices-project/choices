/**
 * Supabase Agent Client
 *
 * Dedicated client for AI agents with proper security, audit logging, and error handling.
 *
 * This utility provides a secure way for AI agents to interact with Supabase,
 * with automatic audit logging, rate limiting, and context management.
 */

import { logAgentOperation } from '@/lib/core/agent/audit'
import { createAgentContext, validateAgentContext } from '@/lib/core/agent/context'
import type {
  AgentClient,
  AgentClientOptions,
  AgentContext,
  AgentOperation,
  AgentOperationResult,
  OperationType,
  ResultStatus,
} from '@/lib/core/agent/types'
import { apiRateLimiter } from '@/lib/rate-limiting/api-rate-limiter'
import { logger } from '@/lib/utils/logger'

import { getSupabaseAdminClient, getSupabaseServerClient } from './server'

import type { Database } from '@/types/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'

// Runtime guard to prevent client-side usage
const assertRunningOnServer = (fnName: string) => {
  if (typeof window !== 'undefined') {
    throw new Error(`${fnName} must be called on the server`)
  }
}

/**
 * Get a Supabase client configured for agent operations
 *
 * @param options - Agent client configuration
 * @returns Agent client with context and audit logging
 *
 * @example
 * ```typescript
 * const agentClient = await getSupabaseAgentClient({
 *   agentId: 'analytics-agent',
 *   agentVersion: '1.0.0',
 *   purpose: 'Analyze poll results',
 *   useServiceRole: true,
 *   enableAudit: true
 * })
 *
 * const { data, error } = await agentClient.client
 *   .from('polls')
 *   .select('*')
 *   .eq('id', pollId)
 * ```
 */
export async function getSupabaseAgentClient(
  options: AgentClientOptions
): Promise<AgentClient> {
  assertRunningOnServer('getSupabaseAgentClient')

  // Validate required options
  if (!options.agentId || typeof options.agentId !== 'string') {
    throw new Error('agentId is required and must be a string')
  }

  // Create agent context
  const context = createAgentContext(options.agentId, {
    metadata: {
      useServiceRole: options.useServiceRole ?? false,
      enableAudit: options.enableAudit ?? true,
    },
    ...(options.agentVersion !== undefined && { agentVersion: options.agentVersion }),
    ...(options.purpose !== undefined && { purpose: options.purpose }),
    ...(options.userId !== undefined && { userId: options.userId }),
  })

  // Validate context
  if (!validateAgentContext(context)) {
    throw new Error('Invalid agent context')
  }

  // Get appropriate Supabase client
  let client: SupabaseClient<Database>

  if (options.useServiceRole) {
    // Use service role for operations that need elevated permissions
    logger.debug('Creating agent client with service role', {
      agentId: context.agentId,
      purpose: context.purpose,
    })
    client = await getSupabaseAdminClient()
  } else {
    // Use regular server client with user session
    logger.debug('Creating agent client with user session', {
      agentId: context.agentId,
      userId: context.userId,
    })
    client = await getSupabaseServerClient()
  }

  // Wrap client operations with audit logging
  const wrappedClient = wrapClientWithAudit(client, context, options)

  return {
    client: wrappedClient,
    context,
    logOperation: async (operation: AgentOperation, result: AgentOperationResult) => {
      if (options.enableAudit !== false) {
        await logAgentOperation(context, operation, result)
      }
    },
  }
}

/**
 * Wrap Supabase client with audit logging and rate limiting
 */
function wrapClientWithAudit(
  client: SupabaseClient<Database>,
  context: AgentContext,
  options: AgentClientOptions
): SupabaseClient<Database> {
  // Create a proxy to intercept operations
  return new Proxy(client, {
    get(target, prop) {
      // Intercept table access (e.g., client.from('table'))
      if (prop === 'from') {
        return (tableName: string) => {
          // Call the original from method on the client
          const table = (target as any).from(tableName)

          // Wrap table operations with audit logging
          return wrapTableWithAudit(table, tableName, context, options)
        }
      }

      // Pass through other properties
      const original = target[prop as keyof SupabaseClient<Database>]
      if (typeof original === 'function') {
        return original.bind(target)
      }
      return original
    },
  }) as SupabaseClient<Database>
}

/**
 * Wrap table operations with audit logging
 */
function wrapTableWithAudit(
  table: any,
  tableName: string,
  context: AgentContext,
  options: AgentClientOptions
): any {
  const operations: Record<string, Function> = {}
  for (const opName of ['select', 'insert', 'update', 'upsert', 'delete'] as const) {
    const fn = table[opName]
    if (typeof fn === 'function') {
      operations[opName] = fn.bind(table)
    }
  }

  const wrapped: any = {}

  for (const [opName, opFn] of Object.entries(operations)) {
    wrapped[opName] = async (...args: any[]) => {
      const startTime = Date.now()
      const operationType = mapOperationType(opName)

      if (options.rateLimit) {
        const rateLimitKey = `agent:${context.agentId}:${tableName}:${operationType}`
        const rateLimitResult = await apiRateLimiter.checkLimit(
          rateLimitKey,
          `agent-operation`,
          options.rateLimit
        )

        if (!rateLimitResult.allowed) {
          const result: AgentOperationResult = {
            status: 'rate_limited',
            error: `Rate limit exceeded: ${rateLimitResult.totalHits}/${options.rateLimit.maxRequests} requests`,
            duration: Date.now() - startTime,
          }

          if (options.enableAudit !== false) {
            await logAgentOperation(
              context,
              {
                operationType,
                tableName,
              },
              result
            )
          }

          throw new Error(result.error)
        }
      }

      try {
        const result = await opFn(...args)
        const duration = Date.now() - startTime

        const status: ResultStatus = result.error ? 'error' : 'success'

        let rowCount: number | undefined
        if (result.data) {
          rowCount = Array.isArray(result.data) ? result.data.length : 1
        }

        if (options.enableAudit !== false) {
          await logAgentOperation(
            context,
            {
              operationType,
              tableName,
              query: opName,
              metadata: {
                args: sanitizeArgs(args),
              },
            },
            {
              status,
              error: result.error?.message,
              duration,
              ...(rowCount !== undefined && { rowCount }),
            }
          )
        }

        if (result.error) {
          logger.error('Agent operation error', {
            agentId: context.agentId,
            operationType,
            tableName,
            error: result.error.message,
            duration,
          })
        }

        return result
      } catch (error) {
        const duration = Date.now() - startTime
        const errorMessage = error instanceof Error ? error.message : String(error)

        if (options.enableAudit !== false) {
          await logAgentOperation(
            context,
            {
              operationType,
              tableName,
              query: opName,
              metadata: {
                args: sanitizeArgs(args),
              },
            },
            {
              status: 'error',
              error: errorMessage,
              duration,
            }
          )
        }

        logger.error('Agent operation exception', {
          agentId: context.agentId,
          operationType,
          tableName,
          error: errorMessage,
          duration,
        })

        throw error
      }
    }
  }

  // Chain methods (select, where, etc.)
  return new Proxy(table, {
    get(target, prop) {
      if (prop in wrapped) {
        return wrapped[prop]
      }
      return target[prop as keyof typeof target]
    },
  })
}

/**
 * Map operation name to OperationType
 */
function mapOperationType(opName: string): OperationType {
  const mapping: Record<string, OperationType> = {
    select: 'SELECT',
    insert: 'INSERT',
    update: 'UPDATE',
    upsert: 'UPSERT',
    delete: 'DELETE',
  }
  return mapping[opName] || 'SELECT'
}

/**
 * Sanitize arguments for logging (remove sensitive data)
 */
function sanitizeArgs(args: any[]): any[] {
  return args.map((arg) => {
    if (typeof arg !== 'object' || arg === null) {
      return arg
    }

    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'api_key', 'auth']
    const sanitized: Record<string, any> = {}

    for (const [key, value] of Object.entries(arg)) {
      if (sensitiveFields.some((field) => key.toLowerCase().includes(field))) {
        sanitized[key] = '[REDACTED]'
      } else {
        sanitized[key] = value
      }
    }

    return sanitized
  })
}

/**
 * Helper to create an agent client for analytics operations
 */
export async function getAnalyticsAgentClient(userId?: string): Promise<AgentClient> {
  return getSupabaseAgentClient({
    agentId: 'analytics-agent',
    agentVersion: '1.0.0',
    purpose: 'Analyze poll and vote data',
    useServiceRole: true,
    enableAudit: true,
    rateLimit: {
      maxRequests: 100,
      windowMs: 60 * 1000, // 1 minute
    },
    ...(userId !== undefined && { userId }),
  })
}

/**
 * Helper to create an agent client for integrity operations
 */
export async function getIntegrityAgentClient(userId?: string): Promise<AgentClient> {
  return getSupabaseAgentClient({
    agentId: 'integrity-agent',
    agentVersion: '1.0.0',
    purpose: 'Vote integrity analysis and bot detection',
    useServiceRole: true,
    enableAudit: true,
    rateLimit: {
      maxRequests: 50,
      windowMs: 60 * 1000, // 1 minute
    },
    ...(userId !== undefined && { userId }),
  })
}

/**
 * Helper to create an agent client for user operations
 */
export async function getUserAgentClient(userId: string): Promise<AgentClient> {
  return getSupabaseAgentClient({
    agentId: 'user-agent',
    agentVersion: '1.0.0',
    purpose: 'User profile and preference operations',
    useServiceRole: false, // Use user session
    userId,
    enableAudit: true,
    rateLimit: {
      maxRequests: 200,
      windowMs: 60 * 1000, // 1 minute
    },
  })
}
