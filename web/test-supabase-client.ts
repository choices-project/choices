// Test file to verify Supabase client with detailed schema
import { getSupabaseServerClient } from './utils/supabase/server'

async function testSupabaseClient() {
  const supabase = await getSupabaseServerClient()
  
  // Test if we can access table types
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('*')
    .limit(1)
  
  console.log('Supabase client test successful')
  return profiles
}

export { testSupabaseClient }
