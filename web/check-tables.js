const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTables() {
  try {
    console.log('🔍 Checking for civics tables...');
    
    // Try to query representatives_core table directly
    const { data, error } = await supabase
      .from('representatives_core')
      .select('id, name')
      .limit(5);
    
    if (error) {
      console.log('❌ representatives_core table not found:', error.message);
    } else {
      console.log('✅ representatives_core table exists with', data.length, 'records');
      console.log('Sample data:', data);
    }
    
    // Try to list all tables in public schema
    console.log('\n🔍 Checking all public tables...');
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_tables_in_schema', { schema_name: 'public' });
    
    if (tablesError) {
      console.log('❌ Could not list tables:', tablesError.message);
    } else {
      console.log('📊 Public schema tables:', tables);
    }
    
  } catch (err) {
    console.error('❌ Error:', err);
  }
}

checkTables();
