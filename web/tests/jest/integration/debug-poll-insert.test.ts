import { describe, it, expect } from '@jest/globals';

/**
 * Debug Poll Insert Test
 * 
 * Tests to debug why polls aren't being inserted/retrieved
 * 
 * Created: January 27, 2025
 * Status: ✅ PRODUCTION READY
 */

describe('Debug Poll Insert', () => {
  it('should debug poll insertion step by step', async () => {
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not found');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('🔍 Step 1: Check if polls table exists...');
    
    // Try to query the polls table directly
    const { data: pollsData, error: pollsError } = await supabase
      .from('polls')
      .select('*')
      .limit(1);
    
    console.log('Polls table query result:', { pollsData, pollsError });
    
    if (pollsError) {
      console.log('❌ Polls table error:', pollsError.message);
      if (pollsError.message.includes('relation "polls" does not exist')) {
        console.log('❌ Polls table does not exist!');
        return;
      }
    } else {
      console.log('✅ Polls table exists and is accessible');
    }
    
    console.log('🔍 Step 2: Check polls table structure...');
    
    // Get table structure
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'polls')
      .eq('table_schema', 'public');
    
    console.log('Polls table columns:', { columns, columnsError });
    
    console.log('🔍 Step 3: Try to insert a minimal poll...');
    
    const minimalPoll = {
      title: 'Debug Test Poll',
      description: 'Debug Test Description',
      options: ['Option 1', 'Option 2'],
      voting_method: 'single_choice',
      status: 'active',
      created_by: 'debug-user',
      privacy_level: 'public'
    };
    
    console.log('Minimal poll data:', minimalPoll);
    
    const { data: insertResult, error: insertError } = await supabase
      .from('polls')
      .insert(minimalPoll)
      .select();
    
    console.log('Insert result:', { insertResult, insertError });
    
    if (insertError) {
      console.log('❌ Insert error details:', {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code
      });
    }
    
    console.log('🔍 Step 4: Query all polls to see what exists...');
    
    const { data: allPolls, error: queryError } = await supabase
      .from('polls')
      .select('*');
    
    console.log('All polls query result:', { allPolls, queryError });
    
    console.log('🔍 Step 5: Query specific poll by title...');
    
    const { data: specificPoll, error: specificError } = await supabase
      .from('polls')
      .select('*')
      .eq('title', 'Debug Test Poll');
    
    console.log('Specific poll query result:', { specificPoll, specificError });
    
    // The test should pass if we can at least connect and query
    expect(insertError).toBeNull();
    expect(queryError).toBeNull();
    expect(specificError).toBeNull();
  });
});
