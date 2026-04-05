#!/usr/bin/env node
/**
 * Verifies relative filesystem targets for Markdown links in canonical docs,
 * root Markdown (README, CONTRIBUTING, …), and `.github` Markdown (templates,
 * SUPPORT). Skips `docs/archive` and `.github/workflows`, external URLs,
 * anchors-only targets, and code blocks.
 *
 * Run from repo root: node scripts/verify-doc-links.mjs
 */
import { existsSync, readFileSync, readdirSync } from 'fs';
import { dirname, join, normalize, relative, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

/** Remove fenced code blocks so example URLs are not validated. */
function stripCodeFences(text) {
  return text.replace(/^```[^\n]*\n[\s\S]*?^```/gm, '\n');
}

function walkMdFiles(dir, acc = []) {
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === 'archive' && dir === join(root, 'docs')) continue;
      walkMdFiles(p, acc);
    } else if (ent.name.endsWith('.md')) acc.push(p);
  }
  return acc;
}

/** PR template, issue templates, SUPPORT — skip workflows (YAML-only). */
function walkGithubMdFiles(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === 'workflows') continue;
      walkGithubMdFiles(p, acc);
    } else if (ent.name.endsWith('.md')) acc.push(p);
  }
  return acc;
}

function extractInlineLinkTargets(text) {
  const targets = [];
  const re = /(?<!!)\[[^\]]*\]\(\s*([^)]+?)\s*\)/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    let raw = m[1].trim();
    raw = raw.replace(/^<([^>]+)>$/, '$1');
    const beforeHash = raw.split('#')[0];
    const pathPart = beforeHash.trim();
    if (!pathPart) continue;
    const withoutTitle = pathPart.replace(/\s+["'][^"']*["']\s*$/, '');
    if (!withoutTitle) continue;
    targets.push(withoutTitle);
  }
  return targets;
}

function extractReferenceDefinitions(text) {
  const targets = [];
  const re = /^\s*\[[^\]]+\]:\s+(\S+)/gm;
  let m;
  while ((m = re.exec(text)) !== null) {
    let raw = m[1].trim();
    raw = raw.replace(/^<|>$/g, '');
    const pathPart = raw.split('#')[0].trim();
    if (!pathPart || /^(https?:|mailto:)/i.test(pathPart)) continue;
    targets.push(pathPart);
  }
  return targets;
}

function shouldSkipTarget(t) {
  if (/^(https?:|mailto:|tel:)/i.test(t)) return true;
  if (t.startsWith('//')) return true;
  if (t.startsWith('@/') || t.startsWith('~/')) return true;
  return false;
}

function resolveTarget(fromFile, target) {
  let decoded = target;
  try {
    decoded = decodeURIComponent(target);
  } catch {
    /* keep raw */
  }
  if (decoded.startsWith('/')) {
    return resolve(join(root, decoded.slice(1)));
  }
  return resolve(dirname(fromFile), decoded);
}

function verifyPath(fromFile, target) {
  const abs = normalize(resolveTarget(fromFile, target));
  const rel = relative(root, abs);
  if (rel.startsWith('..') || rel === '..') return null;
  if (existsSync(abs)) return null;
  return { fromFile, target, abs };
}

function main() {
  const files = [];
  walkMdFiles(join(root, 'docs'), files);
  for (const name of ['README.md', 'CONTRIBUTING.md', 'AGENTS.md', 'DEPLOYMENT.md']) {
    const p = join(root, name);
    if (existsSync(p)) files.push(p);
  }
  walkGithubMdFiles(join(root, '.github'), files);

  const failures = [];
  for (const file of files) {
    let text;
    try {
      text = readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    const scrubbed = stripCodeFences(text);
    const targets = [
      ...extractInlineLinkTargets(scrubbed),
      ...extractReferenceDefinitions(scrubbed),
    ];
    const seen = new Set();
    for (const t of targets) {
      if (shouldSkipTarget(t)) continue;
      if (seen.has(`${file}::${t}`)) continue;
      seen.add(`${file}::${t}`);
      const err = verifyPath(file, t);
      if (err) failures.push(err);
    }
  }

  if (failures.length > 0) {
    console.error('verify-doc-links: broken relative link targets:\n');
    for (const f of failures) {
      console.error(`  ${f.fromFile}`);
      console.error(`    → ${f.target} (resolved: ${f.abs})\n`);
    }
    process.exit(1);
  }

  console.log(
    `verify-doc-links: OK (${files.length} Markdown files scanned; docs/archive/ skipped; .github/workflows/ skipped)`,
  );
}

main();
