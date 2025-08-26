// Jest setup file
// This file runs before each test

// Mock crypto for Node.js environment
if (typeof global.crypto === 'undefined') {
  const { webcrypto } = require('crypto')
  global.crypto = webcrypto
}

// Mock TextEncoder/TextDecoder for Node.js environment
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util')
  global.TextEncoder = TextEncoder
  global.TextDecoder = TextDecoder
}

// Mock atob/btoa for Node.js environment
if (typeof global.atob === 'undefined') {
  global.atob = (str) => Buffer.from(str, 'base64').toString('binary')
  global.btoa = (str) => Buffer.from(str, 'binary').toString('base64')
}

// Set test environment variables
process.env.NODE_ENV = 'test'

// Load actual environment variables for tests
require('dotenv').config({ path: '.env.local' })

// Only set defaults if not already set
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'
}

// Increase timeout for database operations
jest.setTimeout(30000)
