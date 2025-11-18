# Internationalisation Workflow

Last updated: 2025-11-13  
Status owner: GPT‑5 Codex

## Overview

The web app now ships a live `next-intl` integration:

- Middleware negotiates locales and persists the `choices.locale` cookie.
- `web/app/layout.tsx` loads locale-specific catalogues from `web/messages/*.json`.
- `useI18n()` wraps `next-intl` to expose `t()`/`changeLanguage()` while preserving existing call sites.
- `LanguageSelector` updates the app store, sets the locale cookie, and triggers a refresh; the harness spec in `tests/e2e/specs/global-navigation.spec.ts` covers desktop & mobile behaviour.

To keep translations healthy we need a repeatable extraction + linting loop. Manual SR verification isn’t available right now, so automation is our safety net.

## Extraction Pipeline

Run the extractor after adding or renaming translation keys:

```bash
cd web
npm run i18n:extract
```

This command:

1. Uses `@formatjs/cli` with curated include/ignore globs baked into the `i18n:extract` npm script.
2. Scans `app/`, `features/`, `components/`, and `lib/` for `t('...')` calls.
3. Emits `web/messages/en.snapshot.json` containing the detected keys (with source locations for review).

### Workflow Tips

- Check the snapshot diff into Git alongside feature work so reviewers can see which strings need translation.
- Merge new keys into `messages/en.json` and `messages/es.json` as part of the same pull request.
- Treat the snapshot as a safety net: it should reflect *all* keys that exist in code after your change.
- Group feature copy under scoped namespaces (e.g. `dashboard.personal.*`, `feeds.provider.*`) so dashboards, feeds, and harness variants stay aligned and reviewers can diff changes easily.

## Lint Guard Rails

We now ship `eslint-plugin-formatjs`. The rule `formatjs/no-literal-string-in-jsx` runs across `app/`, `features/`, and `components/`, warning whenever a JSX literal slips through without `t(...)`.

```bash
cd web
npm run lint
```

If you see new warnings:

1. Replace the literal with a translation key (`t('namespace.key')`).
2. Populate the corresponding entry in `messages/en.json` (and other locales).
3. Re-run `npm run i18n:extract` to update the snapshot.

> **Note:** `web/eslint.config.js` exposes the literal-string rule as `warn` while `hasLegacyCopy` remains `true`. Flipping the flag to `false` escalates it to `error`.

## Adding New Strings

1. Pick or create an appropriate namespace (e.g. `auth`, `onboarding`, `polls`, `dashboard.personal`, `feeds.provider`, `common`).
2. Add entries to `messages/en.json` and `messages/es.json`; use ICU placeholders where dynamic values are required.
3. Call `t('namespace.key', { placeholder })` in code.
4. Run `npm run i18n:extract` and verify the snapshot.
5. Update tests where necessary (Playwright specs assert translated link text).

## Backlog / Follow-Ups

- Expand locale automation beyond the nav harness (auth + onboarding happy paths).
- Integrate `npm run i18n:extract` into CI (snapshot check fails when stale) — ✅ done.
- Prioritise poll/feeds/civics UI strings (remaining legacy copy) so `hasLegacyCopy` can flip to `false` and the literal-string lint rule becomes an error.
- Onboard additional locales by cloning the base `en.snapshot.json`.

Keeping this loop tight means we can continue to block regressions even while the build remains unstable for manual screen-reader runs. Update this doc as soon as the workflow changes.

