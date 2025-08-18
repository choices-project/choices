#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Checking Privacy Columns...\n');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPrivacyColumns() {
  try {
    // Try to insert a poll with privacy columns
    console.log('📋 Testing poll creation with privacy columns...');
    
    const testPoll = {
      poll_id: `test-privacy-${Date.now()}`,
      title: 'Test Privacy Poll',
      description: 'Testing privacy columns',
      options: ['Option 1', 'Option 2'],
      voting_method: 'single',
      privacy_level: 'private',
      category: 'Technology',
      tags: ['test'],
      status: 'active',
      start_time: new Date().toISOString(),
      end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      ia_public_key: 'test-public-key',
      privacy_metadata: {
        test: true,
        created_at: new Date().toISOString()
      }
    };

    const { data: poll, error: pollError } = await supabase
      .from('po_polls')
      .insert(testPoll)
      .select()
      .single();

    if (pollError) {
      console.log('❌ Error creating poll with privacy columns:', pollError.message);
      
      // Check what columns actually exist
      console.log('\n📋 Checking existing columns...');
      const { data: existingPoll, error: existingError } = await supabase
        .from('po_polls')
        .select('*')
        .limit(1);

      if (existingError) {
        console.log('❌ Error checking existing poll:', existingError.message);
      } else {
        console.log('✅ Existing poll columns:', Object.keys(existingPoll[0] || {}));
      }
    } else {
      console.log('✅ Successfully created poll with privacy columns!');
      console.log('Poll data:', poll);
      
      // Clean up
      await supabase
        .from('po_polls')
        .delete()
        .eq('poll_id', poll.poll_id);
      
      console.log('✅ Test poll cleaned up');
    }

    // Try to insert a vote with privacy columns
    console.log('\n📋 Testing vote creation with privacy columns...');
    
    const testVote = {
      poll_id: poll.poll_id, // Use the actual poll ID from the created poll
      choice: 1,
      privacy_level: 'private',
      token: `test_token_${Date.now()}`,
      tag: `test_tag_${Date.now()}`,
      merkle_leaf: 'public_vote',
      vote_metadata: {
        test: true,
        timestamp: new Date().toISOString()
      }
    };

    const { data: vote, error: voteError } = await supabase
      .from('po_votes')
      .insert(testVote)
      .select()
      .single();

    if (voteError) {
      console.log('❌ Error creating vote with privacy columns:', voteError.message);
      
      // Check what columns actually exist
      console.log('\n📋 Checking existing vote columns...');
      const { data: existingVote, error: existingVoteError } = await supabase
        .from('po_votes')
        .select('*')
        .limit(1);

      if (existingVoteError) {
        console.log('❌ Error checking existing vote:', existingVoteError.message);
      } else {
        console.log('✅ Existing vote columns:', Object.keys(existingVote[0] || {}));
      }
    } else {
      console.log('✅ Successfully created vote with privacy columns!');
      console.log('Vote data:', vote);
      
      // Clean up
      await supabase
        .from('po_votes')
        .delete()
        .eq('id', vote.id);
      
      console.log('✅ Test vote cleaned up');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkPrivacyColumns();
