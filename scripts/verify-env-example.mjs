#!/usr/bin/env node
/**
 * Ensures web/.env.local.example mentions every key from web/lib/config/env.ts
 * (active or commented # KEY=). Run from repo root.
 */
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function extractZodSchemaKeys(tsPath) {
  const text = readFileSync(tsPath, 'utf8');
  const keys = new Set();
  const re = /^\s{2}([A-Z][A-Z0-9_]*): z\./gm;
  let m;
  while ((m = re.exec(text)) !== null) {
    keys.add(m[1]);
  }
  return keys;
}

function extractExampleKeys(examplePath) {
  const text = readFileSync(examplePath, 'utf8');
  const keys = new Set();
  for (const line of text.split('\n')) {
    const t = line.trim();
    if (/^[A-Z][A-Z0-9_]*=/.test(t)) {
      keys.add(t.split('=')[0]);
      continue;
    }
    if (/^#\s*[A-Z][A-Z0-9_]*=/.test(t)) {
      const afterHash = t.slice(1).trim();
      keys.add(afterHash.split('=')[0]);
    }
  }
  return keys;
}

const envTs = join(root, 'web/lib/config/env.ts');
const examplePath = join(root, 'web/.env.local.example');

const schemaKeys = extractZodSchemaKeys(envTs);
let exampleKeys;
try {
  exampleKeys = extractExampleKeys(examplePath);
} catch (e) {
  console.error('verify-env-example: missing web/.env.local.example');
  process.exit(1);
}

const missingInExample = [...schemaKeys].filter((k) => !exampleKeys.has(k)).sort();
const extraInExample = [...exampleKeys].filter((k) => !schemaKeys.has(k)).sort();

if (missingInExample.length || extraInExample.length) {
  if (missingInExample.length) {
    console.error(
      'verify-env-example: web/.env.local.example is missing keys present in web/lib/config/env.ts:\n  ' +
        missingInExample.join('\n  '),
    );
  }
  if (extraInExample.length) {
    console.error(
      'verify-env-example: web/.env.local.example lists keys not in web/lib/config/env.ts:\n  ' +
        extraInExample.join('\n  '),
    );
  }
  console.error(
    'verify-env-example: add/remove lines (use # KEY= for optional) so sets match env.ts.',
  );
  process.exit(1);
}

console.log(
  `verify-env-example: OK (${schemaKeys.size} keys aligned with web/lib/config/env.ts)`,
);
