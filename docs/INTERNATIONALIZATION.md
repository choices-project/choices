## Internationalization Workflow

Choices ships with `next-intl`, a shared `useI18n` hook, and FormatJS-based
extraction tooling. This document captures the day-to-day workflow for keeping
translations healthy and explains the new lint+CI guardrails that block
untranslated copy.

### Where translations live
- Runtime messages: `web/messages/en.json` and `web/messages/es.json`
- Extraction snapshot: `web/messages/en.snapshot.json`
- Hook helpers: `web/hooks/useI18n.ts`

### Adding or updating user-facing copy
1. Wrap UI strings with `t('<namespace>.<key>')`. Prefer descriptive keys that
   match the component surface (e.g. `civics.actions.card.buttons.sign`).
2. Update both `en.json` and `es.json` with the new keys (keep namespaces in
   sync and alphabetised where possible).
3. Run `npm run lint:locale` from `web/` to catch any stray literals.
4. Run `npm run i18n:extract` from `web/` to refresh `en.snapshot.json`.
5. Commit all three files so CI sees a clean snapshot.

### Extraction tooling (`npm run i18n:extract`)
- Uses `@formatjs/cli` to scan `app/`, `components/`, `features/`, and `lib/`
  for calls to `t()` (plus the default next-intl helpers).
- Writes the flattened catalogue to `messages/en.snapshot.json`.
- CI (`.github/workflows/web-ci.yml`) reruns the command and fails if the
  snapshot diff is non-empty, which keeps the snapshot authoritative.

### Locale linting (`npm run lint:locale`)
- Runs ESLint with `formatjs/no-literal-string-in-jsx` targeting
  `app/(app)/candidates/**/*.{ts,tsx}` and `features/civics/**/*.{ts,tsx}`.
- The rule is configured as `error` for those files (`web/eslint.config.js`),
  so literal JSX strings fail both locally and in CI.
- Extend coverage by updating the `files` array in the FormatJS block and the
  glob list inside `lint:locale` when other surfaces reach parity.

### CI automation
- `web-ci` runs (in order) `npm run lint` (soft fail), `npm run lint:locale`
  (hard fail), contract tests, `npm run i18n:extract`, and then checks that
  `messages/en.snapshot.json` has no dirty diff.
- Failure recovery: run the indicated command locally, commit the updated
  snapshot or fix the literal string, and push a new commit.

### Quick checklist
```bash
cd web
npm run lint:locale      # catches literal strings on guarded surfaces
npm run i18n:extract     # refresh snapshot before committing
```

Keep this checklist handy when working through the i18n roadmap (especially
the civics and candidate flows) to avoid CI surprises.

