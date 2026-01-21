/**
 * Agent Types
 *
 * Type definitions for AI agent operations with Supabase
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

export type AgentId = string
export type AgentVersion = string
export type OperationType =
  | 'SELECT'
  | 'INSERT'
  | 'UPDATE'
  | 'DELETE'
  | 'UPSERT'
  | 'FUNCTION_CALL'
  | 'STORED_PROCEDURE'

export type ResultStatus = 'success' | 'error' | 'rate_limited' | 'unauthorized'

export interface AgentContext {
  agentId: AgentId
  agentVersion?: AgentVersion
  purpose?: string
  userId?: string
  requestId?: string
  metadata?: Record<string, unknown>
}

export interface AgentOperation {
  operationType: OperationType
  tableName?: string
  functionName?: string
  query?: string
  filters?: Record<string, unknown>
  data?: Record<string, unknown>
  metadata?: Record<string, unknown>
}

export interface AgentOperationResult {
  status: ResultStatus
  data?: unknown
  error?: string
  rowCount?: number
  duration?: number
}

export interface AgentOperationLog {
  id?: string
  agentId: AgentId
  agentVersion?: AgentVersion
  operationType: OperationType
  tableName?: string
  functionName?: string
  userContext?: string
  requestMetadata?: Record<string, unknown>
  resultStatus: ResultStatus
  errorMessage?: string
  rowCount?: number
  duration?: number
  createdAt?: string
}

export interface AgentClientOptions {
  agentId: AgentId
  agentVersion?: AgentVersion
  purpose?: string
  useServiceRole?: boolean
  userId?: string
  rateLimit?: {
    maxRequests: number
    windowMs: number
  }
  enableAudit?: boolean
}

export interface AgentClient {
  client: SupabaseClient<Database>
  context: AgentContext
  logOperation: (operation: AgentOperation, result: AgentOperationResult) => Promise<void>
}
