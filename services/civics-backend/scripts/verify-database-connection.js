#!/usr/bin/env node

/**
 * Database Connection Verification Script
 * 
 * Verifies that the database connection is working properly
 * and that all required tables exist.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function verifyDatabaseConnection() {
  console.log('🔍 Verifying database connection...');
  
  try {
    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing required environment variables:');
      if (!supabaseUrl) console.error('   - NEXT_PUBLIC_SUPABASE_URL');
      if (!supabaseKey) console.error('   - SUPABASE_SERVICE_ROLE_KEY');
      return false;
    }
    
    console.log('✅ Environment variables found');
    
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });
    
    console.log('🔗 Testing database connection...');
    
    // Test basic connection
    const { data, error } = await supabase
      .from('representatives_core')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Database connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Database connection successful');
    
    // Check required tables
    const requiredTables = [
      'representatives_core',
      'representative_contacts',
      'representative_photos',
      'representative_social_media',
      'id_crosswalk'
    ];
    
    console.log('🔍 Checking required tables...');
    
    for (const table of requiredTables) {
      try {
        const { error: tableError } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (tableError) {
          console.error(`❌ Table '${table}' not accessible:`, tableError.message);
          return false;
        }
        
        console.log(`✅ Table '${table}' accessible`);
      } catch (err) {
        console.error(`❌ Error checking table '${table}':`, err.message);
        return false;
      }
    }
    
    console.log('✅ All required tables accessible');
    
    // Test permissions
    console.log('🔍 Testing write permissions...');
    
    try {
      const { error: insertError } = await supabase
        .from('representatives_core')
        .insert({
          name: 'Test Representative',
          office: 'Test Office',
          level: 'federal',
          state: 'XX',
          is_active: false,
          canonical_id: 'test_verification_' + Date.now()
        });
      
      if (insertError) {
        console.error('❌ Write permission test failed:', insertError.message);
        return false;
      }
      
      console.log('✅ Write permissions confirmed');
      
      // Clean up test record
      await supabase
        .from('representatives_core')
        .delete()
        .eq('canonical_id', 'test_verification_' + Date.now());
      
      console.log('✅ Test record cleaned up');
      
    } catch (err) {
      console.error('❌ Write permission test failed:', err.message);
      return false;
    }
    
    console.log('🎉 Database verification complete!');
    return true;
    
  } catch (error) {
    console.error('❌ Database verification failed:', error.message);
    return false;
  }
}

// Run verification
if (require.main === module) {
  verifyDatabaseConnection()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Verification script failed:', error);
      process.exit(1);
    });
}

module.exports = { verifyDatabaseConnection };
