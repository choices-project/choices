#!/usr/bin/env node

// Test Supabase with Service Role Key
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

async function testServiceRole() {
  console.log('🔧 Testing Supabase with Service Role...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('📋 Environment Variables:');
  console.log(`  Supabase URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}`);
  console.log(`  Service Role Key: ${serviceRoleKey ? '✅ Set' : '❌ Missing'}\n`);

  if (!supabaseUrl || !serviceRoleKey) {
    console.log('⚠️  Service role key not found, trying with anon key...');
    
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!anonKey) {
      console.error('❌ No keys available!');
      process.exit(1);
    }
    
    console.log('Using anon key instead...');
    const supabase = createClient(supabaseUrl, anonKey);
    
    // Try a simple query to test connection
    try {
      const { data, error } = await supabase
        .from('pg_tables')
        .select('tablename')
        .eq('schemaname', 'public')
        .limit(5);
      
      if (error) {
        console.log('❌ Query failed:', error.message);
        console.log('\n🔧 This suggests a permission or connection issue.');
        console.log('Try checking:');
        console.log('1. Your Supabase project is active');
        console.log('2. Your API keys are correct');
        console.log('3. Your database is accessible');
      } else {
        console.log('✅ Query successful!');
        console.log('Found tables:', data?.length || 0);
        if (data && data.length > 0) {
          data.forEach(table => {
            console.log(`   - ${table.tablename}`);
          });
        }
      }
    } catch (err) {
      console.log('❌ Connection test failed:', err.message);
    }
    
    return;
  }

  // Use service role key
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    console.log('✅ Service role client created');

    // Test direct database query
    console.log('\n🔍 Testing direct database access...');
    
    const { data: tables, error: tablesError } = await supabase
      .from('pg_tables')
      .select('tablename')
      .eq('schemaname', 'public')
      .limit(10);

    if (tablesError) {
      console.log('❌ Direct query failed:', tablesError.message);
    } else {
      console.log(`✅ Found ${tables?.length || 0} tables in public schema:`);
      if (tables && tables.length > 0) {
        tables.forEach(table => {
          console.log(`   - ${table.tablename}`);
        });
      }
    }

    // Test our specific tables
    console.log('\n🎯 Testing our tables...');
    const ourTables = ['ia_users', 'po_polls', 'po_votes', 'analytics_events'];
    
    for (const tableName of ourTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ ${tableName}: ${error.message}`);
        } else {
          console.log(`✅ ${tableName}: Accessible (${data?.length || 0} rows)`);
        }
      } catch (err) {
        console.log(`❌ ${tableName}: ${err.message}`);
      }
    }

    console.log('\n🎉 Service role test completed!');

  } catch (error) {
    console.error('❌ Service role test failed:', error.message);
  }
}

testServiceRole().catch(console.error);
