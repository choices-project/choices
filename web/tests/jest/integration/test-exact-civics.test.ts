import { describe, it, expect } from '@jest/globals';

/**
 * Test Exact Civics Approach
 * 
 * Tests database access using the exact same code as civics pipeline
 * 
 * Created: January 27, 2025
 * Status: ✅ PRODUCTION READY
 */

describe('Test Exact Civics Approach', () => {
  it('should test database access using exact civics pipeline code', async () => {
    // Use exact same code as civics pipeline
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    console.log('🔍 Testing database access using exact civics pipeline code...');
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('Supabase Key (first 10 chars):', process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 10));
    
    // Test 1: Query representatives_core table (exact same as civics pipeline)
    console.log('🔍 Test 1: Query representatives_core table (exact civics approach)');
    const query = supabase.from('representatives_core').select('*');
    const { data: representatives, error: dbError } = await query;
    
    console.log('Representatives result:', { representatives, dbError });
    
    // Test 2: Query polls table
    console.log('🔍 Test 2: Query polls table');
    const { data: polls, error: pollsError } = await supabase
      .from('polls')
      .select('*')
      .limit(5);
    
    console.log('Polls result:', { polls, pollsError });
    
    // Test 3: Insert a test poll
    console.log('🔍 Test 3: Insert test poll');
    const testPoll = {
      title: 'Test Poll from Exact Civics Approach',
      description: 'Testing database access using exact civics pipeline code',
      options: ['Option 1', 'Option 2', 'Option 3'],
      voting_method: 'single_choice',
      status: 'active',
      created_by: '00000000-0000-0000-0000-000000000001',
      privacy_level: 'public',
      category: 'test',
      tags: ['test', 'civics-exact'],
      hashtags: ['test', 'civics-exact'],
      primary_hashtag: 'test'
    };
    
    const { data: insertedPoll, error: insertError } = await supabase
      .from('polls')
      .insert(testPoll)
      .select();
    
    console.log('Insert poll result:', { insertedPoll, insertError });
    
    // Test 4: Query the inserted poll
    if (insertedPoll && insertedPoll.length > 0) {
      console.log('🔍 Test 4: Query inserted poll');
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
    
    // Test 5: Test with different privacy levels
    console.log('🔍 Test 5: Test different privacy levels');
    const { data: publicPolls, error: publicPollsError } = await supabase
      .from('polls')
      .select('id, title, privacy_level')
      .eq('privacy_level', 'public')
      .limit(3);
    
    console.log('Public polls result:', { publicPolls, publicPollsError });
    
    // Test 6: Test with different statuses
    console.log('🔍 Test 6: Test different statuses');
    const { data: activePolls, error: activePollsError } = await supabase
      .from('polls')
      .select('id, title, status')
      .eq('status', 'active')
      .limit(3);
    
    console.log('Active polls result:', { activePolls, activePollsError });
    
    // Test 7: Test with different created_by values
    console.log('🔍 Test 7: Test different created_by values');
    const { data: userPolls, error: userPollsError } = await supabase
      .from('polls')
      .select('id, title, created_by')
      .eq('created_by', '00000000-0000-0000-0000-000000000001')
      .limit(3);
    
    console.log('User polls result:', { userPolls, userPollsError });
    
    // Test 8: Test with different categories
    console.log('🔍 Test 8: Test different categories');
    const { data: categoryPolls, error: categoryPollsError } = await supabase
      .from('polls')
      .select('id, title, category')
      .eq('category', 'technology')
      .limit(3);
    
    console.log('Category polls result:', { categoryPolls, categoryPollsError });
    
    // Test 9: Test with different voting methods
    console.log('🔍 Test 9: Test different voting methods');
    const { data: votingMethodPolls, error: votingMethodPollsError } = await supabase
      .from('polls')
      .select('id, title, voting_method')
      .eq('voting_method', 'single_choice')
      .limit(3);
    
    console.log('Voting method polls result:', { votingMethodPolls, votingMethodPollsError });
    
    // Test 10: Test with different statuses
    console.log('🔍 Test 10: Test different statuses');
    const { data: statusPolls, error: statusPollsError } = await supabase
      .from('polls')
      .select('id, title, status')
      .eq('status', 'active')
      .limit(3);
    
    console.log('Status polls result:', { statusPolls, statusPollsError });
    
    // The test should pass if we can access the database
    expect(dbError).toBeNull();
    expect(pollsError).toBeNull();
    expect(insertError).toBeNull();
    expect(publicPollsError).toBeNull();
    expect(activePollsError).toBeNull();
    expect(userPollsError).toBeNull();
    expect(categoryPollsError).toBeNull();
    expect(votingMethodPollsError).toBeNull();
    expect(statusPollsError).toBeNull();
  });
});
