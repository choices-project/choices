#!/usr/bin/env node
/**
 * Next.js 15 Dynamic API scanner for Choices
 * - finds `cookies()/headers()/draftMode()` at module scope (illegal)
 * - flags files that use cookies() but lack `export const dynamic = 'force-dynamic'`
 * - flags server files importing '@supabase/supabase-js' without "use client"
 *
 * Usage: node tools/scan-next-dynamic.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';

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
  const ast = parse(code, {
    sourceType: 'module',
    plugins: [
      'typescript',
      'jsx',
      'topLevelAwait',
      'classProperties',
      'classPrivateProperties',
      'decorators-legacy',
    ],
  });

  const directives = (ast.program.directives || []).map(d => d.value.value);
  const isClient = directives.includes('use client');

  let hasNextHeadersImport = false;
  let hasCookiesCall = false;
  let hasTopLevelDynamic = false;
  let hasForceDynamic = false;
  let hasNodeRuntime = false;
  let importsBrowserSupabase = false;

  // Track if a CallExpression is inside any function-like node
  function isInsideFunction(path) {
    return path.findParent(p =>
      p.isFunctionDeclaration() ||
      p.isFunctionExpression() ||
      p.isArrowFunctionExpression() ||
      p.isObjectMethod() ||
      p.isClassMethod()
    ) != null;
  }

  traverse(ast, {
    ImportDeclaration(p) {
      const src = p.node.source.value;
      if (src === 'next/headers') hasNextHeadersImport = true;
      if (src === '@supabase/supabase-js') importsBrowserSupabase = true;
    },
    CallExpression(p) {
      const callee = p.node.callee;
      const name = callee && callee.type === 'Identifier' ? callee.name : null;
      if (name && (name === 'cookies' || name === 'headers' || name === 'draftMode')) {
        hasCookiesCall = hasCookiesCall || name === 'cookies';
        if (!isInsideFunction(p)) {
          hasTopLevelDynamic = true;
        }
      }
    },
    ExportNamedDeclaration(p) {
      // export const dynamic = 'force-dynamic'
      const decl = p.node.declaration;
      if (decl && decl.type === 'VariableDeclaration') {
        for (const d of decl.declarations) {
          if (d.id.type === 'Identifier' && d.init) {
            if (d.id.name === 'dynamic' && d.init.type === 'StringLiteral' && d.init.value === 'force-dynamic') {
              hasForceDynamic = true;
            }
            if (d.id.name === 'runtime' && d.init.type === 'StringLiteral' && d.init.value === 'nodejs') {
              hasNodeRuntime = true;
            }
          }
        }
      }
    },
  });

  // Report problems
  if (hasTopLevelDynamic) {
    const calls = [];
    // crude but useful: re-scan text for which names appear at top-level
    if (code.match(/\bcookies\s*\(/)) calls.push('cookies');
    if (code.match(/\bheaders\s*\(/)) calls.push('headers');
    if (code.match(/\bdraftMode\s*\(/)) calls.push('draftMode');
    results.topLevelDynamicCalls.push({ file: rel(file), calls });
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
function printResults(r) {
  const hr = () => console.log('-'.repeat(60));
  let fail = false;

  console.log('\nNext 15 Dynamic API scan\n');
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
