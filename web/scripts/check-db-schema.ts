import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const service = process.env.SUPABASE_SECRET_KEY!;

async function checkSchema() {
  console.log('🔍 Checking database schema...');
  
  const supabase = createClient(url, service, { 
    auth: { autoRefreshToken: false, persistSession: false } 
  });

  try {
    // Try to query user_profiles table to see its structure
    console.log('📋 Testing user_profiles table access...');
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1);

    if (profilesError) {
      console.error('❌ Error accessing user_profiles:', profilesError);
    } else {
      console.log('✅ user_profiles table accessible');
      if (profiles && profiles.length > 0) {
        console.log('📋 Sample profile structure:');
        Object.keys(profiles[0]).forEach(key => {
          console.log(`  - ${key}: ${typeof profiles[0][key]}`);
        });
        
        // Check if is_admin column exists
        const hasIsAdmin = 'is_admin' in profiles[0];
        console.log(`\n🔐 is_admin column exists: ${hasIsAdmin ? '✅ YES' : '❌ NO'}`);
      } else {
        console.log('📋 No profiles found, but table exists');
      }
    }

    // Test the is_admin function
    console.log('\n🧪 Testing is_admin function...');
    const { data: adminTest, error: adminError } = await supabase.rpc('is_admin', { 
      input_user_id: '00000000-0000-0000-0000-000000000000' 
    });
    
    if (adminError) {
      console.error('❌ Error testing is_admin function:', adminError);
    } else {
      console.log(`✅ is_admin function works: ${adminTest}`);
    }

  } catch (error) {
    console.error('❌ Script failed:', error);
  }
}

checkSchema().catch(err => { 
  console.error('❌ Script failed:', err); 
  process.exit(1); 
});
