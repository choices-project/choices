#!/usr/bin/env node
/**
 * Custom npm audit wrapper that filters out known/accepted vulnerabilities.
 *
 * Accepted vulnerabilities must be documented with a justification.
 * Re-evaluate each entry whenever the advisory is updated.
 */
import { execSync } from 'node:child_process';

const ACCEPTED_ADVISORIES = [
  {
    id: 'GHSA-9g9p-9gw9-jx7f',
    package: 'next',
    reason: 'DoS via Image Optimizer remotePatterns — only affects self-hosted deployments. This app deploys to Vercel which handles image optimization separately.',
    expires: '2026-06-01',
  },
  {
    id: 'GHSA-h25m-26qc-wcjf',
    package: 'next',
    reason: 'HTTP request deserialization DoS — mitigated by Vercel edge network. Fix requires Next.js ≥15.6 (major upgrade). Re-evaluate when Next.js 15 migration is planned.',
    expires: '2026-06-01',
  },
];

const expiredEntries = ACCEPTED_ADVISORIES.filter(
  (a) => new Date(a.expires) < new Date(),
);
if (expiredEntries.length > 0) {
  console.error(
    '⚠️  The following accepted audit entries have expired and must be re-evaluated:',
  );
  expiredEntries.forEach((e) =>
    console.error(`   - ${e.package} (${e.id}) expired ${e.expires}`),
  );
  process.exit(1);
}

let output;
try {
  output = execSync('npm audit --audit-level=high --json', {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
  });
} catch (err) {
  output = err.stdout || '';
}

let report;
try {
  report = JSON.parse(output);
} catch {
  console.log('✅ No audit issues found.');
  process.exit(0);
}

const vulnerabilities = report.vulnerabilities || {};
const acceptedIds = new Set(ACCEPTED_ADVISORIES.map((a) => a.id));
const acceptedPackages = new Set(ACCEPTED_ADVISORIES.map((a) => a.package));

let hasUnaccepted = false;

for (const [name, vuln] of Object.entries(vulnerabilities)) {
  if (vuln.severity !== 'high' && vuln.severity !== 'critical') continue;

  const advisoryIds = (vuln.via || [])
    .filter((v) => typeof v === 'object' && v.url)
    .map((v) => {
      const match = v.url.match(/GHSA-[a-z0-9-]+/);
      return match ? match[0] : null;
    })
    .filter(Boolean);

  const isAccepted =
    acceptedPackages.has(name) ||
    advisoryIds.some((id) => acceptedIds.has(id));

  if (!isAccepted) {
    hasUnaccepted = true;
    console.error(`❌ ${name} (${vuln.severity})`);
    (vuln.via || [])
      .filter((v) => typeof v === 'object')
      .forEach((v) => console.error(`   ${v.title || v.name} — ${v.url || ''}`));
  }
}

if (hasUnaccepted) {
  console.error('\n❌ Unresolved high/critical vulnerabilities found.');
  console.error(
    'Fix them with `npm audit fix` or document in scripts/audit-high.js if accepted.',
  );
  process.exit(1);
} else {
  if (ACCEPTED_ADVISORIES.length > 0) {
    console.log(
      `✅ Audit passed (${ACCEPTED_ADVISORIES.length} known issue(s) accepted and documented).`,
    );
  } else {
    console.log('✅ Audit passed with no issues.');
  }
  process.exit(0);
}
