#!/usr/bin/env node
/**
 * Simple Next.js 15 Dynamic API scanner for Choices
 * Uses regex patterns to find SSR issues
 * 
 * Usage: node tools/scan-next-dynamic-simple.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(process.cwd(), 'web');
const exts = new Set(['.ts', '.tsx', '.js', '.mjs', '.cjs']);

const files = [];
walk(ROOT);

const results = {
  topLevelDynamicCalls: [], // [{file, calls: ['cookies', ...]}]
  needsForceDynamic: [],    // [file]
  badSupabaseImport: [],    // [file]
};

for (const file of files) {
  const code = fs.readFileSync(file, 'utf8');
  
  // Check for 'use client' directive
  const isClient = code.includes('"use client"') || code.includes("'use client'");
  
  // Check for imports
  const hasNextHeadersImport = /import.*from\s+['"]next\/headers['"]/.test(code);
  const importsBrowserSupabase = /import.*from\s+['"]@supabase\/supabase-js['"]/.test(code);
  
  // Check for dynamic API calls
  const hasCookiesCall = /\bcookies\s*\(/.test(code);
  const hasHeadersCall = /\bheaders\s*\(/.test(code);
  const hasDraftModeCall = /\bdraftMode\s*\(/.test(code);
  
  // Check for exports
  const hasForceDynamic = /export\s+const\s+dynamic\s*=\s*['"]force-dynamic['"]/.test(code);
  const hasNodeRuntime = /export\s+const\s+runtime\s*=\s*['"]nodejs['"]/.test(code);
  
  // Check for top-level calls (simplified - looks for calls not inside function-like structures)
  const topLevelCalls = [];
  if (hasCookiesCall && !isInsideFunction(code, 'cookies')) topLevelCalls.push('cookies');
  if (hasHeadersCall && !isInsideFunction(code, 'headers')) topLevelCalls.push('headers');
  if (hasDraftModeCall && !isInsideFunction(code, 'draftMode')) topLevelCalls.push('draftMode');
  
  // Report problems
  if (topLevelCalls.length > 0) {
    results.topLevelDynamicCalls.push({ file: rel(file), calls: topLevelCalls });
  }

  if ((hasCookiesCall || hasNextHeadersImport) && !hasForceDynamic) {
    results.needsForceDynamic.push(rel(file));
  }

  if (importsBrowserSupabase && !isClient) {
    results.badSupabaseImport.push(rel(file));
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

function isInsideFunction(code, functionName) {
  // Simple heuristic: check if the call is after a function declaration/expression
  const lines = code.split('\n');
  let inFunction = false;
  
  for (const line of lines) {
    // Check if we're entering a function
    if (/function\s+\w+\s*\(|=>\s*{|const\s+\w+\s*=\s*\(.*\)\s*=>|async\s+function/.test(line)) {
      inFunction = true;
    }
    
    // Check if we're exiting a function
    if (line.trim() === '}' && inFunction) {
      inFunction = false;
    }
    
    // If we find the function call and we're not in a function, it's top-level
    if (new RegExp(`\\b${functionName}\\s*\\(`).test(line) && !inFunction) {
      return false;
    }
  }
  
  return true; // Assume it's inside a function if we can't determine
}

function printResults(r) {
  const hr = () => console.log('-'.repeat(60));
  let fail = false;

  console.log('\nNext 15 Dynamic API scan (Simple)\n');
  hr();
  if (r.topLevelDynamicCalls.length) {
    fail = true;
    console.log('❌ Top-level Dynamic API calls (move into a function):');
    for (const { file, calls } of r.topLevelDynamicCalls) {
      console.log(`  - ${file}  [${calls.join(', ')}]`);
    }
  } else {
    console.log('✅ No top-level Dynamic API calls detected.');
  }

  hr();
  if (r.needsForceDynamic.length) {
    console.log('⚠️  Files likely need `export const dynamic = \'force-dynamic\'` (and `runtime = \'nodejs\'` if using Supabase SSR):');
    r.needsForceDynamic.forEach(f => console.log(`  - ${f}`));
  } else {
    console.log('✅ All cookie/headers users appear to declare dynamic rendering.');
  }

  hr();
  if (r.badSupabaseImport.length) {
    fail = true;
    console.log('❌ Server importing `@supabase/supabase-js` without `"use client"`:');
    r.badSupabaseImport.forEach(f => console.log(`  - ${f}`));
    console.log('   Fix: move to a client component or switch to @supabase/ssr server clients.');
  } else {
    console.log('✅ No server imports of @supabase/supabase-js detected.');
  }

  hr();
  if (fail) process.exitCode = 1;
}
