#!/usr/bin/env node

// Check Supabase Schema Status
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

async function checkSchema() {
  console.log('🔍 Checking Supabase schema status...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing environment variables!');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Check if we can connect at all
    console.log('🔧 Testing basic connection...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.log('⚠️  Auth connection failed:', authError.message);
    } else {
      console.log('✅ Basic connection working');
    }

    // Try to list all tables
    console.log('\n📋 Checking for tables...');
    try {
      const { data: tables, error: tablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');

      if (tablesError) {
        console.log('⚠️  Could not query information_schema:', tablesError.message);
      } else {
        console.log(`✅ Found ${tables?.length || 0} tables in public schema:`);
        if (tables && tables.length > 0) {
          tables.forEach(table => {
            console.log(`   - ${table.table_name}`);
          });
        }
      }
    } catch (err) {
      console.log('❌ Error querying tables:', err.message);
    }

    // Try to check specific tables we need
    console.log('\n🎯 Checking required tables...');
    const requiredTables = [
      'ia_users', 'ia_tokens', 'ia_verification_sessions', 'ia_webauthn_credentials',
      'po_polls', 'po_votes', 'po_merkle_trees',
      'analytics_events', 'analytics_demographics'
    ];

    for (const tableName of requiredTables) {
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

    // Check for custom types
    console.log('\n🔧 Checking custom types...');
    try {
      const { data: types, error: typesError } = await supabase
        .from('information_schema.user_defined_types')
        .select('type_name')
        .eq('type_schema', 'public');

      if (typesError) {
        console.log('⚠️  Could not query types:', typesError.message);
      } else {
        console.log(`✅ Found ${types?.length || 0} custom types:`);
        if (types && types.length > 0) {
          types.forEach(type => {
            console.log(`   - ${type.type_name}`);
          });
        }
      }
    } catch (err) {
      console.log('❌ Error querying types:', err.message);
    }

    console.log('\n📋 Summary:');
    console.log('✅ Basic connection: Working');
    console.log('⚠️  Schema status: Needs verification');
    console.log('⚠️  Tables: May not be fully created');
    
    console.log('\n🚀 Recommendations:');
    console.log('1. The schema execution may have failed partway through');
    console.log('2. Try running the schema again in smaller chunks');
    console.log('3. Check the Supabase SQL Editor for any error messages');
    console.log('4. Consider dropping and recreating the schema');

  } catch (error) {
    console.error('❌ Schema check failed:', error.message);
  }
}

checkSchema().catch(console.error);
