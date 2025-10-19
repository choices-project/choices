#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Find all files with duplicate variable issues
const filesToFix = [
  'app/api/auth/register/route.ts',
  'app/api/auth/login/route.ts', 
  'app/api/health/route.ts',
  'app/api/admin/feedback/route.ts',
  'app/api/admin/users/route.ts',
  'app/api/polls/[id]/vote/route.ts',
  'app/api/polls/[id]/close/route.ts',
  'app/api/polls/[id]/lock/route.ts',
  'app/api/feedback/route.ts',
  'app/api/trending/route.ts',
  'app/api/hashtags/route.ts',
  'app/api/civics/openstates-people/route.ts',
  'app/api/civics/representative/[id]/route.ts'
];

function fixFile(filePath) {
  const fullPath = path.join('web', filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`File not found: ${fullPath}`);
    return;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  
  // Fix patterns like "const supabase = supabaseClient as any"
  content = content.replace(/const supabase = supabaseClient as any\n/g, '');
  content = content.replace(/const supabase = supabaseClient\n/g, '');
  content = content.replace(/const typedSupabase = supabaseClient as any\n/g, '');
  content = content.replace(/const typedServiceClient = serviceRoleClient as any\n/g, '');
  content = content.replace(/const typedClient = supabaseClient as any\n/g, '');
  
  // Replace remaining typedSupabase with supabaseClient
  content = content.replace(/typedSupabase/g, 'supabaseClient');
  content = content.replace(/typedServiceClient/g, 'serviceRoleClient');
  content = content.replace(/typedClient/g, 'supabaseClient');
  
  // Remove any remaining "as any" patterns
  content = content.replace(/ as any/g, '');
  
  // Remove comments about type assertions
  content = content.replace(/\/\/ Use type assertion to work around Supabase TypeScript issues\n/g, '');
  
  fs.writeFileSync(fullPath, content);
  console.log(`Fixed: ${filePath}`);
}

console.log('Fixing duplicate variable declarations...');

filesToFix.forEach(fixFile);

console.log('Fix complete!');
