import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const bad = /\b(self|window|document)\b/;

function* walk(dir) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    const s = statSync(p);
    if (s.isDirectory()) yield* walk(p);
    else if (s.isFile()) yield p;
  }
}

let errors = [];
for (const file of walk('.next/server')) {
  const txt = readFileSync(file, 'utf8');
  if (bad.test(txt)) errors.push(file);
}

if (errors.length) {
  console.error('❌ Browser globals found in server output:');
  for (const f of errors) console.error(' -', f);
  process.exit(1);
} else {
  console.log('✅ No browser globals in server output.');
}
