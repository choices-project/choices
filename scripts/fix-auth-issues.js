#!/usr/bin/env node

/**
 * Fix Authentication Issues Script
 * 
 * This script diagnoses and provides solutions for authentication problems.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './web/.env.local' });

// Get Supabase credentials from environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in environment variables');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

// Create Supabase client with service role key for admin access
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function diagnoseAuthIssues() {
  console.log('🔍 Diagnosing authentication issues...\n');
  
  try {
    // Check environment variables
    console.log('📋 Environment Variables Check:');
    console.log(`✅ NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? 'Set' : 'Missing'}`);
    console.log(`✅ SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? 'Set' : 'Missing'}`);
    
    const enabledProviders = process.env.NEXT_PUBLIC_ENABLED_OAUTH_PROVIDERS;
    console.log(`⚠️  NEXT_PUBLIC_ENABLED_OAUTH_PROVIDERS: ${enabledProviders || 'Not set (defaults to google,github)'}`);
    
    // Check if we can connect to Supabase
    console.log('\n🔗 Supabase Connection Test:');
    try {
      const { data: { users }, error } = await supabase.auth.admin.listUsers();
      if (error) {
        console.log(`❌ Connection failed: ${error.message}`);
      } else {
        console.log(`✅ Connection successful (${users.length} users found)`);
      }
    } catch (err) {
      console.log(`❌ Connection error: ${err.message}`);
    }
    
    // Check OAuth configuration
    console.log('\n🔐 OAuth Configuration Check:');
    console.log('⚠️  OAuth providers need to be configured in Supabase Dashboard:');
    console.log('   1. Go to https://supabase.com/dashboard');
    console.log('   2. Select your project');
    console.log('   3. Go to Authentication → Providers');
    console.log('   4. Configure the following providers:');
    
    const providers = ['google', 'github', 'facebook', 'twitter', 'linkedin', 'discord'];
    providers.forEach(provider => {
      console.log(`      - ${provider.toUpperCase()}: Enable and configure credentials`);
    });
    
    // Check email configuration
    console.log('\n📧 Email Configuration Check:');
    console.log('⚠️  Email service issues detected:');
    console.log('   1. Check Supabase Dashboard → Settings → Auth');
    console.log('   2. Verify SMTP settings are configured');
    console.log('   3. Check if email templates are set up');
    console.log('   4. Verify domain is not blocked by email providers');
    
    // Check database tables
    console.log('\n🗄️  Database Tables Check:');
    const requiredTables = [
      'user_profiles',
      'auth.users',
      'feedback',
      'biometric_credentials'
    ];
    
    for (const table of requiredTables) {
      try {
        const { data, error } = await supabase
          .from(table.replace('auth.', ''))
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ Table ${table}: ${error.message}`);
        } else {
          console.log(`✅ Table ${table}: accessible`);
        }
      } catch (err) {
        console.log(`❌ Table ${table}: ${err.message}`);
      }
    }
    
    // Provide solutions
    console.log('\n🛠️  Solutions:');
    console.log('\n1. **Fix OAuth Providers**:');
    console.log('   - Configure OAuth providers in Supabase Dashboard');
    console.log('   - Set up redirect URLs for each provider');
    console.log('   - Add environment variables for OAuth secrets');
    
    console.log('\n2. **Fix Email Issues**:');
    console.log('   - Configure SMTP settings in Supabase');
    console.log('   - Set up email templates');
    console.log('   - Verify domain reputation');
    
    console.log('\n3. **Environment Variables to Add**:');
    console.log('   NEXT_PUBLIC_ENABLED_OAUTH_PROVIDERS=google,github,facebook,twitter,linkedin,discord');
    console.log('   # Add OAuth provider secrets as needed');
    
    console.log('\n4. **Test Authentication**:');
    console.log('   - Test email/password registration');
    console.log('   - Test OAuth providers one by one');
    console.log('   - Check browser console for errors');
    
  } catch (error) {
    console.error('❌ Error during diagnosis:', error.message);
    process.exit(1);
  }
}

// Run the diagnosis
diagnoseAuthIssues()
  .then(() => {
    console.log('\n🎉 Authentication diagnosis completed!');
    console.log('📝 Follow the solutions above to fix the issues.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Diagnosis failed:', error);
    process.exit(1);
  });

