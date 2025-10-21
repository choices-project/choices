import { describe, it, expect } from '@jest/globals';

/**
 * Test Civics Approach
 * 
 * Tests database access using the same approach as civics ingestion pipeline
 * 
 * Created: January 27, 2025
 * Status: ✅ PRODUCTION READY
 */

describe('Test Civics Approach', () => {
  it('should test database access using civics pipeline approach', async () => {
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SECRET_KEY; // Use same key as civics pipeline
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not found');
    }
    
    console.log('🔍 Testing database access using civics pipeline approach...');
    console.log('Supabase URL:', supabaseUrl);
    console.log('Supabase Key (first 10 chars):', supabaseKey.substring(0, 10));
    
    // Use same approach as civics pipeline
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test 1: Query representatives_core table (like civics pipeline does)
    console.log('🔍 Test 1: Query representatives_core table');
    const { data: representatives, error: representativesError } = await supabase
      .from('representatives_core')
      .select('*')
      .limit(5);
    
    console.log('Representatives result:', { representatives, representativesError });
    
    // Test 2: Query polls table
    console.log('🔍 Test 2: Query polls table');
    const { data: polls, error: pollsError } = await supabase
      .from('polls')
      .select('id, title, description, privacy_level, status')
      .limit(5);
    
    console.log('Polls result:', { polls, pollsError });
    
    // Test 3: Get polls count
    console.log('🔍 Test 3: Get polls count');
    const { count: pollsCount, error: pollsCountError } = await supabase
      .from('polls')
      .select('*', { count: 'exact', head: true });
    
    console.log('Polls count result:', { pollsCount, pollsCountError });
    
    // Test 4: Insert a test poll
    console.log('🔍 Test 4: Insert test poll');
    const testPoll = {
      title: 'Test Poll from Civics Approach',
      description: 'Testing database access using civics pipeline approach',
      options: ['Option 1', 'Option 2', 'Option 3'],
      voting_method: 'single_choice',
      status: 'active',
      created_by: '00000000-0000-0000-0000-000000000001',
      privacy_level: 'public',
      category: 'test',
      tags: ['test', 'civics-approach'],
      hashtags: ['test', 'civics-approach'],
      primary_hashtag: 'test'
    };
    
    const { data: insertedPoll, error: insertError } = await supabase
      .from('polls')
      .insert(testPoll)
      .select();
    
    console.log('Insert poll result:', { insertedPoll, insertError });
    
    // Test 5: Query the inserted poll
    if (insertedPoll && insertedPoll.length > 0) {
      console.log('🔍 Test 5: Query inserted poll');
      const { data: queriedPoll, error: queryError } = await supabase
        .from('polls')
        .select('*')
        .eq('id', insertedPoll[0].id);
      
      console.log('Query inserted poll result:', { queriedPoll, queryError });
      
      // Clean up - delete the test poll
      console.log('🔍 Cleanup: Delete test poll');
      const { error: deleteError } = await supabase
        .from('polls')
        .delete()
        .eq('id', insertedPoll[0].id);
      
      console.log('Delete poll result:', { deleteError });
    }
    
    // Test 6: Test with different privacy levels
    console.log('🔍 Test 6: Test different privacy levels');
    const { data: publicPolls, error: publicPollsError } = await supabase
      .from('polls')
      .select('id, title, privacy_level')
      .eq('privacy_level', 'public')
      .limit(3);
    
    console.log('Public polls result:', { publicPolls, publicPollsError });
    
    // Test 7: Test with different statuses
    console.log('🔍 Test 7: Test different statuses');
    const { data: activePolls, error: activePollsError } = await supabase
      .from('polls')
      .select('id, title, status')
      .eq('status', 'active')
      .limit(3);
    
    console.log('Active polls result:', { activePolls, activePollsError });
    
    // The test should pass if we can access the database
    expect(representativesError).toBeNull();
    expect(pollsError).toBeNull();
    expect(pollsCountError).toBeNull();
    expect(insertError).toBeNull();
    expect(publicPollsError).toBeNull();
    expect(activePollsError).toBeNull();
  });
});
