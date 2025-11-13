// Set up test environment variables FIRST, before any other imports
process.env.NODE_ENV = 'test';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.NEXTAUTH_SECRET = 'test-secret';
process.env.NEXTAUTH_URL = 'http://localhost:3000';

// Polyfill fetch/Response/Request for environments that lack them (must run before MSW setup).
require('whatwg-fetch');

// Polyfill TextEncoder/TextDecoder early so they are available for any modules imported during setup.
const { TextEncoder, TextDecoder } = require('util');
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder;
}

// Ensure Web Crypto API is present before tests run (required by Supabase + WebAuthn flows).
const { webcrypto } = require('crypto');
if (typeof global.crypto === 'undefined') {
  global.crypto = webcrypto;
}

// Provide WHATWG stream primitives expected by MSW and other browser-like utilities.
try {
  const { TransformStream, ReadableStream, WritableStream } = require('stream/web');
  if (typeof global.TransformStream === 'undefined' && TransformStream) {
    global.TransformStream = TransformStream;
  }
  if (typeof global.ReadableStream === 'undefined' && ReadableStream) {
    global.ReadableStream = ReadableStream;
  }
  if (typeof global.WritableStream === 'undefined' && WritableStream) {
    global.WritableStream = WritableStream;
  }
} catch (_) {
  // stream/web is available in supported Node versions; ignore if unavailable.
}

// Set up privacy pepper environment variables for testing
process.env.PRIVACY_PEPPER_DEV = 'dev-pepper-consistent-for-testing-12345678901234567890';
process.env.PRIVACY_PEPPER_CURRENT = 'hex:' + 'ab'.repeat(32);
process.env.PRIVACY_PEPPER_PREVIOUS = 'hex:' + 'cd'.repeat(32);
