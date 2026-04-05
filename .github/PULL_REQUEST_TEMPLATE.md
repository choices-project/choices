# Summary
- 

## Testing
- [ ] `npm run lint`
- [ ] `npm run test`
- [ ] `npm run test:e2e -- --grep <tag>`
- [ ] Other (describe):

## Accessibility / I18N Checklist
- [ ] UI strings call `t()` and new keys were added to `web/messages/*.json`
- [ ] Ran `npm run i18n:extract` and committed snapshot changes (if strings changed)
- [ ] Ran axe/locale specs (`npm run test:e2e:axe`, `npx playwright test --grep @locale`) for affected journeys
- [ ] Verified ScreenReaderSupport announcements / live regions for interactive changes

## Docs / Contracts / Release Notes
- [ ] Updated relevant docs (`docs/STATE_MANAGEMENT.md`, `docs/API/contracts.md`, playbooks) if contracts, stores, or governance patterns changed
- [ ] Added/updated MSW fixtures + contract suites (`npm run test:contracts`) when API payloads changed
- [ ] Added an entry to `docs/archive/release-notes/CHANGELOG.md` for user-facing changes
- [ ] Included links to issues / roadmap items (PHASE-* labels) in the PR description

> Need help? See `docs/TESTING.md`, `docs/STATE_MANAGEMENT.md`, and `docs/API/contracts.md`. For inclusive UI, i18n, and harness playbooks see `docs/archive/` as needed.
# PR Title
<!-- Example: feat(analytics): add cache metadata to dashboard API -->

## 🎯 Summary
- What changed and why?
- Link to roadmap/issue/ADR if applicable.

## ✅ Testing
- [ ] `npm run lint`
- [ ] `npm run type-check`
- [ ] `npm run test`
- [ ] `npm run test:contracts`
- [ ] `npm run test:e2e` (or targeted spec: `npx playwright test tests/e2e/specs/...`)
- [ ] Not applicable (explain why)

## ♿ Inclusive UI & 🌐 i18n Checklist
Confirm the surfaces touched in this PR meet the governance standards:
- [ ] Followed inclusive UI guidelines (landmarks, focus, announcements, SR helpers; see `docs/archive/` if needed).
- [ ] Translatable copy routed through `useI18n` and snapshots updated via `npm run i18n:extract` (see `docs/TESTING.md` or `docs/archive/` for i18n workflow).
- [ ] Locale + accessibility automation updated or reviewed (`tests/e2e/specs/*@axe`, locale-switch specs, harness bridges).
- [ ] Manual SR / locale follow-ups documented where required.

## 🔐 API & Contract Alignment
- [ ] API responses use shared helpers from `@/lib/api/response-utils` and types from `@/lib/api/types`.
- [ ] Contract tests (`web/tests/contracts`) updated to cover new/changed routes.
- [ ] MSW fixtures + Playwright harness mocks updated (`web/tests/msw`, `setupExternalAPIMocks`).
- [ ] Release notes updated (see `docs/archive/release-notes/CHANGELOG.md`) if changes impact partners/clients.

## 📚 Docs & Release Checklist
- [ ] Impacted docs updated (architecture, governance, runbooks, README, etc.).
- [ ] **`npm run verify:docs`** (repository root) passes when `web/app/api/**/route.ts` changed; run **`npm run docs:api-inventory`** first if the inventory needs regenerating. When **`web/types/supabase.ts`** changes, run **`npm run docs:public-schema-index`** and update **`docs/ARCHITECTURE.md`** Postgres **~**counts (diagram + Database §) if table / view / RPC totals changed (**`npm run verify:architecture-schema-counts`** flags drift). When **`web/lib/core/feature-flags.ts`** changes, run **`npm run docs:feature-flags`**. When you add or remove **`getSupabaseAdminClient`** or **`apiRateLimiter.checkLimit`** in a `route.ts`, run **`npm run docs:security-snapshots`** (updates `docs/SECURITY.md` markers). Adding or removing top-level **`web/lib/stores/*Store.ts`** files or changing **`cascadeDependentStoreReset`** (order or `name:` labels) requires updating **`docs/ARCHITECTURE.md`** and **`docs/STATE_MANAGEMENT.md`** and, for new cascade keys, **`scripts/verify-store-docs.mjs`** (`CASCADE_LABELS`) — then **`npm run verify:store-docs`**. Broken relative links in canonical docs fail **`npm run verify:doc-links`**. New **`web/app/**/error.tsx`** or **`loading.tsx`** files require updating the Security bullet counts in **`docs/ARCHITECTURE.md`** (**`npm run verify:architecture-boundaries`**). Run the regens before `verify:docs`.
- [ ] Release checklist in `docs/DEPLOYMENT.md#release-checklist` reviewed; call out any boxes that cannot be checked.
- [ ] Support/partner comms noted if behaviour changes (link to draft or ticket).

## 📝 Notes for Reviewers
- Risks, rollbacks, feature flags, or manual validation pointers.
