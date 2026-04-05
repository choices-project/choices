## Summary
- What changed and why? Link issues / [`docs/ROADMAP.md`](../docs/ROADMAP.md) items if applicable.

## Testing (from `web/` unless noted)
- [ ] `npm run lint`
- [ ] `npm run types:ci` (or `npm run type-check`)
- [ ] `npm run test`
- [ ] `npm run test:contracts` (if API payloads or MSW fixtures changed)
- [ ] Playwright: targeted spec or `npm run test:e2e:smoke` when UI flows changed
- [ ] Not applicable (explain):

## Accessibility & i18n (when UI or copy changed)
- [ ] User-visible strings go through i18n (`useI18n` / `t()`); ran `npm run i18n:extract` if needed
- [ ] Considered focus, landmarks, and screen-reader behavior (see [`docs/TESTING.md`](../docs/TESTING.md))
- [ ] Not applicable (explain):

## Docs, contracts & repo checks
- [ ] Updated relevant docs (`docs/API/contracts.md`, `docs/STATE_MANAGEMENT.md`, [`docs/FEEDBACK_AND_ISSUES.md`](../docs/FEEDBACK_AND_ISSUES.md) if feedback widget or issue triage changed, playbooks, etc.) if behavior or contracts changed
- [ ] **`npm run verify:docs`** from **repository root** passes when you touched API routes, `web/types/supabase.ts`, feature flags, stores, security-sensitive routes, or canonical `docs/**` (see [`docs/README.md`](../docs/README.md))
- [ ] User-facing change noted in [`docs/archive/release-notes/CHANGELOG.md`](../docs/archive/release-notes/CHANGELOG.md) when appropriate
- [ ] Not applicable (explain):

## Commits
- [ ] Commits are **signed-off** for DCO (`git commit -s`) — see [`CONTRIBUTING.md`](../CONTRIBUTING.md)

## Notes for reviewers
- Risks, rollout, feature flags, or manual validation steps.
