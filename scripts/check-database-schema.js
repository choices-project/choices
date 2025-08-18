#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Checking Database Schema...\n');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  try {
    // Check po_polls table structure
    console.log('📋 Checking po_polls table...');
    const { data: pollsColumns, error: pollsError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'po_polls'
        ORDER BY ordinal_position;
      `
    });

    if (pollsError) {
      console.log('❌ Error checking po_polls:', pollsError.message);
    } else {
      console.log('✅ po_polls columns:');
      console.log(JSON.stringify(pollsColumns, null, 2));
    }

    // Check po_votes table structure
    console.log('\n📋 Checking po_votes table...');
    const { data: votesColumns, error: votesError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'po_votes'
        ORDER BY ordinal_position;
      `
    });

    if (votesError) {
      console.log('❌ Error checking po_votes:', votesError.message);
    } else {
      console.log('✅ po_votes columns:');
      console.log(JSON.stringify(votesColumns, null, 2));
    }

    // Check functions
    console.log('\n📋 Checking functions...');
    const { data: functions, error: funcError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT routine_name, routine_type
        FROM information_schema.routines 
        WHERE routine_schema = 'public' 
        AND routine_name LIKE '%privacy%'
        ORDER BY routine_name;
      `
    });

    if (funcError) {
      console.log('❌ Error checking functions:', funcError.message);
    } else {
      console.log('✅ Privacy functions:');
      console.log(JSON.stringify(functions, null, 2));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkSchema();
