#!/usr/bin/env node

/**
 * Get Admin User ID using Service Role Key
 * 
 * This script uses the service role key to find your admin user ID
 * and helps set up the .env.local file properly.
 */

require('dotenv').config({ path: './web/.env.local' });
const { createClient } = require('@supabase/supabase-js');

console.log('🔍 Getting Admin User ID with Service Role Key');
console.log('=============================================\n');

async function getAdminUserId() {
  try {
    // Check if we have the service role key
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    
    if (!serviceRoleKey || serviceRoleKey.includes('your_') || serviceRoleKey.includes('here')) {
      console.log('❌ Service role key not found or is placeholder');
      console.log('📝 Please update SUPABASE_SERVICE_ROLE_KEY in web/.env.local');
      return;
    }
    
    if (!supabaseUrl || supabaseUrl.includes('your_') || supabaseUrl.includes('here')) {
      console.log('❌ Supabase URL not found or is placeholder');
      console.log('📝 Please update NEXT_PUBLIC_SUPABASE_URL in web/.env.local');
      return;
    }

    console.log('✅ Service role key and URL found');
    console.log('🔗 Connecting to Supabase...');

    // Create client with service role key
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Try to get user information
    console.log('👤 Fetching user information...');
    
    // First, let's see what tables exist
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    if (tableError) {
      console.log(`⚠️  Cannot access table information: ${tableError.message}`);
      console.log('🔍 Trying alternative approach...');
    } else {
      console.log(`📊 Available tables: ${tables?.map(t => t.table_name).join(', ') || 'None'}`);
    }

    // Try to get users from auth.users (Supabase's built-in auth table)
    console.log('🔍 Checking auth.users table...');
    const { data: users, error: userError } = await supabase
      .from('auth.users')
      .select('id, email, created_at')
      .limit(10);

    if (userError) {
      console.log(`⚠️  Cannot access auth.users: ${userError.message}`);
      console.log('🔍 Trying ia_users table...');
      
      // Try ia_users table
      const { data: iaUsers, error: iaError } = await supabase
        .from('ia_users')
        .select('*')
        .limit(10);

      if (iaError) {
        console.log(`⚠️  Cannot access ia_users: ${iaError.message}`);
        console.log('🔍 Trying direct SQL query...');
        
        // Try a direct SQL query
        const { data: sqlUsers, error: sqlError } = await supabase
          .rpc('exec_sql', { 
            sql: 'SELECT id, email, created_at FROM auth.users LIMIT 5;' 
          });

        if (sqlError) {
          console.log(`❌ Cannot execute SQL: ${sqlError.message}`);
          console.log('📝 Please check your Supabase project configuration');
          return;
        } else {
          console.log('✅ Found users via SQL query:');
          sqlUsers.forEach(user => {
            console.log(`   ID: ${user.id}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Created: ${user.created_at}`);
            console.log('');
          });
        }
      } else {
        console.log('✅ Found users in ia_users table:');
        iaUsers.forEach(user => {
          console.log(`   ID: ${user.id || user.user_id}`);
          console.log(`   Email: ${user.email}`);
          console.log('');
        });
      }
    } else {
      console.log('✅ Found users in auth.users table:');
      users.forEach(user => {
        console.log(`   ID: ${user.id}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Created: ${user.created_at}`);
        console.log('');
      });
    }

    // Ask user to identify their admin user
    console.log('📝 Next Steps:');
    console.log('==============');
    console.log('1. Identify your admin user ID from the list above');
    console.log('2. Update web/.env.local with your admin user ID:');
    console.log('   ADMIN_USER_ID=your_actual_user_id_here');
    console.log('   ADMIN_USER_EMAIL=your_actual_email_here');
    console.log('');
    console.log('3. Test the configuration:');
    console.log('   node scripts/test-environment-and-database.js');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('📝 Please check your Supabase credentials and try again');
  }
}

// Run the function
getAdminUserId();
