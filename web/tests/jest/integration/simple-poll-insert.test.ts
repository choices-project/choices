import { describe, it, expect } from '@jest/globals';

/**
 * Simple Poll Insert Test
 * 
 * Tests inserting a simple poll to debug database issues
 * 
 * Created: January 27, 2025
 * Status: ✅ PRODUCTION READY
 */

describe('Simple Poll Insert', () => {
  it('should insert a minimal poll successfully', async () => {
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not found');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('🔍 Testing minimal poll insert...');
    
    // Try the simplest possible poll insert
    const minimalPoll = {
      title: 'Test Poll',
      description: 'Test Description',
      options: ['Option 1', 'Option 2'],
      voting_method: 'single_choice',
      status: 'active',
      created_by: 'test-user',
      privacy_level: 'public'
    };
    
    console.log('Minimal poll data:', minimalPoll);
    
    const { data: insertResult, error: insertError } = await supabase
      .from('polls')
      .insert(minimalPoll)
      .select();
    
    console.log('Insert result:', { insertResult, insertError });
    
    if (insertError) {
      console.log('❌ Insert error:', insertError);
      console.log('Error details:', {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code
      });
    }
    
    expect(insertError).toBeNull();
    expect(insertResult).toBeDefined();
    
    if (insertResult && insertResult.length > 0) {
      console.log('✅ Successfully inserted poll:', insertResult[0]);
      
      // Clean up
      const { error: deleteError } = await supabase
        .from('polls')
        .delete()
        .eq('id', insertResult[0].id);
      
      if (deleteError) {
        console.log('⚠️ Could not clean up test poll:', deleteError);
      } else {
        console.log('🧹 Test poll cleaned up');
      }
    }
  });
  
  it('should insert a poll with user_id', async () => {
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not found');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('🔍 Testing poll insert with user_id...');
    
    // Try with user_id
    const pollWithUserId = {
      title: 'Test Poll with User',
      description: 'Test Description',
      options: ['Option 1', 'Option 2'],
      voting_method: 'single_choice',
      status: 'active',
      created_by: 'test-user',
      user_id: '00000000-0000-0000-0000-000000000001',
      privacy_level: 'public'
    };
    
    console.log('Poll with user_id data:', pollWithUserId);
    
    const { data: insertResult, error: insertError } = await supabase
      .from('polls')
      .insert(pollWithUserId)
      .select();
    
    console.log('Insert result:', { insertResult, insertError });
    
    if (insertError) {
      console.log('❌ Insert error:', insertError);
      console.log('Error details:', {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code
      });
    }
    
    expect(insertError).toBeNull();
    expect(insertResult).toBeDefined();
    
    if (insertResult && insertResult.length > 0) {
      console.log('✅ Successfully inserted poll with user_id:', insertResult[0]);
      
      // Clean up
      const { error: deleteError } = await supabase
        .from('polls')
        .delete()
        .eq('id', insertResult[0].id);
      
      if (deleteError) {
        console.log('⚠️ Could not clean up test poll:', deleteError);
      } else {
        console.log('🧹 Test poll cleaned up');
      }
    }
  });
});
