#!/usr/bin/env node
/* eslint-env node */
/**
 * Fix async cookies() usage for Next.js 14
 * Replaces await cookies() with cookies() since Next.js 14 uses synchronous cookies
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(process.cwd(), 'web');
const exts = new Set(['.ts', '.tsx', '.js', '.mjs', '.cjs']);

const files = [];
walk(ROOT);

let totalFixed = 0;

for (const file of files) {
  const code = fs.readFileSync(file, 'utf8');
  
  // Check if file contains await cookies()
  if (code.includes('await cookies()')) {
    console.log(`Fixing: ${rel(file)}`);
    
    // Replace await cookies() with cookies()
    const newCode = code.replace(/await\s+cookies\(\)/g, 'cookies()');
    
    // Write back to file
    fs.writeFileSync(file, newCode, 'utf8');
    
    // Count replacements
    const matches = code.match(/await\s+cookies\(\)/g);
    const count = matches ? matches.length : 0;
    totalFixed += count;
    
    console.log(`  - Fixed ${count} instances`);
  }
}

console.log(`\n✅ Total files fixed: ${files.filter(f => fs.readFileSync(f, 'utf8').includes('await cookies()')).length}`);
console.log(`✅ Total instances fixed: ${totalFixed}`);

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
