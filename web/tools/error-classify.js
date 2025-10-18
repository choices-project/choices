import { execSync } from 'child_process';
import fs from 'fs';

try {
  const out = execSync('npm run types:strict', { encoding: 'utf8' });
  logger.info(out);
} catch (e) {
  const txt = e.stdout || e.stderr || String(e);
  fs.writeFileSync('.ts-errors.txt', txt);
  const lines = txt.split('\n');
  const codes = {};
  for (const L of lines) {
    const m = L.match(/error (TS\d+)/);
    if (m) codes[m[1]] = (codes[m[1]] || 0) + 1;
  }
  logger.info('By TS code:');
  Object.entries(codes).sort((a,b) => b[1]-a[1]).forEach(([k,v]) => logger.info(v, k));
  logger.info('\nTS2532 (possibly undefined):', (txt.match(/TS2532/g) || []).length);
  logger.info('exactOptionalPropertyTypes:', (txt.match(/exactOptionalPropertyTypes/g) || []).length);
}
