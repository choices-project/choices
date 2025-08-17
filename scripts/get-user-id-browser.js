/**
 * Browser-based User ID Script
 * 
 * Run this script in your browser console while logged into the application
 * to get your user ID for setting up owner-only admin access.
 * 
 * Instructions:
 * 1. Log into the application at http://localhost:3000
 * 2. Open browser developer tools (F12)
 * 3. Go to Console tab
 * 4. Copy and paste this entire script
 * 5. Press Enter to run
 */

(async function() {
  try {
    console.log('🔍 Getting current user information...\n');

    // Check if Supabase client is available
    if (typeof window !== 'undefined' && window.supabase) {
      const supabase = window.supabase;
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('❌ No authenticated user found');
        console.log('Please log in to the application first, then run this script.');
        return;
      }

      console.log('✅ Authenticated user found:');
      console.log(`   User ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Created: ${user.created_at}`);

      // Get user profile from ia_users table
      const { data: userProfile, error: profileError } = await supabase
        .from('ia_users')
        .select('*')
        .eq('stable_id', user.id)
        .single();

      if (profileError) {
        console.log('\n⚠️  User profile not found in ia_users table');
        console.log('This is normal for new users.');
      } else {
        console.log('\n📋 User Profile:');
        console.log(`   Stable ID: ${userProfile.stable_id}`);
        console.log(`   Verification Tier: ${userProfile.verification_tier}`);
        console.log(`   Is Active: ${userProfile.is_active}`);
        console.log(`   Created: ${userProfile.created_at}`);
      }

      console.log('\n🔧 Next Steps:');
      console.log('1. Copy your User ID:', user.id);
      console.log('2. Replace "your-user-id-here" in these files:');
      console.log('   - database/security_policies.sql');
      console.log('   - web/app/api/admin/trending-topics/analyze/route.ts');
      console.log('   - web/app/api/admin/trending-topics/route.ts');
      console.log('   - web/app/api/admin/generated-polls/route.ts');
      console.log('   - web/app/api/admin/generated-polls/[id]/approve/route.ts');
      console.log('3. Deploy security policies: node scripts/deploy-security-policies.js');
      console.log('4. Restart your development server');
      console.log('5. Test admin access at /admin/automated-polls');

      console.log('\n💡 Example replacement:');
      console.log(`const OWNER_USER_ID = '${user.id}';`);

      // Also try to get from localStorage as backup
      try {
        const authData = localStorage.getItem('supabase.auth.token');
        if (authData) {
          const parsed = JSON.parse(authData);
          if (parsed.currentSession?.user?.id) {
            console.log('\n🔍 Backup method - User ID from localStorage:');
            console.log(`   User ID: ${parsed.currentSession.user.id}`);
          }
        }
      } catch (e) {
        // Ignore localStorage errors
      }

    } else {
      // Fallback: try to get from localStorage
      console.log('🔍 Supabase client not available, trying localStorage...');
      
      try {
        const authData = localStorage.getItem('supabase.auth.token');
        if (authData) {
          const parsed = JSON.parse(authData);
          if (parsed.currentSession?.user?.id) {
            console.log('✅ User found in localStorage:');
            console.log(`   User ID: ${parsed.currentSession.user.id}`);
            console.log(`   Email: ${parsed.currentSession.user.email}`);
            
            console.log('\n🔧 Next Steps:');
            console.log('1. Copy your User ID:', parsed.currentSession.user.id);
            console.log('2. Replace "your-user-id-here" in the security files');
            console.log('3. Deploy security policies');
            
            console.log('\n💡 Example replacement:');
            console.log(`const OWNER_USER_ID = '${parsed.currentSession.user.id}';`);
          } else {
            console.error('❌ No authenticated user found in localStorage');
            console.log('Please log in to the application first, then run this script.');
          }
        } else {
          console.error('❌ No authentication data found');
          console.log('Please log in to the application first, then run this script.');
        }
      } catch (e) {
        console.error('❌ Error reading localStorage:', e.message);
        console.log('Please log in to the application first, then run this script.');
      }
    }

  } catch (error) {
    console.error('❌ Error getting user info:', error.message);
  }
})();
