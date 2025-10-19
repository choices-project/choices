#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Files that need cleanup
const filesToClean = [
  'app/actions/admin/system-status.ts',
  'app/api/auth/register/route.ts', 
  'app/api/auth/login/route.ts',
  'app/api/health/route.ts',
  'app/api/admin/feedback/route.ts',
  'app/api/admin/feedback/export/route.ts',
  'app/api/admin/feedback/[id]/status/route.ts',
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

function cleanupFile(filePath) {
  const fullPath = path.join('web', filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`File not found: ${fullPath}`);
    return;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  
  // Remove "as any" type assertions
  content = content.replace(/const typedSupabase = supabase as any\n/g, '');
  content = content.replace(/const typedServiceClient = serviceRoleClient as any\n/g, '');
  content = content.replace(/const typedClient = supabaseClient as any\n/g, '');
  
  // Replace typedSupabase with supabase
  content = content.replace(/typedSupabase/g, 'supabase');
  content = content.replace(/typedServiceClient/g, 'serviceRoleClient');
  content = content.replace(/typedClient/g, 'supabaseClient');
  
  // Remove comments about type assertions
  content = content.replace(/\/\/ Use type assertion to work around Supabase TypeScript issues\n/g, '');
  
  fs.writeFileSync(fullPath, content);
  console.log(`Cleaned up: ${filePath}`);
}

console.log('Cleaning up as any workarounds...');

filesToClean.forEach(cleanupFile);

console.log('Cleanup complete!');
