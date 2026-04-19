#!/usr/bin/env node
/**
 * Weekly quality gate (mirrors docs/TESTING.md + web-ci intent).
 * Run from repository root: node scripts/quality-weekly.mjs
 */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function run(label, command, args, cwd = root) {
  console.error(`\n==> ${label}\n`);
  const r = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: process.env,
  });
  if (r.status !== 0) {
    console.error(`\nquality-weekly: FAILED at "${label}" (exit ${r.status ?? 1})\n`);
    process.exit(r.status ?? 1);
  }
}

run('verify:docs', 'npm', ['run', 'verify:docs'], root);
run('web lint:strict', 'npm', ['run', 'lint:strict', '--prefix', 'web'], root);
run('web types:ci', 'npm', ['run', 'types:ci', '--prefix', 'web'], root);
run('web lint:locale', 'npm', ['run', 'lint:locale', '--prefix', 'web'], root);
run('web i18n:validate', 'npm', ['run', 'i18n:validate', '--prefix', 'web'], root);
run('web i18n:snapshot-check', 'npm', ['run', 'i18n:snapshot-check', '--prefix', 'web'], root);
run('web build', 'npm', ['run', 'build', '--prefix', 'web'], root);

console.error('\nquality-weekly: all steps passed.\n');
