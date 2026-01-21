/**
 * Agent Audit System
 *
 * Comprehensive audit logging for all agent operations
 */

import { logger } from '@/lib/utils/logger'
import { getSupabaseAdminClient } from '@/utils/supabase/server'

import type {
  AgentContext,
  AgentOperation,
  AgentOperationLog,
  AgentOperationResult,
  OperationType,
  ResultStatus,
} from './types'

/**
 * Log an agent operation to the audit system
 */
export async function logAgentOperation(
  context: AgentContext,
  operation: AgentOperation,
  result: AgentOperationResult
): Promise<void> {
  try {
    const adminClient = await getSupabaseAdminClient()

    const logEntry: Omit<AgentOperationLog, 'id' | 'createdAt'> = {
      agentId: context.agentId,
      agentVersion: context.agentVersion,
      operationType: operation.operationType,
      tableName: operation.tableName,
      functionName: operation.functionName,
      userContext: context.userId,
      requestMetadata: {
        ...context.metadata,
        ...operation.metadata,
        requestId: context.requestId,
        purpose: context.purpose,
      },
      resultStatus: result.status,
      errorMessage: result.error,
      rowCount: result.rowCount,
      duration: result.duration,
    }

    const { error } = await adminClient
      .from('agent_operations')
      .insert(logEntry)

    if (error) {
      // Fallback to logger if database insert fails
      logger.error('Failed to log agent operation to database', {
        error: error.message,
        context: {
          agentId: context.agentId,
          operationType: operation.operationType,
          tableName: operation.tableName,
        },
      })

      // Still log to console for debugging
      logger.warn('Agent operation (fallback logging)', {
        ...logEntry,
        timestamp: new Date().toISOString(),
      })
    } else {
      logger.debug('Agent operation logged', {
        agentId: context.agentId,
        operationType: operation.operationType,
        tableName: operation.tableName,
        status: result.status,
      })
    }
  } catch (error) {
    // Ensure we always log, even if database is unavailable
    logger.error('Exception logging agent operation', {
      error: error instanceof Error ? error.message : String(error),
      context: {
        agentId: context.agentId,
        operationType: operation.operationType,
      },
    })
  }
}

/**
 * Query agent operations from audit log
 */
export async function queryAgentOperations(
  filters?: {
    agentId?: string
    operationType?: OperationType
    tableName?: string
    userId?: string
    status?: ResultStatus
    startDate?: string
    endDate?: string
    limit?: number
  }
): Promise<AgentOperationLog[]> {
  try {
    const adminClient = await getSupabaseAdminClient()

    let query = adminClient
      .from('agent_operations')
      .select('*')
      .order('created_at', { ascending: false })

    if (filters?.agentId) {
      query = query.eq('agent_id', filters.agentId)
    }

    if (filters?.operationType) {
      query = query.eq('operation_type', filters.operationType)
    }

    if (filters?.tableName) {
      query = query.eq('table_name', filters.tableName)
    }

    if (filters?.userId) {
      query = query.eq('user_context', filters.userId)
    }

    if (filters?.status) {
      query = query.eq('result_status', filters.status)
    }

    if (filters?.startDate) {
      query = query.gte('created_at', filters.startDate)
    }

    if (filters?.endDate) {
      query = query.lte('created_at', filters.endDate)
    }

    if (filters?.limit) {
      query = query.limit(filters.limit)
    } else {
      query = query.limit(100) // Default limit
    }

    const { data, error } = await query

    if (error) {
      logger.error('Failed to query agent operations', {
        error: error.message,
        filters,
      })
      return []
    }

    return (data as AgentOperationLog[]) || []
  } catch (error) {
    logger.error('Exception querying agent operations', {
      error: error instanceof Error ? error.message : String(error),
      filters,
    })
    return []
  }
}

/**
 * Get agent operation statistics
 */
export async function getAgentOperationStats(
  agentId: string,
  timeWindow?: { start: string; end: string }
): Promise<{
  total: number
  success: number
  errors: number
  rateLimited: number
  unauthorized: number
  averageDuration?: number
}> {
  try {
    const operations = await queryAgentOperations({
      agentId,
      startDate: timeWindow?.start,
      endDate: timeWindow?.end,
      limit: 10000, // Get enough for stats
    })

    const stats = {
      total: operations.length,
      success: operations.filter((op) => op.resultStatus === 'success').length,
      errors: operations.filter((op) => op.resultStatus === 'error').length,
      rateLimited: operations.filter((op) => op.resultStatus === 'rate_limited').length,
      unauthorized: operations.filter((op) => op.resultStatus === 'unauthorized').length,
      averageDuration: undefined as number | undefined,
    }

    const durations = operations
      .filter((op) => op.duration !== undefined && op.duration !== null)
      .map((op) => op.duration!)

    if (durations.length > 0) {
      stats.averageDuration =
        durations.reduce((sum, d) => sum + d, 0) / durations.length
    }

    return stats
  } catch (error) {
    logger.error('Exception getting agent operation stats', {
      error: error instanceof Error ? error.message : String(error),
      agentId,
    })
    return {
      total: 0,
      success: 0,
      errors: 0,
      rateLimited: 0,
      unauthorized: 0,
    }
  }
}
