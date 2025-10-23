import { describe, it, expect } from '@jest/globals';

/**
 * Test RLS Bypass
 * 
 * Tests different approaches to bypass RLS for service role
 * 
 * Created: January 27, 2025
 * Status: ✅ PRODUCTION READY
 */

describe('Test RLS Bypass', () => {
  it('should test RLS bypass with different client configurations', async () => {
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !serviceKey) {
      throw new Error('Supabase credentials not found');
    }
    
    console.log('🔍 Testing RLS bypass approaches...');
    
    // Test 1: Standard service role client
    console.log('🔍 Test 1: Standard service role client');
    const standardClient = createClient(supabaseUrl, serviceKey);
    
    const { data: standardData, error: standardError } = await standardClient
      .from('polls')
      .select('id, title')
      .limit(1);
    
    console.log('Standard client result:', { standardData, standardError });
    
    // Test 2: Service role with explicit RLS bypass
    console.log('🔍 Test 2: Service role with explicit RLS bypass');
    const bypassClient = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      },
      db: {
        schema: 'public'
      }
    });
    
    const { data: bypassData, error: bypassError } = await bypassClient
      .from('polls')
      .select('id, title')
      .limit(1);
    
    console.log('Bypass client result:', { bypassData, bypassError });
    
    // Test 3: Try with different schema
    console.log('🔍 Test 3: Different schema approach');
    const schemaClient = createClient(supabaseUrl, serviceKey, {
      db: {
        schema: 'public'
      }
    });
    
    const { data: schemaData, error: schemaError } = await schemaClient
      .from('polls')
      .select('id, title')
      .limit(1);
    
    console.log('Schema client result:', { schemaData, schemaError });
    
    // Test 4: Try with raw SQL
    console.log('🔍 Test 4: Raw SQL approach');
    const { data: sqlData, error: sqlError } = await standardClient
      .rpc('get_polls_count');
    
    console.log('SQL client result:', { sqlData, sqlError });
    
    // Test 5: Try to get table info
    console.log('🔍 Test 5: Table info approach');
    const { data: tableData, error: tableError } = await standardClient
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'polls');
    
    console.log('Table info result:', { tableData, tableError });
    
    // Test 6: Try to get column info
    console.log('🔍 Test 6: Column info approach');
    const { data: columnData, error: columnError } = await standardClient
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_schema', 'public')
      .eq('table_name', 'polls')
      .limit(5);
    
    console.log('Column info result:', { columnData, columnError });
    
    // Test 7: Try to get RLS info
    console.log('🔍 Test 7: RLS info approach');
    const { data: rlsData, error: rlsError } = await standardClient
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'polls');
    
    console.log('RLS info result:', { rlsData, rlsError });
    
    // Test 8: Try to get current user
    console.log('🔍 Test 8: Current user approach');
    const { data: userData, error: userError } = await standardClient
      .rpc('current_user');
    
    console.log('Current user result:', { userData, userError });
    
    // Test 9: Try to get current role
    console.log('🔍 Test 9: Current role approach');
    const { data: roleData, error: roleError } = await standardClient
      .rpc('current_role');
    
    console.log('Current role result:', { roleData, roleError });
    
    // Test 10: Try to get session info
    console.log('🔍 Test 10: Session info approach');
    const { data: sessionData, error: sessionError } = await standardClient
      .rpc('session_user');
    
    console.log('Session info result:', { sessionData, sessionError });
    
    // The test should pass if we can at least connect
    expect(standardError).toBeNull();
    expect(bypassError).toBeNull();
    expect(schemaError).toBeNull();
    expect(sqlError).toBeNull();
    expect(tableError).toBeNull();
    expect(columnError).toBeNull();
    expect(rlsError).toBeNull();
    expect(userError).toBeNull();
    expect(roleError).toBeNull();
    expect(sessionError).toBeNull();
  });
});
