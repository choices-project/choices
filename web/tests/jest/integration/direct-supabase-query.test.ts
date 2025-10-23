import { describe, it, expect } from '@jest/globals';

/**
 * Direct Supabase Query Test
 * 
 * Tests direct queries to understand the database structure
 * 
 * Created: January 27, 2025
 * Status: ✅ PRODUCTION READY
 */

describe('Direct Supabase Query', () => {
  it('should query polls table with different approaches', async () => {
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    
    // Try with anon key first
    const anonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !anonKey || !serviceKey) {
      throw new Error('Supabase credentials not found');
    }
    
    console.log('🔍 Testing with anon key...');
    const anonSupabase = createClient(supabaseUrl, anonKey);
    
    const { data: anonData, error: anonError } = await anonSupabase
      .from('polls')
      .select('*')
      .limit(5);
    
    console.log('Anon key result:', { anonData, anonError });
    
    console.log('🔍 Testing with service role key...');
    const serviceSupabase = createClient(supabaseUrl, serviceKey);
    
    const { data: serviceData, error: serviceError } = await serviceSupabase
      .from('polls')
      .select('*')
      .limit(5);
    
    console.log('Service key result:', { serviceData, serviceError });
    
    // Try to get table info
    console.log('🔍 Getting table information...');
    const { data: tableInfo, error: tableInfoError } = await serviceSupabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'polls');
    
    console.log('Table info result:', { tableInfo, tableInfoError });
    
    // Try to get column info
    console.log('🔍 Getting column information...');
    const { data: columnInfo, error: columnInfoError } = await serviceSupabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'polls')
      .eq('table_schema', 'public');
    
    console.log('Column info result:', { columnInfo, columnInfoError });
    
    // Try a simple count
    console.log('🔍 Getting count...');
    const { count, error: countError } = await serviceSupabase
      .from('polls')
      .select('*', { count: 'exact', head: true });
    
    console.log('Count result:', { count, countError });
    
    // Try to insert a simple record
    console.log('🔍 Testing insert...');
    const testRecord = {
      title: 'Direct Test Poll',
      description: 'Testing direct insert',
      question: 'Does this work?',
      options: ['Yes', 'No'],
      voting_method: 'single_choice',
      status: 'active',
      created_by: 'direct-test',
      privacy_level: 'public'
    };
    
    const { data: insertData, error: insertError } = await serviceSupabase
      .from('polls')
      .insert(testRecord)
      .select();
    
    console.log('Insert result:', { insertData, insertError });
    
    // If insert worked, try to query it back
    if (!insertError && insertData && insertData.length > 0) {
      console.log('🔍 Querying back inserted record...');
      const { data: queryBack, error: queryBackError } = await serviceSupabase
        .from('polls')
        .select('*')
        .eq('id', insertData[0].id);
      
      console.log('Query back result:', { queryBack, queryBackError });
      
      // Clean up
      const { error: deleteError } = await serviceSupabase
        .from('polls')
        .delete()
        .eq('id', insertData[0].id);
      
      console.log('Cleanup result:', { deleteError });
    }
    
    // The test should pass if we can at least connect
    expect(anonError).toBeNull();
    expect(serviceError).toBeNull();
  });
});
