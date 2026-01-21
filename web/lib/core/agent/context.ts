/**
 * Agent Context Management
 *
 * Utilities for creating and managing agent operation contexts
 */

import { logger } from '@/lib/utils/logger'

import type { AgentContext, AgentId, AgentVersion } from './types'

/**
 * Create an agent operation context
 */
export function createAgentContext(
  agentId: AgentId,
  options?: {
    agentVersion?: AgentVersion
    purpose?: string
    userId?: string
    requestId?: string
    metadata?: Record<string, unknown>
  }
): AgentContext {
  const context: AgentContext = {
    agentId,
    agentVersion: options?.agentVersion,
    purpose: options?.purpose,
    userId: options?.userId,
    requestId: options?.requestId || generateRequestId(),
    metadata: options?.metadata || {},
  }

  logger.debug('Agent context created', {
    agentId: context.agentId,
    agentVersion: context.agentVersion,
    purpose: context.purpose,
    hasUserId: !!context.userId,
    requestId: context.requestId,
  })

  return context
}

/**
 * Generate a unique request ID for tracking operations
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Validate agent context
 */
export function validateAgentContext(context: AgentContext): boolean {
  if (!context.agentId || typeof context.agentId !== 'string') {
    logger.error('Invalid agent context: missing or invalid agentId', { context })
    return false
  }

  if (context.agentId.length > 100) {
    logger.warn('Agent ID is unusually long', { agentId: context.agentId })
  }

  return true
}

/**
 * Enrich context with additional metadata
 */
export function enrichAgentContext(
  context: AgentContext,
  additionalMetadata: Record<string, unknown>
): AgentContext {
  return {
    ...context,
    metadata: {
      ...context.metadata,
      ...additionalMetadata,
    },
  }
}
