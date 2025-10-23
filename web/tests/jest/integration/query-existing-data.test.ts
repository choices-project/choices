import { describe, it, expect } from '@jest/globals';

/**
 * Query Existing Data Test
 * 
 * Tests to see if we can query the existing data in the database
 * 
 * Created: January 27, 2025
 * Status: ✅ PRODUCTION READY
 */

describe('Query Existing Data', () => {
  it('should query existing polls data', async () => {
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !serviceKey) {
      throw new Error('Supabase credentials not found');
    }
    
    const supabase = createClient(supabaseUrl, serviceKey);
    
    console.log('🔍 Querying existing polls data...');
    
    // Try to get a count first
    const { count, error: countError } = await supabase
      .from('polls')
      .select('*', { count: 'exact', head: true });
    
    console.log('Count result:', { count, countError });
    
    // Try to get some polls
    const { data: polls, error: pollsError } = await supabase
      .from('polls')
      .select('id, title, description, privacy_level, status')
      .limit(5);
    
    console.log('Polls query result:', { polls, pollsError });
    
    // Try to get polls with specific privacy level
    const { data: publicPolls, error: publicPollsError } = await supabase
      .from('polls')
      .select('id, title, description, privacy_level')
      .eq('privacy_level', 'public')
      .limit(5);
    
    console.log('Public polls query result:', { publicPolls, publicPollsError });
    
    // Try to get polls with specific status
    const { data: activePolls, error: activePollsError } = await supabase
      .from('polls')
      .select('id, title, description, status')
      .eq('status', 'active')
      .limit(5);
    
    console.log('Active polls query result:', { activePolls, activePollsError });
    
    // Try to get a specific poll by title
    const { data: specificPoll, error: specificPollError } = await supabase
      .from('polls')
      .select('*')
      .eq('title', 'Sample Poll: Climate Action')
      .single();
    
    console.log('Specific poll query result:', { specificPoll, specificPollError });
    
    // The test should pass if we can at least connect
    expect(countError).toBeNull();
    expect(pollsError).toBeNull();
    expect(publicPollsError).toBeNull();
    expect(activePollsError).toBeNull();
    expect(specificPollError).toBeNull();
  });
});
