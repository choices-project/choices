#!/usr/bin/env node
/* eslint-disable no-console */

// --- CI Guard ---------------------------------------------------------------
if (process.env.CI) {
  console.log("ℹ️  [postbuild] Skipping server bundle scan in CI (guarded).");
  process.exit(0);
}

// --- Config -----------------------------------------------------------------
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const cwd = process.cwd();

// Directories in a standard Next build that contain Node server output
const SCAN_DIRS = [
  path.join(cwd, ".next", "server"),      // primary SSR output
  path.join(cwd, ".next", "standalone"),  // standalone output (if using outputFileTracing: 'standalone')
];

// Skip files/dirs that are noisy or irrelevant for this check
const IGNORE_PATH_PATTERNS = [
  /\/edge-runtime\//,         // not Node.js runtime; different constraints
  /\/_next\/static\//,
  /\/server\/font-manifest\.json$/,
  /\/server\/middleware-manifest\.json$/,
  /\/server\/app-build-manifest\.json$/,
  /\/react-loadable-manifest\.json$/,
  /\.map$/i,
  /\.wasm$/i,
];

// Only check JS-ish files produced by Next
const EXT_ALLOW = new Set([".js", ".mjs", ".cjs"]);

// Don't try to read massive bundles line-by-line
const MAX_FILE_SIZE_BYTES = 2.5 * 1024 * 1024; // 2.5MB

// Patterns that commonly indicate **browser-only** usage.
// We try to keep these specific to reduce false positives.
// Note: we ignore lines that contain an explicit typeof guard.
const CHECKS = [
  { label: "window",        re: /\bwindow\./ },
  { label: "document",      re: /\bdocument\./ },
  { label: "localStorage",  re: /\blocalStorage\b/ },
  { label: "sessionStorage",re: /\bsessionStorage\b/ },
  { label: "navigator",     re: /\bnavigator\./ },
  { label: "location",      re: /\blocation\./ }, // only match location.property access
  { label: "FileReader",    re: /\bnew\s+FileReader\s*\(/ },
  { label: "HTMLElement",   re: /\bHTMLElement\b/ },
];

// If a line contains one of these, we consider it "guarded" and don't flag.
const TYPEOF_GUARDS = [
  /typeof\s+window\s*!==?\s*['"]undefined['"]/,
  /typeof\s+window\s*===?\s*['"]undefined['"]/,
];

// Rough check to see if a token is inside quotes (single/double/backtick)
// This is simple and intentionally conservative; prevents obvious false positives in strings.
function isQuoted(line, tokenIndex) {
  const s = line.slice(0, tokenIndex);
  const single = (s.match(/'/g) || []).length % 2 === 1;
  const double = (s.match(/"/g) || []).length % 2 === 1;
  const back   = (s.match(/`/g) || []).length % 2 === 1;
  return single || double || back;
}

function shouldIgnorePath(p) {
  return IGNORE_PATH_PATTERNS.some((re) => re.test(p));
}

function listFiles(dir) {
  const files = [];
  if (!fs.existsSync(dir)) return files;

  const stack = [dir];
  while (stack.length) {
    const cur = stack.pop();
    for (const entry of fs.readdirSync(cur, { withFileTypes: true })) {
      const full = path.join(cur, entry.name);
      if (shouldIgnorePath(full)) continue;

      if (entry.isDirectory()) {
        stack.push(full);
      } else if (EXT_ALLOW.has(path.extname(full))) {
        files.push(full);
      }
    }
  }
  return files;
}

function formatRel(p) {
  return path.relative(cwd, p) || p;
}

const findings = [];

// --- Run --------------------------------------------------------------------
console.log("🔎  [postbuild] Scanning server output for browser globals…");

let anyScanned = false;

for (const dir of SCAN_DIRS) {
  if (!fs.existsSync(dir)) continue;

  const files = listFiles(dir);
  for (const file of files) {
    anyScanned = true;

    try {
      const stat = fs.statSync(file);
      if (stat.size > MAX_FILE_SIZE_BYTES) {
        // Be gentle with very large chunks; quick string search without splitting lines
        const buf = fs.readFileSync(file, "utf8");
        for (const { label, re } of CHECKS) {
          let m;
          while ((m = re.exec(buf))) {
            const idx = m.index;
            if (isQuoted(buf, idx)) continue;
            // Try to extract a short excerpt
            const start = Math.max(0, idx - 60);
            const end   = Math.min(buf.length, idx + 60);
            const excerpt = buf.slice(start, end).replace(/\s+/g, " ").trim();

            findings.push({
              file,
              line: "?:large", // unknown without splitting
              label,
              excerpt,
            });
            break; // one finding is enough to flag the file
          }
        }
        continue;
      }

      // Normal sized files — line-by-line with context
      const content = fs.readFileSync(file, "utf8");
      const lines = content.split(/\r?\n/);

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Skip trivial generated lines or with explicit typeof guards
        if (TYPEOF_GUARDS.some((rgx) => rgx.test(line))) continue;

        for (const { label, re } of CHECKS) {
          const m = re.exec(line);
          if (!m) continue;

          // Ignore obvious string literal occurrences
          const idx = m.index;
          if (isQuoted(line, idx)) continue;

          findings.push({
            file,
            line: i + 1,
            label,
            excerpt: line.trim().slice(0, 200),
          });
        }
      }
    } catch (err) {
      console.log(`⚠️  [postbuild] Skipping ${formatRel(file)} (${err.message})`);
    }
  }
}

if (!anyScanned) {
  console.log("ℹ️  [postbuild] No server output found to scan (skipping).");
  process.exit(0);
}

if (findings.length === 0) {
  console.log("✅ [postbuild] No browser globals detected in server bundle.");
  process.exit(0);
}

// --- Report & Exit ----------------------------------------------------------
console.error("\n❌ [postbuild] Browser-only globals detected in server output:\n");

for (const f of findings.slice(0, 50)) {
  console.error(
    ` • ${formatRel(f.file)}:${f.line}  [${f.label}]  →  ${f.excerpt}`
  );
}
if (findings.length > 50) {
  console.error(`   …and ${findings.length - 50} more.`);
}

console.error(`
How to fix:
  • Move DOM/browser usage into a Client Component ('use client') or a client-only hook.
  • Gate access behind:  if (typeof window !== 'undefined') { /* … */ }
  • Avoid DOM APIs in route handlers / server components / server utilities.
  • If a third-party lib is browser-only, dynamically import it inside a client boundary.

Tip:
  • To temporarily bypass locally, run with POSTBUILD_SKIP=1 (but do NOT commit that change).
`);

if (process.env.POSTBUILD_SKIP === "1") {
  console.warn("⚠️  [postbuild] POSTBUILD_SKIP=1 set — not failing the build.");
  process.exit(0);
}

process.exit(1);