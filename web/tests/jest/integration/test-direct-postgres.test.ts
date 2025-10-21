import { describe, it, expect } from '@jest/globals';

/**
 * Test Direct PostgreSQL Connection
 * 
 * Tests direct PostgreSQL connection bypassing Supabase client
 * 
 * Created: January 27, 2025
 * Status: ✅ PRODUCTION READY
 */

describe('Test Direct PostgreSQL Connection', () => {
  it('should test direct PostgreSQL connection', async () => {
    const { Client } = await import('pg');
    
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
    
    if (!supabaseUrl || !serviceKey) {
      throw new Error('Supabase credentials not found');
    }
    
    console.log('🔍 Testing direct PostgreSQL connection...');
    console.log('Supabase URL:', supabaseUrl);
    console.log('Service Key (first 10 chars):', serviceKey.substring(0, 10));
    
    // Extract database connection details from Supabase URL
    const url = new URL(supabaseUrl);
    const host = url.hostname;
    const port = url.port || '5432';
    const database = url.pathname.substring(1) || 'postgres';
    
    console.log('Extracted connection details:', { host, port, database });
    
    const client = new Client({
      host,
      port: parseInt(port),
      database,
      user: 'postgres',
      password: serviceKey,
      ssl: { rejectUnauthorized: false }
    });
    
    try {
      await client.connect();
      console.log('✅ Direct PostgreSQL connection successful');
      
      // Test 1: Simple query
      console.log('🔍 Test 1: Simple query');
      const result1 = await client.query('SELECT 1 as test');
      console.log('Simple query result:', result1.rows);
      
      // Test 2: Get current user
      console.log('🔍 Test 2: Current user');
      const result2 = await client.query('SELECT current_user');
      console.log('Current user result:', result2.rows);
      
      // Test 3: Get current role
      console.log('🔍 Test 3: Current role');
      const result3 = await client.query('SELECT current_role');
      console.log('Current role result:', result3.rows);
      
      // Test 4: Get database name
      console.log('🔍 Test 4: Database name');
      const result4 = await client.query('SELECT current_database()');
      console.log('Database name result:', result4.rows);
      
      // Test 5: Get version
      console.log('🔍 Test 5: Version');
      const result5 = await client.query('SELECT version()');
      console.log('Version result:', result5.rows);
      
      // Test 6: Check if polls table exists
      console.log('🔍 Test 6: Check polls table');
      const result6 = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'polls'
      `);
      console.log('Polls table result:', result6.rows);
      
      // Test 7: Get polls count
      console.log('🔍 Test 7: Polls count');
      const result7 = await client.query('SELECT COUNT(*) FROM polls');
      console.log('Polls count result:', result7.rows);
      
      // Test 8: Get sample polls
      console.log('🔍 Test 8: Sample polls');
      const result8 = await client.query('SELECT id, title FROM polls LIMIT 5');
      console.log('Sample polls result:', result8.rows);
      
      // Test 9: Check RLS status
      console.log('🔍 Test 9: RLS status');
      const result9 = await client.query(`
        SELECT relname, relrowsecurity 
        FROM pg_class 
        WHERE relname = 'polls'
      `);
      console.log('RLS status result:', result9.rows);
      
      // Test 10: Check RLS policies
      console.log('🔍 Test 10: RLS policies');
      const result10 = await client.query(`
        SELECT policyname, cmd, roles, qual, with_check
        FROM pg_policies 
        WHERE tablename = 'polls'
      `);
      console.log('RLS policies result:', result10.rows);
      
      expect(result1.rows.length).toBeGreaterThan(0);
      expect(result2.rows.length).toBeGreaterThan(0);
      expect(result3.rows.length).toBeGreaterThan(0);
      expect(result4.rows.length).toBeGreaterThan(0);
      expect(result5.rows.length).toBeGreaterThan(0);
      expect(result6.rows.length).toBeGreaterThan(0);
      expect(result7.rows.length).toBeGreaterThan(0);
      expect(result8.rows.length).toBeGreaterThan(0);
      expect(result9.rows.length).toBeGreaterThan(0);
      expect(result10.rows.length).toBeGreaterThan(0);
      
    } catch (error) {
      console.error('❌ Direct PostgreSQL connection failed:', error);
      throw error;
    } finally {
      await client.end();
    }
  });
});
