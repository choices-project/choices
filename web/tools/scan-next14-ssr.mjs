/* eslint-env node */
#!/usr/bin/env node
/* eslint-env node */
/**
 * Next.js 14 SSR scanner for Choices
 * Focuses on actual Next.js 14 issues, not Next.js 15 breaking changes
 * 
 * Usage: node tools/scan-next14-ssr.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(process.cwd(), 'web');
const exts = new Set(['.ts', '.tsx', '.js', '.mjs', '.cjs']);

const files = [];
walk(ROOT);

const results = {
  serverComponentCookies: [], // Server Components using cookies() (may be OK)
  clientComponentServerCode: [], // 'use client' with server-only code
  badSupabaseImport: [], // Server importing @supabase/supabase-js
  potentialSSRIssues: [], // Files that might have SSR issues
  buildErrors: [], // Files that might cause build errors
};

for (const file of files) {
  const code = fs.readFileSync(file, 'utf8');
  
  // Check for 'use client' directive
  const isClient = code.includes('"use client"') || code.includes("'use client'");
  
  // Check for imports
  const hasNextHeadersImport = /import.*from\s+['"]next\/headers['"]/.test(code);
  const importsBrowserSupabase = /import.*from\s+['"]@supabase\/supabase-js['"]/.test(code);
  const importsAuthHelpers = /import.*from\s+['"]@supabase\/auth-helpers-nextjs['"]/.test(code);
  const importsSSR = /import.*from\s+['"]@supabase\/ssr['"]/.test(code);
  
  // Check for server-only code in client components
  const hasServerOnlyCode = /cookies\(\)|headers\(\)|draftMode\(\)/.test(code);
  const hasServerOnlyImports = /import.*from\s+['"]server-only['"]/.test(code);
  
  // Check for potential SSR issues
  const hasAsyncCookies = /await\s+cookies\(\)/.test(code); // This would be wrong in Next.js 14
  const hasTopLevelServerCode = !isClient && hasServerOnlyCode;
  
  // Check for build issues
  const hasBrowserGlobals = /window\.|document\.|localStorage\.|sessionStorage\./.test(code);
  const hasNodeGlobals = /process\.|Buffer\.|__dirname/.test(code);
  
  // Report findings
  if (!isClient && hasNextHeadersImport) {
    results.serverComponentCookies.push(rel(file));
  }

  if (isClient && (hasServerOnlyCode || hasServerOnlyImports)) {
    results.clientComponentServerCode.push(rel(file));
  }

  if (importsBrowserSupabase && !isClient) {
    results.badSupabaseImport.push(rel(file));
  }

  if (hasAsyncCookies) {
    results.potentialSSRIssues.push(`${rel(file)} - Using await cookies() (should be synchronous in Next.js 14)`);
  }

  if (isClient && hasNodeGlobals) {
    results.buildErrors.push(`${rel(file)} - Client component using Node.js globals`);
  }

  if (!isClient && hasBrowserGlobals) {
    results.buildErrors.push(`${rel(file)} - Server component using browser globals`);
  }
}

printResults(results);

// ---- helpers ----
function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      // skip build output
      if (ent.name === '.next' || ent.name === 'node_modules') continue;
      walk(p);
    } else if (ent.isFile() && exts.has(path.extname(ent.name))) {
      files.push(p);
    }
  }
}

function rel(p) {
  return path.relative(process.cwd(), p);
}

function printResults(r) {
  const hr = () => console.log('-'.repeat(60));
  let fail = false;

  console.log('\nNext.js 14 SSR scan\n');
  hr();
  
  if (r.serverComponentCookies.length) {
    console.log('ℹ️  Server Components using cookies() (may be OK in Next.js 14):');
    r.serverComponentCookies.forEach(f => console.log(`  - ${f}`));
  } else {
    console.log('✅ No server components using cookies() detected.');
  }

  hr();
  if (r.clientComponentServerCode.length) {
    fail = true;
    console.log('❌ Client components with server-only code:');
    r.clientComponentServerCode.forEach(f => console.log(`  - ${f}`));
  } else {
    console.log('✅ No client components with server-only code detected.');
  }

  hr();
  if (r.badSupabaseImport.length) {
    console.log('⚠️  Server importing `@supabase/supabase-js` (should use @supabase/ssr):');
    r.badSupabaseImport.forEach(f => console.log(`  - ${f}`));
  } else {
    console.log('✅ No server imports of @supabase/supabase-js detected.');
  }

  hr();
  if (r.potentialSSRIssues.length) {
    fail = true;
    console.log('❌ Potential SSR issues:');
    r.potentialSSRIssues.forEach(f => console.log(`  - ${f}`));
  } else {
    console.log('✅ No potential SSR issues detected.');
  }

  hr();
  if (r.buildErrors.length) {
    fail = true;
    console.log('❌ Potential build errors:');
    r.buildErrors.forEach(f => console.log(`  - ${f}`));
  } else {
    console.log('✅ No potential build errors detected.');
  }

  hr();
  if (fail) process.exitCode = 1;
}
