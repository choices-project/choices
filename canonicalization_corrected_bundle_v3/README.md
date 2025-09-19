# Canonicalization Corrected Bundle (v3)
**Generated (UTC):** 2025-09-18T12:14:43Z

This bundle codifies the *final* decisions: keep canonicals, disable legacy/duplicates,
add guardrails, and provide codemods to rewrite imports to canonical paths.

## Contents
- `files_to_disable.txt` — legacy/duplicate paths to disable (append `.disabled` or delete)
- `files_to_keep_canonical.txt` — authoritative canonicals to keep
- `import_mapping.csv|json` — path mapping (legacy → canonical)
- `codemods/replace-imports.js` — jscodeshift script to rewrite imports
- `eslint.no-restricted-imports.patch.json` — ESLint rule patch
- `tsconfig.paths.patch.json` — TS path redirects to canonical
- `husky.pre-commit.sample.sh` — pre-commit gate to block legacy paths
- `dangerfile.sample.js` — CI guardrails
- `apply_disable.sh` / `revert_disable.sh` — helpers

## Quick Start
```bash
# 1) Apply TS + ESLint patches (merge with your configs)
jq -s '.[0] * .[1]' tsconfig.json tsconfig.paths.patch.json > tsconfig.merged.json
# then replace tsconfig.json with merged result (verify manually)
# For ESLint, merge rules under "rules.no-restricted-imports"

# 2) Run codemod (dry-run first)
npx jscodeshift -t codemods/replace-imports.js "web/**/*.ts*" --parser=ts --extensions=ts,tsx,js,jsx -d

# 3) Disable legacy files (dry-run by echoing commands, then run)
bash apply_disable.sh

# 4) Lint, build, test
npm run lint && npm run types:strict
npm run build
npm run test:e2e -- --project=chromium-core
```

## Notes
- Some replacements are **path-only** and may require small API adjustments (e.g., AuthProvider → AuthContext, auth middleware patterns).
- Keep UNIFIED_PLAYBOOK.md as the single source of truth. Update it in the same PR.

