import { describe, test, expect, beforeEach, afterAll, jest } from '@jest/globals';
import crypto from 'crypto';

// Mock the env-guard to prevent it from running at module load time
jest.mock('@/lib/civics/env-guard', () => ({
  assertPepperConfig: jest.fn()
}));

// The privacy-utils module is mocked globally in jest.setup.after.js
// We need to unmock it for this specific test to test the real functions
jest.unmock('@/lib/civics/privacy-utils');

describe('pepper rotation verify', () => {
  const OLD_ENV = process.env;
  beforeEach(() => { 
    jest.resetModules(); 
    // Set up default environment for tests
    process.env.PRIVACY_PEPPER_DEV = 'dev-pepper-consistent-for-testing-12345678901234567890';
    process.env.PRIVACY_PEPPER_CURRENT = 'hex:' + 'ab'.repeat(32);
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'test', writable: true });
  });
  afterAll(() => { process.env = OLD_ENV; });

  test('CURRENT issues; CURRENT/PREVIOUS verify', async () => {
    // Set NODE_ENV to production to test CURRENT/PREVIOUS pepper functionality
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', writable: true });
    process.env.PRIVACY_PEPPER_CURRENT = 'hex:' + 'ab'.repeat(32);
    process.env.PRIVACY_PEPPER_PREVIOUS = 'hex:' + 'cd'.repeat(32);

    const { hmac256, verifyHmacDigest } = await import('@/lib/civics/privacy-utils');
    const msg = '123 any st, springfield il';
    const { hex } = hmac256(msg, 'addr');
    expect(verifyHmacDigest(msg, 'addr', hex)).toBe(true);

    // Verify a digest produced with PREVIOUS still validates
    const prev = crypto.createHmac('sha256', Buffer.concat([Buffer.from('cd'.repeat(32), 'hex'), Buffer.from(':addr')]))
      .update(msg).digest('hex');
    expect(verifyHmacDigest(msg, 'addr', prev)).toBe(true);
  });

  test('dev environment uses PRIVACY_PEPPER_DEV', async () => {
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'development', writable: true });
    process.env.PRIVACY_PEPPER_DEV = 'dev-pepper-consistent-for-testing-12345678901234567890';
    
    const { hmac256, verifyHmacDigest } = await import('@/lib/civics/privacy-utils');
    const msg = '123 any st, springfield il';
    const { hex, used } = hmac256(msg, 'addr');
    
    expect(used).toBe('DEV');
    expect(verifyHmacDigest(msg, 'addr', hex)).toBe(true);
  });

  test('production environment requires PRIVACY_PEPPER_CURRENT', async () => {
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', writable: true });
    delete process.env.PRIVACY_PEPPER_CURRENT;
    
    await expect(async () => {
      // This will throw when a function is called due to lazy loading
      jest.resetModules();
      const utils = await import('@/lib/civics/privacy-utils');
      utils.hmac256('test', 'addr');
    }).rejects.toThrow('PRIVACY_PEPPER_CURRENT required');
  });

  test('production forbids PRIVACY_PEPPER_DEV', async () => {
    // Set up production environment
    const originalNodeEnv = process.env.NODE_ENV;
    const originalDevPepper = process.env.PRIVACY_PEPPER_DEV;
    const originalCurrentPepper = process.env.PRIVACY_PEPPER_CURRENT;
    
    try {
      // Mock the environment variables properly for testing
      const _originalEnv = process.env.NODE_ENV;
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'production',
        writable: true,
        configurable: true
      });
      process.env.PRIVACY_PEPPER_DEV = 'dev-pepper';
      process.env.PRIVACY_PEPPER_CURRENT = 'hex:' + 'ab'.repeat(32);
      
      await expect(async () => {
        jest.resetModules();
        // Unmock env-guard to test the real function
        jest.unmock('@/lib/civics/env-guard');
        const utils = await import('@/lib/civics/privacy-utils');
        utils.hmac256('test', 'addr');
      }).rejects.toThrow('PRIVACY_PEPPER_DEV must NOT be set in preview/prod');
    } finally {
      // Restore original environment
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: originalNodeEnv,
        writable: true,
        configurable: true
      });
      if (originalDevPepper !== undefined) {
        process.env.PRIVACY_PEPPER_DEV = originalDevPepper;
      } else {
        delete process.env.PRIVACY_PEPPER_DEV;
      }
      if (originalCurrentPepper !== undefined) {
        process.env.PRIVACY_PEPPER_CURRENT = originalCurrentPepper;
      } else {
        delete process.env.PRIVACY_PEPPER_CURRENT;
      }
    }
  });

  test('domain separation works correctly', async () => {
    process.env.PRIVACY_PEPPER_CURRENT = 'hex:' + 'ab'.repeat(32);
    
    const utils = await import('@/lib/civics/privacy-utils');
    const msg = 'test message';
    
    const addrHash = utils.hmac256(msg, 'addr');
    const placeHash = utils.hmac256(msg, 'place');
    const ipHash = utils.hmac256(msg, 'ip');
    
    // Different scopes should produce different hashes
    expect(addrHash.hex).not.toBe(placeHash.hex);
    expect(placeHash.hex).not.toBe(ipHash.hex);
    expect(ipHash.hex).not.toBe(addrHash.hex);
    
    // But each should verify correctly
    expect(utils.verifyHmacDigest(msg, 'addr', addrHash.hex)).toBe(true);
    expect(utils.verifyHmacDigest(msg, 'place', placeHash.hex)).toBe(true);
    expect(utils.verifyHmacDigest(msg, 'ip', ipHash.hex)).toBe(true);
  });

  test('address normalization works correctly', async () => {
    const utils = await import('@/lib/civics/privacy-utils');
    
    const testCases = [
      { input: '123 Main St.', expected: '123 main st' },
      { input: '456 OAK   AVENUE', expected: '456 oak ave' },
      { input: '789 Pine Road', expected: '789 pine rd' },
      { input: '  101  BOULEVARD  ', expected: '101 blvd' }
    ];
    
    testCases.forEach(({ input, expected }) => {
      expect(utils.normalizeAddress(input)).toBe(expected);
    });
  });

  test('geohash with jitter is deterministic per request', async () => {
    const utils = await import('@/lib/civics/privacy-utils');
    
    const lat = 40.7128;
    const lng = -74.0060;
    const precision = 5;
    const requestId = 'test-request-123';
    
    // Same request ID should produce same jittered geohash
    const hash1 = utils.geohashWithJitter(lat, lng, precision, requestId);
    const hash2 = utils.geohashWithJitter(lat, lng, precision, requestId);
    expect(hash1).toBe(hash2);
    
    // Different request ID should produce different jittered geohash
    const hash3 = utils.geohashWithJitter(lat, lng, precision, 'different-request');
    expect(hash1).not.toBe(hash3);
  });

  test('k-anonymity check works correctly', async () => {
    const utils = await import('@/lib/civics/privacy-utils');
    
    expect(utils.bucketIsKAnonymous(24, 25)).toBe(false);
    expect(utils.bucketIsKAnonymous(25, 25)).toBe(true);
    expect(utils.bucketIsKAnonymous(100, 25)).toBe(true);
    
    // Test default k=25
    expect(utils.bucketIsKAnonymous(24)).toBe(false);
    expect(utils.bucketIsKAnonymous(25)).toBe(true);
  });
});