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

    if (adminError && !adminError.message.includes('already registered')) {
      console.error('Admin user creation error:', adminError);
    } else {
      console.log('✅ Admin user created/verified');
    }

    // Create regular user
    console.log('Creating regular user...');
    const { data: regularUser, error: regularError } = await admin.auth.admin.createUser({
      email: 'user@example.com',
      password: 'Passw0rd!123',
      email_confirm: true,
      user_metadata: { is_admin: false },
    });

    if (regularError && !regularError.message.includes('already registered')) {
      console.error('Regular user creation error:', regularError);
    } else {
      console.log('✅ Regular user created/verified');
    }

    // Ensure profile rows exist
    console.log('Creating user profiles...');
    
    // Admin profile
    const { error: adminProfileError } = await admin.from('user_profiles').upsert({
      user_id: adminUser?.user?.id || 'admin-user-id',
      email: 'admin@example.com',
      is_admin: true,
      is_active: true,
    }, { onConflict: 'email' });

    if (adminProfileError) {
      console.error('Admin profile error:', adminProfileError);
    } else {
      console.log('✅ Admin profile created/verified');
    }

    // Regular user profile
    const { error: userProfileError } = await admin.from('user_profiles').upsert({
      user_id: regularUser?.user?.id || 'regular-user-id',
      email: 'user@example.com',
      is_admin: false,
      is_active: true,
    }, { onConflict: 'email' });

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
