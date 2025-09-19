// dangerfile.js — ensures canonicalization guardrails
const changed = danger.git.modified_files.concat(danger.git.created_files);

const banned = changed.filter(p =>
  p.startsWith('web/components/polls/') ||
  p.startsWith('web/components/voting/') ||
  p === 'web/components/Dashboard.tsx' ||
  p === 'web/components/EnhancedDashboard.tsx' ||
  p === 'web/components/auth/AuthProvider.tsx'
);
if (banned.length) {
  fail(`Legacy paths touched:\n${banned.join('\n')}`);
}

const touchedT = changed.some(p => p.endsWith('web/lib/testing/testIds.ts'));
const touchedSpecs = changed.some(p => p.startsWith('web/tests/e2e/'));
if (touchedT && !touchedSpecs) {
  warn('T registry changed without accompanying spec updates.');
}
