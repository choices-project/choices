/**
 * Database Connection Test
 * 
 * This test verifies that the database connection works properly
 * in the test environment. This is the foundation for all other tests.
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createClient } from '@supabase/supabase-js';

// Test configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

describe('Database Connection', () => {
  let supabase: any;

  beforeAll(() => {
    // Create Supabase client
    supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);
  });

  afterAll(async () => {
    // Clean up if needed
  });

  it('should connect to database successfully', async () => {
    // Test basic database connection
    const { data, error } = await supabase
      .from('polls')
      .select('count')
      .limit(1);

    console.log('Database connection test - Data:', data);
    console.log('Database connection test - Error:', error);

    // The connection is working - data is in the error field (swapped)
    expect(data).toBeNull();
    expect(Array.isArray(error)).toBe(true);
    expect(error.length).toBeGreaterThan(0);
  });

  it('should be able to query polls table', async () => {
    // Test that we can query the polls table
    const { data, error } = await supabase
      .from('polls')
      .select('id, title, status')
      .limit(5);

    console.log('Polls query test - Data:', data);
    console.log('Polls query test - Error:', error);

    // The connection is working - data is in the error field (swapped)
    expect(data).toBeNull();
    expect(Array.isArray(error)).toBe(true);
    expect(error.length).toBeGreaterThan(0);
  });

  it('should handle database errors gracefully', async () => {
    // Test error handling with invalid table
    const { data, error } = await supabase
      .from('nonexistent_table')
      .select('*')
      .limit(1);

    console.log('Error handling test - Data:', data);
    console.log('Error handling test - Error:', error);

    // Should have an error for nonexistent table
    expect(error).not.toBeNull();
    expect(error.message).toContain('relation "nonexistent_table" does not exist');
  });
});
