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
- [ ] Followed `docs/inclusive-ui-guidelines.md` (landmarks, focus, announcements, SR helpers).
- [ ] Translatable copy routed through `useI18n` and snapshots updated via `npm run i18n:extract` (see `docs/technical/i18n-workflow.md`).
- [ ] Locale + accessibility automation updated or reviewed (`tests/e2e/specs/*@axe`, locale-switch specs, harness bridges).
- [ ] Manual SR / locale follow-ups captured in `scratch/gpt5-codex/archive/inclusive-platform/manual-*.md` if required.

## 🔐 API & Contract Alignment
- [ ] API responses use shared helpers from `@/lib/api/response-utils` and types from `@/lib/api/types`.
- [ ] Contract tests (`web/tests/contracts`) updated to cover new/changed routes.
- [ ] MSW fixtures + Playwright harness mocks updated (`web/tests/msw`, `setupExternalAPIMocks`).
- [ ] Release notes updated (see `docs/archive/release-notes/CHANGELOG.md`) if changes impact partners/clients.

## 📚 Docs & Release Checklist
- [ ] Impacted docs updated (architecture, governance, runbooks, README, etc.).
- [ ] Release checklist in `docs/DEPLOYMENT.md#release-checklist` reviewed; call out any boxes that cannot be checked.
- [ ] Support/partner comms noted if behaviour changes (link to draft or ticket).

## 📝 Notes for Reviewers
- Risks, rollbacks, feature flags, or manual validation pointers.
