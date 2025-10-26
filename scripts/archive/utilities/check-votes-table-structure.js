#!/usr/bin/env node

/**
 * Check Votes Table Structure
 * 
 * This script checks the current structure of the votes table
 * to understand what columns exist and what needs to be added.
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

async function checkVotesTableStructure() {
  console.log('🔍 Checking votes table structure...');
  
  try {
    // Get votes table columns
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_schema', 'public')
      .eq('table_name', 'votes')
      .order('ordinal_position');

    if (columnsError) {
      console.error('❌ Error getting votes table columns:', columnsError);
      return;
    }

    console.log('\n📊 Votes Table Columns:');
    console.log('====================');
    columns.forEach(col => {
      console.log(`${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    // Check if polls table exists and its structure
    const { data: pollsColumns, error: pollsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_schema', 'public')
      .eq('table_name', 'polls')
      .order('ordinal_position');

    if (pollsError) {
      console.error('❌ Error getting polls table columns:', pollsError);
    } else {
      console.log('\n📊 Polls Table Columns:');
      console.log('====================');
      pollsColumns.forEach(col => {
        console.log(`${col.column_name}: ${col.data_type}`);
      });
    }

    // Check if poll_options table exists and its structure
    const { data: optionsColumns, error: optionsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_schema', 'public')
      .eq('table_name', 'poll_options')
      .order('ordinal_position');

    if (optionsError) {
      console.error('❌ Error getting poll_options table columns:', optionsError);
    } else {
      console.log('\n📊 Poll Options Table Columns:');
      console.log('============================');
      optionsColumns.forEach(col => {
        console.log(`${col.column_name}: ${col.data_type}`);
      });
    }

    // Check if calculate_user_trust_tier function exists
    const { data: functions, error: functionsError } = await supabase
      .from('information_schema.routines')
      .select('routine_name, routine_type')
      .eq('routine_schema', 'public')
      .eq('routine_name', 'calculate_user_trust_tier');

    if (functionsError) {
      console.error('❌ Error checking functions:', functionsError);
    } else {
      console.log('\n📊 Available Functions:');
      console.log('====================');
      if (functions.length > 0) {
        functions.forEach(func => {
          console.log(`${func.routine_name}: ${func.routine_type}`);
        });
      } else {
        console.log('No calculate_user_trust_tier function found');
      }
    }

  } catch (error) {
    console.error('❌ Error checking table structure:', error);
  }
}

async function main() {
  console.log('🚀 Starting votes table structure check...');
  await checkVotesTableStructure();
  console.log('\n✅ Votes table structure check completed!');
}

main().catch(console.error);
