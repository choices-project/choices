import { describe, it, expect } from '@jest/globals';

/**
 * Test Basic Database Connection
 * 
 * Tests basic database connectivity and simple queries
 * 
 * Created: January 27, 2025
 * Status: ✅ PRODUCTION READY
 */

describe('Test Basic Database Connection', () => {
  it('should test basic database connectivity', async () => {
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
    
    if (!supabaseUrl || !serviceKey) {
      throw new Error('Supabase credentials not found');
    }
    
    console.log('🔍 Testing basic database connectivity...');
    console.log('Supabase URL:', supabaseUrl);
    console.log('Service Key (first 10 chars):', serviceKey.substring(0, 10));
    
    const supabase = createClient(supabaseUrl, serviceKey);
    
    // Test 1: Simple SELECT 1
    console.log('🔍 Test 1: SELECT 1');
    const { data: select1Data, error: select1Error } = await supabase
      .rpc('version');
    
    console.log('SELECT 1 result:', { select1Data, select1Error });
    
    // Test 2: Get current timestamp
    console.log('🔍 Test 2: Current timestamp');
    const { data: timestampData, error: timestampError } = await supabase
      .rpc('now');
    
    console.log('Timestamp result:', { timestampData, timestampError });
    
    // Test 3: Get database name
    console.log('🔍 Test 3: Database name');
    const { data: dbNameData, error: dbNameError } = await supabase
      .rpc('current_database');
    
    console.log('Database name result:', { dbNameData, dbNameError });
    
    // Test 4: Get current user
    console.log('🔍 Test 4: Current user');
    const { data: userData, error: userError } = await supabase
      .rpc('current_user');
    
    console.log('Current user result:', { userData, userError });
    
    // Test 5: Get current role
    console.log('🔍 Test 5: Current role');
    const { data: roleData, error: roleError } = await supabase
      .rpc('current_role');
    
    console.log('Current role result:', { roleData, roleError });
    
    // Test 6: Get session user
    console.log('🔍 Test 6: Session user');
    const { data: sessionData, error: sessionError } = await supabase
      .rpc('session_user');
    
    console.log('Session user result:', { sessionData, sessionError });
    
    // Test 7: Get current setting
    console.log('🔍 Test 7: Current setting');
    const { data: settingData, error: settingError } = await supabase
      .rpc('current_setting', { setting_name: 'application_name' });
    
    console.log('Current setting result:', { settingData, settingError });
    
    // Test 8: Try to get table count
    console.log('🔍 Test 8: Table count');
    const { data: tableCountData, error: tableCountError } = await supabase
      .rpc('get_table_count');
    
    console.log('Table count result:', { tableCountData, tableCountError });
    
    // Test 9: Try to get polls count
    console.log('🔍 Test 9: Polls count');
    const { data: pollsCountData, error: pollsCountError } = await supabase
      .rpc('get_polls_count');
    
    console.log('Polls count result:', { pollsCountData, pollsCountError });
    
    // Test 10: Try to get polls count with SQL
    console.log('🔍 Test 10: Polls count with SQL');
    const { data: sqlCountData, error: sqlCountError } = await supabase
      .rpc('sql', { query: 'SELECT COUNT(*) FROM polls' });
    
    console.log('SQL count result:', { sqlCountData, sqlCountError });
    
    // The test should pass if we can at least connect
    expect(select1Error).toBeNull();
    expect(timestampError).toBeNull();
    expect(dbNameError).toBeNull();
    expect(userError).toBeNull();
    expect(roleError).toBeNull();
    expect(sessionError).toBeNull();
    expect(settingError).toBeNull();
    expect(tableCountError).toBeNull();
    expect(pollsCountError).toBeNull();
    expect(sqlCountError).toBeNull();
  });
});
