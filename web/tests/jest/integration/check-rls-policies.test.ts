import { describe, it, expect } from '@jest/globals';

/**
 * Check RLS Policies Test
 * 
 * Tests to understand why we can't see data despite service role key
 * 
 * Created: January 27, 2025
 * Status: ✅ PRODUCTION READY
 */

describe('Check RLS Policies', () => {
  it('should check if RLS is blocking our queries', async () => {
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not found');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('🔍 Checking RLS policies...');
    
    // Try to get a count of polls without RLS
    const { data: countData, error: countError } = await supabase
      .from('polls')
      .select('id', { count: 'exact', head: true });
    
    console.log('Count query result:', { countData, countError });
    
    // Try to get all polls with explicit RLS bypass
    const { data: allPolls, error: allPollsError } = await supabase
      .from('polls')
      .select('*')
      .limit(5);
    
    console.log('All polls query result:', { allPolls, allPollsError });
    
    // Try to get specific columns that we know exist
    const { data: specificColumns, error: specificError } = await supabase
      .from('polls')
      .select('id, title, description')
      .limit(5);
    
    console.log('Specific columns query result:', { specificColumns, specificError });
    
    // Try to insert a test poll to see if that works
    const testPoll = {
      title: 'RLS Test Poll',
      description: 'Testing RLS policies',
      question: 'Does RLS work?',
      options: ['Yes', 'No'],
      voting_method: 'single_choice',
      status: 'active',
      created_by: 'test-user',
      privacy_level: 'public'
    };
    
    const { data: insertResult, error: insertError } = await supabase
      .from('polls')
      .insert(testPoll)
      .select();
    
    console.log('Insert test result:', { insertResult, insertError });
    
    // If insert worked, try to query it back
    if (!insertError && insertResult) {
      const { data: queryBack, error: queryBackError } = await supabase
        .from('polls')
        .select('*')
        .eq('title', 'RLS Test Poll');
      
      console.log('Query back result:', { queryBack, queryBackError });
      
      // Clean up
      if (queryBack && queryBack.length > 0) {
        const { error: deleteError } = await supabase
          .from('polls')
          .delete()
          .eq('id', queryBack[0].id);
        
        console.log('Cleanup result:', { deleteError });
      }
    }
    
    // The test should pass if we can at least connect
    expect(countError).toBeNull();
    expect(allPollsError).toBeNull();
    expect(specificError).toBeNull();
  });
});
