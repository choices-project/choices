#!/usr/bin/env node

/**
 * 🔍 DEEP INVESTIGATION - RLS & PERMISSIONS
 * 
 * This script performs a deep investigation into the permission issues.
 * We'll test every aspect systematically to find the root cause.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'web/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
  console.error('❌ Missing Supabase configuration');
  console.log('URL:', supabaseUrl ? '✅' : '❌');
  console.log('Service Key:', supabaseServiceKey ? '✅' : '❌');
  console.log('Anon Key:', supabaseAnonKey ? '✅' : '❌');
  process.exit(1);
}

const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

async function deepInvestigation() {
  console.log('🔍 DEEP INVESTIGATION - RLS & PERMISSIONS\n');

  try {
    // 1. TEST BASIC CONNECTION
    console.log('🔌 Testing Basic Connection...');
    const connectionTest = await supabaseService.from('polls').select('count').limit(1);
    console.log('Service Role Connection:', connectionTest.error ? `❌ ${connectionTest.error.message}` : '✅ Working');
    
    const anonTest = await supabaseAnon.from('polls').select('count').limit(1);
    console.log('Anonymous Connection:', anonTest.error ? `❌ ${anonTest.error.message}` : '✅ Working');

    // 2. CHECK RLS STATUS ON ALL TABLES
    console.log('\n🔒 Checking RLS Status on All Tables...');
    const tables = [
      'polls', 'votes', 'poll_options', 'user_profiles', 'representatives_core',
      'trust_tier_analytics', 'narrative_analysis_results', 'bot_detection_logs',
      'analytics_events', 'analytics_event_data', 'openstates_people_data',
      'id_crosswalk', 'roles', 'permissions', 'user_roles', 'hashtag_flags',
      'message_delivery_logs', 'civic_action_metadata', 'trust_tier_progression'
    ];

    for (const table of tables) {
      try {
        const rlsStatus = await supabaseService.rpc('exec_sql', {
          sql: `
            SELECT schemaname, tablename, rowsecurity 
            FROM pg_tables 
            WHERE tablename = '${table}' AND schemaname = 'public';
          `
        });
        console.log(`${table}:`, rlsStatus.data?.[0]?.rowsecurity ? '🔒 RLS Enabled' : '🔓 RLS Disabled');
      } catch (error) {
        console.log(`${table}: ❌ Error checking RLS status`);
      }
    }

    // 3. TEST TABLE ACCESS WITH DIFFERENT METHODS
    console.log('\n📊 Testing Table Access with Different Methods...');
    
    // Test with direct SQL
    try {
      const directSQL = await supabaseService.rpc('exec_sql', {
        sql: 'SELECT COUNT(*) as count FROM polls LIMIT 1;'
      });
      console.log('Direct SQL Access:', directSQL.error ? `❌ ${directSQL.error.message}` : '✅ Working');
    } catch (error) {
      console.log('Direct SQL Access:', `❌ ${error.message}`);
    }

    // Test with Supabase client
    try {
      const clientAccess = await supabaseService.from('polls').select('id').limit(1);
      console.log('Supabase Client Access:', clientAccess.error ? `❌ ${clientAccess.error.message}` : '✅ Working');
    } catch (error) {
      console.log('Supabase Client Access:', `❌ ${error.message}`);
    }

    // 4. CHECK TABLE STRUCTURE
    console.log('\n🏗️ Checking Table Structure...');
    try {
      const tableStructure = await supabaseService.rpc('exec_sql', {
        sql: `
          SELECT column_name, data_type, is_nullable 
          FROM information_schema.columns 
          WHERE table_name = 'polls' AND table_schema = 'public'
          ORDER BY ordinal_position;
        `
      });
      console.log('Polls Table Structure:');
      tableStructure.data?.forEach(col => {
        console.log(`  ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      });
    } catch (error) {
      console.log('Table Structure Check:', `❌ ${error.message}`);
    }

    // 5. TEST SPECIFIC PERMISSIONS
    console.log('\n🔑 Testing Specific Permissions...');
    
    // Test SELECT permission
    try {
      const selectTest = await supabaseService.rpc('exec_sql', {
        sql: 'SELECT id FROM polls LIMIT 1;'
      });
      console.log('SELECT Permission:', selectTest.error ? `❌ ${selectTest.error.message}` : '✅ Working');
    } catch (error) {
      console.log('SELECT Permission:', `❌ ${error.message}`);
    }

    // Test INSERT permission
    try {
      const insertTest = await supabaseService.rpc('exec_sql', {
        sql: `
          INSERT INTO polls (id, question, is_public, is_shareable, created_by) 
          VALUES (gen_random_uuid(), 'Test Poll', true, true, gen_random_uuid()) 
          RETURNING id;
        `
      });
      console.log('INSERT Permission:', insertTest.error ? `❌ ${insertTest.error.message}` : '✅ Working');
    } catch (error) {
      console.log('INSERT Permission:', `❌ ${error.message}`);
    }

    // Test UPDATE permission
    try {
      const updateTest = await supabaseService.rpc('exec_sql', {
        sql: 'UPDATE polls SET question = question WHERE id = (SELECT id FROM polls LIMIT 1);'
      });
      console.log('UPDATE Permission:', updateTest.error ? `❌ ${updateTest.error.message}` : '✅ Working');
    } catch (error) {
      console.log('UPDATE Permission:', `❌ ${error.message}`);
    }

    // Test DELETE permission
    try {
      const deleteTest = await supabaseService.rpc('exec_sql', {
        sql: 'DELETE FROM polls WHERE question = \'Test Poll\';'
      });
      console.log('DELETE Permission:', deleteTest.error ? `❌ ${deleteTest.error.message}` : '✅ Working');
    } catch (error) {
      console.log('DELETE Permission:', `❌ ${error.message}`);
    }

    // 6. CHECK SERVICE ROLE PERMISSIONS
    console.log('\n👤 Checking Service Role Permissions...');
    try {
      const roleCheck = await supabaseService.rpc('exec_sql', {
        sql: `
          SELECT 
            r.rolname,
            r.rolsuper,
            r.rolcreaterole,
            r.rolcreatedb,
            r.rolcanlogin
          FROM pg_roles r 
          WHERE r.rolname = 'service_role';
        `
      });
      console.log('Service Role Permissions:');
      roleCheck.data?.forEach(role => {
        console.log(`  Role: ${role.rolname}`);
        console.log(`  Superuser: ${role.rolsuper}`);
        console.log(`  Create Role: ${role.rolcreaterole}`);
        console.log(`  Create DB: ${role.rolcreatedb}`);
        console.log(`  Can Login: ${role.rolcanlogin}`);
      });
    } catch (error) {
      console.log('Service Role Check:', `❌ ${error.message}`);
    }

    // 7. TEST FUNCTION EXECUTION
    console.log('\n🧠 Testing Function Execution...');
    try {
      const functionTest = await supabaseService.rpc('analyze_poll_sentiment', {
        p_poll_id: '00000000-0000-0000-0000-000000000000',
        p_time_window: '1 hour'
      });
      console.log('Function Execution:', functionTest.error ? `❌ ${functionTest.error.message}` : '✅ Working');
      if (functionTest.data) {
        console.log('Function Result:', JSON.stringify(functionTest.data, null, 2));
      }
    } catch (error) {
      console.log('Function Execution:', `❌ ${error.message}`);
    }

    // 8. CHECK FOR EXISTING DATA
    console.log('\n📊 Checking for Existing Data...');
    try {
      const dataCheck = await supabaseService.rpc('exec_sql', {
        sql: 'SELECT COUNT(*) as poll_count FROM polls;'
      });
      console.log('Polls Count:', dataCheck.data?.[0]?.poll_count || 0);
      
      const votesCheck = await supabaseService.rpc('exec_sql', {
        sql: 'SELECT COUNT(*) as vote_count FROM votes;'
      });
      console.log('Votes Count:', votesCheck.data?.[0]?.vote_count || 0);
    } catch (error) {
      console.log('Data Check:', `❌ ${error.message}`);
    }

    // 9. TEST WITH SAMPLE DATA
    console.log('\n🧪 Testing with Sample Data...');
    try {
      // Create a test poll
      const createPoll = await supabaseService.rpc('exec_sql', {
        sql: `
          INSERT INTO polls (id, question, is_public, is_shareable, created_by) 
          VALUES (gen_random_uuid(), 'Deep Investigation Test Poll', true, true, gen_random_uuid()) 
          RETURNING id;
        `
      });
      
      if (createPoll.data && createPoll.data[0]) {
        const pollId = createPoll.data[0].id;
        console.log('Created Test Poll:', pollId);
        
        // Test reading the poll
        const readPoll = await supabaseService.rpc('exec_sql', {
          sql: `SELECT * FROM polls WHERE id = '${pollId}';`
        });
        console.log('Read Test Poll:', readPoll.error ? `❌ ${readPoll.error.message}` : '✅ Working');
        
        // Test function with real poll ID
        const functionTestReal = await supabaseService.rpc('analyze_poll_sentiment', {
          p_poll_id: pollId,
          p_time_window: '1 hour'
        });
        console.log('Function with Real Poll:', functionTestReal.error ? `❌ ${functionTestReal.error.message}` : '✅ Working');
        
        // Clean up
        await supabaseService.rpc('exec_sql', {
          sql: `DELETE FROM polls WHERE id = '${pollId}';`
        });
        console.log('Cleaned up test poll');
      }
    } catch (error) {
      console.log('Sample Data Test:', `❌ ${error.message}`);
    }

    // 10. CHECK SUPABASE CONFIGURATION
    console.log('\n⚙️ Checking Supabase Configuration...');
    console.log('Supabase URL:', supabaseUrl);
    console.log('Service Key Length:', supabaseServiceKey?.length || 0);
    console.log('Anon Key Length:', supabaseAnonKey?.length || 0);
    
    // Test different Supabase client configurations
    try {
      const testClient = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });
      
      const testQuery = await testClient.from('polls').select('id').limit(1);
      console.log('Alternative Client Config:', testQuery.error ? `❌ ${testQuery.error.message}` : '✅ Working');
    } catch (error) {
      console.log('Alternative Client Config:', `❌ ${error.message}`);
    }

    console.log('\n🎉 DEEP INVESTIGATION COMPLETE!');

  } catch (error) {
    console.error('❌ Error in deep investigation:', error);
    throw error;
  }
}

// Test specific table access
async function testSpecificTableAccess() {
  console.log('\n🔍 Testing Specific Table Access...\n');

  const tables = ['polls', 'votes', 'poll_options', 'user_profiles'];

  for (const table of tables) {
    console.log(`Testing ${table}...`);
    
    try {
      // Test with service role
      const serviceTest = await supabaseService.from(table).select('*').limit(1);
      console.log(`  Service Role: ${serviceTest.error ? `❌ ${serviceTest.error.message}` : '✅ Working'}`);
      
      // Test with anonymous
      const anonTest = await supabaseAnon.from(table).select('*').limit(1);
      console.log(`  Anonymous: ${anonTest.error ? `❌ ${anonTest.error.message}` : '✅ Working'}`);
      
    } catch (error) {
      console.log(`  Error: ${error.message}`);
    }
  }
}

// Main execution
async function main() {
  try {
    await deepInvestigation();
    await testSpecificTableAccess();
    
    console.log('\n🚀 DEEP INVESTIGATION COMPLETE!');
    console.log('🎯 This should reveal the root cause of the permission issues!');
    
  } catch (error) {
    console.error('❌ Deep investigation failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  deepInvestigation,
  testSpecificTableAccess
};
