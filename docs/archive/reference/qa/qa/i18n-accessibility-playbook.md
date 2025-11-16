# Accessibility & I18n QA Playbook

Last updated: 2025-11-15  
Status: Draft (QA + Product buy-in required)

---

## 1. Objectives
- Verify that accessibility (a11y) and internationalisation (i18n) requirements remain regression-free across releases.
- Provide a repeatable cadence for automated checks, manual validation, and release sign-off.
- Track findings centrally so GOV-002 can enforce remediation SLAs.

## 2. Roles & Responsibilities
| Role | Primary Responsibilities | Backup |
| --- | --- | --- |
| Accessibility QA Lead | Coordinate audits, own smoke logs, review lint/axe reports. | Engineering accessibility owner |
| Localisation QA Lead | Validate translations, placeholders, and locale persistence. | Product localisation manager |
| Automation Engineer | Maintain Playwright specs, CI integrations, and harness stability. | E2E tooling owner |
| Feature Teams | Resolve issues raised during audits within agreed SLA. | Engineering managers |

## 3. Test Cadence
| Frequency | Scope | Actions |
| --- | --- | --- |
| Every PR | Automated lint (`npm run lint`), axe sweeps via Playwright (@axe tags), i18n snapshot check. | Ensure CI is green; resolve lint warnings where `hasLegacyCopy` allows. |
| Weekly | Targeted manual smoke on priority routes (poll create/run, onboarding, nav, admin, PWA). | Update `scratch/gpt5-codex/archive/inclusive-platform/manual-a11y-smoke-YYYY-MM-DD.md`. |
| Release Candidate | Full regression: accessibility (NVDA + VoiceOver), locale switch scenarios (`en` ↔ `es`), analytics dashboards once available. | File issues (A11Y-### / I18N-###). |
| Quarterly | Governance review: update guidelines, revisit checklists, adjust tooling severity (e.g., flip `hasLegacyCopy`). | Capture decisions in GOV-001/GOV-002 artefacts. |

## 4. Automated Checklist
- `npm run lint` (watch for `formatjs/no-literal-string-in-jsx` warnings; treat as blockers once legacy copy removed).
- `npm run test:e2e:axe` for axe-tagged smoke journeys.
- `npm run test:e2e:nav` to exercise navigation/admin/locale/analytics harness specs (`navigation-shell`, `global-navigation`, `admin-navigation`, analytics SR + axe, locale-switch`) before promoting CI gates. CI job **Nav & Locale Accessibility** runs the same command (Chromium, harness mode) on every PR.
- `npx playwright test widget-dashboard-keyboard` (keyboard move/resize workflow regression).
- `npx playwright test tests/e2e/specs/civics-lure.spec.ts --project=chromium` (harden election countdown + civics live regions).
- `npm run i18n:extract` – ensure `messages/en.snapshot.json` has no unexpected diff (CI enforces this).
- Optional: `npm run types:ci` to catch type regressions in i18n plumbing.

## 5. Manual Checklist (Per Release)
1. **Navigation & Layout**
   - Skip links announce landing targets.
   - Language selector persists choice across refresh/navigation.
2. **Poll Flows**
   - Create, share, and voting surfaces expose live regions.
   - Charts provide textual summaries.
3. **Onboarding**
   - Progress labels announce current step.
   - Validation errors read aloud and visible.
4. **Polls listing & filters**
   - Filters, categories, and pagination render translated labels; locale-aware numbers/dates show on cards.
   - Trending badges and vote counts announce correctly, including screen-reader hints for filter chips.
5. **Feed infinite scroll**
   - Pull-to-refresh/loading/end-of-feed messages are translated; refresh state is announced when triggered.
   - Scroll-to-top control is keyboard accessible with descriptive aria-label.
   - Feed error/refresh toasts (including harness provider) surface translated titles/messages and fire `aria-live` announcements.
6. **Personal dashboard**
   - Overview metrics, quick actions, trending topics, and representatives panels use translated copy and locale-aware numbers/dates.
   - Harness mode mirrors production semantics (same aria labels, announcements, and translated strings).
7. **Admin & Analytics**
   - Sidebar landmarks, focus management, chart accessibility (verify localized summaries/tables + live status announcements).
   - Widget dashboard edit mode exposes keyboard instructions, arrow-key move/resize remains operable, and announcements fire via `ScreenReaderSupport`.
8. **PWA Surfaces**
   - Offline/online announcements, service worker updates, translation coverage, and installer/offline queue live regions emit ScreenReaderSupport updates with localized copy.

Document each session in the smoke log with:
- Date, device/browser, assistive tech used.
- Findings, severity, linked issues.

## 6. Bug Triage & SLAs
| Severity | Definition | SLA | Notes |
| --- | --- | --- | --- |
| Critical | Blocks task completion for assistive tech / localisation | Fix before release | Escalate to engineering manager. |
| High | Significant degradation but workaround exists | 1 sprint | Prioritise as release-blocking unless exception granted. |
| Medium | Cosmetic/secondary impact | 2 sprints | Track to completion; bundle if multiple related items. |
| Low | Nice-to-have / documentation | Backlog | Evaluate quarterly. |

## 7. Reporting & Sign-Off
- Use template in `docs/inclusive-ui-guidelines.md` Appendix B for contact list.
- Weekly summary in project channel: automation status, manual findings, open issues.
- Release sign-off requires: no open Critical/High issues, smoke log updated, i18n snapshot current.

## 8. Continuous Improvement
- Log flake root causes in test harness and track until resolved.
- Monitor lint warnings; plan to set `hasLegacyCopy = false` once poll, feeds, and civics surfaces are fully translated.
- Expand locale automation (add auth/onboarding locale specs, visual diffs).
- Review playbook quarterly; update SLA table and tooling references as they evolve.

---

## 9. Audit Schedule
| Window | Tooling | Flow Focus | Primary Owner | Backup | Notes |
| --- | --- | --- | --- | --- | --- |
| Nov 14–17 2025 | NVDA 2024.3 + VoiceOver 14.6 | Poll create/run, onboarding, nav, admin, analytics, widget editor | Accessibility QA Lead (Jamie Chen) | Eng Accessibility Owner | Capture findings + recordings in `scratch/gpt5-codex/archive/inclusive-platform/manual-a11y-smoke-2025-11-12.md` and link reopened issues. |
| Feb 10–14 2026 | NVDA + VoiceOver + locale sweep (`en`/`es`) | Global nav, onboarding, dashboard, locale persistence | Localization QA Lead (Priya N.) | Accessibility QA Lead | Run new auth/onboarding locale specs; attach traces to run sheet. |
| May 12–16 2026 | Locale regression (desktop + mobile) | Polls, feeds, civics, legal copy | Localization QA Lead | Product Localization Manager | Validate translation backlog (I18N-004/005/006) before expanding locales. |
| Aug 11–15 2026 | Full SR + locale audit + PWA harness | Navigation, analytics, PWA/offline flows | Accessibility QA Lead | Automation Engineer | Coordinate with PWA team for offline flows; ensure audit logs stored in `archive/inclusive-platform/reports/`. |

Assign prep owners two weeks before each window and update this table when dates shift. All recordings/transcripts belong in `scratch/gpt5-codex/archive/inclusive-platform/manual-sr-audit-run-sheet-2025-11.md` or future counterparts.

---

## 10. PR & Release Checklist
- **Pull Request Template:** Complete the Accessibility/I18N checklist in `.github/PULL_REQUEST_TEMPLATE.md` for every UI change (strings translated, lint + axe run, snapshots regenerated, relevant docs updated).
- **Docs & Contract Updates:** When a PR modifies stores, layouts, or API envelopes, update the corresponding sections in `docs/ARCHITECTURE/stores.md`, `docs/API/contracts.md`, and `docs/TESTING/api-contract-plan.md`.
- **Release Notes:** Add a bullet to `docs/archive/release-notes/CHANGELOG.md` summarizing user-facing accessibility/i18n changes before tagging a release.
- **Sign-off Artifact:** Attach the latest smoke log entry, contract suite run (`npm run test:contracts`), and locale spec run (`npx playwright test --grep @locale`) to the release ticket.
 
## 11. Election Countdown QA
- **Component contract:** `ElectionCountdownCard` and `ElectionCountdownBadge` must expose translated labels, `aria-live` announcements for loading/error states, and countdown badges that reflect remaining days plus total elections.
- **Manual steps:** Trigger the countdown card on dashboard/civics panels, verify the badge swaps between loading/error/ready states, and confirm the empty-state copy is localized.
- **Automation:** Unit coverage exists in `web/tests/unit/features/civics/ElectionCountdownCard.test.tsx` and `web/tests/unit/features/civics/ElectionCountdownBadge.test.tsx` (badge assertions include `role="status"`, `aria-live="polite"`, countdown strings, and additional-election counts). Expand RTL specs whenever copy or structure changes, and mirror updates in `messages/*.json`.
- **Notification touchpoints:** When civics countdown pushes toasts via `useNotificationActions`, ensure announcements fire with `aria-live="polite"` and include division/date context for assistive tech.

---

### References
- `docs/inclusive-ui-guidelines.md`
- `docs/technical/i18n-workflow.md`
- `scratch/gpt5-codex/archive/inclusive-platform/issues.md`
- `scratch/gpt5-codex/archive/inclusive-platform/manual-a11y-smoke-*.md`

