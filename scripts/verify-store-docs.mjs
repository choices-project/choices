#!/usr/bin/env node
/**
 * Ensures documented Zustand store counts and logout-cascade order match the codebase:
 * - *Store.ts files directly under web/lib/stores/
 * - cascadeDependentStoreReset() in userStore.ts (count + name order)
 *
 * Run from repo root: node scripts/verify-store-docs.mjs
 */
import { readFileSync, readdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const storesDir = join(root, 'web/lib/stores');
const userStorePath = join(storesDir, 'userStore.ts');
const stateMgmtPath = join(root, 'docs/STATE_MANAGEMENT.md');
const archPath = join(root, 'docs/ARCHITECTURE.md');

/** Doc prose labels (STATE_MANAGEMENT + ARCHITECTURE parentheticals) per code `name`. */
const CASCADE_LABELS = {
  profile: 'profile',
  admin: 'admin',
  polls: 'polls',
  feeds: 'feeds',
  analytics: 'analytics',
  hashtag: 'hashtag',
  voting: 'voting',
  contact: 'contact',
  notification: 'notification',
  onboarding: 'onboarding',
  representative: 'representative',
  election: 'election',
  pwa: 'PWA',
  widget: 'widget',
  pollWizard: 'poll wizard',
  voterRegistration: 'voter registration',
  hashtagModeration: 'hashtag moderation',
};

function countTopLevelStoreModules() {
  return readdirSync(storesDir).filter((n) => n.endsWith('Store.ts')).length;
}

function getCascadeStoresSlice() {
  const text = readFileSync(userStorePath, 'utf8');
  const needle = 'const stores: Array<{ name: string; reset: () => void }> = [';
  const start = text.indexOf(needle);
  if (start === -1) {
    throw new Error('verify-store-docs: could not find cascade stores array in userStore.ts');
  }
  const from = start + needle.length;
  const end = text.indexOf('\n  ];', from);
  if (end === -1) {
    throw new Error('verify-store-docs: could not find end of cascade stores array');
  }
  return text.slice(from, end);
}

function cascadeCodeNamesFromSlice(slice) {
  const names = [];
  const re = /\{ name: '([^']+)'/g;
  let m;
  while ((m = re.exec(slice)) !== null) names.push(m[1]);
  return names;
}

function docLabelsFromCodeNames(names) {
  return names.map((n) => {
    const label = CASCADE_LABELS[n];
    if (label === undefined) {
      throw new Error(
        `verify-store-docs: cascade name '${n}' has no doc label mapping — add CASCADE_LABELS in verify-store-docs.mjs`,
      );
    }
    return label;
  });
}

function expectFileInt(path, re, label, expected) {
  const text = readFileSync(path, 'utf8');
  const m = text.match(re);
  if (!m) {
    console.error(`verify-store-docs: could not find ${label} in ${path}`);
    process.exit(1);
  }
  const found = Number.parseInt(m[1], 10);
  if (found !== expected) {
    console.error(
      `verify-store-docs: ${path} documents ${label} as **${found}** but codebase has ${expected}. Update the doc.`,
    );
    process.exit(1);
  }
}

function expectCascadeOrder(path, re, label, expectedLabels) {
  const text = readFileSync(path, 'utf8');
  const m = text.match(re);
  if (!m) {
    console.error(`verify-store-docs: could not find cascade order (${label}) in ${path}`);
    process.exit(1);
  }
  const found = m[1].split(',').map((s) => s.trim());
  if (found.length !== expectedLabels.length) {
    console.error(
      `verify-store-docs: ${path} lists ${found.length} cascade stores in "${label}" but userStore.ts has ${expectedLabels.length}.`,
    );
    process.exit(1);
  }
  for (let i = 0; i < found.length; i += 1) {
    if (found[i] !== expectedLabels[i]) {
      console.error(
        `verify-store-docs: cascade order mismatch in ${path} (${label}):\n` +
          `  position ${i + 1}: doc "${found[i]}" vs code-derived "${expectedLabels[i]}"\n` +
          `  doc full:    ${found.join(' → ')}\n` +
          `  expected:    ${expectedLabels.join(' → ')}`,
      );
      process.exit(1);
    }
  }
}

function main() {
  let modules;
  let slice;
  let codeNames;
  let expectedLabels;
  try {
    modules = countTopLevelStoreModules();
    slice = getCascadeStoresSlice();
    codeNames = cascadeCodeNamesFromSlice(slice);
    expectedLabels = docLabelsFromCodeNames(codeNames);
  } catch (e) {
    console.error(e?.message ?? e);
    process.exit(1);
  }

  const cascade = codeNames.length;
  const mCount = slice.match(/\{ name: '/g);
  if (!mCount || mCount.length !== cascade) {
    console.error('verify-store-docs: internal cascade parse error');
    process.exit(1);
  }

  expectFileInt(
    stateMgmtPath,
    /There are \*\*(\d+)\*\* `\*Store\.ts` modules/,
    '*Store.ts module count',
    modules,
  );
  expectFileInt(
    stateMgmtPath,
    /Only \*\*(\d+)\*\* of them are reset by/,
    'cascade reset count',
    cascade,
  );

  expectFileInt(archPath, /Zustand \(~(\d+) store modules/, 'architecture diagram store count', modules);
  expectFileInt(archPath, /\*\*(\d+)\*\* dependent stores \(/, 'architecture cascade count', cascade);

  expectCascadeOrder(
    stateMgmtPath,
    /in order:\s*([^)]+)\)/,
    'STATE_MANAGEMENT cascade list',
    expectedLabels,
  );
  expectCascadeOrder(
    archPath,
    /dependent stores \(([^)]+)\)/,
    'ARCHITECTURE cascade parenthetical',
    expectedLabels,
  );

  console.log(
    `verify-store-docs: OK (${modules} *Store.ts modules, ${cascade} cascade resets; counts + order match docs)`,
  );
}

main();
