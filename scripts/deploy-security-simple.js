#!/usr/bin/env node

/**
 * Simple Security Deployment Script
 * 
 * This script provides the SQL commands to deploy security policies
 * manually in the Supabase dashboard.
 */

const fs = require('fs');
const path = require('path');

async function deploySecuritySimple() {
  try {
    console.log('🔒 Security Deployment - Manual Method\n');

    // Read the security policies SQL file
    const sqlFilePath = path.join(__dirname, '../database/security_policies.sql');
    
    if (!fs.existsSync(sqlFilePath)) {
      console.error('❌ Security policies SQL file not found:', sqlFilePath);
      process.exit(1);
    }

    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    console.log('📋 To deploy security policies manually:');
    console.log('');
    console.log('1. Go to your Supabase Dashboard');
    console.log('   https://supabase.com/dashboard');
    console.log('');
    console.log('2. Select your project');
    console.log('');
    console.log('3. Go to SQL Editor');
    console.log('');
    console.log('4. Copy and paste the following SQL:');
    console.log('');
    console.log('='.repeat(80));
    console.log(sqlContent);
    console.log('='.repeat(80));
    console.log('');
    console.log('5. Click "Run" to execute the SQL');
    console.log('');
    console.log('✅ After deployment, your security will be active!');
    console.log('');
    console.log('🔧 Next Steps:');
    console.log('1. Restart your development server');
    console.log('2. Test admin access at /admin/automated-polls');
    console.log('3. Test poll creation and voting functionality');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the deployment
deploySecuritySimple();
