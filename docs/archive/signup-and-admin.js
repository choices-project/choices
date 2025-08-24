#!/usr/bin/env node

require('dotenv').config({ path: './web/.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function signupAndAdmin() {
  console.log('🔐 Signup and Admin Setup Helper\n');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    const email = process.argv[2] || 'admin@choices.com';
    
    console.log('📋 Valid Password Requirements:');
    console.log('   • At least 8 characters');
    console.log('   • Must contain uppercase letter');
    console.log('   • Must contain lowercase letter');
    console.log('   • Must contain number');
    console.log('   • Must contain special character');
    console.log('\n💡 Suggested password: Admin123!@#');
    console.log('\n📝 Steps:');
    console.log('1. Go to http://localhost:3002/register');
    console.log('2. Use the email:', email);
    console.log('3. Use a password that meets the requirements above');
    console.log('4. Complete the signup process');
    console.log('5. Run this script again to upgrade to admin');
    console.log('\n🔧 After signup, run: node scripts/signup-and-admin.js ' + email);

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('ia_users')
      .select('id, email, verification_tier')
      .eq('email', email.toLowerCase())
      .single();

    if (existingUser) {
      console.log('\n✅ User found!');
      console.log(`   Email: ${existingUser.email}`);
      console.log(`   Current Tier: ${existingUser.verification_tier}`);
      
      if (['T2', 'T3'].includes(existingUser.verification_tier)) {
        console.log('🎉 User already has admin privileges!');
        console.log('\n🎉 You can now access the admin dashboard at: http://localhost:3002/admin');
      } else {
        console.log('🔧 Upgrading user to admin...');
        
        const { error: updateError } = await supabase
          .from('ia_users')
          .update({ verification_tier: 'T2' })
          .eq('id', existingUser.id);

        if (updateError) {
          console.log('❌ Error upgrading user:', updateError.message);
          return;
        }

        console.log('✅ User successfully upgraded to admin!');
        console.log('\n🎉 You can now access the admin dashboard at: http://localhost:3002/admin');
      }
    } else {
      console.log('\n❌ User not found. Please complete the signup process first.');
    }

  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

signupAndAdmin().catch(console.error);
