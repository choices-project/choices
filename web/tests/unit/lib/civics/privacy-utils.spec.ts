describe('pepper rotation verify', () => {
  const OLD_ENV = process.env;
  beforeEach(() => { 
    jest.resetModules(); 
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', writable: true });
  });
  afterAll(() => { process.env = OLD_ENV; });

  test('CURRENT issues; CURRENT/PREVIOUS verify', () => {
    process.env.PRIVACY_PEPPER_CURRENT = 'hex:' + 'ab'.repeat(32);
    process.env.PRIVACY_PEPPER_PREVIOUS = 'hex:' + 'cd'.repeat(32);

    const utils = require('./privacy-utils') as typeof import('./privacy-utils');
    const msg = '123 any st, springfield il';
    const { hex } = utils.hmac256(msg, 'addr');
    expect(utils.verifyHmacDigest(msg, 'addr', hex)).toBe(true);

    // Verify a digest produced with PREVIOUS still validates
    const crypto = require('crypto');
    const prev = crypto.createHmac('sha256', Buffer.concat([Buffer.from('cd'.repeat(32), 'hex'), Buffer.from(':addr')]))
      .update(msg).digest('hex');
    expect(utils.verifyHmacDigest(msg, 'addr', prev)).toBe(true);
  });

  test('dev environment uses PRIVACY_PEPPER_DEV', () => {
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'development', writable: true });
    process.env.PRIVACY_PEPPER_DEV = 'dev-pepper-consistent-for-testing-12345678901234567890';
    
    const utils = require('./privacy-utils') as typeof import('./privacy-utils');
    const msg = '123 any st, springfield il';
    const { hex, used } = utils.hmac256(msg, 'addr');
    
    expect(used).toBe('DEV');
    expect(utils.verifyHmacDigest(msg, 'addr', hex)).toBe(true);
  });

  test('production environment requires PRIVACY_PEPPER_CURRENT', () => {
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', writable: true });
    delete process.env.PRIVACY_PEPPER_CURRENT;
    
    expect(() => {
      require('./privacy-utils');
    }).toThrow('PRIVACY_PEPPER_CURRENT required');
  });

  test('production forbids PRIVACY_PEPPER_DEV', () => {
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', writable: true });
    process.env.PRIVACY_PEPPER_DEV = 'dev-pepper';
    process.env.PRIVACY_PEPPER_CURRENT = 'hex:' + 'ab'.repeat(32);
    
    expect(() => {
      require('./privacy-utils');
    }).toThrow('PRIVACY_PEPPER_DEV must NOT be set in preview/prod');
  });

  test('domain separation works correctly', () => {
    process.env.PRIVACY_PEPPER_CURRENT = 'hex:' + 'ab'.repeat(32);
    
    const utils = require('./privacy-utils') as typeof import('./privacy-utils');
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

  test('address normalization works correctly', () => {
    const utils = require('./privacy-utils') as typeof import('./privacy-utils');
    
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

  test('geohash with jitter is deterministic per request', () => {
    const utils = require('./privacy-utils') as typeof import('./privacy-utils');
    
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

  test('k-anonymity check works correctly', () => {
    const utils = require('./privacy-utils') as typeof import('./privacy-utils');
    
    expect(utils.bucketIsKAnonymous(24, 25)).toBe(false);
    expect(utils.bucketIsKAnonymous(25, 25)).toBe(true);
    expect(utils.bucketIsKAnonymous(100, 25)).toBe(true);
    
    // Test default k=25
    expect(utils.bucketIsKAnonymous(24)).toBe(false);
    expect(utils.bucketIsKAnonymous(25)).toBe(true);
  });
});