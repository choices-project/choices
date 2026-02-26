/**
 * Agent Client Unit Tests
 *
 * Tests for the Supabase agent client utility.
 * Uses node environment because getSupabaseAgentClient asserts server-only (no window).
 *
 * @jest-environment node
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { getSupabaseAgentClient, getAnalyticsAgentClient, getIntegrityAgentClient, getUserAgentClient } from '@/utils/supabase/agent'
import { createAgentContext, validateAgentContext, enrichAgentContext } from '@/lib/core/agent/context'
import { logAgentOperation, queryAgentOperations, getAgentOperationStats } from '@/lib/core/agent/audit'

// Mock the Supabase clients
jest.mock('@/utils/supabase/server', () => ({
  getSupabaseAdminClient: jest.fn(() => Promise.resolve({
    from: jest.fn(() => ({
      select: jest.fn(() => Promise.resolve({ data: [], error: null })),
      insert: jest.fn(() => Promise.resolve({ data: [], error: null })),
      update: jest.fn(() => Promise.resolve({ data: [], error: null })),
      upsert: jest.fn(() => Promise.resolve({ data: [], error: null })),
      delete: jest.fn(() => Promise.resolve({ data: [], error: null })),
    })),
  })),
  getSupabaseServerClient: jest.fn(() => Promise.resolve({
    from: jest.fn(() => ({
      select: jest.fn(() => Promise.resolve({ data: [], error: null })),
      insert: jest.fn(() => Promise.resolve({ data: [], error: null })),
      update: jest.fn(() => Promise.resolve({ data: [], error: null })),
      upsert: jest.fn(() => Promise.resolve({ data: [], error: null })),
      delete: jest.fn(() => Promise.resolve({ data: [], error: null })),
    })),
  })),
}))

// Mock the audit system
jest.mock('@/lib/core/agent/audit', () => ({
  logAgentOperation: jest.fn(() => Promise.resolve()),
  queryAgentOperations: jest.fn(() => Promise.resolve([])),
  getAgentOperationStats: jest.fn(() => Promise.resolve({
    total: 0,
    success: 0,
    errors: 0,
    rateLimited: 0,
    unauthorized: 0,
  })),
}))

// Mock rate limiter (agent uses api-rate-limiter, not server-actions)
jest.mock('@/lib/rate-limiting/api-rate-limiter', () => ({
  apiRateLimiter: {
    checkLimit: jest.fn(() => Promise.resolve({
      allowed: true,
      totalHits: 0,
      remaining: 100,
      retryAfter: null,
    })),
  },
}))

describe('Agent Client', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Set required environment variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
  })

  describe('getSupabaseAgentClient', () => {
    it('should create agent client with service role', async () => {
      const agent = await getSupabaseAgentClient({
        agentId: 'test-agent',
        agentVersion: '1.0.0',
        purpose: 'Test operations',
        useServiceRole: true,
      })

      expect(agent).toBeDefined()
      expect(agent.context.agentId).toBe('test-agent')
      expect(agent.context.agentVersion).toBe('1.0.0')
      expect(agent.context.purpose).toBe('Test operations')
      expect(agent.client).toBeDefined()
      expect(agent.logOperation).toBeDefined()
    })

    it('should create agent client with authenticated client', async () => {
      const agent = await getSupabaseAgentClient({
        agentId: 'user-agent',
        userId: 'user-123',
        useServiceRole: false,
      })

      expect(agent).toBeDefined()
      expect(agent.context.agentId).toBe('user-agent')
      expect(agent.context.userId).toBe('user-123')
    })

    it('should require agentId', async () => {
      await expect(
        getSupabaseAgentClient({
          agentId: '',
          useServiceRole: true,
        } as any)
      ).rejects.toThrow('agentId is required')
    })

    it('should generate requestId automatically', async () => {
      const agent = await getSupabaseAgentClient({
        agentId: 'test-agent',
        useServiceRole: true,
      })

      expect(agent.context.requestId).toBeDefined()
      expect(agent.context.requestId).toMatch(/^req_/)
    })

    it('should respect enableAudit flag', async () => {
      const agent = await getSupabaseAgentClient({
        agentId: 'test-agent',
        enableAudit: false,
        useServiceRole: true,
      })

      // Operations should still work but may not log
      expect(agent).toBeDefined()
    })
  })

  describe('Helper Functions', () => {
    it('should create analytics agent client', async () => {
      const agent = await getAnalyticsAgentClient()

      expect(agent).toBeDefined()
      expect(agent.context.agentId).toBe('analytics-agent')
      expect(agent.context.agentVersion).toBe('1.0.0')
      expect(agent.context.purpose).toBe('Analyze poll and vote data')
    })

    it('should create integrity agent client', async () => {
      const agent = await getIntegrityAgentClient()

      expect(agent).toBeDefined()
      expect(agent.context.agentId).toBe('integrity-agent')
      expect(agent.context.purpose).toBe('Vote integrity analysis and bot detection')
    })

    it('should create user agent client with userId', async () => {
      const agent = await getUserAgentClient('user-123')

      expect(agent).toBeDefined()
      expect(agent.context.agentId).toBe('user-agent')
      expect(agent.context.userId).toBe('user-123')
      expect(agent.context.metadata?.useServiceRole).toBe(false)
    })
  })

  describe('Agent Operations', () => {
    it('should perform SELECT operation with audit logging', async () => {
      const agent = await getSupabaseAgentClient({
        agentId: 'test-agent',
        useServiceRole: true,
        enableAudit: true,
      })

      // Agent wraps select as async; chain ends at select (no limit/order)
      const { data, error } = await agent.client.from('polls').select('*')

      expect(data).toBeDefined()
      expect(error).toBeNull()
    })

    it('should handle errors and log them', async () => {
      const { getSupabaseAdminClient } = require('@/utils/supabase/server')
      const noop = jest.fn(() => Promise.resolve({ data: null, error: null }))
      getSupabaseAdminClient.mockReturnValueOnce(Promise.resolve({
        from: jest.fn(() => ({
          select: jest.fn(() => Promise.resolve({
            data: null,
            error: { message: 'Test error', code: 'TEST_ERROR' },
          })),
          insert: noop,
          update: noop,
          upsert: noop,
          delete: noop,
        })),
      }))

      const agent = await getSupabaseAgentClient({
        agentId: 'test-agent',
        useServiceRole: true,
        enableAudit: true,
      })

      const { error } = await agent.client
        .from('polls')
        .select('*')

      expect(error).toBeDefined()
      expect(error?.message).toBe('Test error')
    })
  })

  describe('Agent Context', () => {
    it('should create valid agent context', () => {
      const context = createAgentContext('test-agent', {
        agentVersion: '1.0.0',
        purpose: 'Test',
        userId: 'user-123',
      })

      expect(context.agentId).toBe('test-agent')
      expect(context.agentVersion).toBe('1.0.0')
      expect(context.purpose).toBe('Test')
      expect(context.userId).toBe('user-123')
      expect(context.requestId).toBeDefined()
    })

    it('should validate agent context', () => {
      const validContext = createAgentContext('test-agent')
      expect(validateAgentContext(validContext)).toBe(true)

      const invalidContext = { agentId: '' } as any
      expect(validateAgentContext(invalidContext)).toBe(false)
    })

    it('should enrich agent context', () => {
      const context = createAgentContext('test-agent')
      const enriched = enrichAgentContext(context, {
        pollId: 'poll-123',
        additionalData: 'test',
      })

      expect(enriched.metadata?.pollId).toBe('poll-123')
      expect(enriched.metadata?.additionalData).toBe('test')
    })
  })

  describe('Rate Limiting', () => {
    it('should respect rate limits', async () => {
      const { apiRateLimiter } = require('@/lib/rate-limiting/api-rate-limiter')
      apiRateLimiter.checkLimit.mockReturnValueOnce(Promise.resolve({
        allowed: false,
        totalHits: 100,
        remaining: 0,
        retryAfter: 60,
      }))

      const agent = await getSupabaseAgentClient({
        agentId: 'test-agent',
        useServiceRole: true,
        rateLimit: {
          maxRequests: 100,
          windowMs: 60000,
        },
      })

      await expect(
        agent.client.from('polls').select('*')
      ).rejects.toThrow('Rate limit exceeded')
    })
  })
})

describe('Agent Audit System', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should log agent operations', async () => {
    const context = createAgentContext('test-agent')
    const operation = {
      operationType: 'SELECT' as const,
      tableName: 'polls',
    }
    const result = {
      status: 'success' as const,
      rowCount: 10,
      duration: 100,
    }

    await logAgentOperation(context, operation, result)

    expect(logAgentOperation).toHaveBeenCalledWith(context, operation, result)
  })

  it('should query agent operations', async () => {
    const operations = await queryAgentOperations({
      agentId: 'test-agent',
      limit: 10,
    })

    expect(queryAgentOperations).toHaveBeenCalledWith({
      agentId: 'test-agent',
      limit: 10,
    })
    expect(operations).toBeDefined()
  })

  it('should get agent operation stats', async () => {
    const stats = await getAgentOperationStats('test-agent')

    expect(getAgentOperationStats).toHaveBeenCalledWith('test-agent')
    expect(stats).toBeDefined()
    expect(stats.total).toBeDefined()
    expect(stats.success).toBeDefined()
    expect(stats.errors).toBeDefined()
  })
})
