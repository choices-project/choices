/**
 * Basic DPoP Library Test
 * Tests the DPoP library functionality without database dependencies
 */

import { describe, it, expect } from '@jest/globals'
import { 
  generateDPoPKeyPair, 
  createDPoPProof, 
  calculateJKT,
  verifyDPoPProof,
  generateDPoPNonce,
  validateDPoPTimestamp
} from '@/lib/dpop'

describe('DPoP Library - Basic Functionality', () => {
  describe('Key Generation', () => {
    it('should generate valid DPoP key pairs', async () => {
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

    it('should generate unique JKT for different key pairs', async () => {
      const keyPair1 = await generateDPoPKeyPair()
      const keyPair2 = await generateDPoPKeyPair()
      
      expect(keyPair1.jkt).not.toBe(keyPair2.jkt)
    })
  })

  describe('JKT Calculation', () => {
    it('should calculate JKT correctly from JWK', async () => {
      const keyPair = await generateDPoPKeyPair()
      const publicKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey)
      const calculatedJkt = await calculateJKT(publicKeyJwk)
      
      expect(calculatedJkt).toBe(keyPair.jkt)
      expect(calculatedJkt).toMatch(/^[A-Za-z0-9_-]{43}$/) // Base64URL format
    })
  })

  describe('DPoP Proof Creation', () => {
    it('should create valid DPoP proofs', async () => {
      const keyPair = await generateDPoPKeyPair()
      
      const proof = await createDPoPProof(
        keyPair.privateKey,
        keyPair.jkt,
        'POST',
        'https://api.example.com/v1/polls',
        'test-nonce'
      )

      expect(proof.jti).toBeDefined()
      expect(proof.htm).toBe('POST')
      expect(proof.htu).toBe('https://api.example.com/v1/polls')
      expect(proof.iat).toBeDefined()
      expect(proof.jkt).toBe(keyPair.jkt)
      expect(proof.nonce).toBe('test-nonce')
      expect(proof.signature).toBeDefined()
      
      // Verify JWT format
      expect(proof.signature).toMatch(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/)
    })

    it('should create proofs with different HTTP methods', async () => {
      const keyPair = await generateDPoPKeyPair()
      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
      
      for (const method of methods) {
        const proof = await createDPoPProof(
          keyPair.privateKey,
          keyPair.jkt,
          method,
          'https://api.example.com/v1/test'
        )

        expect(proof.htm).toBe(method)
      }
    })
  })

  describe('DPoP Proof Verification', () => {
    it('should verify DPoP proofs correctly', async () => {
      const keyPair = await generateDPoPKeyPair()
      
      const proof = await createDPoPProof(
        keyPair.privateKey,
        keyPair.jkt,
        'GET',
        'https://api.example.com/v1/users'
      )

      const isValid = await verifyDPoPProof(proof, keyPair.publicKey)
      expect(isValid).toBe(true)
    })

    it('should reject invalid DPoP proofs', async () => {
      const keyPair1 = await generateDPoPKeyPair()
      const keyPair2 = await generateDPoPKeyPair()
      
      const proof = await createDPoPProof(
        keyPair1.privateKey,
        keyPair1.jkt,
        'POST',
        'https://api.example.com/v1/test'
      )

      // Try to verify with different key pair
      const isValid = await verifyDPoPProof(proof, keyPair2.publicKey)
      expect(isValid).toBe(false)
    })
  })

  describe('Nonce Generation', () => {
    it('should generate secure nonces', async () => {
      const nonce1 = generateDPoPNonce()
      const nonce2 = generateDPoPNonce()
      
      expect(nonce1).toBeDefined()
      expect(nonce1).toHaveLength(43) // Base64URL encoded
      expect(nonce1).not.toBe(nonce2) // Should be unique
    })

    it('should generate unique nonces', async () => {
      const nonces = new Set()
      
      // Generate multiple nonces
      for (let i = 0; i < 100; i++) {
        const nonce = generateDPoPNonce()
        expect(nonces.has(nonce)).toBe(false) // Should be unique
        nonces.add(nonce)
      }
    })
  })

  describe('Timestamp Validation', () => {
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

  describe('Performance', () => {
    it('should generate keys quickly', async () => {
      const startTime = Date.now()
      
      for (let i = 0; i < 5; i++) {
        await generateDPoPKeyPair()
      }
      
      const endTime = Date.now()
      const totalTime = endTime - startTime
      
      expect(totalTime).toBeLessThan(1000) // Should complete in under 1 second
    })

    it('should create proofs quickly', async () => {
      const keyPair = await generateDPoPKeyPair()
      const startTime = Date.now()
      
      for (let i = 0; i < 5; i++) {
        await createDPoPProof(
          keyPair.privateKey,
          keyPair.jkt,
          'POST',
          'https://api.example.com/v1/test'
        )
      }
      
      const endTime = Date.now()
      const totalTime = endTime - startTime
      
      expect(totalTime).toBeLessThan(1000) // Should complete in under 1 second
    })
  })
})
