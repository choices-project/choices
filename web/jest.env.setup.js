/**
 * Jest Environment Setup - Load Real Supabase Credentials
 * 
 * This file loads environment variables from .env.local for testing.
 * We use real Supabase credentials for production testing.
 */

// Load environment variables from .env.local
require('dotenv').config({ path: '../.env.local' });

// Set up privacy pepper environment variables for testing
process.env.PRIVACY_PEPPER_DEV = 'dev-pepper-consistent-for-testing-12345678901234567890';
process.env.PRIVACY_PEPPER_CURRENT = 'hex:' + 'ab'.repeat(32);

// Load real Supabase credentials from .env.local
// Use real Supabase configuration for testing
process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;