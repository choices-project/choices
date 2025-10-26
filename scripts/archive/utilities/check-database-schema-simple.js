#!/usr/bin/env node

/**
 * Check Database Schema - Simple Approach
 * 
 * This script checks the current database schema using direct SQL queries
 * to understand what tables and columns exist.
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: './web/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDatabaseSchema() {
  console.log('🔍 Checking database schema...');
  
  try {
    // Check if votes table exists by trying to select from it
    console.log('\n📊 Checking votes table...');
    const { data: votesData, error: votesError } = await supabase
      .from('votes')
      .select('*')
      .limit(1);

    if (votesError) {
      console.error('❌ Votes table error:', votesError.message);
    } else {
      console.log('✅ Votes table exists');
      if (votesData && votesData.length > 0) {
        console.log('📋 Sample vote data:', Object.keys(votesData[0]));
      }
    }

    // Check if polls table exists
    console.log('\n📊 Checking polls table...');
    const { data: pollsData, error: pollsError } = await supabase
      .from('polls')
      .select('*')
      .limit(1);

    if (pollsError) {
      console.error('❌ Polls table error:', pollsError.message);
    } else {
      console.log('✅ Polls table exists');
      if (pollsData && pollsData.length > 0) {
        console.log('📋 Sample poll data:', Object.keys(pollsData[0]));
      }
    }

    // Check if poll_options table exists
    console.log('\n📊 Checking poll_options table...');
    const { data: optionsData, error: optionsError } = await supabase
      .from('poll_options')
      .select('*')
      .limit(1);

    if (optionsError) {
      console.error('❌ Poll options table error:', optionsError.message);
    } else {
      console.log('✅ Poll options table exists');
      if (optionsData && optionsData.length > 0) {
        console.log('📋 Sample poll option data:', Object.keys(optionsData[0]));
      }
    }

    // Try to create a test vote to see what columns are required
    console.log('\n🧪 Testing vote creation...');
    const testVote = {
      poll_id: '00000000-0000-0000-0000-000000000000',
      option_id: '00000000-0000-0000-0000-000000000000',
      created_at: new Date().toISOString()
    };

    const { data: testVoteData, error: testVoteError } = await supabase
      .from('votes')
      .insert(testVote)
      .select()
      .single();

    if (testVoteError) {
      console.error('❌ Test vote creation error:', testVoteError.message);
    } else {
      console.log('✅ Test vote created successfully');
      console.log('📋 Test vote data:', testVoteData);
      
      // Clean up test vote
      await supabase
        .from('votes')
        .delete()
        .eq('id', testVoteData.id);
    }

  } catch (error) {
    console.error('❌ Error checking database schema:', error);
  }
}

async function main() {
  console.log('🚀 Starting database schema check...');
  await checkDatabaseSchema();
  console.log('\n✅ Database schema check completed!');
}

main().catch(console.error);
