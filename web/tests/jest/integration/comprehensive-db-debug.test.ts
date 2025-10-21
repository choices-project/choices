import { describe, it, expect } from '@jest/globals';

/**
 * Comprehensive Database Debug Test
 * 
 * Tests to understand the exact database issue
 * 
 * Created: January 27, 2025
 * Status: ✅ PRODUCTION READY
 */

describe('Comprehensive Database Debug', () => {
  it('should debug the database connection comprehensively', async () => {
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
    
    if (!supabaseUrl || !serviceKey) {
      throw new Error('Supabase credentials not found');
    }
    
    console.log('🔍 Step 1: Testing basic connection...');
    const supabase = createClient(supabaseUrl, serviceKey);
    
    // Test 1: Try to get database version
    const { data: versionData, error: versionError } = await supabase
      .rpc('version');
    
    console.log('Database version:', { versionData, versionError });
    
    // Test 2: Try to list all tables
    const { data: tablesData, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    console.log('Tables in public schema:', { tablesData, tablesError });
    
    // Test 3: Try to get polls table structure
    const { data: pollsStructure, error: pollsStructureError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'polls')
      .eq('table_schema', 'public');
    
    console.log('Polls table structure:', { pollsStructure, pollsStructureError });
    
    // Test 4: Try to get a count of polls
    const { count: pollsCount, error: countError } = await supabase
      .from('polls')
      .select('*', { count: 'exact', head: true });
    
    console.log('Polls count:', { pollsCount, countError });
    
    // Test 5: Try to get first few polls
    const { data: pollsData, error: pollsError } = await supabase
      .from('polls')
      .select('*')
      .limit(3);
    
    console.log('First 3 polls:', { pollsData, pollsError });
    
    // Test 6: Try to get specific columns
    const { data: pollsColumns, error: pollsColumnsError } = await supabase
      .from('polls')
      .select('id, title, description')
      .limit(3);
    
    console.log('Polls with specific columns:', { pollsColumns, pollsColumnsError });
    
    // Test 7: Try to insert a test record
    const testRecord = {
      title: 'Comprehensive Test Poll',
      description: 'Testing comprehensive database access',
      question: 'Does this work?',
      options: ['Yes', 'No'],
      voting_method: 'single_choice',
      status: 'active',
      created_by: 'comprehensive-test',
      privacy_level: 'public'
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('polls')
      .insert(testRecord)
      .select();
    
    console.log('Insert test result:', { insertData, insertError });
    
    // Test 8: If insert worked, try to query it back
    if (!insertError && insertData && insertData.length > 0) {
      const { data: queryBack, error: queryBackError } = await supabase
        .from('polls')
        .select('*')
        .eq('id', insertData[0].id);
      
      console.log('Query back result:', { queryBack, queryBackError });
      
      // Clean up
      const { error: deleteError } = await supabase
        .from('polls')
        .delete()
        .eq('id', insertData[0].id);
      
      console.log('Cleanup result:', { deleteError });
    }
    
    // Test 9: Try to get RLS policies
    const { data: rlsPolicies, error: rlsError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'polls');
    
    console.log('RLS policies for polls table:', { rlsPolicies, rlsError });
    
    // Test 10: Try to get table permissions
    const { data: permissions, error: permissionsError } = await supabase
      .from('information_schema.table_privileges')
      .select('*')
      .eq('table_name', 'polls')
      .eq('table_schema', 'public');
    
    console.log('Table permissions:', { permissions, permissionsError });
    
    // The test should pass if we can at least connect
    expect(versionError).toBeNull();
    expect(tablesError).toBeNull();
    expect(pollsStructureError).toBeNull();
  });
});
