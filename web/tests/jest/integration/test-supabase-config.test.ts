import { describe, it, expect } from '@jest/globals';

/**
 * Test Supabase Configuration
 * 
 * Tests to understand the Supabase client configuration issue
 * 
 * Created: January 27, 2025
 * Status: ✅ PRODUCTION READY
 */

describe('Test Supabase Configuration', () => {
  it('should test different Supabase client configurations', async () => {
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !serviceKey || !anonKey) {
      throw new Error('Supabase credentials not found');
    }
    
    console.log('🔍 Testing Supabase client configurations...');
    console.log('Supabase URL:', supabaseUrl);
    console.log('Service Key (first 10 chars):', serviceKey.substring(0, 10));
    console.log('Anon Key (first 10 chars):', anonKey.substring(0, 10));
    
    // Test 1: Service role client
    console.log('🔍 Test 1: Service role client');
    const serviceClient = createClient(supabaseUrl, serviceKey);
    
    const { data: serviceData, error: serviceError } = await serviceClient
      .from('polls')
      .select('id, title')
      .limit(1);
    
    console.log('Service client result:', { serviceData, serviceError });
    
    // Test 2: Anon client
    console.log('🔍 Test 2: Anon client');
    const anonClient = createClient(supabaseUrl, anonKey);
    
    const { data: anonData, error: anonError } = await anonClient
      .from('polls')
      .select('id, title')
      .limit(1);
    
    console.log('Anon client result:', { anonData, anonError });
    
    // Test 3: Service role with auth bypass
    console.log('🔍 Test 3: Service role with auth bypass');
    const serviceClientWithAuth = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    const { data: serviceAuthData, error: serviceAuthError } = await serviceClientWithAuth
      .from('polls')
      .select('id, title')
      .limit(1);
    
    console.log('Service client with auth bypass result:', { serviceAuthData, serviceAuthError });
    
    // Test 4: Try to get database version
    console.log('🔍 Test 4: Database version');
    const { data: versionData, error: versionError } = await serviceClient
      .rpc('version');
    
    console.log('Database version result:', { versionData, versionError });
    
    // Test 5: Try to get current user
    console.log('🔍 Test 5: Current user');
    const { data: userData, error: userError } = await serviceClient.auth.getUser();
    
    console.log('Current user result:', { userData, userError });
    
    // Test 6: Try to get session
    console.log('🔍 Test 6: Current session');
    const { data: sessionData, error: sessionError } = await serviceClient.auth.getSession();
    
    console.log('Current session result:', { sessionData, sessionError });
    
    // The test should pass if we can at least connect
    expect(serviceError).toBeNull();
    expect(anonError).toBeNull();
    expect(serviceAuthError).toBeNull();
    expect(versionError).toBeNull();
    expect(userError).toBeNull();
    expect(sessionError).toBeNull();
  });
});
