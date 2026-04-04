#!/usr/bin/env node
/**
 * Keeps docs/FEATURE_FLAGS.md tables in sync with web/lib/core/feature-flags.ts.
 *
 *   node scripts/generate-feature-flags-doc.mjs         # rewrite marked sections
 *   node scripts/generate-feature-flags-doc.mjs --check # exit 1 if doc would change
 */
import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const tsPath = join(root, 'web/lib/core/feature-flags.ts');
const mdPath = join(root, 'docs/FEATURE_FLAGS.md');

const MARK_MUTABLE_START = '<!-- AUTO-GENERATED:FEATURE_FLAGS_MUTABLE_TABLE -->';
const MARK_MUTABLE_END = '<!-- END AUTO-GENERATED:FEATURE_FLAGS_MUTABLE_TABLE -->';
const MARK_ALWAYS_START = '<!-- AUTO-GENERATED:ALWAYS_ENABLED_BODY -->';
const MARK_ALWAYS_END = '<!-- END AUTO-GENERATED:ALWAYS_ENABLED_BODY -->';

function extractBlock(text, anchor, openCh, closeCh) {
  const start = text.indexOf(anchor);
  if (start === -1) {
    throw new Error(`generate-feature-flags-doc: missing anchor "${anchor}" in ${tsPath}`);
  }
  let i = start + anchor.length;
  while (i < text.length && text[i] !== openCh) i += 1;
  if (i >= text.length || text[i] !== openCh) {
    throw new Error(`generate-feature-flags-doc: expected "${openCh}" after "${anchor}"`);
  }
  i += 1;
  let depth = 1;
  const begin = i;
  while (i < text.length && depth > 0) {
    const c = text[i];
    if (c === openCh) depth += 1;
    else if (c === closeCh) depth -= 1;
    i += 1;
  }
  if (depth !== 0) {
    throw new Error('generate-feature-flags-doc: unbalanced braces/brackets in source');
  }
  return text.slice(begin, i - 1);
}

function compactJsdoc(s) {
  return s
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*\*\s?/, '').trim())
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseMutableEntries(block) {
  const entries = [];
  const re =
    /(?:\/\*\*([\s\S]*?)\*\/\s*)?([A-Z][A-Z0-9_]*)\s*:\s*(true|false)\s*(?:,[^\S\r\n]*(?:\/\/\s*(.*))?)?/g;
  let m;
  while ((m = re.exec(block)) !== null) {
    const [, jsdoc, key, value, inlineNote] = m;
    let notes = inlineNote?.trim() ?? '';
    if (jsdoc) {
      const jd = compactJsdoc(jsdoc);
      if (jd) notes = notes ? `${jd} ${notes}` : jd;
    }
    entries.push({ key, value, notes });
  }
  return entries;
}

function parseAlwaysEnabled(block) {
  const keys = [];
  const re = /'([^']+)'/g;
  let m;
  while ((m = re.exec(block)) !== null) keys.push(m[1]);
  return keys;
}

function escapeCell(s) {
  return (s || '—').replace(/\|/g, '\\|');
}

function buildMutableTable(rows) {
  const header = ['| Key | Default (code) | Notes |', '|-----|----------------|--------|'];
  const body = rows.map(
    ({ key, value, notes }) =>
      `| \`${key}\` | \`${value}\` | ${escapeCell(notes)} |`,
  );
  return [...header, ...body].join('\n');
}

function buildAlwaysBody(keys) {
  return keys.map((k) => `- \`${k}\``).join('\n');
}

function spliceDoc(fullMd, markerStart, markerEnd, newBody) {
  const a = fullMd.indexOf(markerStart);
  const b = fullMd.indexOf(markerEnd);
  if (a === -1 || b === -1 || b < a) {
    throw new Error(
      `generate-feature-flags-doc: missing markers in ${mdPath}\n` +
        `  Need: ${markerStart} ... ${markerEnd}`,
    );
  }
  const afterStart = a + markerStart.length;
  const before = fullMd.slice(0, afterStart);
  const after = fullMd.slice(b);
  const inner = fullMd.slice(afterStart, b).trim();
  const next = `${before}\n\n${newBody}\n\n${after}`;
  return { next, prevInner: inner, newInner: newBody.trim() };
}

function main() {
  const check = process.argv.includes('--check');
  const ts = readFileSync(tsPath, 'utf8');

  const mutableBlock = extractBlock(ts, 'export const FEATURE_FLAGS = ', '{', '}');
  const mutableRows = parseMutableEntries(mutableBlock);
  if (mutableRows.length === 0) {
    console.error('generate-feature-flags-doc: no FEATURE_FLAGS entries parsed');
    process.exit(1);
  }

  const alwaysBlock = extractBlock(ts, 'const ALWAYS_ENABLED_FLAGS = ', '[', ']');
  const alwaysKeys = parseAlwaysEnabled(alwaysBlock);
  if (alwaysKeys.length === 0) {
    console.error('generate-feature-flags-doc: no ALWAYS_ENABLED_FLAGS parsed');
    process.exit(1);
  }

  const mutableBody = buildMutableTable(mutableRows);
  const alwaysBody = buildAlwaysBody(alwaysKeys);

  let md = readFileSync(mdPath, 'utf8');
  let changed = false;

  const m1 = spliceDoc(md, MARK_MUTABLE_START, MARK_MUTABLE_END, mutableBody);
  if (m1.prevInner !== m1.newInner) changed = true;
  md = m1.next;

  const m2 = spliceDoc(md, MARK_ALWAYS_START, MARK_ALWAYS_END, alwaysBody);
  if (m2.prevInner !== m2.newInner) changed = true;
  md = m2.next;

  if (check) {
    if (changed) {
      console.error(
        'generate-feature-flags-doc --check: docs/FEATURE_FLAGS.md is out of sync with web/lib/core/feature-flags.ts\n' +
          'Run: npm run docs:feature-flags',
      );
      process.exit(1);
    }
    console.log('generate-feature-flags-doc --check: OK');
    return;
  }

  writeFileSync(mdPath, md, 'utf8');
  console.log(`generate-feature-flags-doc: updated ${mdPath}`);
}

main();
