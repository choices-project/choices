# @choices/civics-shared (web copy)

This package is a **synced copy** of [`services/civics-shared`](../../services/civics-shared). The canonical source lives in `services/civics-shared`; the web app depends on this local copy via `file:./services-civics-shared` so Vercel (rootDirectory: `web`) can build without the full monorepo.

**Keep both in sync.** When you change `services/civics-shared`, update this copy:

```bash
cp -r ../../services/civics-shared/* ./
cp ../../services/civics-shared/tests/shared.test.mjs tests/
```

The deploy workflow also copies `services/civics-shared` → `web/services-civics-shared` when this directory is missing, so production stays aligned with the canonical package.

See [`services/civics-shared/README.md`](../../services/civics-shared/README.md) for API and usage.
