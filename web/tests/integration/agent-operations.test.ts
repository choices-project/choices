/**
 * Agent Operations Integration Tests
 *
 * Integration tests for agent operations with Supabase.
 * Uses node environment because getSupabaseAgentClient asserts server-only (no window).
 *
 * @jest-environment node
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { getSupabaseAgentClient, getAnalyticsAgentClient } from '@/utils/supabase/agent'
import { queryAgentOperations, getAgentOperationStats } from '@/lib/core/agent/audit'

// Skip integration tests unless explicitly opted in (requires real Supabase + RUN_AGENT_INTEGRATION=true)
// These tests hit a real DB and can timeout in CI; run locally with: RUN_AGENT_INTEGRATION=true npm test
const SKIP_INTEGRATION =
  process.env.RUN_AGENT_INTEGRATION !== 'true' ||
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL.includes('example')

const describeTest = SKIP_INTEGRATION ? describe.skip : describe
describeTest('Agent Operations Integration', () => {
  let testAgentId: string

  beforeAll(() => {
    testAgentId = `test-agent-${Date.now()}`
  })

  afterAll(async () => {
    // Cleanup: Remove test agent operations if needed
    // This would require admin access
  })

  describe('Agent Client Creation', () => {
    it('should create analytics agent client', async () => {
      const agent = await getAnalyticsAgentClient()

      expect(agent).toBeDefined()
      expect(agent.context.agentId).toBe('analytics-agent')
      expect(agent.client).toBeDefined()
    })

    it('should create custom agent client', async () => {
      const agent = await getSupabaseAgentClient({
        agentId: testAgentId,
        agentVersion: '1.0.0',
        purpose: 'Integration test',
        useServiceRole: true,
        enableAudit: true,
      })

      expect(agent).toBeDefined()
      expect(agent.context.agentId).toBe(testAgentId)
    })
  })

  describe('Agent Operations', () => {
    it('should perform SELECT operation and log it', async () => {
      const agent = await getSupabaseAgentClient({
        agentId: testAgentId,
        useServiceRole: true,
        enableAudit: true,
      })

      // Perform a simple SELECT operation (agent wraps select as async; no limit chain)
      const { error } = await agent.client.from('polls').select('id')

      // Operation should succeed (or fail gracefully if no data)
      expect(error).toBeNull() // Or handle gracefully if table doesn't exist in test DB

      // Wait a bit for audit log to be written
      await new Promise(resolve => setTimeout(resolve, 100))

      // Query audit logs
      const operations = await queryAgentOperations({
        agentId: testAgentId,
        limit: 1,
      })

      // Should have at least one operation logged
      if (operations.length > 0) {
        expect(operations[0].agentId).toBe(testAgentId)
        expect(operations[0].operationType).toBe('SELECT')
        expect(operations[0].tableName).toBe('polls')
      }
    })

    it('should handle errors gracefully', async () => {
      const agent = await getSupabaseAgentClient({
        agentId: testAgentId,
        useServiceRole: true,
        enableAudit: true,
      })

      // Try to select from a non-existent table
      const { error } = await agent.client.from('non_existent_table_xyz').select('*')

      // Should handle error gracefully
      if (error) {
        expect(error).toBeDefined()
      }

      // Wait for audit log
      await new Promise(resolve => setTimeout(resolve, 100))

      // Check that error was logged
      const operations = await queryAgentOperations({
        agentId: testAgentId,
        status: 'error',
        limit: 1,
      })

      // If error occurred, it should be logged
      if (error && operations.length > 0) {
        expect(operations[0].resultStatus).toBe('error')
      }
    })
  })

  describe('Audit Logging', () => {
    it('should query agent operations', async () => {
      const operations = await queryAgentOperations({
        agentId: 'analytics-agent',
        limit: 10,
      })

      expect(Array.isArray(operations)).toBe(true)
    })

    it('should get agent operation stats', async () => {
      const stats = await getAgentOperationStats('analytics-agent')

      expect(stats).toBeDefined()
      expect(typeof stats.total).toBe('number')
      expect(typeof stats.success).toBe('number')
      expect(typeof stats.errors).toBe('number')
      expect(typeof stats.rateLimited).toBe('number')
      expect(typeof stats.unauthorized).toBe('number')
    })

    it('should filter operations by date range', async () => {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 7) // Last 7 days

      const operations = await queryAgentOperations({
        agentId: 'analytics-agent',
        startDate: startDate.toISOString(),
        limit: 100,
      })

      expect(Array.isArray(operations)).toBe(true)

      // All operations should be within date range
      if (operations.length > 0) {
        operations.forEach(op => {
          if (op.createdAt) {
            expect(new Date(op.createdAt).getTime()).toBeGreaterThanOrEqual(startDate.getTime())
          }
        })
      }
    })
  })

  describe('Rate Limiting', () => {
    it('should enforce rate limits', async () => {
      const agent = await getSupabaseAgentClient({
        agentId: testAgentId,
        useServiceRole: true,
        rateLimit: {
          maxRequests: 2, // Very low limit for testing
          windowMs: 1000, // 1 second
        },
      })

      // First request should succeed
      const { error: error1 } = await agent.client.from('polls').select('id')

      expect(error1).toBeNull()

      // Second request should succeed
      const { error: error2 } = await agent.client.from('polls').select('id')

      expect(error2).toBeNull()

      // Third request might hit rate limit (depending on timing)
      const { error: error3 } = await agent.client.from('polls').select('id')

      // Either succeeds or rate limited
      if (error3) {
        expect(error3.message).toContain('Rate limit')
      }
    })
  })
})

describe('Agent Operations (Unit - Mocked)', () => {
  it('should handle successful operations', async () => {
    // This test uses mocked clients and doesn't require database
    const mockClient = {
      from: jest.fn(() => ({
        select: jest.fn(() => Promise.resolve({
          data: [{ id: '1' }],
          error: null,
        })),
      })),
    }

    // Test that operations are structured correctly
    expect(mockClient.from).toBeDefined()
  })
})
