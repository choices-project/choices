/**
 * Schema Test Runner
 * Comprehensive test runner for Phase 1.4 schema implementation
 * 
 * Validates DPoP implementation, database functions, and security features
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { createClient } from '@supabase/supabase-js'
import { 
  generateDPoPKeyPair, 
  createDPoPProof, 
  calculateJKT,
  verifyDPoPProof,
  generateDPoPNonce,
  validateDPoPTimestamp
} from '@/lib/dpop'

// Test configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

describe('Phase 1.4 Schema Implementation Validation', () => {
  let testUserId: string
  let testUserEmail: string
  let dpopKeyPair: any
  let jkt: string

  beforeAll(async () => {
    // Create test user
    testUserEmail = `test-schema-${Date.now()}@example.com`
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

  describe('DPoP Implementation Validation', () => {
    it('should generate proper ECDSA P-256 key pairs', async () => {
      const keyPair = await generateDPoPKeyPair()
      
      expect(keyPair.publicKey).toBeInstanceOf(CryptoKey)
      expect(keyPair.privateKey).toBeInstanceOf(CryptoKey)
      expect(keyPair.jkt).toBeDefined()
      expect(keyPair.jkt).toHaveLength(43) // Base64URL encoded SHA-256
      
      // Verify key types
      expect(keyPair.publicKey.type).toBe('public')
      expect(keyPair.privateKey.type).toBe('private')
      expect(keyPair.publicKey.algorithm.name).toBe('ECDSA')
      expect(keyPair.privateKey.algorithm.name).toBe('ECDSA')
    })

    it('should calculate JKT correctly from JWK', async () => {
      const publicKeyJwk = await crypto.subtle.exportKey('jwk', dpopKeyPair.publicKey)
      const calculatedJkt = await calculateJKT(publicKeyJwk)
      
      expect(calculatedJkt).toBe(jkt)
      expect(calculatedJkt).toMatch(/^[A-Za-z0-9_-]{43}$/) // Base64URL format
    })

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
      
      // Verify JWT format
      expect(proof.signature).toMatch(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/)
    })

    it('should verify DPoP proofs correctly', async () => {
      const proof = await createDPoPProof(
        dpopKeyPair.privateKey,
        jkt,
        'GET',
        'https://api.example.com/v1/users'
      )

      const isValid = await verifyDPoPProof(proof, dpopKeyPair.publicKey)
      expect(isValid).toBe(true)
    })

    it('should reject invalid DPoP proofs', async () => {
      const proof = await createDPoPProof(
        dpopKeyPair.privateKey,
        jkt,
        'POST',
        'https://api.example.com/v1/test'
      )

      // Create different key pair
      const differentKeyPair = await generateDPoPKeyPair()
      
      const isValid = await verifyDPoPProof(proof, differentKeyPair.publicKey)
      expect(isValid).toBe(false)
    })

    it('should generate secure nonces', async () => {
      const nonce1 = generateDPoPNonce()
      const nonce2 = generateDPoPNonce()
      
      expect(nonce1).toBeDefined()
      expect(nonce1).toHaveLength(43) // Base64URL encoded
      expect(nonce1).not.toBe(nonce2) // Should be unique
    })

    it('should validate timestamps correctly', async () => {
      const now = Math.floor(Date.now() / 1000)
      
      // Valid timestamp (current time)
      expect(validateDPoPTimestamp(now)).toBe(true)
      
      // Valid timestamp (4 minutes ago)
      expect(validateDPoPTimestamp(now - 240)).toBe(true)
      
      // Invalid timestamp (6 minutes ago)
      expect(validateDPoPTimestamp(now - 360)).toBe(false)
      
      // Invalid timestamp (future)
      expect(validateDPoPTimestamp(now + 360)).toBe(false)
    })
  })

  describe('Database Functions Validation', () => {
    it('should create secure tokens with DPoP binding', async () => {
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

    it('should create secure sessions with DPoP binding', async () => {
      const { data, error } = await supabase.rpc('create_secure_session', {
        p_user_id: testUserId,
        p_dpop_jkt: jkt,
        p_ip_address: '192.168.1.100',
        p_user_agent: 'Test Browser'
      })

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data[0].session_id).toBeDefined()
      expect(data[0].session_hash).toBeDefined()
    })

    it('should validate DPoP bindings', async () => {
      // Create session
      const { data: session } = await supabase.rpc('create_secure_session', {
        p_user_id: testUserId,
        p_dpop_jkt: jkt,
        p_ip_address: '192.168.1.100',
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

    it('should create secure device flows', async () => {
      const { data, error } = await supabase.rpc('create_secure_device_flow', {
        p_provider: 'google',
        p_user_id: testUserId,
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

    it('should verify device flows by user code', async () => {
      // Create device flow
      const { data: flowData } = await supabase.rpc('create_secure_device_flow', {
        p_provider: 'github',
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
      expect(verification[0].provider).toBe('github')
      expect(verification[0].status).toBe('pending')
    })

    it('should complete device flows successfully', async () => {
      // Create device flow
      const { data: flowData } = await supabase.rpc('create_secure_device_flow', {
        p_provider: 'facebook',
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
    })

    it('should track device flow polling', async () => {
      // Create device flow
      const { data: flowData } = await supabase.rpc('create_secure_device_flow', {
        p_provider: 'twitter',
        p_user_id: testUserId,
        p_client_ip: '192.168.1.100',
        p_user_agent: 'Test Browser'
      })

      // Track polling
      const { data: success } = await supabase.rpc('track_device_flow_polling', {
        p_device_code: flowData[0].device_code
      })

      expect(success).toBe(true)
    })

    it('should provide device flow analytics', async () => {
      const { data: analytics, error } = await supabase.rpc('get_device_flow_analytics', {
        p_hours_back: 24
      })

      expect(error).toBeNull()
      expect(analytics).toBeDefined()
      expect(Array.isArray(analytics)).toBe(true)
    })

    it('should cleanup expired data', async () => {
      const { data: deletedCount, error } = await supabase.rpc('cleanup_expired_dpop_data')
      
      expect(error).toBeNull()
      expect(deletedCount).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Security Validation', () => {
    it('should enforce proper key generation', async () => {
      const keyPair = await generateDPoPKeyPair()
      
      // Verify key properties
      expect(keyPair.publicKey.extractable).toBe(true)
      expect(keyPair.privateKey.extractable).toBe(true)
      
      // Verify algorithm
      const publicKeyAlgorithm = keyPair.publicKey.algorithm as EcKeyAlgorithm
      const privateKeyAlgorithm = keyPair.privateKey.algorithm as EcKeyAlgorithm
      
      expect(publicKeyAlgorithm.name).toBe('ECDSA')
      expect(privateKeyAlgorithm.name).toBe('ECDSA')
      expect(publicKeyAlgorithm.namedCurve).toBe('P-256')
      expect(privateKeyAlgorithm.namedCurve).toBe('P-256')
    })

    it('should enforce proper JWT format', async () => {
      const proof = await createDPoPProof(
        dpopKeyPair.privateKey,
        jkt,
        'POST',
        'https://api.example.com/v1/test'
      )

      // Verify JWT structure
      const parts = proof.signature.split('.')
      expect(parts).toHaveLength(3)
      
      // Verify header
      const header = JSON.parse(atob(parts[0].replace(/-/g, '+').replace(/_/g, '/')))
      expect(header.typ).toBe('dpop+jwt')
      expect(header.alg).toBe('ES256')
      expect(header.jkt).toBe(jkt)
      
      // Verify payload
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
      expect(payload.jti).toBeDefined()
      expect(payload.htm).toBe('POST')
      expect(payload.htu).toBe('https://api.example.com/v1/test')
      expect(payload.iat).toBeDefined()
      expect(payload.jkt).toBe(jkt)
    })

    it('should enforce proper nonce generation', async () => {
      const nonces = new Set()
      
      // Generate multiple nonces
      for (let i = 0; i < 100; i++) {
        const nonce = generateDPoPNonce()
        expect(nonces.has(nonce)).toBe(false) // Should be unique
        nonces.add(nonce)
      }
    })
  })

  describe('Performance Validation', () => {
    it('should generate keys quickly', async () => {
      const startTime = Date.now()
      
      for (let i = 0; i < 10; i++) {
        await generateDPoPKeyPair()
      }
      
      const endTime = Date.now()
      const totalTime = endTime - startTime
      
      expect(totalTime).toBeLessThan(1000) // Should complete in under 1 second
    })

    it('should create proofs quickly', async () => {
      const startTime = Date.now()
      
      for (let i = 0; i < 10; i++) {
        await createDPoPProof(
          dpopKeyPair.privateKey,
          jkt,
          'POST',
          'https://api.example.com/v1/test'
        )
      }
      
      const endTime = Date.now()
      const totalTime = endTime - startTime
      
      expect(totalTime).toBeLessThan(1000) // Should complete in under 1 second
    })

    it('should verify proofs quickly', async () => {
      const proof = await createDPoPProof(
        dpopKeyPair.privateKey,
        jkt,
        'GET',
        'https://api.example.com/v1/users'
      )

      const startTime = Date.now()
      
      for (let i = 0; i < 10; i++) {
        await verifyDPoPProof(proof, dpopKeyPair.publicKey)
      }
      
      const endTime = Date.now()
      const totalTime = endTime - startTime
      
      expect(totalTime).toBeLessThan(1000) // Should complete in under 1 second
    })
  })
})
