// scripts/console-to-logger.js
/**
 * Naive console → logger codemod. Maps:
 * console.log -> logger.info
 * console.debug -> logger.debug
 * console.warn -> logger.warn
 * console.error -> logger.error
 */
import fs from 'node:fs';
import path from 'node:path';

const map = {
  'console.log': 'logger.info',
  'console.debug': 'logger.debug',
  'console.warn': 'logger.warn',
  'console.error': 'logger.error',
};

const ROOTS = ['app', 'components', 'lib'];

function ensureLoggerImport(src) {
  if (/from ['"]@\/lib\/logger['"]/.test(src)) return src;
  if (!src.includes('logger.')) return src;
  // place at the top after first import
  const lines = src.split('\n');
  const firstImportIdx = lines.findIndex((l) => /^import\s/.test(l));
  const imp = `import { logger } from '@/lib/logger';`;
  if (firstImportIdx >= 0) {
    lines.splice(firstImportIdx + 1, 0, imp);
    return lines.join('\n');
  }
  return `${imp}\n${src}`;
}

function transformFile(file) {
  let src = fs.readFileSync(file, 'utf8');
  let changed = false;
  for (const k of Object.keys(map)) {
    const before = src;
    src = src.replaceAll(k, map[k]);
    if (src !== before) changed = true;
  }
  if (changed) {
    src = ensureLoggerImport(src);
    fs.writeFileSync(file, src, 'utf8');
    console.log('updated:', file);
  }
}

function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.isFile() && (p.endsWith('.ts') || p.endsWith('.tsx'))) {
      transformFile(p);
    }
  }
}

for (const r of ROOTS) if (fs.existsSync(r)) walk(r);
