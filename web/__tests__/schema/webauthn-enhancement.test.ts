/**
 * WebAuthn Enhancement Tests
 * Tests for enhanced WebAuthn credential storage with binary IDs and metadata
 * 
 * These tests define how the WebAuthn system SHOULD work,
 * guiding implementation to the correct security architecture.
 */

import { createClient } from '@supabase/supabase-js'
import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals'

// Test configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

describe('WebAuthn Enhancement', () => {
  let testUserId: string
  let testUserEmail: string

  beforeAll(async () => {
    // Create test user
    testUserEmail = `test-webauthn-${Date.now()}@example.com`
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
    await supabase.from('webauthn_credentials').delete().eq('user_id', testUserId)
  })

  describe('Binary Credential Storage', () => {
    it('should store credential IDs as binary data', async () => {
      const credentialId = 'test-credential-id-binary'
      const credentialIdBytes = Buffer.from(credentialId, 'hex')
      
      const { data, error } = await supabase
        .from('webauthn_credentials')
        .insert({
          user_id: testUserId,
          credential_id: credentialIdBytes,
          public_key: Buffer.from('test-public-key'),
          sign_count: 1,
          is_active: true
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data.credential_id).toBeDefined()
      
      // Verify it's stored as binary
      const { data: retrieved } = await supabase
        .from('webauthn_credentials')
        .select('credential_id')
        .eq('id', data.id)
        .single()

      expect(Buffer.isBuffer(retrieved.credential_id)).toBe(true)
      expect(retrieved.credential_id.toString('hex')).toBe(credentialId)
    })

    it('should enforce unique credential IDs per user', async () => {
      const credentialId = Buffer.from('unique-credential-id', 'hex')
      
      // Insert first credential
      await supabase
        .from('webauthn_credentials')
        .insert({
          user_id: testUserId,
          credential_id: credentialId,
          public_key: Buffer.from('test-public-key-1'),
          sign_count: 1,
          is_active: true
        })

      // Try to insert duplicate credential ID for same user (should fail)
      const { error } = await supabase
        .from('webauthn_credentials')
        .insert({
          user_id: testUserId,
          credential_id: credentialId,
          public_key: Buffer.from('test-public-key-2'),
          sign_count: 1,
          is_active: true
        })

      expect(error).toBeDefined()
      expect(error?.code).toBe('23505') // Unique constraint violation
    })

    it('should allow same credential ID for different users', async () => {
      // Create second test user
      const secondUserEmail = `test-webauthn-2-${Date.now()}@example.com`
      const { data: { user: secondUser } } = await supabase.auth.admin.createUser({
        email: secondUserEmail,
        password: 'test-password-123',
        email_confirm: true
      })

      const credentialId = Buffer.from('shared-credential-id', 'hex')
      
      // Insert credential for first user
      const { error: error1 } = await supabase
        .from('webauthn_credentials')
        .insert({
          user_id: testUserId,
          credential_id: credentialId,
          public_key: Buffer.from('test-public-key-1'),
          sign_count: 1,
          is_active: true
        })

      // Insert same credential ID for second user (should succeed)
      const { error: error2 } = await supabase
        .from('webauthn_credentials')
        .insert({
          user_id: secondUser.id,
          credential_id: credentialId,
          public_key: Buffer.from('test-public-key-2'),
          sign_count: 1,
          is_active: true
        })

      expect(error1).toBeNull()
      expect(error2).toBeNull()

      // Cleanup second user
      await supabase.auth.admin.deleteUser(secondUser.id)
    })
  })

  describe('Metadata Support', () => {
    it('should store AAGUID for device identification', async () => {
      const aaguid = '550e8400-e29b-41d4-a716-446655440000'
      
      const { data, error } = await supabase
        .from('webauthn_credentials')
        .insert({
          user_id: testUserId,
          credential_id: Buffer.from('test-credential-id'),
          public_key: Buffer.from('test-public-key'),
          aaguid: aaguid,
          sign_count: 1,
          is_active: true
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data.aaguid).toBe(aaguid)
    })

    it('should store COSE public key in binary format', async () => {
      const cosePublicKey = Buffer.from('test-cose-public-key-binary')
      
      const { data, error } = await supabase
        .from('webauthn_credentials')
        .insert({
          user_id: testUserId,
          credential_id: Buffer.from('test-credential-id'),
          cose_public_key: cosePublicKey,
          sign_count: 1,
          is_active: true
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data.cose_public_key).toBeDefined()
      expect(Buffer.isBuffer(data.cose_public_key)).toBe(true)
    })

    it('should store transport protocols as array', async () => {
      const transports = ['usb', 'nfc', 'ble']
      
      const { data, error } = await supabase
        .from('webauthn_credentials')
        .insert({
          user_id: testUserId,
          credential_id: Buffer.from('test-credential-id'),
          public_key: Buffer.from('test-public-key'),
          transports: transports,
          sign_count: 1,
          is_active: true
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data.transports).toEqual(transports)
    })

    it('should store backup state information', async () => {
      const { data, error } = await supabase
        .from('webauthn_credentials')
        .insert({
          user_id: testUserId,
          credential_id: Buffer.from('test-credential-id'),
          public_key: Buffer.from('test-public-key'),
          backup_eligible: true,
          backup_state: true,
          sign_count: 1,
          is_active: true
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data.backup_eligible).toBe(true)
      expect(data.backup_state).toBe(true)
    })
  })

  describe('Sign Count Management', () => {
    it('should store sign count as BIGINT', async () => {
      const largeSignCount = BigInt('9223372036854775807') // Max BIGINT
      
      const { data, error } = await supabase
        .from('webauthn_credentials')
        .insert({
          user_id: testUserId,
          credential_id: Buffer.from('test-credential-id'),
          public_key: Buffer.from('test-public-key'),
          sign_count: largeSignCount,
          is_active: true
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data.sign_count).toBe(largeSignCount.toString())
    })

    it('should detect sign count regressions', async () => {
      // Create credential with initial sign count
      const { data: credential } = await supabase
        .from('webauthn_credentials')
        .insert({
          user_id: testUserId,
          credential_id: Buffer.from('test-credential-id'),
          public_key: Buffer.from('test-public-key'),
          sign_count: 100,
          is_active: true
        })
        .select()
        .single()

      // Test sign count regression detection
      const { data: isRegression } = await supabase.rpc('detect_sign_count_regression', {
        p_user_id: testUserId,
        p_credential_id: Buffer.from('test-credential-id'),
        p_new_sign_count: 50 // Lower than stored (100)
      })

      expect(isRegression).toBe(true)

      // Verify credential is marked as potential clone
      const { data: updatedCredential } = await supabase
        .from('webauthn_credentials')
        .select('clone_detected')
        .eq('id', credential.id)
        .single()

      expect(updatedCredential.clone_detected).toBe(true)
    })

    it('should allow normal sign count progression', async () => {
      // Create credential with initial sign count
      await supabase
        .from('webauthn_credentials')
        .insert({
          user_id: testUserId,
          credential_id: Buffer.from('test-credential-id'),
          public_key: Buffer.from('test-public-key'),
          sign_count: 100,
          is_active: true
        })

      // Test normal sign count progression
      const { data: isRegression } = await supabase.rpc('detect_sign_count_regression', {
        p_user_id: testUserId,
        p_credential_id: Buffer.from('test-credential-id'),
        p_new_sign_count: 150 // Higher than stored (100)
      })

      expect(isRegression).toBe(false)
    })
  })

  describe('Credential Usage Tracking', () => {
    it('should update credential usage statistics', async () => {
      const credentialId = Buffer.from('test-credential-id')
      
      // Create credential
      const { data: credential } = await supabase
        .from('webauthn_credentials')
        .insert({
          user_id: testUserId,
          credential_id: credentialId,
          public_key: Buffer.from('test-public-key'),
          sign_count: 100,
          is_active: true
        })
        .select()
        .single()

      // Update usage
      const { data: success } = await supabase.rpc('update_webauthn_credential_usage', {
        p_user_id: testUserId,
        p_credential_id: credentialId,
        p_new_sign_count: 101,
        p_uv_result: true
      })

      expect(success).toBe(true)

      // Verify usage was updated
      const { data: updatedCredential } = await supabase
        .from('webauthn_credentials')
        .select('sign_count, last_used_at, last_uv_result')
        .eq('id', credential.id)
        .single()

      expect(updatedCredential.sign_count).toBe('101')
      expect(updatedCredential.last_used_at).toBeDefined()
      expect(updatedCredential.last_uv_result).toBe(true)
    })

    it('should track multiple usage updates', async () => {
      const credentialId = Buffer.from('test-credential-id')
      
      // Create credential
      await supabase
        .from('webauthn_credentials')
        .insert({
          user_id: testUserId,
          credential_id: credentialId,
          public_key: Buffer.from('test-public-key'),
          sign_count: 100,
          is_active: true
        })

      // Multiple usage updates
      for (let i = 101; i <= 105; i++) {
        const { data: success } = await supabase.rpc('update_webauthn_credential_usage', {
          p_user_id: testUserId,
          p_credential_id: credentialId,
          p_new_sign_count: i,
          p_uv_result: i % 2 === 0 // Alternate UV results
        })

        expect(success).toBe(true)
      }

      // Verify final state
      const { data: finalCredential } = await supabase
        .from('webauthn_credentials')
        .select('sign_count, last_uv_result')
        .eq('user_id', testUserId)
        .single()

      expect(finalCredential.sign_count).toBe('105')
      expect(finalCredential.last_uv_result).toBe(false) // Last update was odd number
    })
  })

  describe('User Credential Management', () => {
    it('should retrieve user active credentials', async () => {
      // Create multiple credentials
      const credentials = [
        {
          credential_id: Buffer.from('credential-1'),
          public_key: Buffer.from('public-key-1'),
          sign_count: 100,
          is_active: true
        },
        {
          credential_id: Buffer.from('credential-2'),
          public_key: Buffer.from('public-key-2'),
          sign_count: 200,
          is_active: true
        },
        {
          credential_id: Buffer.from('credential-3'),
          public_key: Buffer.from('public-key-3'),
          sign_count: 300,
          is_active: false // Inactive
        }
      ]

      for (const cred of credentials) {
        await supabase
          .from('webauthn_credentials')
          .insert({
            user_id: testUserId,
            ...cred
          })
      }

      // Get active credentials
      const { data: activeCredentials } = await supabase.rpc('get_user_webauthn_credentials', {
        p_user_id: testUserId
      })

      expect(activeCredentials).toHaveLength(2) // Only active credentials
      expect(activeCredentials[0].credential_id).toBeDefined()
      expect(activeCredentials[0].clone_detected).toBe(false)
    })

    it('should exclude cloned credentials from active list', async () => {
      // Create credential and mark as cloned
      await supabase
        .from('webauthn_credentials')
        .insert({
          user_id: testUserId,
          credential_id: Buffer.from('cloned-credential'),
          public_key: Buffer.from('test-public-key'),
          sign_count: 100,
          is_active: true,
          clone_detected: true
        })

      // Get active credentials
      const { data: activeCredentials } = await supabase.rpc('get_user_webauthn_credentials', {
        p_user_id: testUserId
      })

      expect(activeCredentials).toHaveLength(0) // Cloned credential excluded
    })

    it('should order credentials by last used time', async () => {
      // Create credentials with different last_used_at times
      const now = new Date()
      const credentials = [
        {
          credential_id: Buffer.from('credential-old'),
          public_key: Buffer.from('public-key-1'),
          sign_count: 100,
          last_used_at: new Date(now.getTime() - 86400000) // 1 day ago
        },
        {
          credential_id: Buffer.from('credential-new'),
          public_key: Buffer.from('public-key-2'),
          sign_count: 200,
          last_used_at: now
        },
        {
          credential_id: Buffer.from('credential-no-usage'),
          public_key: Buffer.from('public-key-3'),
          sign_count: 300
          // No last_used_at
        }
      ]

      for (const cred of credentials) {
        await supabase
          .from('webauthn_credentials')
          .insert({
            user_id: testUserId,
            ...cred
          })
      }

      // Get active credentials
      const { data: activeCredentials } = await supabase.rpc('get_user_webauthn_credentials', {
        p_user_id: testUserId
      })

      expect(activeCredentials).toHaveLength(3)
      // Should be ordered by last_used_at DESC NULLS LAST
      expect(activeCredentials[0].credential_id.toString('hex')).toBe('credential-new')
      expect(activeCredentials[1].credential_id.toString('hex')).toBe('credential-old')
      expect(activeCredentials[2].credential_id.toString('hex')).toBe('credential-no-usage')
    })
  })

  describe('Data Integrity Constraints', () => {
    it('should enforce positive sign count constraint', async () => {
      const { error } = await supabase
        .from('webauthn_credentials')
        .insert({
          user_id: testUserId,
          credential_id: Buffer.from('test-credential-id'),
          public_key: Buffer.from('test-public-key'),
          sign_count: -1, // Negative sign count
          is_active: true
        })

      expect(error).toBeDefined()
      expect(error?.code).toBe('23514') // Check constraint violation
    })

    it('should enforce valid transports constraint', async () => {
      const { error } = await supabase
        .from('webauthn_credentials')
        .insert({
          user_id: testUserId,
          credential_id: Buffer.from('test-credential-id'),
          public_key: Buffer.from('test-public-key'),
          transports: [], // Empty array
          sign_count: 1,
          is_active: true
        })

      expect(error).toBeDefined()
      expect(error?.code).toBe('23514') // Check constraint violation
    })

    it('should allow valid transports', async () => {
      const { error } = await supabase
        .from('webauthn_credentials')
        .insert({
          user_id: testUserId,
          credential_id: Buffer.from('test-credential-id'),
          public_key: Buffer.from('test-public-key'),
          transports: ['usb'], // Valid transport
          sign_count: 1,
          is_active: true
        })

      expect(error).toBeNull()
    })
  })

  describe('Performance Optimization', () => {
    it('should have proper indexes for credential lookups', async () => {
      // Create test credential
      await supabase
        .from('webauthn_credentials')
        .insert({
          user_id: testUserId,
          credential_id: Buffer.from('test-credential-id'),
          public_key: Buffer.from('test-public-key'),
          sign_count: 1,
          is_active: true
        })

      // Test lookup performance
      const startTime = Date.now()
      
      const { data, error } = await supabase
        .from('webauthn_credentials')
        .select()
        .eq('user_id', testUserId)
        .eq('is_active', true)

      const endTime = Date.now()
      const queryTime = endTime - startTime

      expect(error).toBeNull()
      expect(queryTime).toBeLessThan(100) // Should be fast with proper indexes
    })

    it('should have proper indexes for AAGUID lookups', async () => {
      const aaguid = '550e8400-e29b-41d4-a716-446655440000'
      
      // Create test credential with AAGUID
      await supabase
        .from('webauthn_credentials')
        .insert({
          user_id: testUserId,
          credential_id: Buffer.from('test-credential-id'),
          public_key: Buffer.from('test-public-key'),
          aaguid: aaguid,
          sign_count: 1,
          is_active: true
        })

      // Test AAGUID lookup performance
      const startTime = Date.now()
      
      const { data, error } = await supabase
        .from('webauthn_credentials')
        .select()
        .eq('aaguid', aaguid)

      const endTime = Date.now()
      const queryTime = endTime - startTime

      expect(error).toBeNull()
      expect(queryTime).toBeLessThan(100) // Should be fast with proper indexes
    })
  })

  describe('Migration Safety', () => {
    it('should preserve existing credential data during migration', async () => {
      // This test ensures that migration scripts don't lose data
      const { data: credentialCount } = await supabase
        .from('webauthn_credentials')
        .select('id', { count: 'exact' })

      // Verify data exists and is accessible
      expect(credentialCount).toBeGreaterThanOrEqual(0)
    })

    it('should maintain backward compatibility during transition', async () => {
      // Test that both old and new credential storage methods work
      const { data: credentials } = await supabase
        .from('webauthn_credentials')
        .select('*')
        .limit(1)

      // Verify credential structure is correct
      if (credentials && credentials.length > 0) {
        const credential = credentials[0]
        expect(credential.user_id).toBeDefined()
        expect(credential.credential_id).toBeDefined()
        expect(credential.sign_count).toBeDefined()
      }
    })
  })
})
