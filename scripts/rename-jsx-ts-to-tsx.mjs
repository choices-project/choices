// scripts/rename-jsx-ts-to-tsx.mjs
import fs from 'node:fs';
import path from 'node:path';

const ROOTS = ['lib', 'app', 'components', 'tests'];
const JSX_PAT = /<[A-Za-z][A-Za-z0-9:\-]*\b[^>]*>|<\/[A-Za-z][A-Za-z0-9:\-]*>/;

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else if (entry.isFile() && p.endsWith('.ts')) {
      const src = fs.readFileSync(p, 'utf8');
      if (JSX_PAT.test(src)) {
        const to = p.replace(/\.ts$/, '.tsx');
        fs.renameSync(p, to);
        console.log(`renamed: ${p} -> ${to}`);
      }
    }
  }
}

for (const r of ROOTS) if (fs.existsSync(r)) walk(r);
