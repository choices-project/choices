#!/usr/bin/env node
/**
 * Fails if .cursor/mcp.json embeds obvious machine-specific absolute paths
 * (breaks clones / other OS users). Run from repo root.
 */
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const mcpPath = join(root, '.cursor/mcp.json');

let text;
try {
  text = readFileSync(mcpPath, 'utf8');
} catch {
  console.error('verify-mcp-config: missing .cursor/mcp.json');
  process.exit(1);
}

// macOS / Linux home-style absolutes; adjust if team standardizes on another pattern
const badPatterns = [
  { re: /\/Users\/[^/\s"]+/g, label: 'macOS /Users/... absolute path' },
  { re: /\/home\/[^/\s"]+/g, label: 'Linux /home/... absolute path' },
];

const hits = [];
for (const { re, label } of badPatterns) {
  const m = text.match(re);
  if (m) {
    hits.push(`${label}: ${[...new Set(m)].join(', ')}`);
  }
}

if (hits.length) {
  console.error(
    'verify-mcp-config: .cursor/mcp.json must use repo-relative bash scripts, not machine paths:\n  ' +
      hits.join('\n  '),
  );
  process.exit(1);
}

console.log('verify-mcp-config: OK (no machine-specific absolute paths in .cursor/mcp.json)');
