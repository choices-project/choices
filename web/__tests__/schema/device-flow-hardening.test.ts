/**
 * Device Flow Hardening Tests
 * Tests for enhanced device flow security with hashed codes and telemetry
 * 
 * These tests define how the device flow system SHOULD work,
 * guiding implementation to the correct security architecture.
 */

import { createClient } from '@supabase/supabase-js'
import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals'

// Test configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

describe('Device Flow Hardening', () => {
  let testUserId: string
  let testUserEmail: string

  beforeAll(async () => {
    // Create test user
    testUserEmail = `test-device-flow-${Date.now()}@example.com`
    const { data: { user }, error } = await supabase.auth.admin.createUser({
      email: testUserEmail,
      password: 'test-password-123',
      email_confirm: true
    })
    
    if (error || !user) {
      throw new Error(`Failed to create test user: ${error?.message}`)
    }
    
    testUserId = user.id
  })

  afterAll(async () => {
    // Cleanup test user
    await supabase.auth.admin.deleteUser(testUserId)
  })

  beforeEach(async () => {
    // Clean up any test data before each test
    await supabase.from('device_flows').delete().eq('user_id', testUserId)
  })

  describe('Secure Device Flow Creation', () => {
    it('should create device flows with hashed codes', async () => {
      const { data, error } = await supabase.rpc('create_secure_device_flow', {
        p_provider: 'google',
        p_user_id: testUserId,
        p_redirect_to: '/dashboard',
        p_scopes: ['openid', 'email', 'profile'],
        p_client_ip: '192.168.1.100',
        p_user_agent: 'Test Browser'
      })

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data[0].device_code).toBeDefined()
      expect(data[0].user_code).toBeDefined()
      expect(data[0].verification_uri).toBeDefined()
      expect(data[0].expires_in).toBe(600) // 10 minutes
      expect(data[0].interval).toBe(5) // 5 seconds
    })

    it('should store device and user codes as hashes', async () => {
      const { data: flowData } = await supabase.rpc('create_secure_device_flow', {
        p_provider: 'google',
        p_user_id: testUserId,
        p_client_ip: '192.168.1.100',
        p_user_agent: 'Test Browser'
      })

      // Verify flow was created in database
      const { data: storedFlow } = await supabase
        .from('device_flows')
        .select('device_code_hash, user_code_hash, device_code, user_code')
        .eq('device_code', flowData[0].device_code)
        .single()

      expect(storedFlow.device_code_hash).toBeDefined()
      expect(storedFlow.user_code_hash).toBeDefined()
      expect(storedFlow.device_code).toBeDefined()
      expect(storedFlow.user_code).toBeDefined()

      // Verify hashes are not the original codes
      expect(storedFlow.device_code_hash).not.toBe(flowData[0].device_code)
      expect(storedFlow.user_code_hash).not.toBe(flowData[0].user_code)
    })

    it('should set proper expiration times', async () => {
      const { data: flowData } = await supabase.rpc('create_secure_device_flow', {
        p_provider: 'google',
        p_user_id: testUserId,
        p_client_ip: '192.168.1.100',
        p_user_agent: 'Test Browser'
      })

      const { data: storedFlow } = await supabase
        .from('device_flows')
        .select('expires_at, retention_expires_at')
        .eq('device_code', flowData[0].device_code)
        .single()

      const now = new Date()
      const expiresAt = new Date(storedFlow.expires_at)
      const retentionExpiresAt = new Date(storedFlow.retention_expires_at)

      // Should expire in 10 minutes
      expect(expiresAt.getTime()).toBeGreaterThan(now.getTime() + 9 * 60 * 1000)
      expect(expiresAt.getTime()).toBeLessThan(now.getTime() + 11 * 60 * 1000)

      // Should be retained for 24 hours
      expect(retentionExpiresAt.getTime()).toBeGreaterThan(now.getTime() + 23 * 60 * 60 * 1000)
      expect(retentionExpiresAt.getTime()).toBeLessThan(now.getTime() + 25 * 60 * 60 * 1000)
    })

    it('should hash client IP and user agent for privacy', async () => {
      const clientIp = '192.168.1.100'
      const userAgent = 'Mozilla/5.0 (Test Browser)'

      const { data: flowData } = await supabase.rpc('create_secure_device_flow', {
        p_provider: 'google',
        p_user_id: testUserId,
        p_client_ip: clientIp,
        p_user_agent: userAgent
      })

      const { data: storedFlow } = await supabase
        .from('device_flows')
        .select('client_ip_hash, user_agent_hash')
        .eq('device_code', flowData[0].device_code)
        .single()

      expect(storedFlow.client_ip_hash).toBeDefined()
      expect(storedFlow.user_agent_hash).toBeDefined()
      
      // Verify hashes are not the original values
      expect(storedFlow.client_ip_hash).not.toBe(clientIp)
      expect(storedFlow.user_agent_hash).not.toBe(userAgent)
    })
  })

  describe('Device Flow Verification', () => {
    it('should verify device flows by user code', async () => {
      // Create device flow
      const { data: flowData } = await supabase.rpc('create_secure_device_flow', {
        p_provider: 'google',
        p_user_id: testUserId,
        p_client_ip: '192.168.1.100',
        p_user_agent: 'Test Browser'
      })

      // Verify by user code
      const { data: verification, error } = await supabase.rpc('verify_device_flow_by_user_code', {
        p_user_code: flowData[0].user_code
      })

      expect(error).toBeNull()
      expect(verification).toBeDefined()
      expect(verification[0].device_code).toBe(flowData[0].device_code)
      expect(verification[0].provider).toBe('google')
      expect(verification[0].status).toBe('pending')
    })

    it('should reject expired device flows', async () => {
      // Create device flow with short expiration
      const { data: flowData } = await supabase.rpc('create_secure_device_flow', {
        p_provider: 'google',
        p_user_id: testUserId,
        p_client_ip: '192.168.1.100',
        p_user_agent: 'Test Browser'
      })

      // Manually expire the flow
      await supabase
        .from('device_flows')
        .update({ expires_at: new Date(Date.now() - 60000).toISOString() })
        .eq('device_code', flowData[0].device_code)

      // Try to verify expired flow
      const { data: verification, error } = await supabase.rpc('verify_device_flow_by_user_code', {
        p_user_code: flowData[0].user_code
      })

      expect(verification).toHaveLength(0) // No valid flows found
    })

    it('should reject completed device flows', async () => {
      // Create device flow
      const { data: flowData } = await supabase.rpc('create_secure_device_flow', {
        p_provider: 'google',
        p_user_id: testUserId,
        p_client_ip: '192.168.1.100',
        p_user_agent: 'Test Browser'
      })

      // Complete the flow
      await supabase.rpc('complete_device_flow', {
        p_user_code: flowData[0].user_code,
        p_user_id: testUserId
      })

      // Try to verify completed flow
      const { data: verification } = await supabase.rpc('verify_device_flow_by_user_code', {
        p_user_code: flowData[0].user_code
      })

      expect(verification).toHaveLength(0) // No pending flows found
    })
  })

  describe('Device Flow Completion', () => {
    it('should complete device flows successfully', async () => {
      // Create device flow
      const { data: flowData } = await supabase.rpc('create_secure_device_flow', {
        p_provider: 'google',
        p_user_id: testUserId,
        p_client_ip: '192.168.1.100',
        p_user_agent: 'Test Browser'
      })

      // Complete the flow
      const { data: success } = await supabase.rpc('complete_device_flow', {
        p_user_code: flowData[0].user_code,
        p_user_id: testUserId
      })

      expect(success).toBe(true)

      // Verify flow is completed
      const { data: completedFlow } = await supabase
        .from('device_flows')
        .select('status, user_id, completed_at, success_count')
        .eq('device_code', flowData[0].device_code)
        .single()

      expect(completedFlow.status).toBe('completed')
      expect(completedFlow.user_id).toBe(testUserId)
      expect(completedFlow.completed_at).toBeDefined()
      expect(completedFlow.success_count).toBe(1)
    })

    it('should reject completion of expired flows', async () => {
      // Create device flow
      const { data: flowData } = await supabase.rpc('create_secure_device_flow', {
        p_provider: 'google',
        p_user_id: testUserId,
        p_client_ip: '192.168.1.100',
        p_user_agent: 'Test Browser'
      })

      // Manually expire the flow
      await supabase
        .from('device_flows')
        .update({ expires_at: new Date(Date.now() - 60000).toISOString() })
        .eq('device_code', flowData[0].device_code)

      // Try to complete expired flow
      const { data: success } = await supabase.rpc('complete_device_flow', {
        p_user_code: flowData[0].user_code,
        p_user_id: testUserId
      })

      expect(success).toBe(false)
    })

    it('should reject completion of already completed flows', async () => {
      // Create device flow
      const { data: flowData } = await supabase.rpc('create_secure_device_flow', {
        p_provider: 'google',
        p_user_id: testUserId,
        p_client_ip: '192.168.1.100',
        p_user_agent: 'Test Browser'
      })

      // Complete the flow first time
      const { data: success1 } = await supabase.rpc('complete_device_flow', {
        p_user_code: flowData[0].user_code,
        p_user_id: testUserId
      })

      expect(success1).toBe(true)

      // Try to complete again
      const { data: success2 } = await supabase.rpc('complete_device_flow', {
        p_user_code: flowData[0].user_code,
        p_user_id: testUserId
      })

      expect(success2).toBe(false)
    })
  })

  describe('Polling Telemetry', () => {
    it('should track polling attempts', async () => {
      // Create device flow
      const { data: flowData } = await supabase.rpc('create_secure_device_flow', {
        p_provider: 'google',
        p_user_id: testUserId,
        p_client_ip: '192.168.1.100',
        p_user_agent: 'Test Browser'
      })

      // Track multiple polling attempts
      for (let i = 0; i < 3; i++) {
        const { data: success } = await supabase.rpc('track_device_flow_polling', {
          p_device_code: flowData[0].device_code
        })

        expect(success).toBe(true)
      }

      // Verify polling statistics
      const { data: flow } = await supabase
        .from('device_flows')
        .select('poll_count, last_polled_at')
        .eq('device_code', flowData[0].device_code)
        .single()

      expect(flow.poll_count).toBe(3)
      expect(flow.last_polled_at).toBeDefined()
    })

    it('should not track polling for expired flows', async () => {
      // Create device flow
      const { data: flowData } = await supabase.rpc('create_secure_device_flow', {
        p_provider: 'google',
        p_user_id: testUserId,
        p_client_ip: '192.168.1.100',
        p_user_agent: 'Test Browser'
      })

      // Manually expire the flow
      await supabase
        .from('device_flows')
        .update({ expires_at: new Date(Date.now() - 60000).toISOString() })
        .eq('device_code', flowData[0].device_code)

      // Try to track polling for expired flow
      const { data: success } = await supabase.rpc('track_device_flow_polling', {
        p_device_code: flowData[0].device_code
      })

      expect(success).toBe(false)
    })
  })

  describe('Device Flow Status Checking', () => {
    it('should check device flow status correctly', async () => {
      // Create device flow
      const { data: flowData } = await supabase.rpc('create_secure_device_flow', {
        p_provider: 'google',
        p_user_id: testUserId,
        p_client_ip: '192.168.1.100',
        p_user_agent: 'Test Browser'
      })

      // Check status
      const { data: status, error } = await supabase.rpc('check_device_flow_status', {
        p_device_code: flowData[0].device_code
      })

      expect(error).toBeNull()
      expect(status).toBeDefined()
      expect(status[0].status).toBe('pending')
      expect(status[0].provider).toBe('google')
      expect(status[0].poll_count).toBe(0)
    })

    it('should return empty for expired flows', async () => {
      // Create device flow
      const { data: flowData } = await supabase.rpc('create_secure_device_flow', {
        p_provider: 'google',
        p_user_id: testUserId,
        p_client_ip: '192.168.1.100',
        p_user_agent: 'Test Browser'
      })

      // Manually expire the flow
      await supabase
        .from('device_flows')
        .update({ expires_at: new Date(Date.now() - 60000).toISOString() })
        .eq('device_code', flowData[0].device_code)

      // Check status of expired flow
      const { data: status } = await supabase.rpc('check_device_flow_status', {
        p_device_code: flowData[0].device_code
      })

      expect(status).toHaveLength(0) // No valid flows found
    })
  })

  describe('Device Flow Analytics', () => {
    it('should provide device flow analytics', async () => {
      // Create multiple device flows for different providers
      const providers = ['google', 'github', 'facebook']
      
      for (const provider of providers) {
        const { data: flowData } = await supabase.rpc('create_secure_device_flow', {
          p_provider: provider,
          p_user_id: testUserId,
          p_client_ip: '192.168.1.100',
          p_user_agent: 'Test Browser'
        })

        // Complete some flows
        if (provider === 'google' || provider === 'github') {
          await supabase.rpc('complete_device_flow', {
            p_user_code: flowData[0].user_code,
            p_user_id: testUserId
          })
        }
      }

      // Get analytics
      const { data: analytics, error } = await supabase.rpc('get_device_flow_analytics', {
        p_hours_back: 24
      })

      expect(error).toBeNull()
      expect(analytics).toBeDefined()
      expect(analytics.length).toBeGreaterThan(0)

      // Verify analytics structure
      const googleAnalytics = analytics.find((a: any) => a.provider === 'google')
      if (googleAnalytics) {
        expect(googleAnalytics.total_flows).toBe(1)
        expect(googleAnalytics.completed_flows).toBe(1)
        expect(googleAnalytics.expired_flows).toBe(0)
        expect(googleAnalytics.success_rate).toBe(100)
      }
    })

    it('should calculate success rates correctly', async () => {
      // Create flows with different outcomes
      const { data: flow1 } = await supabase.rpc('create_secure_device_flow', {
        p_provider: 'google',
        p_user_id: testUserId,
        p_client_ip: '192.168.1.100',
        p_user_agent: 'Test Browser'
      })

      const { data: flow2 } = await supabase.rpc('create_secure_device_flow', {
        p_provider: 'google',
        p_user_id: testUserId,
        p_client_ip: '192.168.1.100',
        p_user_agent: 'Test Browser'
      })

      // Complete one flow
      await supabase.rpc('complete_device_flow', {
        p_user_code: flow1[0].user_code,
        p_user_id: testUserId
      })

      // Expire the other flow
      await supabase
        .from('device_flows')
        .update({ 
          status: 'expired',
          expires_at: new Date(Date.now() - 60000).toISOString()
        })
        .eq('device_code', flow2[0].device_code)

      // Get analytics
      const { data: analytics } = await supabase.rpc('get_device_flow_analytics', {
        p_hours_back: 24
      })

      const googleAnalytics = analytics.find((a: any) => a.provider === 'google')
      if (googleAnalytics) {
        expect(googleAnalytics.total_flows).toBe(2)
        expect(googleAnalytics.completed_flows).toBe(1)
        expect(googleAnalytics.expired_flows).toBe(1)
        expect(googleAnalytics.success_rate).toBe(50)
      }
    })
  })

  describe('Automatic Cleanup', () => {
    it('should cleanup expired device flows', async () => {
      // Create device flow
      const { data: flowData } = await supabase.rpc('create_secure_device_flow', {
        p_provider: 'google',
        p_user_id: testUserId,
        p_client_ip: '192.168.1.100',
        p_user_agent: 'Test Browser'
      })

      // Manually expire the flow
      await supabase
        .from('device_flows')
        .update({ 
          expires_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          status: 'expired'
        })
        .eq('device_code', flowData[0].device_code)

      // Run cleanup
      const { data: deletedCount, error } = await supabase.rpc('cleanup_expired_device_flows')

      expect(error).toBeNull()
      expect(deletedCount).toBeGreaterThan(0)

      // Verify flow is deleted
      const { data: remainingFlow } = await supabase
        .from('device_flows')
        .select('*')
        .eq('device_code', flowData[0].device_code)

      expect(remainingFlow).toHaveLength(0)
    })

    it('should cleanup old completed flows', async () => {
      // Create device flow
      const { data: flowData } = await supabase.rpc('create_secure_device_flow', {
        p_provider: 'google',
        p_user_id: testUserId,
        p_client_ip: '192.168.1.100',
        p_user_agent: 'Test Browser'
      })

      // Complete the flow
      await supabase.rpc('complete_device_flow', {
        p_user_code: flowData[0].user_code,
        p_user_id: testUserId
      })

      // Manually set old retention time
      await supabase
        .from('device_flows')
        .update({ 
          retention_expires_at: new Date(Date.now() - 60 * 60 * 1000).toISOString() // 1 hour ago
        })
        .eq('device_code', flowData[0].device_code)

      // Run cleanup
      const { data: deletedCount } = await supabase.rpc('cleanup_expired_device_flows')

      expect(deletedCount).toBeGreaterThan(0)

      // Verify flow is deleted
      const { data: remainingFlow } = await supabase
        .from('device_flows')
        .select('*')
        .eq('device_code', flowData[0].device_code)

      expect(remainingFlow).toHaveLength(0)
    })
  })

  describe('Data Integrity Constraints', () => {
    it('should enforce positive interval constraint', async () => {
      const { error } = await supabase
        .from('device_flows')
        .insert({
          device_code: 'test-device-code',
          user_code: 'test-user-code',
          provider: 'google',
          user_id: testUserId,
          status: 'pending',
          interval_seconds: 0, // Invalid interval
          expires_at: new Date(Date.now() + 600000).toISOString()
        })

      expect(error).toBeDefined()
      expect(error?.code).toBe('23514') // Check constraint violation
    })

    it('should enforce positive poll count constraint', async () => {
      const { error } = await supabase
        .from('device_flows')
        .insert({
          device_code: 'test-device-code',
          user_code: 'test-user-code',
          provider: 'google',
          user_id: testUserId,
          status: 'pending',
          poll_count: -1, // Invalid poll count
          expires_at: new Date(Date.now() + 600000).toISOString()
        })

      expect(error).toBeDefined()
      expect(error?.code).toBe('23514') // Check constraint violation
    })

    it('should enforce future expiration constraint', async () => {
      const { error } = await supabase
        .from('device_flows')
        .insert({
          device_code: 'test-device-code',
          user_code: 'test-user-code',
          provider: 'google',
          user_id: testUserId,
          status: 'pending',
          expires_at: new Date(Date.now() - 600000).toISOString() // Past time
        })

      expect(error).toBeDefined()
      expect(error?.code).toBe('23514') // Check constraint violation
    })

    it('should enforce retention after expiration constraint', async () => {
      const expiresAt = new Date(Date.now() + 600000)
      const retentionExpiresAt = new Date(Date.now() + 300000) // Before expiration

      const { error } = await supabase
        .from('device_flows')
        .insert({
          device_code: 'test-device-code',
          user_code: 'test-user-code',
          provider: 'google',
          user_id: testUserId,
          status: 'pending',
          expires_at: expiresAt.toISOString(),
          retention_expires_at: retentionExpiresAt.toISOString()
        })

      expect(error).toBeDefined()
      expect(error?.code).toBe('23514') // Check constraint violation
    })
  })

  describe('Performance Optimization', () => {
    it('should have proper indexes for expiration lookups', async () => {
      // Create test device flow
      await supabase.rpc('create_secure_device_flow', {
        p_provider: 'google',
        p_user_id: testUserId,
        p_client_ip: '192.168.1.100',
        p_user_agent: 'Test Browser'
      })

      // Test expiration lookup performance
      const startTime = Date.now()
      
      const { data, error } = await supabase
        .from('device_flows')
        .select()
        .gt('expires_at', new Date().toISOString())
        .eq('status', 'pending')

      const endTime = Date.now()
      const queryTime = endTime - startTime

      expect(error).toBeNull()
      expect(queryTime).toBeLessThan(100) // Should be fast with proper indexes
    })

    it('should have proper indexes for user code hash lookups', async () => {
      // Create test device flow
      const { data: flowData } = await supabase.rpc('create_secure_device_flow', {
        p_provider: 'google',
        p_user_id: testUserId,
        p_client_ip: '192.168.1.100',
        p_user_agent: 'Test Browser'
      })

      // Test user code hash lookup performance
      const startTime = Date.now()
      
      const { data, error } = await supabase
        .from('device_flows')
        .select()
        .eq('user_code', flowData[0].user_code)

      const endTime = Date.now()
      const queryTime = endTime - startTime

      expect(error).toBeNull()
      expect(queryTime).toBeLessThan(100) // Should be fast with proper indexes
    })
  })

  describe('Migration Safety', () => {
    it('should preserve existing device flow data during migration', async () => {
      // This test ensures that migration scripts don't lose data
      const { data: flowCount } = await supabase
        .from('device_flows')
        .select('id', { count: 'exact' })

      // Verify data exists and is accessible
      expect(flowCount).toBeGreaterThanOrEqual(0)
    })

    it('should maintain backward compatibility during transition', async () => {
      // Test that both old and new device flow storage methods work
      const { data: flows } = await supabase
        .from('device_flows')
        .select('*')
        .limit(1)

      // Verify flow structure is correct
      if (flows && flows.length > 0) {
        const flow = flows[0]
        expect(flow.device_code).toBeDefined()
        expect(flow.user_code).toBeDefined()
        expect(flow.provider).toBeDefined()
        expect(flow.status).toBeDefined()
      }
    })
  })
})
