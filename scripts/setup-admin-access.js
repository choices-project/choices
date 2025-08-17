#!/usr/bin/env node

/**
 * Setup Admin Access Script
 * 
 * This script sets up admin access directly in the database and generates
 * the necessary environment variables for secure admin access.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: './web/.env.local' });

// Get Supabase credentials from environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.log('Please ensure you have:');
  console.log('- NEXT_PUBLIC_SUPABASE_URL');
  console.log('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupAdminAccess() {
  try {
    console.log('🔧 Setting up admin access...\n');

    // Get admin email from user input
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const adminEmail = await new Promise((resolve) => {
      rl.question('Enter your admin email address: ', (email) => {
        rl.close();
        resolve(email.trim());
      });
    });

    if (!adminEmail) {
      console.error('❌ Email address is required');
      process.exit(1);
    }

    console.log(`\n🔍 Looking for user with email: ${adminEmail}`);

    // Find user in Supabase Auth
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Error accessing Supabase Auth:', authError.message);
      process.exit(1);
    }

    const authUser = authUsers.users.find(user => user.email === adminEmail);
    
    if (!authUser) {
      console.error('❌ User not found in Supabase Auth');
      console.log('Please make sure you have registered with this email address.');
      process.exit(1);
    }

    console.log('✅ Found user in Supabase Auth:');
    console.log(`   User ID: ${authUser.id}`);
    console.log(`   Email: ${authUser.email}`);
    console.log(`   Email confirmed: ${authUser.email_confirmed_at ? 'Yes' : 'No'}`);

    // Check if user exists in ia_users table
    const { data: iaUser, error: iaError } = await supabase
      .from('ia_users')
      .select('*')
      .eq('stable_id', authUser.id)
      .single();

    if (iaError && iaError.code !== 'PGRST116') {
      console.error('❌ Error checking ia_users table:', iaError.message);
      process.exit(1);
    }

    if (!iaUser) {
      console.log('\n📝 Creating user record in ia_users table...');
      
      const { data: newIaUser, error: createError } = await supabase
        .from('ia_users')
        .insert({
          stable_id: authUser.id,
          email: authUser.email,
          verification_tier: 'T3', // Admin tier
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Error creating user record:', createError.message);
        process.exit(1);
      }

      console.log('✅ Created user record in ia_users table');
    } else {
      console.log('\n📝 Updating existing user record...');
      
      const { error: updateError } = await supabase
        .from('ia_users')
        .update({
          verification_tier: 'T3', // Admin tier
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('stable_id', authUser.id);

      if (updateError) {
        console.error('❌ Error updating user record:', updateError.message);
        process.exit(1);
      }

      console.log('✅ Updated user record to admin tier');
    }

    // Generate environment variables
    const envVars = {
      ADMIN_USER_ID: authUser.id,
      ADMIN_USER_EMAIL: authUser.email,
      NEXT_PUBLIC_ADMIN_EMAIL: authUser.email // For client-side checks if needed
    };

    console.log('\n🔧 Generated Environment Variables:');
    console.log('====================================');
    Object.entries(envVars).forEach(([key, value]) => {
      console.log(`${key}=${value}`);
    });

    // Create .env.admin file with the variables
    const envContent = Object.entries(envVars)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    const envFilePath = path.join(__dirname, '..', '.env.admin');
    fs.writeFileSync(envFilePath, envContent);

    console.log(`\n💾 Saved environment variables to: ${envFilePath}`);

    // Update security policies with the user ID
    console.log('\n🔒 Updating security policies...');
    
    const securityFiles = [
      'database/security_policies.sql',
      'web/app/api/admin/trending-topics/analyze/route.ts',
      'web/app/api/admin/trending-topics/route.ts',
      'web/app/api/admin/generated-polls/route.ts',
      'web/app/api/admin/generated-polls/[id]/approve/route.ts'
    ];

    securityFiles.forEach(filePath => {
      const fullPath = path.join(__dirname, '..', filePath);
      if (fs.existsSync(fullPath)) {
        let content = fs.readFileSync(fullPath, 'utf8');
        content = content.replace(/your-user-id-here/g, authUser.id);
        fs.writeFileSync(fullPath, content);
        console.log(`✅ Updated: ${filePath}`);
      } else {
        console.log(`⚠️  File not found: ${filePath}`);
      }
    });

    // Create a summary file
    const summaryContent = `# Admin Access Setup Summary

## User Information
- **User ID**: ${authUser.id}
- **Email**: ${authUser.email}
- **Verification Tier**: T3 (Admin)
- **Status**: Active

## Environment Variables
${Object.entries(envVars).map(([key, value]) => `${key}=${value}`).join('\n')}

## Files Updated
${securityFiles.map(file => `- ${file}`).join('\n')}

## Next Steps
1. Add the environment variables to your .env.local file
2. Deploy security policies: node scripts/deploy-security-policies.js
3. Restart your development server
4. Test admin access at /admin/automated-polls

## Security Notes
- Admin access is restricted to user ID: ${authUser.id}
- Only this user can access admin features
- All admin actions are logged
- Environment variables should be kept secure

Generated: ${new Date().toISOString()}
`;

    const summaryPath = path.join(__dirname, '..', 'ADMIN_SETUP_SUMMARY.md');
    fs.writeFileSync(summaryPath, summaryContent);
    console.log(`\n📋 Created setup summary: ${summaryPath}`);

    console.log('\n🎉 Admin access setup complete!');
    console.log('\n📋 Next Steps:');
    console.log('1. Add these environment variables to your .env.local file:');
    Object.entries(envVars).forEach(([key, value]) => {
      console.log(`   ${key}=${value}`);
    });
    console.log('\n2. Deploy security policies:');
    console.log('   node scripts/deploy-security-policies.js');
    console.log('\n3. Restart your development server');
    console.log('\n4. Test admin access at: /admin/automated-polls');

  } catch (error) {
    console.error('❌ Error setting up admin access:', error.message);
    process.exit(1);
  }
}

// Run the setup
setupAdminAccess();
