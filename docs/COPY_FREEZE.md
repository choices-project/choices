# Copy Freeze Process

_Last updated: April 5, 2026_

Before each release, we run a **copy freeze** so translators can complete pending strings and no new keys slip in after translation sign-off.

## When to Run

- **Trigger:** When a release is scheduled (e.g. RC or GA cut).
- **Timing:** Announce freeze date 3–5 days before the release; freeze starts when the release branch is cut or when the maintainer announces it.

## Steps

### 1. Announce the freeze

- Post in the team channel / release notes: “Copy freeze for vX.Y.Z starts [date]. No new translation keys after this point.”
- Optionally create a GitHub milestone or label for “copy freeze” PRs.

### 2. Final extraction

```bash
cd web
npm run i18n:extract
```

- Commit `messages/en.snapshot.json` if it changed.
- Ensure `messages/en.json` and `messages/es.json` contain all keys from the snapshot.

### 3. Complete translations

- Run `npm run i18n:validate` — ensures every key in `en.json` exists in `es.json` (and other locales). Fails with exit 1 if any key is missing.
- Add missing keys to non-English catalogues; use English as fallback if needed.
- Run `npm run lint:locale` — must pass with zero warnings.

### 4. Verify CI

- CI already runs `i18n:extract` and fails if the snapshot is stale.
- Ensure `lint:locale` passes in CI (see `web-ci.yml` and `ci.yml`).

### 5. Post-freeze policy

- During freeze: PRs that add new `t('...')` keys or change existing copy should be deferred to the next release, or explicitly approved by the release owner.
- Exceptions: critical bug fixes that require new copy — add the key, update all catalogues, and re-run extraction in the same PR.

## Reference

- **Extraction workflow:** `docs/archive/reference/technical/technical/i18n-workflow.md`
- **Roadmap i18n tasks:** `docs/ROADMAP.md` §4.3
