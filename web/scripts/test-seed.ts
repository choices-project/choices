import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const service = process.env.SUPABASE_SECRET_KEY!;

async function main() {
  console.log('🌱 Seeding test data...');
  
  const admin = createClient(url, service, { 
    auth: { autoRefreshToken: false, persistSession: false } 
  });

  try {
    // Create admin user
    console.log('Creating admin user...');
    const { data: adminUser, error: adminError } = await admin.auth.admin.createUser({
      email: 'admin@example.com',
      password: 'Passw0rd!123',
      email_confirm: true,
      user_metadata: { is_admin: true },
    });

    let adminUserId = adminUser?.user?.id;
    
    if (adminError && !adminError.message.includes('already registered')) {
      console.error('Admin user creation error:', adminError);
    } else {
      console.log('✅ Admin user created/verified');
    }

    // If user creation failed because user exists, get the existing user ID
    if (!adminUserId) {
      console.log('Getting existing admin user ID...');
      const { data: existingUsers } = await admin.auth.admin.listUsers();
      const existingAdmin = existingUsers?.users?.find(u => u.email === 'admin@example.com');
      adminUserId = existingAdmin?.id;
    }

    // Create regular user
    console.log('Creating regular user...');
    const { data: regularUser, error: regularError } = await admin.auth.admin.createUser({
      email: 'user@example.com',
      password: 'Passw0rd!123',
      email_confirm: true,
      user_metadata: { is_admin: false },
    });

    let regularUserId = regularUser?.user?.id;

    if (regularError && !regularError.message.includes('already registered')) {
      console.error('Regular user creation error:', regularError);
    } else {
      console.log('✅ Regular user created/verified');
    }

    // If user creation failed because user exists, get the existing user ID
    if (!regularUserId) {
      console.log('Getting existing regular user ID...');
      const { data: existingUsers } = await admin.auth.admin.listUsers();
      const existingRegular = existingUsers?.users?.find(u => u.email === 'user@example.com');
      regularUserId = existingRegular?.id;
    }

    // Ensure profile rows exist
    console.log('Creating user profiles...');
    
    // Admin profile - update existing profile to ensure is_admin is set
    let adminProfileError = null;
    if (adminUserId) {
      const { error: updateError } = await admin.from('user_profiles')
        .update({
          email: 'admin@example.com',
          username: 'admin',
          trust_tier: 'T3',
          is_admin: true,
          is_active: true,
        })
        .eq('user_id', adminUserId);
      adminProfileError = updateError;
    } else {
      adminProfileError = new Error('No admin user ID available');
    }

    if (adminProfileError) {
      console.error('Admin profile error:', adminProfileError);
    } else {
      console.log('✅ Admin profile created/verified');
    }

    // Regular user profile - update existing profile to ensure is_admin is set
    let userProfileError = null;
    if (regularUserId) {
      const { error: updateError } = await admin.from('user_profiles')
        .update({
          email: 'user@example.com',
          username: 'user',
          trust_tier: 'T1',
          is_admin: false,
          is_active: true,
        })
        .eq('user_id', regularUserId);
      userProfileError = updateError;
    } else {
      userProfileError = new Error('No regular user ID available');
    }

    if (userProfileError) {
      console.error('User profile error:', userProfileError);
    } else {
      console.log('✅ User profile created/verified');
    }

    console.log('🎉 Test data seeding completed!');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

main().catch(err => { 
  console.error('❌ Script failed:', err); 
  process.exit(1); 
});
