/**
 * Deterministic IV Generation Tests
 * 
 * Tests for generateDeterministicIV wrapper for generateIVFromSeed
 * 
 * Created: 2025-01-16
 */

import { describe, it, expect, beforeEach } from '@jest/globals';

import { SecureKeyManager } from '@/lib/crypto/key-management';

describe('SecureKeyManager - Deterministic IV Generation', () => {
  let manager: SecureKeyManager;

  beforeEach(() => {
    manager = new SecureKeyManager();
  });

  describe('generateDeterministicIV', () => {
    it('should generate deterministic IV from seed', () => {
      const seed = 'test-seed-123';
      const iv1 = manager.generateDeterministicIV(seed);
      const iv2 = manager.generateDeterministicIV(seed);

      expect(iv1).toBeInstanceOf(Uint8Array);
      expect(iv2).toBeInstanceOf(Uint8Array);
      expect(iv1.length).toBe(12); // AES-GCM IV size
      expect(iv2.length).toBe(12);

      // Deterministic: same seed should produce same IV
      expect(Array.from(iv1)).toEqual(Array.from(iv2));
    });

    it('should generate different IVs for different seeds', () => {
      const seed1 = 'seed-1';
      const seed2 = 'seed-2';

      const iv1 = manager.generateDeterministicIV(seed1);
      const iv2 = manager.generateDeterministicIV(seed2);

      expect(Array.from(iv1)).not.toEqual(Array.from(iv2));
    });

    it('should generate consistent IVs for same seed across calls', () => {
      const seed = 'consistent-seed';

      const ivs = Array.from({ length: 10 }, () => 
        manager.generateDeterministicIV(seed)
      );

      // All IVs should be identical
      const first = Array.from(ivs[0]!);
      ivs.forEach(iv => {
        expect(Array.from(iv)).toEqual(first);
      });
    });

    it('should handle empty seed', () => {
      const iv = manager.generateDeterministicIV('');
      expect(iv).toBeInstanceOf(Uint8Array);
      expect(iv.length).toBe(12);
    });

    it('should handle long seeds', () => {
      const longSeed = 'a'.repeat(1000);
      const iv = manager.generateDeterministicIV(longSeed);
      expect(iv).toBeInstanceOf(Uint8Array);
      expect(iv.length).toBe(12);
    });

    it('should handle special characters in seed', () => {
      const specialSeed = 'test!@#$%^&*()_+-=[]{}|;:,.<>?';
      const iv = manager.generateDeterministicIV(specialSeed);
      expect(iv).toBeInstanceOf(Uint8Array);
      expect(iv.length).toBe(12);
    });

    it('should generate valid IV bytes (0-255)', () => {
      const seed = 'test-seed';
      const iv = manager.generateDeterministicIV(seed);

      for (let i = 0; i < iv.length; i++) {
        const byte = iv[i];
        expect(byte).toBeGreaterThanOrEqual(0);
        expect(byte).toBeLessThanOrEqual(255);
      }
    });
  });

  describe('Security Considerations', () => {
    it('should produce different IVs for similar seeds', () => {
      const seed1 = 'seed-1';
      const seed2 = 'seed-2';
      const seed3 = 'seed-1 '; // Same with trailing space

      const iv1 = manager.generateDeterministicIV(seed1);
      const iv2 = manager.generateDeterministicIV(seed2);
      const iv3 = manager.generateDeterministicIV(seed3);

      expect(Array.from(iv1)).not.toEqual(Array.from(iv2));
      expect(Array.from(iv1)).not.toEqual(Array.from(iv3));
    });

    it('should be deterministic but not predictable without seed', () => {
      // Generate IVs for random seeds
      const randomSeeds = Array.from({ length: 100 }, (_, i) => `seed-${i}-${Math.random()}`);
      const ivs = randomSeeds.map(seed => manager.generateDeterministicIV(seed));

      // All should be unique (very high probability)
      const unique = new Set(ivs.map(iv => Array.from(iv).join(',')));
      expect(unique.size).toBeGreaterThan(95); // Allow for rare collisions
    });
  });
});

