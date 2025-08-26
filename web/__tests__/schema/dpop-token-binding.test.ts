/**
 * DPoP Token Binding Tests
 * Tests for Demonstrating Proof of Possession token binding
 * 
 * These tests define how the DPoP system SHOULD work,
 * guiding implementation to the correct security architecture.
 */

import { createClient } from '@supabase/supabase-js'
import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals'
import { generateDPoPKeyPair, createDPoPProof, calculateJKT } from '@/lib/dpop'

// Test configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

describe('DPoP Token Binding', () => {
  let testUserId: string
  let testUserEmail: string
  let dpopKeyPair: any
  let jkt: string

  beforeAll(async () => {
    // Create test user
    testUserEmail = `test-dpop-${Date.now()}@example.com`
    const { data: { user }, error } = await supabase.auth.admin.createUser({
      email: testUserEmail,
      password: 'test-password-123',
      email_confirm: true
    })
    
    if (error || !user) {
      throw new Error(`Failed to create test user: ${error?.message}`)
    }
    
    testUserId = user.id

    // Generate DPoP key pair
    dpopKeyPair = await generateDPoPKeyPair()
    jkt = dpopKeyPair.jkt
  })

  afterAll(async () => {
    // Cleanup test user
    await supabase.auth.admin.deleteUser(testUserId)
  })

  beforeEach(async () => {
    // Clean up any test data before each test
    await supabase.from('ia_tokens').delete().eq('user_stable_id', testUserId)
    await supabase.from('user_sessions').delete().eq('user_id', testUserId)
    await supabase.from('dpop_replay_guard').delete().eq('jkt', jkt)
  })

  describe('DPoP Key Generation', () => {
    it('should generate valid DPoP key pairs', async () => {
      const keyPair = await generateDPoPKeyPair()
      
      expect(keyPair.publicKey).toBeDefined()
      expect(keyPair.privateKey).toBeDefined()
      expect(keyPair.jkt).toBeDefined()
      expect(keyPair.jkt).toHaveLength(43) // Base64URL encoded SHA-256
    })

    it('should generate unique JKT for different key pairs', async () => {
      const keyPair1 = await generateDPoPKeyPair()
      const keyPair2 = await generateDPoPKeyPair()
      
      expect(keyPair1.jkt).not.toBe(keyPair2.jkt)
    })

    it('should calculate JKT correctly from JWK', async () => {
      const keyPair = await generateDPoPKeyPair()
      const calculatedJkt = await calculateJKT(keyPair.publicKey)
      
      expect(calculatedJkt).toBe(keyPair.jkt)
    })
  })

  describe('DPoP Proof Creation', () => {
    it('should create valid DPoP proofs', async () => {
      const proof = await createDPoPProof(
        dpopKeyPair.privateKey,
        jkt,
        'POST',
        'https://api.example.com/v1/polls',
        'test-nonce'
      )

      expect(proof.jti).toBeDefined()
      expect(proof.htm).toBe('POST')
      expect(proof.htu).toBe('https://api.example.com/v1/polls')
      expect(proof.iat).toBeDefined()
      expect(proof.jkt).toBe(jkt)
      expect(proof.nonce).toBe('test-nonce')
      expect(proof.signature).toBeDefined()
    })

    it('should create proofs with different HTTP methods', async () => {
      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
      
      for (const method of methods) {
        const proof = await createDPoPProof(
          dpopKeyPair.privateKey,
          jkt,
          method,
          'https://api.example.com/v1/test'
        )

        expect(proof.htm).toBe(method)
      }
    })

    it('should create proofs with different URIs', async () => {
      const uris = [
        'https://api.example.com/v1/polls',
        'https://api.example.com/v1/users/profile',
        'https://api.example.com/v1/auth/token'
      ]
      
      for (const uri of uris) {
        const proof = await createDPoPProof(
          dpopKeyPair.privateKey,
          jkt,
          'POST',
          uri
        )

        expect(proof.htu).toBe(uri)
      }
    })
  })

  describe('Secure Token Creation', () => {
    it('should create DPoP-bound tokens', async () => {
      const { data, error } = await supabase.rpc('create_secure_token', {
        p_user_id: testUserId,
        p_dpop_jkt: jkt,
        p_expires_in_hours: 1
      })

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data[0].token_id).toBeDefined()
      expect(data[0].token_hash).toBeDefined()
      expect(data[0].jti).toBeDefined()
      expect(data[0].expires_at).toBeDefined()
    })

    it('should hash tokens before storage', async () => {
      const { data, error } = await supabase.rpc('create_secure_token', {
        p_user_id: testUserId,
        p_dpop_jkt: jkt
      })

      expect(error).toBeNull()
      
      // Verify token is stored as hash, not plaintext
      const { data: storedToken } = await supabase
        .from('ia_tokens')
        .select('token_hash, user_stable_id')
        .eq('id', data[0].token_id)
        .single()

      expect(storedToken.token_hash).toBeDefined()
      expect(storedToken.token_hash).toHaveLength(64) // SHA-256 hex
      expect(storedToken.user_stable_id).toBe(testUserId)
    })

    it('should bind tokens to DPoP JKT', async () => {
      const { data, error } = await supabase.rpc('create_secure_token', {
        p_user_id: testUserId,
        p_dpop_jkt: jkt
      })

      expect(error).toBeNull()
      
      const { data: storedToken } = await supabase
        .from('ia_tokens')
        .select('dpop_jkt')
        .eq('id', data[0].token_id)
        .single()

      expect(storedToken.dpop_jkt).toBe(jkt)
    })

    it('should support token rotation', async () => {
      // Create initial token
      const { data: initialToken } = await supabase.rpc('create_secure_token', {
        p_user_id: testUserId,
        p_dpop_jkt: jkt
      })

      // Rotate token
      const { data: rotatedToken, error } = await supabase.rpc('rotate_token', {
        p_old_token_id: initialToken[0].token_id,
        p_user_id: testUserId,
        p_dpop_jkt: jkt
      })

      expect(error).toBeNull()
      expect(rotatedToken[0].token_id).not.toBe(initialToken[0].token_id)
      
      // Verify old token is revoked
      const { data: oldToken } = await supabase
        .from('ia_tokens')
        .select('revoked_at')
        .eq('id', initialToken[0].token_id)
        .single()

      expect(oldToken.revoked_at).toBeDefined()
      
      // Verify rotation lineage
      const { data: newToken } = await supabase
        .from('ia_tokens')
        .select('rotated_from')
        .eq('id', rotatedToken[0].token_id)
        .single()

      expect(newToken.rotated_from).toBe(initialToken[0].token_id)
    })
  })

  describe('DPoP Binding Validation', () => {
    it('should validate DPoP bindings correctly', async () => {
      // Create a session with DPoP binding
      const { data: session } = await supabase.rpc('create_secure_session', {
        p_user_id: testUserId,
        p_dpop_jkt: jkt,
        p_ip_address: '192.168.1.1',
        p_user_agent: 'Test Browser'
      })

      // Create DPoP proof
      const proof = await createDPoPProof(
        dpopKeyPair.privateKey,
        jkt,
        'POST',
        'https://api.example.com/v1/test'
      )

      // Validate binding
      const { data: isValid, error } = await supabase.rpc('validate_dpop_binding', {
        p_session_id: session[0].session_id,
        p_dpop_jkt: jkt,
        p_dpop_nonce: proof.jti
      })

      expect(error).toBeNull()
      expect(isValid).toBe(true)
    })

    it('should reject invalid DPoP bindings', async () => {
      // Create a session with DPoP binding
      const { data: session } = await supabase.rpc('create_secure_session', {
        p_user_id: testUserId,
        p_dpop_jkt: jkt,
        p_ip_address: '192.168.1.1',
        p_user_agent: 'Test Browser'
      })

      // Try to validate with wrong JKT
      const wrongJkt = 'wrong-jkt-thumbprint'
      const { data: isValid, error } = await supabase.rpc('validate_dpop_binding', {
        p_session_id: session[0].session_id,
        p_dpop_jkt: wrongJkt,
        p_dpop_nonce: 'test-nonce'
      })

      expect(isValid).toBe(false)
    })

    it('should prevent replay attacks', async () => {
      // Create a session with DPoP binding
      const { data: session } = await supabase.rpc('create_secure_session', {
        p_user_id: testUserId,
        p_dpop_jkt: jkt,
        p_ip_address: '192.168.1.1',
        p_user_agent: 'Test Browser'
      })

      // Create DPoP proof
      const proof = await createDPoPProof(
        dpopKeyPair.privateKey,
        jkt,
        'POST',
        'https://api.example.com/v1/test'
      )

      // First validation should succeed
      const { data: isValid1 } = await supabase.rpc('validate_dpop_binding', {
        p_session_id: session[0].session_id,
        p_dpop_jkt: jkt,
        p_dpop_nonce: proof.jti
      })

      expect(isValid1).toBe(true)

      // Second validation with same JTI should fail (replay attack)
      const { data: isValid2 } = await supabase.rpc('validate_dpop_binding', {
        p_session_id: session[0].session_id,
        p_dpop_jkt: jkt,
        p_dpop_nonce: proof.jti
      })

      expect(isValid2).toBe(false)
    })
  })

  describe('Replay Protection', () => {
    it('should store DPoP replay guards', async () => {
      const proof = await createDPoPProof(
        dpopKeyPair.privateKey,
        jkt,
        'POST',
        'https://api.example.com/v1/test'
      )

      const { data, error } = await supabase.rpc('add_dpop_replay_guard', {
        p_jti: proof.jti,
        p_jkt: jkt,
        p_htm: proof.htm,
        p_htu: proof.htu,
        p_iat: new Date(proof.iat * 1000).toISOString(),
        p_expires_at: new Date((proof.iat + 300) * 1000).toISOString()
      })

      expect(error).toBeNull()
      expect(data).toBe(true)

      // Verify replay guard was stored
      const { data: guard } = await supabase
        .from('dpop_replay_guard')
        .select('*')
        .eq('jti', proof.jti)
        .single()

      expect(guard).toBeDefined()
      expect(guard.jkt).toBe(jkt)
      expect(guard.htm).toBe(proof.htm)
      expect(guard.htu).toBe(proof.htu)
    })

    it('should prevent duplicate JTI storage', async () => {
      const proof = await createDPoPProof(
        dpopKeyPair.privateKey,
        jkt,
        'POST',
        'https://api.example.com/v1/test'
      )

      // First storage should succeed
      const { data: success1 } = await supabase.rpc('add_dpop_replay_guard', {
        p_jti: proof.jti,
        p_jkt: jkt,
        p_htm: proof.htm,
        p_htu: proof.htu,
        p_iat: new Date(proof.iat * 1000).toISOString(),
        p_expires_at: new Date((proof.iat + 300) * 1000).toISOString()
      })

      expect(success1).toBe(true)

      // Second storage with same JTI should fail
      const { data: success2 } = await supabase.rpc('add_dpop_replay_guard', {
        p_jti: proof.jti,
        p_jkt: jkt,
        p_htm: proof.htm,
        p_htu: proof.htu,
        p_iat: new Date(proof.iat * 1000).toISOString(),
        p_expires_at: new Date((proof.iat + 300) * 1000).toISOString()
      })

      expect(success2).toBe(false)
    })
  })

  describe('Session Privacy Protection', () => {
    it('should hash sensitive session data', async () => {
      const ipAddress = '192.168.1.100'
      const userAgent = 'Mozilla/5.0 (Test Browser)'

      const { data: session } = await supabase.rpc('create_secure_session', {
        p_user_id: testUserId,
        p_dpop_jkt: jkt,
        p_ip_address: ipAddress,
        p_user_agent: userAgent
      })

      expect(session[0].session_hash).toBeDefined()
      expect(session[0].session_hash).toHaveLength(64) // SHA-256 hex

      // Verify session is stored with hashed data
      const { data: storedSession } = await supabase
        .from('user_sessions')
        .select('ip_hash, ua_hash, session_hash')
        .eq('id', session[0].session_id)
        .single()

      expect(storedSession.ip_hash).toBeDefined()
      expect(storedSession.ua_hash).toBeDefined()
      expect(storedSession.session_hash).toBeDefined()
      
      // Verify hashes are not the original values
      expect(storedSession.ip_hash).not.toBe(ipAddress)
      expect(storedSession.ua_hash).not.toBe(userAgent)
    })

    it('should support session rotation', async () => {
      const { data: initialSession } = await supabase.rpc('create_secure_session', {
        p_user_id: testUserId,
        p_dpop_jkt: jkt,
        p_ip_address: '192.168.1.1',
        p_user_agent: 'Test Browser'
      })

      // Rotate session
      const { data: rotatedSession } = await supabase.rpc('create_secure_session', {
        p_user_id: testUserId,
        p_dpop_jkt: jkt,
        p_ip_address: '192.168.1.2',
        p_user_agent: 'Test Browser Updated'
      })

      expect(rotatedSession[0].session_id).not.toBe(initialSession[0].session_id)

      // Verify old session is marked as rotated
      const { data: oldSession } = await supabase
        .from('user_sessions')
        .select('last_rotated_at')
        .eq('id', initialSession[0].session_id)
        .single()

      expect(oldSession.last_rotated_at).toBeDefined()
    })
  })

  describe('Token Expiration and Cleanup', () => {
    it('should enforce token expiration', async () => {
      const { data, error } = await supabase.rpc('create_secure_token', {
        p_user_id: testUserId,
        p_dpop_jkt: jkt,
        p_expires_in_hours: 0.001 // 3.6 seconds
      })

      expect(error).toBeNull()

      // Wait for token to expire
      await new Promise(resolve => setTimeout(resolve, 5000))

      // Verify token is expired
      const { data: expiredToken } = await supabase
        .from('ia_tokens')
        .select('expires_at')
        .eq('id', data[0].token_id)
        .single()

      expect(new Date(expiredToken.expires_at).getTime()).toBeLessThan(Date.now())
    })

    it('should cleanup expired data', async () => {
      // Create expired replay guard
      const expiredTime = new Date(Date.now() - 60000).toISOString() // 1 minute ago
      await supabase.rpc('add_dpop_replay_guard', {
        p_jti: 'expired-jti',
        p_jkt: jkt,
        p_htm: 'GET',
        p_htu: 'https://api.example.com/v1/test',
        p_iat: expiredTime,
        p_expires_at: expiredTime
      })

      // Run cleanup
      const { error } = await supabase.rpc('cleanup_expired_dpop_data')
      expect(error).toBeNull()

      // Verify expired data is cleaned up
      const { data: expiredGuard } = await supabase
        .from('dpop_replay_guard')
        .select('*')
        .eq('jti', 'expired-jti')

      expect(expiredGuard).toHaveLength(0)
    })
  })

  describe('Security Constraints', () => {
    it('should enforce token expiration constraints', async () => {
      // Try to create token with past expiration
      const pastTime = new Date(Date.now() - 3600000).toISOString() // 1 hour ago
      
      const { error } = await supabase
        .from('ia_tokens')
        .insert({
          user_stable_id: testUserId,
          dpop_jkt: jkt,
          expires_at: pastTime,
          token_hash: 'test-hash',
          jti: 'test-jti'
        })

      expect(error).toBeDefined()
      expect(error?.code).toBe('23514') // Check constraint violation
    })

    it('should enforce DPoP replay guard constraints', async () => {
      // Try to create replay guard with invalid times
      const { error } = await supabase
        .from('dpop_replay_guard')
        .insert({
          jti: 'test-jti',
          jkt: jkt,
          htm: 'GET',
          htu: 'https://api.example.com/v1/test',
          iat: new Date().toISOString(),
          expires_at: new Date(Date.now() - 1000).toISOString() // Past expiration
        })

      expect(error).toBeDefined()
      expect(error?.code).toBe('23514') // Check constraint violation
    })
  })
})
