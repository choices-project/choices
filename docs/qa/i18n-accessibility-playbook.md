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
   - Offline/offline announcements, service worker updates, translation coverage.

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

### References
- `docs/inclusive-ui-guidelines.md`
- `docs/technical/i18n-workflow.md`
- `scratch/gpt5-codex/archive/inclusive-platform/issues.md`
- `scratch/gpt5-codex/archive/inclusive-platform/manual-a11y-smoke-*.md`

