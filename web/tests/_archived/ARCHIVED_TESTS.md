## Archived Tests

These tests are excluded from `tsconfig.tests.json` and no longer run in CI.

### Archived on 2026-01-19
- `web/tests/_archived/unit/stores/**` - legacy store unit tests tied to pre-refactor APIs.
- `web/tests/_archived/unit/sophisticated-civic-engagement.test.ts` - legacy utils coverage.
- `web/tests/_archived/unit/vote/**` - legacy vote validator coverage.
- `web/tests/_archived/e2e/specs/**` - legacy smoke E2E specs (moved from `tests/e2e/specs/_archived`).

If any of these become relevant again, move them out of `_archived` and remove the exclusions.
