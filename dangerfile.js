/**
 * Danger.js configuration for canonicalization enforcement
 * 
 * Prevents regression by blocking legacy paths and ensuring T registry changes
 * are accompanied by spec updates.
 */

const changed = danger.git.modified_files.concat(danger.git.created_files);

// Block legacy file paths
const bannedFiles = changed.filter(p =>
  p.startsWith('web/components/polls/') ||
  p.startsWith('web/components/voting/') ||
  p.startsWith('web/components/admin/layout/')
);
if (bannedFiles.length) {
  fail(`Legacy paths touched:\n${bannedFiles.join('\n')}`);
}

// Scan for legacy imports in diffs
const diff = danger.git.diffForFile;
async function scanImports(file) {
  const d = await diff(file);
  if (!d || !d.added) return;
  const bad = d.added.match(/from ['"]@\/components\/(polls|voting|admin\/layout)\/.+['"]/g);
  if (bad) fail(`Legacy imports added in ${file}:\n${bad.join('\n')}`);
}
await Promise.all(changed.filter(f => f.endsWith('.ts') || f.endsWith('.tsx')).map(scanImports));

// Require T registry changes to be accompanied by spec updates
const touchedT = changed.some(p => p.endsWith('web/lib/testing/testIds.ts'));
const touchedSpecs = changed.some(p => p.startsWith('web/tests/e2e/'));
if (touchedT && !touchedSpecs) {
  warn('T registry changed without accompanying spec updates.');
}
