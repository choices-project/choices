#!/usr/bin/env node

/**
 * Privacy-First Database Setup Script
 * 
 * Sets up the complete privacy-first database schema with:
 * - Client-side encryption support
 * - Consent management
 * - Privacy-preserving analytics
 * - User data controls
 * 
 * @created September 9, 2025
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

// Configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('   SUPABASE_SECRET_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runSQLFile(filePath) {
  console.log(`📄 Reading SQL file: ${filePath}`);
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ SQL file not found: ${filePath}`);
    return false;
  }

  const sql = fs.readFileSync(filePath, 'utf8');
  
  console.log(`🚀 Executing SQL from: ${filePath}`);
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error(`❌ Error executing SQL:`, error);
      return false;
    }
    
    console.log(`✅ SQL executed successfully`);
    return true;
  } catch (err) {
    console.error(`❌ Exception executing SQL:`, err);
    return false;
  }
}

async function setupPrivacyDatabase() {
  console.log('🔐 Setting up Privacy-First Database Architecture');
  console.log('================================================');
  
  const scripts = [
    'database/clean-database-setup.sql',
    'database/security-cleanup.sql',
    'database/fix-function-security.sql',
    'database/privacy-first-schema.sql',
    'database/performance-optimization.sql'
  ];
  
  let successCount = 0;
  let totalCount = scripts.length;
  
  for (const script of scripts) {
    const scriptPath = path.join(__dirname, '..', script);
    console.log(`\n📋 Processing: ${script}`);
    
    const success = await runSQLFile(scriptPath);
    if (success) {
      successCount++;
      console.log(`✅ ${script} completed successfully`);
    } else {
      console.log(`❌ ${script} failed`);
    }
  }
  
  console.log('\n📊 Setup Summary');
  console.log('================');
  console.log(`✅ Successful: ${successCount}/${totalCount}`);
  console.log(`❌ Failed: ${totalCount - successCount}/${totalCount}`);
  
  if (successCount === totalCount) {
    console.log('\n🎉 Privacy-First Database Setup Complete!');
    console.log('\n🔐 Privacy Features Enabled:');
    console.log('   • Client-side encryption for user data');
    console.log('   • Granular consent management');
    console.log('   • Privacy-preserving analytics');
    console.log('   • User data export and anonymization');
    console.log('   • Row-level security on all tables');
    console.log('   • Admin-proof data access');
    
    console.log('\n📋 Next Steps:');
    console.log('   1. Test the privacy features');
    console.log('   2. Set up user onboarding flow');
    console.log('   3. Implement consent UI components');
    console.log('   4. Create privacy dashboard');
    console.log('   5. Deploy with confidence!');
  } else {
    console.log('\n⚠️  Some scripts failed. Please review the errors above.');
    process.exit(1);
  }
}

// Run the setup
setupPrivacyDatabase().catch(console.error);


