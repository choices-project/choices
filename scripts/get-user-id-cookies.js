/**
 * Cookie-based User ID Script
 * 
 * This script works with the cookie-based authentication system.
 * Run this in your browser console while logged into the application.
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
    console.log('🔍 Getting current user information via API...\n');

    // Method 1: Try the API endpoint (uses cookie-based auth)
    try {
      const response = await fetch('/api/user/get-id', {
        method: 'GET',
        credentials: 'include', // Important: include cookies
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      if (data.success && data.user) {
        console.log('✅ User found via API:');
        console.log(`   User ID: ${data.user.id}`);
        console.log(`   Email: ${data.user.email}`);
        console.log(`   Created: ${data.user.created_at}`);
        
        if (data.user.profile) {
          console.log('\n📋 User Profile:');
          console.log(`   Stable ID: ${data.user.profile.stable_id}`);
          console.log(`   Verification Tier: ${data.user.profile.verification_tier}`);
          console.log(`   Is Active: ${data.user.profile.is_active}`);
        }

        console.log('\n🔧 Next Steps:');
        console.log('1. Copy your User ID:', data.user.id);
        console.log('2. Replace "your-user-id-here" in these files:');
        data.instructions.files_to_update.forEach(file => {
          console.log(`   - ${file}`);
        });
        console.log('3. Deploy security policies: node scripts/deploy-security-policies.js');
        console.log('4. Restart your development server');
        console.log('5. Test admin access at /admin/automated-polls');

        console.log('\n💡 Example replacement:');
        console.log(data.instructions.example_replacement);

        return;
      } else {
        console.log('❌ API returned error:', data.error);
        if (data.debug) {
          console.log('🔍 Debug info:', data.debug);
        }
      }
    } catch (apiError) {
      console.log('❌ API call failed:', apiError.message);
    }

    // Method 2: Try to get from cookies directly
    console.log('\n🔍 Trying to get user ID from cookies...');
    
    const cookies = document.cookie.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {});

    console.log('📋 Available cookies:', Object.keys(cookies));

    // Look for Supabase auth cookies
    const authCookies = Object.keys(cookies).filter(key => 
      key.includes('auth') || key.includes('supabase')
    );

    if (authCookies.length > 0) {
      console.log('🔍 Found auth cookies:', authCookies);
      
      // Try to decode the auth cookie
      authCookies.forEach(cookieName => {
        try {
          const cookieValue = decodeURIComponent(cookies[cookieName]);
          console.log(`📋 Cookie ${cookieName}:`, cookieValue.substring(0, 100) + '...');
          
          // Try to parse as JSON
          try {
            const parsed = JSON.parse(cookieValue);
            if (parsed.user?.id) {
              console.log('✅ Found user ID in cookie:', parsed.user.id);
              console.log('   Email:', parsed.user.email);
            }
          } catch (e) {
            // Not JSON, that's okay
          }
        } catch (e) {
          console.log(`❌ Could not decode cookie ${cookieName}`);
        }
      });
    }

    // Method 3: Try localStorage as last resort
    console.log('\n🔍 Checking localStorage as backup...');
    
    try {
      const authData = localStorage.getItem('supabase.auth.token');
      if (authData) {
        const parsed = JSON.parse(authData);
        if (parsed.currentSession?.user?.id) {
          console.log('✅ Found user ID in localStorage:');
          console.log(`   User ID: ${parsed.currentSession.user.id}`);
          console.log(`   Email: ${parsed.currentSession.user.email}`);
          
          console.log('\n💡 Example replacement:');
          console.log(`const OWNER_USER_ID = '${parsed.currentSession.user.id}';`);
          return;
        }
      }
    } catch (e) {
      console.log('❌ localStorage check failed:', e.message);
    }

    // If we get here, we couldn't find the user ID
    console.log('\n❌ Could not find user ID');
    console.log('🔧 Troubleshooting steps:');
    console.log('1. Make sure you are logged into the application');
    console.log('2. Try refreshing the page and running this script again');
    console.log('3. Check if you can access protected pages like /dashboard');
    console.log('4. Try logging out and logging back in');

  } catch (error) {
    console.error('❌ Error getting user info:', error.message);
  }
})();
