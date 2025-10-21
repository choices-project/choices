#!/usr/bin/env node

/**
 * Fix the login route by properly typing the profile object
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'app/api/auth/login/route.ts');

console.log('🔧 Fixing login route type issues...\n');

try {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Import the Database type
  const importLine = "import type { Database } from '@/types/database'";
  if (!content.includes("import type { Database }")) {
    content = content.replace(
      /import type { NextRequest} from 'next\/server';/,
      `import type { NextRequest} from 'next/server';\n${importLine}`
    );
  }
  
  // Define the profile type
  const profileTypeDefinition = `
// Define the profile type based on the selected fields
type UserProfile = Pick<Database['public']['Tables']['user_profiles']['Row'], 
  'username' | 'trust_tier' | 'display_name' | 'avatar_url' | 'bio' | 'is_active'
>;`;
  
  // Add the type definition after imports
  if (!content.includes('type UserProfile')) {
    content = content.replace(
      /import type { Database } from '@\/types\/database';/,
      `import type { Database } from '@/types/database';${profileTypeDefinition}`
    );
  }
  
  // Fix the profile type annotation
  content = content.replace(
    /const { data: profile, error: profileError } = await supabaseClient/,
    'const { data: profile, error: profileError } = await supabaseClient'
  );
  
  // Add proper typing to the profile variable
  content = content.replace(
    /\.single\(\)/,
    '.single() as { data: UserProfile | null; error: any }'
  );
  
  // Remove all the (profile as any) casts
  content = content.replace(/\(profile as any\)\./g, 'profile.');
  
  // Remove the user_id as any cast
  content = content.replace(/\.eq\('user_id', authData\.user\.id as any\)/g, ".eq('user_id', authData.user.id)");
  
  // Write the fixed content back
  fs.writeFileSync(filePath, content, 'utf8');
  
  console.log('✅ Fixed login route type issues:');
  console.log('  - Added Database type import');
  console.log('  - Added UserProfile type definition');
  console.log('  - Removed all (profile as any) casts');
  console.log('  - Removed user_id as any cast');
  
} catch (error) {
  console.error('❌ Error fixing login route:', error.message);
  process.exit(1);
}
