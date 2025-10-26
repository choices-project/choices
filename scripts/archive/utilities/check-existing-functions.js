/**
 * CHOICES PLATFORM - CHECK EXISTING DATABASE FUNCTIONS
 * 
 * Repository: https://github.com/choices-project/choices
 * Live Site: https://choices-platform.vercel.app
 * License: MIT
 * 
 * This script checks what database functions already exist
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './web/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  console.log('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in web/.env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkExistingFunctions() {
  console.log('🔍 CHOICES PLATFORM - CHECKING EXISTING DATABASE FUNCTIONS');
  console.log('=' * 60);

  try {
    // Check for existing functions
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql: `
        SELECT 
          routine_name,
          routine_type,
          data_type as return_type,
          routine_definition
        FROM information_schema.routines 
        WHERE routine_schema = 'public' 
        AND (
          routine_name LIKE '%trust%' 
          OR routine_name LIKE '%bot%' 
          OR routine_name LIKE '%sentiment%'
          OR routine_name LIKE '%analytics%'
          OR routine_name LIKE '%link%'
        )
        ORDER BY routine_name;
      `
    });

    if (error) {
      console.error('❌ Error checking functions:', error);
      return false;
    }

    if (data && data.length > 0) {
      console.log('📊 EXISTING FUNCTIONS:');
      data.forEach(func => {
        console.log(`   • ${func.routine_name} (${func.routine_type}) - Returns: ${func.return_type}`);
      });
    } else {
      console.log('📊 No existing functions found');
    }

    // Check for existing tables
    const { data: tables, error: tableError } = await supabase.rpc('exec_sql', { 
      sql: `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND (
          table_name LIKE '%trust%' 
          OR table_name LIKE '%webauthn%'
          OR table_name LIKE '%vote%'
        )
        ORDER BY table_name;
      `
    });

    if (tableError) {
      console.error('❌ Error checking tables:', tableError);
    } else if (tables && tables.length > 0) {
      console.log('\n📊 EXISTING TABLES:');
      tables.forEach(table => {
        console.log(`   • ${table.table_name}`);
      });
    }

    return true;

  } catch (error) {
    console.error('❌ Failed to check functions:', error);
    return false;
  }
}

// Run the check
checkExistingFunctions()
  .then(success => {
    if (success) {
      console.log('\n🎉 FUNCTION CHECK COMPLETE!');
      console.log('Next steps:');
      console.log('1. Review existing functions');
      console.log('2. Update function signatures if needed');
      console.log('3. Re-run database function creation');
    } else {
      console.log('\n❌ CHECK FAILED');
      console.log('Please check the error messages above');
    }
  })
  .catch(error => {
    console.error('❌ Unexpected error:', error);
  });
