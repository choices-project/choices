import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const bad = /\b(window|document|\bself\b)\b/;

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) yield* walk(p);
    else if (s.isFile() && p.includes('/.next/server/') && !p.includes('/standalone/')) yield p;
  }
}

const offenders = [];
for (const file of walk('.')) {
  const txt = readFileSync(file, 'utf8');
  if (bad.test(txt)) offenders.push(file);
}
if (offenders.length) {
  console.error('❌ Browser globals found in server output:');
  offenders.forEach((f) => console.error(' -', f));
  process.exit(1);
} else {
  console.log('✅ Server output contains no browser globals.');
}
