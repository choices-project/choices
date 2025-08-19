#!/usr/bin/env node

const fs = require('fs');

// Function to fix remaining auth route errors
function fixAuthRoutes() {
  const fixes = [
    // Fix delete-account route
    {
      file: 'web/app/api/auth/delete-account/route.ts',
      search: '    const {  } = await supabase',
      replace: '    const { data: deletedUser, error: deleteError } = await supabase'
    },
    {
      file: 'web/app/api/auth/delete-account/route.ts',
      search: '    const {  } = await supabase.auth.admin.deleteUser',
      replace: '    const { data: authDeletedUser, error: authDeleteError } = await supabase.auth.admin.deleteUser'
    },
    // Fix forgot-password route
    {
      file: 'web/app/api/auth/forgot-password/route.ts',
      search: '    const { data: user } = await supabase',
      replace: '    const { data: user, error: userError } = await supabase'
    },
    // Fix register route
    {
      file: 'web/app/api/auth/register/route.ts',
      search: '    const { email, password, twoFactorCode } = await request.json()',
      replace: '    const { email, password: userPassword, twoFactorCode } = await request.json()'
    },
    // Fix sync-user route
    {
      file: 'web/app/api/auth/sync-user/route.ts',
      search: '    const { data: existingUser } = await supabase',
      replace: '    const { data: existingUser, error: existingError } = await supabase'
    },
    {
      file: 'web/app/api/auth/sync-user/route.ts',
      search: '    const { data: newUser } = await supabase',
      replace: '    const { data: newUser, error: createError } = await supabase'
    }
  ];

  fixes.forEach(fix => {
    try {
      if (fs.existsSync(fix.file)) {
        let content = fs.readFileSync(fix.file, 'utf8');
        if (content.includes(fix.search)) {
          const newContent = content.replace(fix.search, fix.replace);
          fs.writeFileSync(fix.file, newContent, 'utf8');
          console.log(`✅ Fixed: ${fix.file}`);
        } else {
          console.log(`⚠️  Pattern not found: ${fix.file}`);
        }
      }
    } catch (error) {
      console.log(`❌ Error fixing ${fix.file}:`, error.message);
    }
  });
}

console.log('🔧 Fixing remaining auth route errors...');
fixAuthRoutes();
console.log('✅ Auth route fixes completed!');
