#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Testing exec_sql function...\n');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testExecSql() {
  try {
    // Test a simple query
    console.log('📋 Testing simple query...');
    const { data: simpleResult, error: simpleError } = await supabase.rpc('exec_sql', {
      sql: 'SELECT 1 as test_value;'
    });

    console.log('Simple query result:', simpleResult);
    console.log('Simple query error:', simpleError);

    // Test table existence
    console.log('\n📋 Testing table existence...');
    const { data: tableResult, error: tableError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('po_polls', 'po_votes')
        ORDER BY table_name;
      `
    });

    console.log('Table existence result:', tableResult);
    console.log('Table existence error:', tableError);

    // Test direct Supabase query
    console.log('\n📋 Testing direct Supabase query...');
    const { data: directResult, error: directError } = await supabase
      .from('po_polls')
      .select('poll_id, title')
      .limit(1);

    console.log('Direct query result:', directResult);
    console.log('Direct query error:', directError);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testExecSql();
