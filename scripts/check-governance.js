#!/usr/bin/env node
/**
 * Lightweight governance enforcement.
 *
 * Fails when store or API surfaces change without their companion docs/checklists.
 * Use GOVERNANCE_BYPASS=1 to skip (e.g., when applying upstream patches).
 */

const { execFileSync } = require('child_process');
const shellQuote = require('shell-quote');

if (process.env.GOVERNANCE_BYPASS === '1') {
  process.exit(0);
}

function runDiff(command) {
  try {
    let cmd, args;
    if (typeof command === 'string') {
      const parsed = shellQuote.parse(command);
      cmd = parsed[0];
      args = parsed.slice(1);
    } else if (Array.isArray(command)) {
      [cmd, ...args] = command;
    } else {
      throw new Error('Invalid command format');
    }
    const stdout = execFileSync(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] }).toString().trim();
    if (!stdout) {
      return [];
    }
    return stdout.split('\n').map((file) => file.trim()).filter(Boolean);
  } catch {
    return null;
  }
}

function getChangedFiles() {
  const commands = [
    process.env.GOVERNANCE_DIFF || 'git diff --name-only --cached',
    'git diff --name-only --diff-filter=ACMRTUXB HEAD^ HEAD',
  ];

  for (const command of commands) {
    const result = runDiff(command);
    if (result !== null) {
      return result;
    }
  }

  console.error('[governance] Failed to compute git diff. Ensure git history is available.');
  process.exit(1);
}

const changedFiles = getChangedFiles();

const rules = [
  {
    name: 'store-governance',
    triggers: [/^web\/lib\/stores\//, /^scratch\/gpt5-codex\/store-roadmaps\//],
    requireAll: [
      'scratch/store-modernization-roadmap.md',
      'docs/ARCHITECTURE/stores.md',
    ],
    message:
      'Store changes require updating `scratch/store-modernization-roadmap.md` (owner/status) and `docs/ARCHITECTURE/stores.md` (selector contract).',
  },
  {
    name: 'api-contracts',
    triggers: [/^web\/app\/api\//],
    requireAll: ['docs/API/contracts.md'],
    requireOne: [
      'docs/TESTING/api-contract-plan.md',
      'docs/archive/release-notes/CHANGELOG.md',
    ],
    message:
      'API handler changes require updating `docs/API/contracts.md` plus either `docs/TESTING/api-contract-plan.md` or the changelog to document the contract impact.',
  },
];

const violations = [];

function fileChanged(pattern) {
  if (pattern instanceof RegExp) {
    return changedFiles.some((file) => pattern.test(file));
  }
  return changedFiles.includes(pattern);
}

rules.forEach((rule) => {
  const triggered = rule.triggers.some(fileChanged);
  if (!triggered) {
    return;
  }

  if (rule.requireAll) {
    const missing = rule.requireAll.filter((file) => !fileChanged(file));
    if (missing.length) {
      violations.push({
        rule: rule.name,
        detail: `${rule.message} Missing: ${missing.join(', ')}`,
      });
      return;
    }
  }

  if (rule.requireOne && !rule.requireOne.some(fileChanged)) {
    violations.push({
      rule: rule.name,
      detail: `${rule.message} Update at least one of: ${rule.requireOne.join(', ')}`,
    });
  }
});

if (violations.length) {
  console.error('Governance check failed:');
  for (const violation of violations) {
    console.error(`- [${violation.rule}] ${violation.detail}`);
  }
  console.error('\nSet GOVERNANCE_BYPASS=1 to skip (not recommended).');
  process.exit(1);
}

process.exit(0);

